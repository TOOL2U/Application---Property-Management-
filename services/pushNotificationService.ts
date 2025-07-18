/**
 * Push Notification Service
 * Firebase Cloud Messaging integration for job assignment notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

// Admin services are handled server-side only
// Client-side push notifications use Expo's FCM integration
let adminService: any = null;
import type { 
  JobAssignment, 
  JobNotificationPayload, 
  NotificationType,
  StaffAvailability 
} from '@/types/jobAssignment';

// Configure notification behavior
// Fix: Add missing properties for NotificationBehavior type
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize push notifications for the mobile app and web
   */
  async initialize(staffId: string): Promise<boolean> {
    try {
      console.log('🔔 Initializing push notifications for staff:', staffId);

      // Check platform and device support
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, using web push notifications');
        return await this.initializeWebPushNotifications(staffId);
      }

      // Skip push notifications for non-mobile platforms during development
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('⚠️ Push notifications not supported on platform:', Platform.OS);
        return false;
      }

      // Check if device supports push notifications (mobile only)
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return false;
      }

      // Request permissions with error handling
      let finalStatus: string;
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (permissionError) {
        console.error('❌ Error requesting notification permissions:', permissionError);
        return false;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Push notification permissions not granted');
        return false;
      }

      // Get Expo push token with proper error handling
      try {
        const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc';

        if (!projectId) {
          console.error('❌ No Firebase project ID found for push notifications');
          return false;
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        this.expoPushToken = token.data;
        console.log('✅ Expo push token obtained:', this.expoPushToken);

        // Save token to staff profile
        await this.saveTokenToStaffProfile(staffId, this.expoPushToken);
      } catch (tokenError) {
        console.error('❌ Error getting Expo push token:', tokenError);
        // Continue without token - we can still set up listeners
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Initialize web push notifications
   */
  async initializeWebPushNotifications(staffId: string): Promise<boolean> {
    try {
      console.log('🌐 Initializing web push notifications for staff:', staffId);

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker not supported in this browser');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('⚠️ Push notifications not supported in this browser');
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      // Register service worker first (required for Expo web push notifications)
      try {
        console.log('🔧 Registering service worker for web push notifications...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker registered and ready:', registration);

        // Skip Expo push token for web during development
        // Web push notifications will use service worker instead
        console.log('⚠️ Skipping Expo push token for web platform - using service worker notifications');

        // Set up notification listeners for web
        this.setupWebNotificationListeners();

        return true;
      } catch (swError) {
        console.error('❌ Service worker registration failed:', swError);
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing web push notifications:', error);
      return false;
    }
  }

  /**
   * Set up notification listeners for web platform
   */
  setupWebNotificationListeners(): void {
    try {
      // Listen for notification clicks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('📱 Web notification message received:', event.data);

          if (event.data?.type === 'notification-click') {
            // Handle notification click
            const { jobId, action } = event.data;
            this.handleWebNotificationAction(jobId, action);
          }
        });
      }

      // Set up Expo notification listeners if available
      if (Notifications.addNotificationReceivedListener) {
        this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
          console.log('📱 Web notification received:', notification);
        });
      }

      if (Notifications.addNotificationResponseReceivedListener) {
        this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('📱 Web notification response:', response);

          // Handle job assignment actions
          if (response.notification.request.content.data?.type === 'job_assignment') {
            const { jobId } = response.notification.request.content.data;
            const action = response.actionIdentifier as string;
            this.handleWebNotificationAction(jobId as string, action);
          }
        });
      }

      console.log('✅ Web notification listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up web notification listeners:', error);
    }
  }

  /**
   * Handle web notification actions
   */
  async handleWebNotificationAction(jobId: string, action: string): Promise<void> {
    try {
      console.log('🔄 Handling web notification action:', { jobId, action });

      if (action === 'accept' || action === 'decline') {
        // Import job assignment service dynamically
        const { mobileJobAssignmentService } = await import('@/services/jobAssignmentService');

        const status = action === 'accept' ? 'accepted' : 'rejected';
        const result = await mobileJobAssignmentService.updateJobStatus({
          jobId,
          staffId: 'current-user', // This should be the actual staff ID
          status,
          // Remove timestamp as it's not part of JobStatusUpdate interface
        });

        if (result.success) {
          console.log(`✅ Job ${action}ed successfully via web notification`);

          // Show confirmation notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Job ${action}ed`, {
              body: `Job has been ${action}ed successfully`,
              icon: '/assets/icon.png',
            });
          }
        } else {
          console.error(`❌ Failed to ${action} job:`, result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error handling web notification action:', error);
    }
  }

  /**
   * Save FCM token to staff profile for server-side notifications
   */
  private async saveTokenToStaffProfile(staffId: string, token: string): Promise<void> {
    try {
      const db = await getDb();
      const staffRef = doc(db, 'staff_accounts', staffId);
      
      // Get current staff data
      const staffDoc = await getDoc(staffRef);
      if (!staffDoc.exists()) {
        console.error('❌ Staff profile not found:', staffId);
        return;
      }

      const staffData = staffDoc.data();
      const currentTokens = staffData.fcmTokens || [];

      // Add token if not already present
      if (!currentTokens.includes(token)) {
        await updateDoc(staffRef, {
          fcmTokens: arrayUnion(token),
          lastTokenUpdate: new Date(),
          notificationPreferences: {
            pushEnabled: true,
            emailEnabled: staffData.notificationPreferences?.emailEnabled ?? true,
            smsEnabled: staffData.notificationPreferences?.smsEnabled ?? false,
            reminderMinutes: staffData.notificationPreferences?.reminderMinutes ?? 15,
            ...staffData.notificationPreferences
          }
        });

        console.log('✅ FCM token saved to staff profile');
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      
      const data = notification.request.content.data;
      if (data?.type === 'job_assigned') {
        this.handleJobAssignmentNotification(data);
      }
    });

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data?.jobId) {
        this.handleNotificationTap(data);
      }
    });
  }

  /**
   * Handle job assignment notification
   */
  private handleJobAssignmentNotification(data: any): void {
    // You can add custom logic here, like showing an in-app alert
    console.log('📋 Job assignment notification received:', data.jobId);
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(data: any): void {
    // Navigate to job details or acceptance screen
    console.log('🎯 Navigate to job:', data.jobId);
    // This would typically use your navigation system
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('job-assignments', {
      name: 'Job Assignments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('job-updates', {
      name: 'Job Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#22c55e',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('job-reminders', {
      name: 'Job Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
      sound: 'default',
    });
  }

  /**
   * Send job assignment notification (server-side)
   */
  static async sendJobAssignmentNotification(job: JobAssignment): Promise<void> {
    try {
      console.log('📤 Sending job assignment notification for job:', job.id);

      // Get staff FCM tokens
      const db = await getDb();
      const staffRef = doc(db, 'staff_accounts', job.staffId);
      const staffDoc = await getDoc(staffRef);
      
      if (!staffDoc.exists()) {
        console.error('❌ Staff not found for notification:', job.staffId);
        return;
      }

      const staffData = staffDoc.data();
      const fcmTokens = staffData.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.warn('⚠️ No FCM tokens found for staff:', job.staffId);
        return;
      }

      // Check notification preferences
      if (!staffData.notificationPreferences?.pushEnabled) {
        console.log('📵 Push notifications disabled for staff:', job.staffId);
        return;
      }

      // Create notification payload
      const payload: JobNotificationPayload = {
        title: '🔔 New Job Assignment',
        body: `${job.title} - ${job.type.replace('_', ' ')} at ${job.location.address}`,
        data: {
          type: 'job_assigned',
          jobId: job.id,
          staffId: job.staffId,
          priority: job.priority,
          scheduledFor: job.scheduledFor.toDate().toISOString(),
          jobTitle: job.title,
          jobType: job.type,
          location: job.location.address,
        },
        android: {
          priority: job.priority === 'urgent' ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: 'job-assignments',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Send notification using Firebase Admin
      const admin = adminService.getMessaging();
      if (admin) {
        const response = await admin.sendMulticast({
          tokens: fcmTokens,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data,
          android: payload.android,
          apns: payload.apns,
        });

        console.log('✅ Notification sent successfully:', response.successCount, 'sent,', response.failureCount, 'failed');

        // Log notification
        await PushNotificationService.logNotification(job, 'job_assigned', 'sent');
      }
    } catch (error) {
      console.error('❌ Error sending job assignment notification:', error);
      // Fix: Handle unknown error type safely
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await PushNotificationService.logNotification(job, 'job_assigned', 'failed', errorMessage);
    }
  }

  /**
   * Send job status update notification
   */
  static async sendJobStatusNotification(
    job: JobAssignment, 
    previousStatus: string,
    targetAudience: 'admin' | 'staff' = 'admin'
  ): Promise<void> {
    try {
      console.log('📤 Sending job status notification:', job.id, previousStatus, '->', job.status);

      let title = '';
      let body = '';
      let notificationType: NotificationType = 'job_updated';

      switch (job.status) {
        case 'accepted':
          title = '✅ Job Accepted';
          body = `${job.title} has been accepted by staff`;
          notificationType = 'job_accepted';
          break;
        case 'rejected':
          title = '❌ Job Rejected';
          body = `${job.title} has been rejected by staff`;
          notificationType = 'job_rejected';
          break;
        case 'completed':
          title = '🎉 Job Completed';
          body = `${job.title} has been completed`;
          notificationType = 'job_completed';
          break;
        default:
          title = '📋 Job Updated';
          body = `${job.title} status changed to ${job.status}`;
      }

      // For now, we'll implement admin notifications later
      // This would typically send to admin/manager FCM tokens
      console.log('📱 Would send to admin:', title, body);

      // Log notification
      await PushNotificationService.logNotification(job, notificationType, 'sent');
    } catch (error) {
      console.error('❌ Error sending job status notification:', error);
    }
  }

  /**
   * Send job reminder notification
   */
  static async sendJobReminder(job: JobAssignment): Promise<void> {
    try {
      console.log('⏰ Sending job reminder for:', job.id);

      const payload: JobNotificationPayload = {
        title: '⏰ Job Reminder',
        body: `${job.title} is scheduled to start soon`,
        data: {
          type: 'job_reminder',
          jobId: job.id,
          staffId: job.staffId,
          priority: job.priority,
          scheduledFor: job.scheduledFor.toDate().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'job-reminders',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Implementation would be similar to sendJobAssignmentNotification
      console.log('⏰ Job reminder payload ready:', payload);
    } catch (error) {
      console.error('❌ Error sending job reminder:', error);
    }
  }

  /**
   * Log notification for audit trail
   */
  private static async logNotification(
    job: JobAssignment,
    type: NotificationType,
    status: 'sent' | 'delivered' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const notificationLog = {
        id: `notif_${Date.now()}`,
        type,
        sentAt: new Date(),
        sentTo: job.staffId,
        method: 'push' as const,
        status,
        error,
      };

      // Add to job's notification log
      const db = await getDb();
      const jobRef = doc(db, 'job_assignments', job.id);
      await updateDoc(jobRef, {
        notificationsSent: arrayUnion(notificationLog),
      });
    } catch (error) {
      console.error('❌ Error logging notification:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
// Fix: Export class for dynamic imports
export { PushNotificationService };
export default pushNotificationService;
