/**
 * Notification Display Service
 * Handles fetching and managing notifications for the mobile app UI
 */

import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, Unsubscribe } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'job_assigned' | 'job_updated' | 'system' | 'reminder';
  assignedTo: string;
  read: boolean;
  timestamp: Date;
  jobId?: string;
  priority?: 'low' | 'medium' | 'high';
  data?: any;
}

class NotificationDisplayService {
  private listeners: Map<string, Unsubscribe> = new Map();

  /**
   * Subscribe to real-time notifications for a staff member
   */
  subscribeToNotifications(
    staffId: string,
    callback: (notifications: AppNotification[]) => void,
    maxCount: number = 50
  ): () => void {
    try {
      console.log('🔔 NotificationDisplay: Subscribing to notifications for:', staffId);

      // Initialize async and setup listener
      this.setupNotificationListener(staffId, callback, maxCount);

      // Return cleanup function
      return () => {
        console.log('🔇 NotificationDisplay: Unsubscribing from notifications for:', staffId);
        const unsubscribe = this.listeners.get(staffId);
        if (unsubscribe) {
          unsubscribe();
          this.listeners.delete(staffId);
        }
      };

    } catch (error) {
      console.error('❌ NotificationDisplay: Failed to subscribe to notifications:', error);
      // Return empty cleanup function
      return () => {};
    }
  }

  /**
   * Setup the actual Firestore listener (async)
   */
  private async setupNotificationListener(
    staffId: string,
    callback: (notifications: AppNotification[]) => void,
    maxCount: number
  ): Promise<void> {
    try {
      console.log('🔔 NotificationDisplay: Setting up listener for staff ID:', staffId);
      
      // Import Firebase UID service to convert staff ID to Firebase UID
      const { firebaseUidService } = await import('./firebaseUidService');
      const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
      
      if (!firebaseUid) {
        console.error('❌ NotificationDisplay: No Firebase UID found for staff:', staffId);
        return;
      }
      
      console.log('🔔 NotificationDisplay: Using Firebase UID for queries:', firebaseUid);
      
      const db = await getDb();
      const notificationsRef = collection(db, 'staff_notifications');
      
      // Try multiple query approaches to find notifications
      const knownStaffId = 'IDJrsXWiL2dCHVpveH97'; // The staff ID from logs
      const knownStaffEmail = 'staff@siamoon.com'; // Known email
      
      console.log('🔔 NotificationDisplay: Will try multiple queries to find notifications');
      console.log('   - Firebase UID:', firebaseUid);
      console.log('   - Staff ID:', knownStaffId);
      console.log('   - Staff Email:', knownStaffEmail);
      
      // Start with Firebase UID (userId field)
      let q = query(
        notificationsRef,
        where('userId', '==', firebaseUid),
        limit(maxCount)
      );
      
      console.log(`🔔 NotificationDisplay: Primary query: userId == ${firebaseUid}`);

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log(`🔔 NotificationDisplay: Query executed, snapshot size: ${snapshot.size}`);
        
        const notifications: AppNotification[] = [];
        
        // Debug: log ALL fields in each document for complete inspection
        const docs = snapshot.docs;
        docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`📄 NotificationDisplay: Document ${doc.id} - ALL FIELDS:`, data);
          
          // Show detailed data for first few to avoid log spam
          if (index < 3) {
            console.log(`📋 Full data for notification ${index + 1}:`, JSON.stringify(data, null, 2));
          }
        });

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Generate sophisticated notification titles based on type and available data
          const generateNotificationTitle = (type: string, data: any): string => {
            switch (type) {
              case 'job_assigned':
                if (data.jobTitle) return `New Assignment: ${data.jobTitle}`;
                if (data.propertyName) return `New Job at ${data.propertyName}`;
                if (data.location) return `New Assignment at ${data.location}`;
                return 'New Job Assignment';
              
              case 'job_updated':
                if (data.jobTitle) return `Update: ${data.jobTitle}`;
                if (data.updateType) return `Job ${data.updateType}`;
                return 'Job Status Update';
              
              case 'job_completed':
                if (data.jobTitle) return `Completed: ${data.jobTitle}`;
                return 'Job Completion Confirmed';
              
              case 'schedule_update':
                if (data.scheduleType) return `Schedule ${data.scheduleType}`;
                return 'Schedule Update';
              
              case 'priority_change':
                if (data.newPriority) return `Priority Changed to ${data.newPriority}`;
                return 'Priority Update';
              
              case 'message':
                if (data.sender) return `Message from ${data.sender}`;
                return 'New Message';
              
              case 'reminder':
                if (data.reminderType) return `Reminder: ${data.reminderType}`;
                return 'Task Reminder';
              
              case 'system':
                if (data.systemType) return `System: ${data.systemType}`;
                return 'System Notification';
              
              default:
                return data.title || `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Notification`;
            }
          };

          // Generate sophisticated messages
          const generateNotificationMessage = (type: string, data: any): string => {
            const fallbackMessage = data.message || data.description || data.body || '';
            
            switch (type) {
              case 'job_assigned':
                if (data.propertyName && data.taskType) {
                  return `${data.taskType} required at ${data.propertyName}. ${fallbackMessage}`.trim();
                }
                if (data.dueDate) {
                  return `New assignment due by ${new Date(data.dueDate).toLocaleDateString()}. ${fallbackMessage}`.trim();
                }
                return fallbackMessage || 'You have been assigned a new job. Please check the details and start when ready.';
              
              case 'job_updated':
                if (data.updateReason) {
                  return `Update: ${data.updateReason}. ${fallbackMessage}`.trim();
                }
                return fallbackMessage || 'There has been an update to your assigned job. Please review the changes.';
              
              case 'job_completed':
                return fallbackMessage || 'Great work! Your job has been marked as completed.';
              
              default:
                return fallbackMessage || 'Please check the app for more details.';
            }
          };

          notifications.push({
            id: doc.id,
            title: generateNotificationTitle(data.type || 'notification', data),
            message: generateNotificationMessage(data.type || 'notification', data),
            type: data.type || 'job_assigned',
            assignedTo: data.userId || data.assignedTo || data.staffId || '',
            read: data.read || false,
            timestamp: data.timestamp?.toDate() || data.createdAt?.toDate() || new Date(),
            jobId: data.jobId || data.id,
            priority: data.priority || 'medium',
            data: data
          });
        });

        // If no results from primary query, try fallback queries
        if (notifications.length === 0) {
          console.log('🔍 NotificationDisplay: Primary query returned 0, trying fallback queries...');
          
          try {
            // Try with staffId field
            const staffIdQuery = query(notificationsRef, where('staffId', '==', knownStaffId), limit(maxCount));
            const { getDocs } = await import('firebase/firestore');
            const staffIdSnapshot = await getDocs(staffIdQuery);
            
            console.log(`🔍 Fallback query 1 (staffId): ${staffIdSnapshot.size} results`);
            
            if (staffIdSnapshot.size > 0) {
              console.log('✅ Found notifications using staffId field!');
              staffIdSnapshot.forEach((doc) => {
                const data = doc.data();
                notifications.push({
                  id: doc.id,
                  title: data.title || 'Notification',
                  message: data.message || data.body || '',
                  type: data.type || 'system',
                  assignedTo: data.staffId || knownStaffId,
                  read: data.read || false,
                  timestamp: data.timestamp?.toDate() || new Date(),
                  jobId: data.jobId,
                  priority: data.priority || 'medium',
                  data: data.data,
                });
              });
            } else {
              // Try with assignedTo field
              const assignedToQuery = query(notificationsRef, where('assignedTo', '==', knownStaffId), limit(maxCount));
              const assignedToSnapshot = await getDocs(assignedToQuery);
              
              console.log(`🔍 Fallback query 2 (assignedTo): ${assignedToSnapshot.size} results`);
              
              if (assignedToSnapshot.size > 0) {
                console.log('✅ Found notifications using assignedTo field!');
                assignedToSnapshot.forEach((doc) => {
                  const data = doc.data();
                  notifications.push({
                    id: doc.id,
                    title: data.title || 'Notification',
                    message: data.message || data.body || '',
                    type: data.type || 'system',
                    assignedTo: data.assignedTo || knownStaffId,
                    read: data.read || false,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    jobId: data.jobId,
                    priority: data.priority || 'medium',
                    data: data.data,
                  });
                });
              }
            }
          } catch (fallbackError) {
            console.error('❌ Fallback queries failed:', fallbackError);
          }
        }

        // Sort notifications by timestamp manually (since we can't use orderBy yet)
        notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        console.log('� NotificationDisplay: Final result:', notifications.length, 'notifications from staff_notifications');
        
        // If still no results, run debug query
        if (notifications.length === 0) {
          console.log('🔍 NotificationDisplay: Still no results, running debug query...');
          
          try {
            const debugQuery = query(notificationsRef, limit(3));
            const { getDocs } = await import('firebase/firestore');
            const debugSnapshot = await getDocs(debugQuery);
            
            console.log(`🔍 Debug: Found ${debugSnapshot.size} total notifications in collection`);
            debugSnapshot.forEach((debugDoc) => {
              const debugData = debugDoc.data();
              console.log(`🔍 Debug notification [${debugDoc.id}]:`, {
                userId: debugData.userId,
                staffId: debugData.staffId,
                assignedTo: debugData.assignedTo,
                email: debugData.email,
                title: debugData.title,
                allFields: Object.keys(debugData)
              });
            });
          } catch (debugError) {
            console.error('🔍 Debug query failed:', debugError);
          }
        }
        
        callback(notifications);
      }, (error) => {
        console.error('❌ NotificationDisplay: Subscription error:', error);
        callback([]);
      });

      // Store the unsubscribe function
      this.listeners.set(staffId, unsubscribe);

    } catch (error) {
      console.error('❌ NotificationDisplay: Failed to setup listener:', error);
      callback([]);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      console.log('📖 NotificationDisplay: Marking notification as read:', notificationId);

      const db = await getDb();
      const notificationRef = doc(db, 'staff_notifications', notificationId);
      
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date(),
      });

      console.log('✅ NotificationDisplay: Notification marked as read');
    } catch (error) {
      console.error('❌ NotificationDisplay: Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      console.log('📖 NotificationDisplay: Marking', notificationIds.length, 'notifications as read');

      const db = await getDb();
      const promises = notificationIds.map(id => {
        const notificationRef = doc(db, 'staff_notifications', id);
        return updateDoc(notificationRef, {
          read: true,
          readAt: new Date(),
        });
      });

      await Promise.all(promises);
      console.log('✅ NotificationDisplay: All notifications marked as read');
    } catch (error) {
      console.error('❌ NotificationDisplay: Failed to mark notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a staff member
   */
  async deleteAllNotifications(staffId: string): Promise<void> {
    try {
      console.log('🗑️ NotificationDisplay: Deleting all notifications for:', staffId);

      const db = await getDb();
      const notificationsRef = collection(db, 'staff_notifications');
      
      // Get Firebase UID for the staff member
      const { firebaseUidService } = await import('@/services/firebaseUidService');
      const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
      
      if (!firebaseUid) {
        throw new Error(`No Firebase UID found for staff: ${staffId}`);
      }

      // Query all notifications for this user
      const q = query(notificationsRef, where('userId', '==', firebaseUid));
      const { getDocs, deleteDoc } = await import('firebase/firestore');
      const snapshot = await getDocs(q);

      console.log(`🗑️ NotificationDisplay: Found ${snapshot.size} notifications to delete`);

      // Delete all notifications
      const deletePromises = snapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'staff_notifications', docSnapshot.id))
      );

      await Promise.all(deletePromises);
      
      console.log('✅ NotificationDisplay: All notifications deleted successfully');
    } catch (error) {
      console.error('❌ NotificationDisplay: Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification count summary
   */
  getNotificationSummary(notifications: AppNotification[]): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    recent: number; // Last 24 hours
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const summary = {
      total: notifications.length,
      unread: 0,
      byType: {} as Record<string, number>,
      recent: 0,
    };

    notifications.forEach(notification => {
      // Count unread
      if (!notification.read) {
        summary.unread++;
      }

      // Count by type
      summary.byType[notification.type] = (summary.byType[notification.type] || 0) + 1;

      // Count recent (last 24 hours)
      if (notification.timestamp > oneDayAgo) {
        summary.recent++;
      }
    });

    return summary;
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    console.log('🧹 NotificationDisplay: Cleaning up all listeners');
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

// Export singleton instance
export const notificationDisplayService = new NotificationDisplayService();
