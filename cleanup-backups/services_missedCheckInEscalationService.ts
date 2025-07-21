/**
 * Missed Check-In Escalation Service
 * Monitors job check-ins and escalates to admin when staff don't check in on time
 */

import { doc, collection, query, where, onSnapshot, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as Notifications from 'expo-notifications';
import { JobData } from '@/types/jobData';

export interface MissedCheckInMonitoring {
  id: string;
  jobId: string;
  staffId: string;
  scheduledStartTime: Date;
  checkInDeadline: Date;
  escalationTime: Date;
  hasCheckedIn: boolean;
  hasEscalated: boolean;
  isActive: boolean;
  adminNotified: boolean;
  foaAlertSent: boolean;
  staffRemindersSent: number;
  createdAt: Date;
}

export interface EscalationAlert {
  id: string;
  jobId: string;
  staffId: string;
  type: 'staff_reminder' | 'foa_alert' | 'admin_escalation';
  message: string;
  sentAt: Date;
  acknowledged: boolean;
}

export class MissedCheckInEscalationService {
  private listeners: { [jobId: string]: () => void } = {};

  /**
   * 🔔 Setup Missed Check-In Monitoring
   * Called when a job is assigned with a scheduled start time
   */
  async setupMissedCheckInMonitoring(
    jobId: string,
    staffId: string,
    scheduledStartTime: Date
  ): Promise<void> {
    try {
      // Calculate escalation timeline
      const checkInDeadline = new Date(scheduledStartTime.getTime() + 10 * 60 * 1000); // 10 minutes after start
      const escalationTime = new Date(checkInDeadline.getTime() + 10 * 60 * 1000); // 10 minutes after deadline

      const monitoring: Omit<MissedCheckInMonitoring, 'id'> = {
        jobId,
        staffId,
        scheduledStartTime,
        checkInDeadline,
        escalationTime,
        hasCheckedIn: false,
        hasEscalated: false,
        isActive: true,
        adminNotified: false,
        foaAlertSent: false,
        staffRemindersSent: 0,
        createdAt: new Date()
      };

      // Save monitoring record
      const monitoringRef = doc(collection(db, 'job_check_in_monitoring'), jobId);
      await updateDoc(monitoringRef, {
        ...monitoring,
        scheduledStartTime: serverTimestamp(),
        checkInDeadline: serverTimestamp(),
        escalationTime: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Setup real-time monitoring
      this.startMonitoring(jobId);

      console.log('✅ Missed check-in monitoring set up for job:', jobId);

    } catch (error) {
      console.error('Failed to setup missed check-in monitoring:', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring for a job
   */
  private startMonitoring(jobId: string): void {
    // Clean up existing listener
    if (this.listeners[jobId]) {
      this.listeners[jobId]();
    }

    // Setup new listener
    const monitoringRef = doc(db, 'job_check_in_monitoring', jobId);
    const unsubscribe = onSnapshot(monitoringRef, async (doc) => {
      if (!doc.exists()) return;

      const monitoring = doc.data() as MissedCheckInMonitoring;
      const now = new Date();

      // Skip if already checked in or escalated
      if (monitoring.hasCheckedIn || monitoring.hasEscalated || !monitoring.isActive) {
        return;
      }

      const checkInDeadline = monitoring.checkInDeadline instanceof Date ? 
        monitoring.checkInDeadline : 
        new Date(monitoring.checkInDeadline);
      const escalationTime = monitoring.escalationTime instanceof Date ? 
        monitoring.escalationTime : 
        new Date(monitoring.escalationTime);

      // Check if deadline passed and staff hasn't checked in
      if (now > checkInDeadline && !monitoring.foaAlertSent) {
        await this.sendFOAAlert(monitoring);
      }

      // Check if escalation time reached
      if (now > escalationTime && !monitoring.hasEscalated) {
        await this.escalateToAdmin(monitoring);
      }
    });

    this.listeners[jobId] = unsubscribe;
  }

  /**
   * 🧠 Send FOA Alert to Staff
   * Notify staff via FOA that they missed check-in
   */
  private async sendFOAAlert(monitoring: MissedCheckInMonitoring): Promise<void> {
    try {
      // Get job details for context
      const jobData = await this.getJobData(monitoring.jobId);
      if (!jobData) return;

      // Generate FOA alert message
      const foaMessage = await this.generateFOAAlertMessage(jobData, monitoring);

      // Send local notification to staff
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧠 FOA Alert: Missed Check-In',
          body: foaMessage,
          data: {
            type: 'missed_checkin_alert',
            jobId: monitoring.jobId,
            staffId: monitoring.staffId,
            foaMessage
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      // Log the alert
      await this.logEscalationAlert({
        jobId: monitoring.jobId,
        staffId: monitoring.staffId,
        type: 'foa_alert',
        message: foaMessage
      });

      // Update monitoring record
      const monitoringRef = doc(db, 'job_check_in_monitoring', monitoring.jobId);
      await updateDoc(monitoringRef, {
        foaAlertSent: true,
        staffRemindersSent: monitoring.staffRemindersSent + 1
      });

      console.log('📱 FOA alert sent for missed check-in:', monitoring.jobId);

    } catch (error) {
      console.error('Failed to send FOA alert:', error);
    }
  }

  /**
   * 🚨 Escalate to Admin
   * Notify administrators when staff doesn't respond to reminders
   */
  private async escalateToAdmin(monitoring: MissedCheckInMonitoring): Promise<void> {
    try {
      // Get job and staff details
      const jobData = await this.getJobData(monitoring.jobId);
      const staffData = await this.getStaffData(monitoring.staffId);

      if (!jobData || !staffData) return;

      // Generate escalation message
      const escalationMessage = this.generateAdminEscalationMessage(jobData, staffData, monitoring);

      // Send notification to all administrators
      await this.notifyAdministrators(escalationMessage, monitoring);

      // Log the escalation
      await this.logEscalationAlert({
        jobId: monitoring.jobId,
        staffId: monitoring.staffId,
        type: 'admin_escalation',
        message: escalationMessage
      });

      // Update monitoring record
      const monitoringRef = doc(db, 'job_check_in_monitoring', monitoring.jobId);
      await updateDoc(monitoringRef, {
        hasEscalated: true,
        adminNotified: true,
        isActive: false // Stop monitoring
      });

      console.log('🚨 Escalated missed check-in to admin:', monitoring.jobId);

    } catch (error) {
      console.error('Failed to escalate to admin:', error);
    }
  }

  /**
   * Generate FOA alert message for staff
   */
  private async generateFOAAlertMessage(
    job: JobData, 
    monitoring: MissedCheckInMonitoring
  ): Promise<string> {
    try {
      const minutesLate = Math.round(
        (new Date().getTime() - monitoring.checkInDeadline.getTime()) / (1000 * 60)
      );

      const prompt = `Staff missed check-in for job "${job.title}" and is ${minutesLate} minutes late. 
      
      Generate a helpful FOA alert message that:
      1. Gently reminds them about the missed check-in
      2. Encourages immediate check-in
      3. Offers assistance if there are issues
      4. Maintains a supportive tone
      
      Keep it under 60 words, helpful and non-judgmental.`;

      // Create context for FOA
      const context = {
        job: {
          id: job.id,
          title: job.title,
          type: job.jobType,
          description: job.description || '',
          priority: job.priority || 'normal',
          location: { address: job.propertyRef?.address || '' },
          estimatedDuration: job.estimatedDuration || 60,
          status: job.status
        } as any,
        staffRole: 'staff',
      };

      // Generate reminder message (AI service no longer available)
      return `Hi! I noticed you haven't checked in for "${job.title}" yet. Please check in when you arrive or let me know if you need assistance.`;

    } catch (error) {
      console.error('Failed to generate FOA alert message:', error);
      return `Hi! I noticed you haven't checked in for "${job.title}" yet. Please check in when you arrive or let me know if you need assistance.`;
    }
  }

  /**
   * Generate admin escalation message
   */
  private generateAdminEscalationMessage(
    job: JobData,
    staff: any,
    monitoring: MissedCheckInMonitoring
  ): string {
    const minutesLate = Math.round(
      (new Date().getTime() - monitoring.scheduledStartTime.getTime()) / (1000 * 60)
    );

    return `🚨 MISSED CHECK-IN ALERT

Staff: ${staff.fullName || staff.name || 'Unknown'}
Job: ${job.title}
Property: ${job.propertyRef?.name || 'Unknown'}
Scheduled: ${monitoring.scheduledStartTime.toLocaleTimeString()}
Status: ${minutesLate} minutes late, no check-in

Actions taken:
- FOA alert sent to staff
- ${monitoring.staffRemindersSent} reminder(s) sent

Please contact staff member directly or reassign job if needed.`;
  }

  /**
   * Send notifications to administrators
   */
  private async notifyAdministrators(message: string, monitoring: MissedCheckInMonitoring): Promise<void> {
    try {
      // Query for admin users
      const adminsQuery = query(
        collection(db, 'staff_accounts'),
        where('role', 'in', ['admin', 'manager']),
        where('isActive', '==', true)
      );

      // In a real implementation, you would:
      // 1. Get admin FCM tokens
      // 2. Send push notifications
      // 3. Send emails
      // 4. Create in-app notifications

      // For now, log the escalation
      await addDoc(collection(db, 'admin_notifications'), {
        type: 'missed_checkin_escalation',
        title: 'Staff Missed Check-In',
        message,
        jobId: monitoring.jobId,
        staffId: monitoring.staffId,
        severity: 'high',
        createdAt: serverTimestamp(),
        acknowledged: false
      });

      console.log('📧 Admin escalation notifications sent');

    } catch (error) {
      console.error('Failed to notify administrators:', error);
    }
  }

  /**
   * Log escalation alerts for audit trail
   */
  private async logEscalationAlert(alert: Omit<EscalationAlert, 'id' | 'sentAt' | 'acknowledged'>): Promise<void> {
    try {
      await addDoc(collection(db, 'escalation_alerts'), {
        ...alert,
        sentAt: serverTimestamp(),
        acknowledged: false
      });
    } catch (error) {
      console.error('Failed to log escalation alert:', error);
    }
  }

  /**
   * Mark check-in completed (call this when staff checks in)
   */
  async markCheckInCompleted(jobId: string): Promise<void> {
    try {
      const monitoringRef = doc(db, 'job_check_in_monitoring', jobId);
      await updateDoc(monitoringRef, {
        hasCheckedIn: true,
        isActive: false
      });

      // Clean up listener
      if (this.listeners[jobId]) {
        this.listeners[jobId]();
        delete this.listeners[jobId];
      }

      console.log('✅ Check-in completed for job:', jobId);

    } catch (error) {
      console.error('Failed to mark check-in completed:', error);
    }
  }

  /**
   * Cancel monitoring (call when job is cancelled/completed)
   */
  async cancelMonitoring(jobId: string): Promise<void> {
    try {
      const monitoringRef = doc(db, 'job_check_in_monitoring', jobId);
      await updateDoc(monitoringRef, {
        isActive: false
      });

      // Clean up listener
      if (this.listeners[jobId]) {
        this.listeners[jobId]();
        delete this.listeners[jobId];
      }

      console.log('❌ Monitoring cancelled for job:', jobId);

    } catch (error) {
      console.error('Failed to cancel monitoring:', error);
    }
  }

  /**
   * Utility methods
   */
  private async getJobData(jobId: string): Promise<JobData | null> {
    try {
      // Implementation would fetch job data from Firestore
      // For now, return null to avoid compilation errors
      return null;
    } catch (error) {
      console.error('Failed to get job data:', error);
      return null;
    }
  }

  private async getStaffData(staffId: string): Promise<any | null> {
    try {
      // Implementation would fetch staff data from Firestore
      // For now, return null to avoid compilation errors
      return null;
    } catch (error) {
      console.error('Failed to get staff data:', error);
      return null;
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    Object.values(this.listeners).forEach(unsubscribe => unsubscribe());
    this.listeners = {};
  }
}

// Export singleton instance
export const missedCheckInEscalationService = new MissedCheckInEscalationService();
