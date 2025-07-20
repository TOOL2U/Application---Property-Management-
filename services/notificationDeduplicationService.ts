/**
 * Notification Deduplication Service
 * Prevents multiple notifications for the same job assignment
 */

export interface NotificationEvent {
  jobId: string;
  staffId: string;
  type: 'job_assigned' | 'job_updated' | 'job_completed' | 'job_cancelled';
  source: 'push' | 'firestore' | 'banner' | 'modal';
  timestamp: number;
}

class NotificationDeduplicationService {
  private recentNotifications: Map<string, NotificationEvent[]> = new Map();
  private readonly DUPLICATE_THRESHOLD = 5000; // 5 seconds
  private readonly MAX_HISTORY = 100; // Keep last 100 notifications per staff
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor() {
    // Periodic cleanup of old notifications
    setInterval(() => {
      this.cleanupOldNotifications();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Check if notification should be allowed
   */
  shouldAllowNotification(event: NotificationEvent): boolean {
    const key = `${event.staffId}:${event.jobId}:${event.type}`;
    const staffNotifications = this.recentNotifications.get(event.staffId) || [];
    
    // Check for recent duplicate
    const isDuplicate = staffNotifications.some(notification => 
      notification.jobId === event.jobId &&
      notification.type === event.type &&
      (event.timestamp - notification.timestamp) < this.DUPLICATE_THRESHOLD
    );

    if (isDuplicate) {
      console.log(`🔕 Blocked duplicate notification: ${event.type} for job ${event.jobId} from ${event.source}`);
      return false;
    }

    // Log the notification
    this.logNotification(event);
    return true;
  }

  /**
   * Log a notification event
   */
  private logNotification(event: NotificationEvent): void {
    const staffNotifications = this.recentNotifications.get(event.staffId) || [];
    
    // Add new notification
    staffNotifications.push(event);
    
    // Keep only recent notifications
    const filtered = staffNotifications
      .filter(n => (event.timestamp - n.timestamp) < this.CLEANUP_INTERVAL)
      .slice(-this.MAX_HISTORY);
    
    this.recentNotifications.set(event.staffId, filtered);
    
    console.log(`📝 Logged notification: ${event.type} for job ${event.jobId} from ${event.source}`);
  }

  /**
   * Clean up old notifications
   */
  private cleanupOldNotifications(): void {
    const now = Date.now();
    const cutoff = now - this.CLEANUP_INTERVAL;
    
    for (const [staffId, notifications] of this.recentNotifications.entries()) {
      const filtered = notifications.filter(n => n.timestamp > cutoff);
      
      if (filtered.length === 0) {
        this.recentNotifications.delete(staffId);
      } else {
        this.recentNotifications.set(staffId, filtered);
      }
    }
    
    console.log('🧹 Cleaned up old notification history');
  }

  /**
   * Get notification statistics for debugging
   */
  getStats(): { 
    totalStaff: number; 
    totalNotifications: number; 
    recentActivity: { staffId: string; count: number }[] 
  } {
    const totalStaff = this.recentNotifications.size;
    let totalNotifications = 0;
    const recentActivity: { staffId: string; count: number }[] = [];
    
    for (const [staffId, notifications] of this.recentNotifications.entries()) {
      totalNotifications += notifications.length;
      recentActivity.push({ staffId, count: notifications.length });
    }
    
    return {
      totalStaff,
      totalNotifications,
      recentActivity: recentActivity.sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Force clear notification history for a staff member
   */
  clearStaffHistory(staffId: string): void {
    this.recentNotifications.delete(staffId);
    console.log(`🗑️ Cleared notification history for staff: ${staffId}`);
  }

  /**
   * Force clear all notification history
   */
  clearAllHistory(): void {
    this.recentNotifications.clear();
    console.log('🗑️ Cleared all notification history');
  }
}

// Export singleton instance
export const notificationDeduplicationService = new NotificationDeduplicationService();
export default notificationDeduplicationService;
