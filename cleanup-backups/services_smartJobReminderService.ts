/**
 * Smart Job Reminder Service with FOA Integration
 * Schedules 1-hour pre-job notifications with AI-powered context
 */

import * as Notifications from 'expo-notifications';
import { Job } from '@/types/job';
import { JobData } from '@/types/jobData';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

// Configure notification behavior for reminders
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isJobReminder = notification.request.content.data?.type === 'job_reminder';
    return {
      shouldShowAlert: true,
      shouldPlaySound: isJobReminder, // Always play sound for job reminders
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

interface JobReminderSchedule {
  id: string;
  jobId: string;
  staffId: string;
  reminderType: 'pre_job_1hour' | 'job_start' | 'job_overdue' | 'completion_check';
  scheduledFor: Date;
  notificationId?: string;
  foaContext?: {
    preparationTips: string[];
    safetyReminders: string[];
    estimatedArrival: string;
    weatherAlert?: string;
  };
  jobData: {
    title: string;
    propertyName: string;
    propertyAddress: string;
    type: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    estimatedDuration: number;
  };
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
  deviceTestMode?: boolean; // For 2-minute test mode
}

interface FOAReminderContent {
  title: string;
  body: string;
  preparationMessage: string;
  safetyNote?: string;
  trafficNote?: string;
  weatherNote?: string;
}

class SmartJobReminderService {
  private scheduledReminders: Map<string, JobReminderSchedule> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private isInitialized = false;

  /**
   * Initialize the service and request notification permissions
   */
  async initialize(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Notification permissions not granted for job reminders');
        return false;
      }
      
      // Check if we can schedule notifications
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        console.warn('⚠️ Notification permissions not sufficient for job reminders');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ Smart Job Reminder Service initialized successfully');
      
      // Start listening for reminder due times
      this.startReminderMonitoring();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Smart Job Reminder Service:', error);
      return false;
    }
  }

  /**
   * Schedule a 1-hour pre-job reminder with FOA context
   */
  async schedulePreJobReminder(job: JobData, staffId: string, testMode: boolean = false): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const reminderId = `${job.id}_pre_1hour`;
      
      // Calculate reminder time (1 hour before job start, or 2 minutes for testing)
      const jobStartTime = job.scheduledDate ? new Date(job.scheduledDate) : new Date();
      const reminderTime = testMode 
        ? new Date(Date.now() + 2 * 60 * 1000) // 2 minutes for testing
        : new Date(jobStartTime.getTime() - (60 * 60 * 1000)); // 1 hour before

      // Don't schedule if the reminder time is in the past (unless testing)
      if (!testMode && reminderTime <= new Date()) {
        console.log('⏰ Reminder time is in the past, skipping:', reminderId);
        return false;
      }

      // Generate FOA context for the reminder
      const foaContext = await this.generateFOAReminderContext(job);
      
      // Create reminder schedule data
      const reminderSchedule: JobReminderSchedule = {
        id: reminderId,
        jobId: job.id,
        staffId,
        reminderType: 'pre_job_1hour',
        scheduledFor: reminderTime,
        foaContext,
        jobData: {
          title: job.title,
          propertyName: job.propertyRef?.name || 'Property',
          propertyAddress: job.propertyRef?.address || (typeof job.location === 'string' ? job.location : job.location?.address) || 'Location TBD',
          type: job.jobType,
          priority: job.priority as 'low' | 'normal' | 'high' | 'urgent',
          estimatedDuration: job.estimatedDuration || 60,
        },
        sent: false,
        createdAt: new Date(),
        deviceTestMode: testMode,
      };

      // Schedule the local notification
      const notificationContent = this.createFOANotificationContent(reminderSchedule);
      
      let trigger: any;
      if (testMode) {
        trigger = { seconds: 120 };
      } else {
        trigger = reminderTime;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationContent.title,
          body: notificationContent.body,
          data: {
            type: 'job_reminder',
            jobId: job.id,
            staffId,
            reminderType: 'pre_job_1hour',
            foaPreparation: notificationContent.preparationMessage,
            safetyNote: notificationContent.safetyNote,
            deepLink: `/(tabs)/jobs?jobId=${job.id}`,
            testMode,
          },
          sound: 'default',
          priority: 'high',
        },
        trigger,
      });

      reminderSchedule.notificationId = notificationId;

      // Store in memory for quick access
      this.scheduledReminders.set(reminderId, reminderSchedule);

      // Save to Firestore for persistence and server-side fallback
      await this.saveReminderToFirestore(reminderSchedule);

      // Update job with reminder info
      await this.updateJobReminderStatus(job.id, {
        preJobReminderScheduled: true,
        preJobReminderTime: Timestamp.fromDate(reminderTime),
        lastReminderUpdate: Timestamp.fromDate(new Date()),
      });

      console.log(`⏰ Pre-job reminder scheduled:`, {
        jobTitle: job.title,
        reminderTime: reminderTime.toLocaleString(),
        testMode,
        foaContext: !!foaContext
      });

      return true;

    } catch (error) {
      console.error('❌ Error scheduling pre-job reminder:', error);
      return false;
    }
  }

  /**
   * Generate FOA-powered context for job reminders
   */
  private async generateFOAReminderContext(job: JobData): Promise<JobReminderSchedule['foaContext']> {
    try {
      // Create minimal context for FOA
      const context = {
        job: {
          id: job.id,
          title: job.title,
          type: job.jobType,
          description: job.description || '',
          priority: job.priority || 'normal',
          location: { address: job.propertyRef?.address || (typeof job.location === 'string' ? job.location : job.location?.address) || '' },
          estimatedDuration: job.estimatedDuration || 60,
        } as any,
        staffRole: 'staff',
      };

      // Generate standard preparation tips (AI service no longer available)
      let preparationTips: string[] = [
        'Review job requirements and gather necessary tools',
        'Check weather conditions and dress appropriately',
        'Verify property access information and contact details'
      ];
      
      let safetyReminders: string[] = [
        'Follow all safety protocols',
        'Use proper protective equipment when required'
      ];

      // Customize tips based on job type
      const jobType = job.title?.toLowerCase() || '';
      if (jobType.includes('maintenance')) {
        preparationTips.unshift('Bring maintenance toolkit and spare parts');
        safetyReminders.unshift('Turn off utilities before starting work');
      } else if (jobType.includes('inspection')) {
        preparationTips.unshift('Prepare inspection checklist and camera');
      }

      return {
        preparationTips,
        safetyReminders,
        estimatedArrival: this.calculateArrivalTime(job),
        // Could add weather data in the future
      };

    } catch (error) {
      console.warn('⚠️ Could not generate FOA context for reminder:', error);
      return {
        preparationTips: ['Review job requirements'],
        safetyReminders: ['Follow safety protocols'],
        estimatedArrival: 'Plan to arrive 15 minutes early',
      };
    }
  }

  /**
   * Create notification content with FOA intelligence
   */
  private createFOANotificationContent(reminder: JobReminderSchedule): FOAReminderContent {
    const { jobData, foaContext } = reminder;
    
    const title = `⏰ Job Starting Soon`;
    
    let body = `${jobData.title} at ${jobData.propertyName} starts in 1 hour.`;
    
    // Add priority indicator
    if (jobData.priority === 'urgent') {
      body = `🚨 URGENT: ${body}`;
    } else if (jobData.priority === 'high') {
      body = `📍 ${body}`;
    }

    const preparationMessage = foaContext?.preparationTips?.length 
      ? `FOA suggests: ${foaContext.preparationTips[0]}`
      : 'FOA: Review your checklist and gather tools';

    const safetyNote = foaContext?.safetyReminders?.length
      ? foaContext.safetyReminders[0]
      : undefined;

    return {
      title,
      body,
      preparationMessage,
      safetyNote,
    };
  }

  /**
   * Calculate estimated arrival time
   */
  private calculateArrivalTime(job: JobData): string {
    const startTime = job.scheduledDate ? new Date(job.scheduledDate) : new Date();
    const arrivalTime = new Date(startTime.getTime() - (15 * 60 * 1000)); // 15 minutes early
    return `Arrive by ${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  /**
   * Save reminder to Firestore for server-side fallback
   */
  private async saveReminderToFirestore(reminder: JobReminderSchedule): Promise<void> {
    try {
      const db = await getDb();
      const reminderRef = doc(db, 'job_reminders', reminder.staffId, 'reminders', reminder.id);
      
      await setDoc(reminderRef, {
        ...reminder,
        scheduledFor: Timestamp.fromDate(reminder.scheduledFor),
        createdAt: Timestamp.fromDate(reminder.createdAt),
        sentAt: reminder.sentAt ? Timestamp.fromDate(reminder.sentAt) : null,
      });
      
    } catch (error) {
      console.error('❌ Error saving reminder to Firestore:', error);
    }
  }

  /**
   * Update job with reminder status
   */
  private async updateJobReminderStatus(jobId: string, updates: Record<string, any>): Promise<void> {
    try {
      const db = await getDb();
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, updates);
    } catch (error) {
      console.error('❌ Error updating job reminder status:', error);
    }
  }

  /**
   * Cancel all reminders for a job (when completed/cancelled)
   */
  async cancelJobReminders(jobId: string): Promise<void> {
    try {
      // Cancel local notifications
      const remindersToCancel = Array.from(this.scheduledReminders.values())
        .filter(reminder => reminder.jobId === jobId);

      for (const reminder of remindersToCancel) {
        if (reminder.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        }
        this.scheduledReminders.delete(reminder.id);
      }

      console.log(`✅ Cancelled ${remindersToCancel.length} reminders for job: ${jobId}`);

    } catch (error) {
      console.error('❌ Error cancelling job reminders:', error);
    }
  }

  /**
   * Start monitoring for reminder processing
   */
  private startReminderMonitoring(): void {
    // Check every minute for due reminders
    setInterval(async () => {
      await this.processDueReminders();
    }, 60 * 1000);
  }

  /**
   * Process any reminders that are due
   */
  private async processDueReminders(): Promise<void> {
    try {
      const now = new Date();
      
      for (const reminder of this.scheduledReminders.values()) {
        if (!reminder.sent && reminder.scheduledFor <= now) {
          await this.processReminder(reminder);
        }
      }
    } catch (error) {
      console.error('❌ Error processing due reminders:', error);
    }
  }

  /**
   * Process a single reminder
   */
  private async processReminder(reminder: JobReminderSchedule): Promise<void> {
    try {
      // Mark as sent
      reminder.sent = true;
      reminder.sentAt = new Date();
      
      // Update in Firestore
      await this.saveReminderToFirestore(reminder);
      
      console.log(`✅ Processed reminder: ${reminder.id}`);
      
    } catch (error) {
      console.error('❌ Error processing reminder:', error);
    }
  }

  /**
   * Handle notification response (when user taps)
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<{
    action: 'navigate_to_job' | 'open_foa_chat' | 'view_checklist' | 'unknown';
    jobId?: string;
    foaMessage?: string;
  }> {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'job_reminder') {
      const jobId = data.jobId as string;
      const foaPreparation = data.foaPreparation as string;
      
      console.log('📱 User tapped job reminder:', jobId);
      
      return {
        action: 'navigate_to_job',
        jobId,
        foaMessage: foaPreparation,
      };
    }

    return { action: 'unknown' };
  }

  /**
   * Test the reminder system with a 2-minute schedule
   */
  async testJobReminder(job: JobData, staffId: string): Promise<boolean> {
    console.log('🧪 Testing job reminder system with 2-minute delay...');
    return await this.schedulePreJobReminder(job, staffId, true);
  }

  /**
   * Get all scheduled reminders for a staff member
   */
  getScheduledReminders(staffId: string): JobReminderSchedule[] {
    return Array.from(this.scheduledReminders.values())
      .filter(reminder => reminder.staffId === staffId && !reminder.sent);
  }

  /**
   * Listen for job assignments and auto-schedule reminders
   */
  startJobAssignmentListener(staffId: string): () => void {
    const dbPromise = getDb();
    
    return new Promise<() => void>(async (resolve) => {
      const db = await dbPromise;
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted'])
      );

      const unsubscribe = onSnapshot(jobsQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const jobData = { id: change.doc.id, ...change.doc.data() } as JobData;
            
            // Auto-schedule reminder for newly assigned/accepted jobs
            if (jobData.status === 'assigned' || jobData.status === 'accepted') {
              await this.schedulePreJobReminder(jobData, staffId);
            }
          }
        });
      });

      this.listeners.set(staffId, unsubscribe);
      resolve(unsubscribe);
    }) as any;
  }

  /**
   * Stop listening for a staff member
   */
  stopJobAssignmentListener(staffId: string): void {
    const unsubscribe = this.listeners.get(staffId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(staffId);
    }
  }
}

// Export singleton instance
export const smartJobReminderService = new SmartJobReminderService();
export default smartJobReminderService;

// Export types
export type {
  JobReminderSchedule,
  FOAReminderContent
};
