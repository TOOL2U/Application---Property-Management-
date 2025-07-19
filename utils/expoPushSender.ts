/**
 * Server-side Push Notification Sender
 * Sends push notifications using Expo Push API
 */

import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  categoryId?: string;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

interface NotificationTarget {
  staffId: string;
  tokens: string[];
}

export class ExpoPushNotificationSender {
  private static readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  /**
   * Send notification to specific staff member
   */
  static async sendToStaff(
    staffId: string, 
    title: string, 
    body: string, 
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const tokens = await this.getStaffPushTokens(staffId);
      
      if (tokens.length === 0) {
        console.warn('⚠️ No push tokens found for staff:', staffId);
        return false;
      }

      const message: ExpoPushMessage = {
        to: tokens,
        title,
        body,
        data: {
          staffId,
          ...data,
        },
        sound: 'default',
        priority: 'high',
        categoryId: data?.type === 'job_assignment' ? 'job_assignment' : undefined,
      };

      return await this.sendPushNotification(message);

    } catch (error) {
      console.error('❌ Error sending notification to staff:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple staff members
   */
  static async sendToMultipleStaff(
    staffIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: number; failed: number }> {
    try {
      const targets = await Promise.all(
        staffIds.map(async (staffId) => ({
          staffId,
          tokens: await this.getStaffPushTokens(staffId),
        }))
      );

      const validTargets = targets.filter(target => target.tokens.length > 0);
      
      if (validTargets.length === 0) {
        console.warn('⚠️ No valid push tokens found for any staff members');
        return { success: 0, failed: staffIds.length };
      }

      let successCount = 0;
      let failedCount = 0;

      for (const target of validTargets) {
        const message: ExpoPushMessage = {
          to: target.tokens,
          title,
          body,
          data: {
            staffId: target.staffId,
            ...data,
          },
          sound: 'default',
          priority: 'high',
        };

        const sent = await this.sendPushNotification(message);
        if (sent) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };

    } catch (error) {
      console.error('❌ Error sending notifications to multiple staff:', error);
      return { success: 0, failed: staffIds.length };
    }
  }

  /**
   * Send job assignment notification
   */
  static async sendJobAssignment(
    staffId: string,
    jobData: {
      jobId: string;
      title: string;
      type: string;
      location: string;
      priority: string;
      scheduledFor?: string;
    }
  ): Promise<boolean> {
    const title = '📋 New Job Assignment';
    const body = `${jobData.title} - ${jobData.type} at ${jobData.location}`;
    
    const data = {
      type: 'job_assignment',
      jobId: jobData.jobId,
      priority: jobData.priority,
      actionRequired: true,
      deepLink: `/(tabs)/jobs`, // Adjust based on your routing
    };

    return await this.sendToStaff(staffId, title, body, data);
  }

  /**
   * Send emergency notification
   */
  static async sendEmergencyAlert(
    staffIds: string[],
    emergencyData: {
      title: string;
      location: string;
      description: string;
      urgency: 'high' | 'critical';
    }
  ): Promise<{ success: number; failed: number }> {
    const title = '🚨 Emergency Alert';
    const body = `${emergencyData.title} at ${emergencyData.location}`;
    
    const data = {
      type: 'emergency',
      priority: 'urgent',
      urgency: emergencyData.urgency,
      description: emergencyData.description,
      actionRequired: true,
    };

    return await this.sendToMultipleStaff(staffIds, title, body, data);
  }

  /**
   * Send job status update notification
   */
  static async sendJobStatusUpdate(
    adminStaffIds: string[],
    jobData: {
      jobId: string;
      title: string;
      status: string;
      staffName: string;
    }
  ): Promise<{ success: number; failed: number }> {
    let title = '';
    let emoji = '';

    switch (jobData.status) {
      case 'accepted':
        title = 'Job Accepted';
        emoji = '✅';
        break;
      case 'rejected':
        title = 'Job Rejected';
        emoji = '❌';
        break;
      case 'completed':
        title = 'Job Completed';
        emoji = '🎉';
        break;
      default:
        title = 'Job Updated';
        emoji = '📋';
    }

    const notificationTitle = `${emoji} ${title}`;
    const body = `${jobData.title} has been ${jobData.status} by ${jobData.staffName}`;
    
    const data = {
      type: 'job_update',
      jobId: jobData.jobId,
      status: jobData.status,
      priority: 'normal',
    };

    return await this.sendToMultipleStaff(adminStaffIds, notificationTitle, body, data);
  }

  /**
   * Get push tokens for a staff member
   */
  private static async getStaffPushTokens(staffId: string): Promise<string[]> {
    try {
      const db = await getDb();
      
      // Get tokens from devices subcollection
      const devicesRef = collection(db, 'staff_accounts', staffId, 'devices');
      const devicesSnapshot = await getDocs(devicesRef);
      
      const tokens: string[] = [];
      devicesSnapshot.forEach(doc => {
        const deviceData = doc.data();
        if (deviceData.isActive && deviceData.token) {
          tokens.push(deviceData.token);
        }
      });

      // Also check the main staff document for backward compatibility
      const staffRef = collection(db, 'staff_accounts');
      const staffQuery = query(staffRef, where('__name__', '==', staffId));
      const staffSnapshot = await getDocs(staffQuery);
      
      if (!staffSnapshot.empty) {
        const staffData = staffSnapshot.docs[0].data();
        const fcmTokens = staffData.fcmTokens || [];
        tokens.push(...fcmTokens);
      }

      // Remove duplicates
      return [...new Set(tokens)];

    } catch (error) {
      console.error('❌ Error getting staff push tokens:', error);
      return [];
    }
  }

  /**
   * Send push notification using Expo Push API
   */
  private static async sendPushNotification(message: ExpoPushMessage): Promise<boolean> {
    try {
      console.log('📤 Sending push notification:', message.title);

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Push notification sent successfully:', result);
        return true;
      } else {
        console.error('❌ Push notification failed:', result);
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Validate push tokens (check if they're still valid)
   */
  static async validatePushTokens(tokens: string[]): Promise<string[]> {
    try {
      // This would typically use Expo's push receipt API
      // For now, we'll assume all tokens are valid
      // In production, you should implement proper token validation
      return tokens;

    } catch (error) {
      console.error('❌ Error validating push tokens:', error);
      return tokens;
    }
  }

  /**
   * Send notification receipt check (for delivery confirmation)
   */
  static async checkNotificationReceipts(receiptIds: string[]): Promise<void> {
    try {
      // Implement receipt checking using Expo's receipt API
      // https://docs.expo.dev/push-notifications/sending-notifications/#push-receipts
      console.log('🔍 Checking notification receipts:', receiptIds);

    } catch (error) {
      console.error('❌ Error checking notification receipts:', error);
    }
  }
}

export default ExpoPushNotificationSender;
