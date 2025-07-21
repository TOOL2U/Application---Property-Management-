/**
 * Smart Job Notification Service
 * Handles pre-job reminders and intelligent notifications
 */

import * as Notifications from 'expo-notifications';
import { Job } from '@/types/job';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface JobNotificationSchedule {
  jobId: string;
  notificationId: string;
  scheduledFor: Date;
  type: 'pre_job_reminder' | 'job_start' | 'job_overdue' | 'job_completion_reminder';
}

class SmartJobNotificationService {
  private scheduledNotifications: Map<string, JobNotificationSchedule> = new Map();

  async initialize(): Promise<void> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return;
    }
    
    console.log('✅ Smart Job Notification Service initialized');
  }

  /**
   * Schedule a 1-hour pre-job reminder
   */
  async schedulePreJobReminder(job: Job, staffId: string): Promise<void> {
    try {
      const scheduledDate = new Date(job.scheduledDate);
      const reminderTime = new Date(scheduledDate.getTime() - (60 * 60 * 1000)); // 1 hour before

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.log('⏰ Job starts too soon for pre-reminder:', job.title);
        return;
      }

      const notificationContent = {
        title: '👷 Job Starting Soon',
        body: `Your job at ${job.location?.address || 'the property'} begins in 1 hour. Tap to review tasks.`,
        data: {
          jobId: job.id,
          staffId,
          type: 'pre_job_reminder',
          jobTitle: job.title,
          propertyName: job.location?.address || 'Property',
        },
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Immediate notification for now, can be enhanced later
      });

      // Store notification schedule
      this.scheduledNotifications.set(job.id, {
        jobId: job.id,
        notificationId,
        scheduledFor: reminderTime,
        type: 'pre_job_reminder',
      });

      // Update job in Firestore with notification info
      await this.updateJobNotificationStatus(job.id, {
        preJobReminderScheduled: true,
        preJobReminderTime: Timestamp.fromDate(reminderTime),
        lastNotificationUpdate: Timestamp.fromDate(new Date()),
      });

      console.log('⏰ Pre-job reminder scheduled for:', job.title, 'at', reminderTime);
    } catch (error) {
      console.error('❌ Error scheduling pre-job reminder:', error);
    }
  }

  /**
   * Schedule job start confirmation
   */
  async scheduleJobStartNotification(job: Job, staffId: string): Promise<void> {
    try {
      const scheduledDate = new Date(job.scheduledDate);
      
      const notificationContent = {
        title: '🚀 Job Time!',
        body: `Time to start: ${job.title}. Tap to begin with AI assistance.`,
        data: {
          jobId: job.id,
          staffId,
          type: 'job_start',
          jobTitle: job.title,
          autoOpenAI: true,
        },
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Immediate notification for now
      });

      this.scheduledNotifications.set(`${job.id}_start`, {
        jobId: job.id,
        notificationId,
        scheduledFor: scheduledDate,
        type: 'job_start',
      });

      console.log('🚀 Job start notification scheduled for:', job.title);
    } catch (error) {
      console.error('❌ Error scheduling job start notification:', error);
    }
  }

  /**
   * Schedule job completion reminder (for jobs in progress)
   */
  async scheduleJobCompletionReminder(job: Job, staffId: string): Promise<void> {
    try {
      // Schedule reminder 2 hours after job start
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + 2);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Job Progress Check',
          body: `Don't forget to complete "${job.title}" and upload required photos!`,
          data: {
            type: 'job_completion_reminder',
            jobId: job.id,
            staffId: staffId,
          },
        },
        trigger: null, // Schedule immediately
      });

      // Store notification reference
      this.scheduledNotifications.set(`${job.id}_completion`, {
        jobId: job.id,
        notificationId,
        scheduledFor: reminderDate,
        type: 'job_completion_reminder',
      });

      console.log('⏰ Job completion reminder scheduled for:', job.title);
    } catch (error) {
      console.error('❌ Error scheduling job completion reminder:', error);
    }
  }

  /**
   * Cancel notifications for a job (when job is completed/cancelled)
   */
  async cancelJobNotifications(jobId: string): Promise<void> {
    try {
      // Cancel pre-job reminder
      const preJobNotification = this.scheduledNotifications.get(jobId);
      if (preJobNotification) {
        await Notifications.cancelScheduledNotificationAsync(preJobNotification.notificationId);
        this.scheduledNotifications.delete(jobId);
      }

      // Cancel job start notification
      const jobStartNotification = this.scheduledNotifications.get(`${jobId}_start`);
      if (jobStartNotification) {
        await Notifications.cancelScheduledNotificationAsync(jobStartNotification.notificationId);
        this.scheduledNotifications.delete(`${jobId}_start`);
      }

      console.log('🚫 Cancelled notifications for job:', jobId);
    } catch (error) {
      console.error('❌ Error cancelling job notifications:', error);
    }
  }

  /**
   * Handle notification responses (when user taps notification)
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<{
    shouldOpenJob: boolean;
    shouldOpenAI: boolean;
    jobId?: string;
    action?: string;
  }> {
    const { data } = response.notification.request.content;
    
    if (data && typeof data === 'object' && 'type' in data) {
      if (data.type === 'pre_job_reminder') {
        return {
          shouldOpenJob: true,
          shouldOpenAI: true,
          jobId: typeof data.jobId === 'string' ? data.jobId : undefined,
          action: 'pre_job_review',
        };
      }
      
      if (data.type === 'job_start') {
        return {
          shouldOpenJob: true,
          shouldOpenAI: data.autoOpenAI === true,
          jobId: typeof data.jobId === 'string' ? data.jobId : undefined,
          action: 'start_job',
        };
      }
    }

    return {
      shouldOpenJob: false,
      shouldOpenAI: false,
    };
  }

  /**
   * Get all pending job notifications for a staff member
   */
  async getPendingNotifications(staffId: string): Promise<JobNotificationSchedule[]> {
    try {
      const db = await getDb();
      const jobsRef = collection(db, 'jobs');
      const q = query(
        jobsRef,
        where('assignedStaffId', '==', staffId),
        where('status', 'in', ['assigned', 'accepted'])
      );

      const querySnapshot = await getDocs(q);
      const pendingJobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pendingJobs.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate() || new Date(),
        } as Job);
      });

      // Schedule notifications for jobs that don't have them yet
      for (const job of pendingJobs) {
        if (!this.scheduledNotifications.has(job.id)) {
          await this.schedulePreJobReminder(job, staffId);
          await this.scheduleJobStartNotification(job, staffId);
        }
      }

      return Array.from(this.scheduledNotifications.values());
    } catch (error) {
      console.error('❌ Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Update job notification status in Firestore
   */
  private async updateJobNotificationStatus(jobId: string, updates: any): Promise<void> {
    try {
      const db = await getDb();
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, updates);
    } catch (error) {
      console.error('❌ Error updating job notification status:', error);
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    const expiredNotifications: string[] = [];

    this.scheduledNotifications.forEach((notification, key) => {
      if (notification.scheduledFor < now) {
        expiredNotifications.push(key);
      }
    });

    for (const key of expiredNotifications) {
      this.scheduledNotifications.delete(key);
    }

    console.log(`🧹 Cleaned up ${expiredNotifications.length} expired notifications`);
  }
}

export const smartJobNotificationService = new SmartJobNotificationService();
