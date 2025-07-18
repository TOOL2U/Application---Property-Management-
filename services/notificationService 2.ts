import { collection, doc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationData } from '@/hooks/useNotifications';

export interface PushNotificationPayload {
  to: string | string[]; // Push token(s)
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send push notification via Expo Push API
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    try {
      // For demo purposes, log the notification instead of sending
      console.log('📱 Push Notification Sent:', {
        to: payload.to,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      // In production, uncomment this to send real notifications:
      /*
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: payload.to,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: payload.sound || 'default',
          badge: payload.badge,
          priority: payload.priority || 'high',
          channelId: payload.channelId || 'default',
        }),
      });

      const result = await response.json();
      console.log('Push notification result:', result);
      
      return response.ok;
      */

      return true; // Demo mode always returns success
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Get user's push token from Firestore
  async getUserPushToken(userId: string): Promise<string | null> {
    try {
      // For demo purposes, return a mock token
      return `demo-token-${userId}`;

      // In production, uncomment this:
      /*
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.pushToken || null;
      }
      return null;
      */
    } catch (error) {
      console.error('Error getting user push token:', error);
      return null;
    }
  }

  // Send task assignment notification
  async sendTaskAssignmentNotification(staffId: string, taskData: any): Promise<boolean> {
    try {
      const pushToken = await this.getUserPushToken(staffId);
      
      if (!pushToken) {
        console.log('No push token found for staff:', staffId);
        return false;
      }

      const payload: PushNotificationPayload = {
        to: pushToken,
        title: '📋 New Task Assigned',
        body: `${taskData.taskType} at ${taskData.propertyName}`,
        data: {
          type: 'task_assigned',
          taskId: taskData.id,
          staffId: staffId,
          taskType: taskData.taskType,
          propertyName: taskData.propertyName,
          scheduledDate: taskData.scheduledDate,
          priority: taskData.priority,
        },
        sound: 'default',
        badge: 1,
        priority: taskData.priority === 'urgent' ? 'high' : 'normal',
      };

      const success = await this.sendPushNotification(payload);
      
      if (success) {
        // Log notification in Firestore for tracking
        await this.logNotification({
          userId: staffId,
          type: 'task_assigned',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sentAt: new Date(),
          status: 'sent',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
      return false;
    }
  }

  // Send task update notification
  async sendTaskUpdateNotification(staffId: string, taskData: any, updateType: string): Promise<boolean> {
    try {
      const pushToken = await this.getUserPushToken(staffId);
      
      if (!pushToken) {
        console.log('No push token found for staff:', staffId);
        return false;
      }

      let title = '📝 Task Updated';
      let body = `${taskData.propertyName} - ${updateType}`;

      if (updateType === 'cancelled') {
        title = '❌ Task Cancelled';
        body = `${taskData.taskType} at ${taskData.propertyName} has been cancelled`;
      } else if (updateType === 'rescheduled') {
        title = '📅 Task Rescheduled';
        body = `${taskData.taskType} at ${taskData.propertyName} has been rescheduled`;
      } else if (updateType === 'priority_changed') {
        title = '⚡ Priority Updated';
        body = `${taskData.taskType} at ${taskData.propertyName} - Priority: ${taskData.priority}`;
      }

      const payload: PushNotificationPayload = {
        to: pushToken,
        title,
        body,
        data: {
          type: 'task_updated',
          taskId: taskData.id,
          staffId: staffId,
          updateType: updateType,
          taskType: taskData.taskType,
          propertyName: taskData.propertyName,
          priority: taskData.priority,
        },
        sound: 'default',
        priority: taskData.priority === 'urgent' ? 'high' : 'normal',
      };

      const success = await this.sendPushNotification(payload);
      
      if (success) {
        await this.logNotification({
          userId: staffId,
          type: 'task_updated',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sentAt: new Date(),
          status: 'sent',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending task update notification:', error);
      return false;
    }
  }

  // Send urgent task notification
  async sendUrgentTaskNotification(staffId: string, taskData: any): Promise<boolean> {
    try {
      const pushToken = await this.getUserPushToken(staffId);
      
      if (!pushToken) {
        console.log('No push token found for staff:', staffId);
        return false;
      }

      const payload: PushNotificationPayload = {
        to: pushToken,
        title: '🚨 URGENT TASK',
        body: `Immediate attention required: ${taskData.taskType} at ${taskData.propertyName}`,
        data: {
          type: 'urgent_task',
          taskId: taskData.id,
          staffId: staffId,
          taskType: taskData.taskType,
          propertyName: taskData.propertyName,
          priority: 'urgent',
        },
        sound: 'default',
        badge: 1,
        priority: 'high',
      };

      const success = await this.sendPushNotification(payload);
      
      if (success) {
        await this.logNotification({
          userId: staffId,
          type: 'urgent_task',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sentAt: new Date(),
          status: 'sent',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending urgent task notification:', error);
      return false;
    }
  }

  // Send reminder notification
  async sendTaskReminderNotification(staffId: string, taskData: any): Promise<boolean> {
    try {
      const pushToken = await this.getUserPushToken(staffId);
      
      if (!pushToken) {
        console.log('No push token found for staff:', staffId);
        return false;
      }

      const payload: PushNotificationPayload = {
        to: pushToken,
        title: '⏰ Task Reminder',
        body: `Don't forget: ${taskData.taskType} at ${taskData.propertyName} in 30 minutes`,
        data: {
          type: 'reminder',
          taskId: taskData.id,
          staffId: staffId,
          taskType: taskData.taskType,
          propertyName: taskData.propertyName,
        },
        sound: 'default',
        priority: 'normal',
      };

      const success = await this.sendPushNotification(payload);
      
      if (success) {
        await this.logNotification({
          userId: staffId,
          type: 'reminder',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sentAt: new Date(),
          status: 'sent',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending task reminder notification:', error);
      return false;
    }
  }

  // Log notification for tracking and analytics
  private async logNotification(notificationLog: any): Promise<void> {
    try {
      // For demo purposes, just log to console
      console.log('📊 Notification logged:', notificationLog);

      // In production, uncomment this:
      /*
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notificationLog,
        sentAt: serverTimestamp(),
      });
      */
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Send bulk notifications to multiple staff members
  async sendBulkNotifications(staffIds: string[], notificationData: NotificationData): Promise<boolean[]> {
    try {
      const results = await Promise.all(
        staffIds.map(async (staffId) => {
          const pushToken = await this.getUserPushToken(staffId);
          
          if (!pushToken) {
            console.log('No push token found for staff:', staffId);
            return false;
          }

          const payload: PushNotificationPayload = {
            to: pushToken,
            title: notificationData.title,
            body: notificationData.body,
            data: {
              ...notificationData.data,
              staffId: staffId,
            },
            sound: 'default',
            priority: 'normal',
          };

          return await this.sendPushNotification(payload);
        })
      );

      return results;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return staffIds.map(() => false);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
