/**
 * Push Notification Service
 * Comprehensive Expo push notifications with Firebase integration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationDeduplicationService } from '@/services/notificationDeduplicationService';

// Admin services are handled server-side only
let adminService: any = null;
import type { 
  JobAssignment, 
  JobNotificationPayload, 
  NotificationType,
  StaffAvailability 
} from '@/types/jobAssignment';

// Configure notification behavior for all app states
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  deviceName: string;
  lastUpdated: any; // Firestore timestamp
  isActive: boolean;
  appVersion?: string;
}

export interface NotificationData {
  type: 'job_assignment' | 'job_update' | 'emergency' | 'system' | 'message';
  jobId?: string;
  staffId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionRequired?: boolean;
  deepLink?: string;
  [key: string]: any;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: NotificationData;
  sound?: string | boolean;
  badge?: number;
  categoryId?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private deviceId: string | null = null;
  private currentStaffId: string | null = null;
  private isInitialized: boolean = false;
  private permissionStatus: Notifications.PermissionStatus | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  constructor() {
    console.log('📲 PushNotificationService: Initializing...');
    this.setupNotificationCategories();
  }

  /**
   * Initialize push notifications for the authenticated staff member
   */
  async initialize(staffId: string): Promise<boolean> {
    try {
      console.log('� PushNotificationService: Initializing for staff:', staffId);
      
      this.currentStaffId = staffId;

      // Handle different platforms
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, using web push notifications');
        return await this.initializeWebPushNotifications(staffId);
      }

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return false;
      }

      // Request permissions
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        console.warn('⚠️ Push notification permissions denied');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.error('❌ Failed to get push token');
        return false;
      }

      // Store token in Firestore
      await this.storePushToken(staffId, token);

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      this.isInitialized = true;
      console.log('✅ PushNotificationService: Initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ PushNotificationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionStatus = finalStatus;

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted:', finalStatus);
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;

    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem('expo_push_token');
      if (cachedToken && this.expoPushToken === cachedToken) {
        console.log('📱 Using cached push token');
        return cachedToken;
      }

      console.log('📱 Getting new push token...');
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'cc931fa3';
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      
      // Cache the token
      await AsyncStorage.setItem('expo_push_token', this.expoPushToken);
      
      console.log('✅ Push token obtained:', this.expoPushToken.substring(0, 20) + '...');
      return this.expoPushToken;

    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Store push token in Firestore
   */
  async storePushToken(staffId: string, token: string): Promise<void> {
    try {
      const db = await getDb();
      
      // Generate a unique device ID
      this.deviceId = await this.getDeviceId();
      
      const tokenData: PushToken = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: this.deviceId,
        deviceName: await this.getDeviceName(),
        lastUpdated: serverTimestamp(),
        isActive: true,
        appVersion: '1.0.0',
      };

      // Store in staff_accounts/{staffId}/devices/{deviceId}
      const deviceRef = doc(db, 'staff_accounts', staffId, 'devices', this.deviceId);
      await setDoc(deviceRef, tokenData, { merge: true });

      console.log('✅ Push token stored in Firestore for device:', this.deviceId);

      // Also save to staff profile for backward compatibility
      await this.saveTokenToStaffProfile(staffId, token);

      // Clean up old/inactive tokens for this staff member
      await this.cleanupOldTokens(staffId);

    } catch (error) {
      console.error('❌ Failed to store push token:', error);
      throw error;
    }
  }

  /**
   * Save FCM token to staff profile for server-side notifications (backward compatibility)
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
   * Remove push token from Firestore (on logout)
   */
  async removePushToken(staffId: string): Promise<void> {
    try {
      if (!this.deviceId) {
        this.deviceId = await this.getDeviceId();
      }

      const db = await getDb();
      const deviceRef = doc(db, 'staff_accounts', staffId, 'devices', this.deviceId!);
      await deleteDoc(deviceRef);

      console.log('✅ Push token removed from Firestore');

      // Clear local cache
      await AsyncStorage.removeItem('expo_push_token');
      this.expoPushToken = null;

    } catch (error) {
      console.error('❌ Failed to remove push token:', error);
    }
  }

  /**
   * Clean up old/inactive tokens
   */
  async cleanupOldTokens(staffId: string): Promise<void> {
    try {
      const db = await getDb();
      const devicesRef = collection(db, 'staff_accounts', staffId, 'devices');
      const snapshot = await getDocs(devicesRef);

      const currentTime = Date.now();
      const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60 * 1000); // 30 days

      for (const docSnap of snapshot.docs) {
        const deviceData = docSnap.data() as PushToken;
        const lastUpdated = deviceData.lastUpdated?.toMillis() || 0;

        // Remove tokens older than 30 days or from different devices with same token
        if (lastUpdated < thirtyDaysAgo || 
            (deviceData.token === this.expoPushToken && docSnap.id !== this.deviceId)) {
          await deleteDoc(docSnap.ref);
          console.log('🧹 Cleaned up old token for device:', docSnap.id);
        }
      }

    } catch (error) {
      console.error('❌ Failed to cleanup old tokens:', error);
    }
  }

  /**
   * Get unique device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        // Generate a new device ID
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }

      return deviceId;

    } catch (error) {
      console.error('❌ Failed to get device ID:', error);
      return `${Platform.OS}_${Date.now()}_fallback`;
    }
  }

  /**
   * Get device name
   */
  private async getDeviceName(): Promise<string> {
    try {
      const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}` || 'Unknown Device';
      return deviceName;
    } catch (error) {
      console.error('❌ Failed to get device name:', error);
      return 'Unknown Device';
    }
  }

  /**
   * Setup notification categories (for action buttons)
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('job_assignment', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Decline',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('emergency', [
        {
          identifier: 'respond',
          buttonTitle: 'Respond',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'call_support',
          buttonTitle: 'Call Support',
          options: { opensAppToForeground: true },
        },
      ]);

      console.log('✅ Notification categories set up');

    } catch (error) {
      console.error('❌ Failed to setup notification categories:', error);
    }
  }
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

      // Check deduplication service first
      const shouldSend = notificationDeduplicationService.shouldAllowNotification({
        jobId: job.id,
        staffId: job.staffId,
        type: 'job_assigned',
        source: 'push',
        timestamp: Date.now(),
      });

      if (!shouldSend) {
        console.log('🔕 Push notification blocked by deduplication service');
        return;
      }

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
   * Get current notification permission status
   */
  getPermissionStatus(): Notifications.PermissionStatus | null {
    return this.permissionStatus;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check notification status:', error);
      return false;
    }
  }

  /**
   * Get current push token
   */
  getCurrentPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Refresh push token
   */
  async refreshPushToken(): Promise<string | null> {
    try {
      if (!this.currentStaffId) {
        console.error('❌ No current staff ID for token refresh');
        return null;
      }

      const newToken = await this.getPushToken();
      if (newToken && newToken !== this.expoPushToken) {
        await this.storePushToken(this.currentStaffId, newToken);
        console.log('✅ Push token refreshed');
      }

      return newToken;

    } catch (error) {
      console.error('❌ Failed to refresh push token:', error);
      return null;
    }
  }

  /**
   * Send a local notification (for testing)
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from Sia Moon Staff app',
          data: {
            type: 'system',
            priority: 'normal',
          },
          sound: true,
          categoryIdentifier: 'job_assignment',
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Test notification sent');

    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  }

  /**
   * Enhanced cleanup on logout
   */
  async enhancedCleanup(staffId?: string): Promise<void> {
    try {
      console.log('🧹 PushNotificationService: Enhanced cleaning up...');

      if (staffId && this.deviceId) {
        await this.removePushToken(staffId);
      }

      this.expoPushToken = null;
      this.deviceId = null;
      this.currentStaffId = null;
      this.isInitialized = false;
      this.permissionStatus = null;

      // Clean up listeners
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }

      console.log('✅ PushNotificationService: Enhanced cleanup complete');

    } catch (error) {
      console.error('❌ PushNotificationService: Enhanced cleanup failed:', error);
    }
  }

  /**
   * Clean up listeners (original method)
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
