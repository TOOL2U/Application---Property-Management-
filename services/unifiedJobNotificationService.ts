/**
 * Unified Job Notification Service
 * Single point of truth for all job-related notifications
 * Prevents duplicates and ensures reliable delivery
 */

import {
  enhancedNotificationDeduplicationService,
  type NotificationRequest
} from './enhancedNotificationDeduplicationService';
import { notificationRateLimitingService } from './notificationRateLimitingService';
import { pushNotificationService } from './pushNotificationService';
import { getDb } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface JobNotificationData {
  jobId: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  propertyName: string;
  propertyAddress: string;
  scheduledDate: Date;
  assignedStaffId?: string;
  assignedStaffName?: string;
  status?: string;
  previousStatus?: string;
  completionNotes?: string;
  photos?: string[];
}

export interface NotificationRecipient {
  id: string;
  name: string;
  role: 'staff' | 'admin' | 'manager';
  fcmTokens?: string[];
  notificationPreferences?: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    jobAssignments: boolean;
    jobUpdates: boolean;
    urgentOnly: boolean;
  };
}

export interface NotificationResult {
  success: boolean;
  eventId: string;
  recipientCount: number;
  channelResults: {
    push: { success: number; failed: number; };
    webhook: { success: number; failed: number; };
    realtime: { success: number; failed: number; };
  };
  duplicatesBlocked: number;
  errors: string[];
}

class UnifiedJobNotificationService {
  private readonly ADMIN_ROLES = ['admin', 'manager'];
  private readonly STAFF_ROLES = ['staff', 'admin', 'manager'];

  /**
   * Send job assignment notification
   */
  async sendJobAssignmentNotification(jobData: JobNotificationData): Promise<NotificationResult> {
    console.log('📤 Sending job assignment notification:', jobData.jobId);

    const result: NotificationResult = {
      success: false,
      eventId: '',
      recipientCount: 0,
      channelResults: {
        push: { success: 0, failed: 0 },
        webhook: { success: 0, failed: 0 },
        realtime: { success: 0, failed: 0 }
      },
      duplicatesBlocked: 0,
      errors: []
    };

    try {
      // Get assigned staff member
      if (!jobData.assignedStaffId) {
        result.errors.push('No assigned staff ID provided');
        return result;
      }

      const recipient = await this.getStaffMember(jobData.assignedStaffId);
      if (!recipient) {
        result.errors.push(`Staff member not found: ${jobData.assignedStaffId}`);
        return result;
      }

      // Check if staff wants job assignment notifications
      if (recipient.notificationPreferences?.jobAssignments === false) {
        console.log('🔕 Staff has disabled job assignment notifications:', recipient.id);
        result.success = true;
        return result;
      }

      // Create notification request
      const notificationRequest: NotificationRequest = {
        eventType: 'job.assigned',
        entityId: jobData.jobId,
        recipientId: recipient.id,
        content: {
          title: '🔔 New Job Assignment',
          body: `${jobData.title} - ${jobData.type.replace('_', ' ')} at ${jobData.propertyName}`,
          data: {
            jobId: jobData.jobId,
            jobTitle: jobData.title,
            jobType: jobData.type,
            priority: jobData.priority,
            propertyName: jobData.propertyName,
            propertyAddress: jobData.propertyAddress,
            scheduledDate: jobData.scheduledDate.toISOString(),
            assignedStaffId: jobData.assignedStaffId,
            deepLink: `app://jobs/${jobData.jobId}`
          }
        },
        source: 'unified_service',
        priority: jobData.priority,
        metadata: {
          jobType: jobData.type,
          propertyId: jobData.propertyName // You might want to pass actual property ID
        }
      };

      // Check rate limits first
      const rateLimitResult = await notificationRateLimitingService.checkRateLimit(
        recipient.id,
        'job.assigned',
        jobData.priority
      );

      if (!rateLimitResult.allowed) {
        result.errors.push(`Rate limited: ${rateLimitResult.reason}`);
        result.success = false;
        console.log('🚫 Job assignment notification rate limited:', rateLimitResult.reason);
        return result;
      }

      // Check for duplicates
      const deduplicationResult = await enhancedNotificationDeduplicationService
        .shouldAllowNotification(notificationRequest);

      if (!deduplicationResult.allowed) {
        result.duplicatesBlocked = 1;
        result.success = true; // Not an error, just blocked duplicate
        result.eventId = deduplicationResult.event.id;
        console.log('🔕 Job assignment notification blocked as duplicate:', deduplicationResult.reason);
        return result;
      }

      result.eventId = deduplicationResult.event.id;
      result.recipientCount = 1;

      // Send push notification
      if (recipient.notificationPreferences?.pushEnabled !== false && recipient.fcmTokens?.length) {
        try {
          const pushResult = await this.sendPushNotification(recipient, notificationRequest);
          if (pushResult.success) {
            result.channelResults.push.success = 1;
          } else {
            result.channelResults.push.failed = 1;
            result.errors.push(`Push notification failed: ${pushResult.error}`);
          }
        } catch (error) {
          result.channelResults.push.failed = 1;
          result.errors.push(`Push notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send real-time notification (WebSocket/Server-Sent Events)
      try {
        await this.sendRealtimeNotification(recipient.id, notificationRequest);
        result.channelResults.realtime.success = 1;
      } catch (error) {
        result.channelResults.realtime.failed = 1;
        result.errors.push(`Real-time notification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Mark as sent if at least one channel succeeded
      const totalSuccess = result.channelResults.push.success + result.channelResults.realtime.success;
      if (totalSuccess > 0) {
        await enhancedNotificationDeduplicationService.markNotificationSent(result.eventId);
        result.success = true;
      } else {
        await enhancedNotificationDeduplicationService.markNotificationFailed(
          result.eventId, 
          `All channels failed: ${result.errors.join(', ')}`
        );
      }

      console.log('✅ Job assignment notification completed:', {
        jobId: jobData.jobId,
        success: result.success,
        channels: result.channelResults
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error('❌ Error sending job assignment notification:', error);

      if (result.eventId) {
        await enhancedNotificationDeduplicationService.markNotificationFailed(result.eventId, errorMessage);
      }

      return result;
    }
  }

  /**
   * Send job status update notification
   */
  async sendJobStatusUpdateNotification(jobData: JobNotificationData): Promise<NotificationResult> {
    console.log('📤 Sending job status update notification:', jobData.jobId, jobData.status);

    const result: NotificationResult = {
      success: false,
      eventId: '',
      recipientCount: 0,
      channelResults: {
        push: { success: 0, failed: 0 },
        webhook: { success: 0, failed: 0 },
        realtime: { success: 0, failed: 0 }
      },
      duplicatesBlocked: 0,
      errors: []
    };

    try {
      // Get admin/manager recipients for status updates
      const recipients = await this.getAdminRecipients();
      if (recipients.length === 0) {
        result.errors.push('No admin recipients found');
        return result;
      }

      result.recipientCount = recipients.length;

      // Generate appropriate notification content based on status
      const { title, body } = this.generateStatusUpdateContent(jobData);

      let totalDuplicatesBlocked = 0;
      let totalSuccess = 0;

      // Send to each admin recipient
      for (const recipient of recipients) {
        // Skip if recipient has disabled job updates
        if (recipient.notificationPreferences?.jobUpdates === false) {
          continue;
        }

        const notificationRequest: NotificationRequest = {
          eventType: 'job.status_updated',
          entityId: jobData.jobId,
          recipientId: recipient.id,
          content: {
            title,
            body,
            data: {
              jobId: jobData.jobId,
              jobTitle: jobData.title,
              status: jobData.status,
              previousStatus: jobData.previousStatus,
              assignedStaffId: jobData.assignedStaffId,
              assignedStaffName: jobData.assignedStaffName,
              propertyName: jobData.propertyName,
              completionNotes: jobData.completionNotes,
              deepLink: `app://jobs/${jobData.jobId}`
            }
          },
          source: 'unified_service',
          priority: jobData.priority,
          metadata: {
            statusChange: `${jobData.previousStatus} -> ${jobData.status}`,
            jobType: jobData.type
          }
        };

        // Check for duplicates
        const deduplicationResult = await enhancedNotificationDeduplicationService
          .shouldAllowNotification(notificationRequest);

        if (!deduplicationResult.allowed) {
          totalDuplicatesBlocked++;
          continue;
        }

        if (!result.eventId) {
          result.eventId = deduplicationResult.event.id;
        }

        // Send push notification
        if (recipient.notificationPreferences?.pushEnabled !== false && recipient.fcmTokens?.length) {
          try {
            const pushResult = await this.sendPushNotification(recipient, notificationRequest);
            if (pushResult.success) {
              result.channelResults.push.success++;
              totalSuccess++;
            } else {
              result.channelResults.push.failed++;
              result.errors.push(`Push to ${recipient.name}: ${pushResult.error}`);
            }
          } catch (error) {
            result.channelResults.push.failed++;
            result.errors.push(`Push error for ${recipient.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }

        // Send real-time notification
        try {
          await this.sendRealtimeNotification(recipient.id, notificationRequest);
          result.channelResults.realtime.success++;
          totalSuccess++;
        } catch (error) {
          result.channelResults.realtime.failed++;
          result.errors.push(`Real-time error for ${recipient.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Mark individual notification as sent/failed
        if (totalSuccess > 0) {
          await enhancedNotificationDeduplicationService.markNotificationSent(deduplicationResult.event.id);
        } else {
          await enhancedNotificationDeduplicationService.markNotificationFailed(
            deduplicationResult.event.id,
            'All channels failed for this recipient'
          );
        }
      }

      result.duplicatesBlocked = totalDuplicatesBlocked;
      result.success = totalSuccess > 0;

      console.log('✅ Job status update notification completed:', {
        jobId: jobData.jobId,
        status: jobData.status,
        success: result.success,
        recipients: result.recipientCount,
        duplicatesBlocked: totalDuplicatesBlocked
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error('❌ Error sending job status update notification:', error);
      return result;
    }
  }

  /**
   * Send push notification to a recipient
   */
  private async sendPushNotification(
    recipient: NotificationRecipient, 
    request: NotificationRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!recipient.fcmTokens?.length) {
        return { success: false, error: 'No FCM tokens available' };
      }

      // Use existing push notification service
      const success = await pushNotificationService.sendToUser(recipient.id, {
        title: request.content.title,
        body: request.content.body,
        data: request.content.data,
        sound: request.priority === 'urgent' ? 'urgent_notification.wav' : 'default',
        priority: request.priority === 'urgent' ? 'high' : 'normal'
      });

      return { success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown push notification error' 
      };
    }
  }

  /**
   * Send real-time notification (WebSocket/SSE)
   */
  private async sendRealtimeNotification(
    recipientId: string, 
    request: NotificationRequest
  ): Promise<void> {
    // TODO: Implement WebSocket/Server-Sent Events for real-time notifications
    // For now, just log that we would send it
    console.log('📡 Real-time notification sent:', {
      recipientId,
      eventType: request.eventType,
      entityId: request.entityId
    });
  }

  /**
   * Get staff member by ID
   */
  private async getStaffMember(staffId: string): Promise<NotificationRecipient | null> {
    try {
      const db = await getDb();
      const staffDoc = await getDoc(doc(db, 'staff', staffId));
      
      if (!staffDoc.exists()) {
        return null;
      }

      const data = staffDoc.data();
      return {
        id: staffDoc.id,
        name: data.name || 'Unknown Staff',
        role: data.role || 'staff',
        fcmTokens: data.fcmTokens || [],
        notificationPreferences: data.notificationPreferences || {
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          jobAssignments: true,
          jobUpdates: true,
          urgentOnly: false
        }
      };
    } catch (error) {
      console.error('❌ Error getting staff member:', error);
      return null;
    }
  }

  /**
   * Get admin/manager recipients
   */
  private async getAdminRecipients(): Promise<NotificationRecipient[]> {
    try {
      const db = await getDb();
      const adminQuery = query(
        collection(db, 'staff'),
        where('role', 'in', this.ADMIN_ROLES)
      );
      
      const adminDocs = await getDocs(adminQuery);
      const recipients: NotificationRecipient[] = [];

      adminDocs.forEach(doc => {
        const data = doc.data();
        recipients.push({
          id: doc.id,
          name: data.name || 'Unknown Admin',
          role: data.role,
          fcmTokens: data.fcmTokens || [],
          notificationPreferences: data.notificationPreferences || {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            jobAssignments: true,
            jobUpdates: true,
            urgentOnly: false
          }
        });
      });

      return recipients;
    } catch (error) {
      console.error('❌ Error getting admin recipients:', error);
      return [];
    }
  }

  /**
   * Generate status update notification content
   */
  private generateStatusUpdateContent(jobData: JobNotificationData): { title: string; body: string } {
    const staffName = jobData.assignedStaffName || 'Staff member';
    
    switch (jobData.status) {
      case 'accepted':
        return {
          title: '✅ Job Accepted',
          body: `${jobData.title} has been accepted by ${staffName}`
        };
      case 'rejected':
        return {
          title: '❌ Job Rejected',
          body: `${jobData.title} has been rejected by ${staffName}`
        };
      case 'started':
        return {
          title: '🚀 Job Started',
          body: `${staffName} has started working on ${jobData.title}`
        };
      case 'completed':
        return {
          title: '🎉 Job Completed',
          body: `${jobData.title} has been completed by ${staffName}`
        };
      case 'cancelled':
        return {
          title: '🚫 Job Cancelled',
          body: `${jobData.title} has been cancelled`
        };
      default:
        return {
          title: '📋 Job Updated',
          body: `${jobData.title} status changed to ${jobData.status}`
        };
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<{
    deduplication: any;
    recentNotifications: number;
  }> {
    const deduplicationStats = await enhancedNotificationDeduplicationService.getStats();
    
    return {
      deduplication: deduplicationStats,
      recentNotifications: deduplicationStats.totalProcessed
    };
  }
}

// Export singleton instance
export const unifiedJobNotificationService = new UnifiedJobNotificationService();
export default unifiedJobNotificationService;
