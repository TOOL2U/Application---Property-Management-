import { Storage } from '../utils/storage';

interface NotificationConfig {
  appId: string;
  restApiKey: string;
  userAuthKey?: string;
}

interface NotificationPayload {
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionButtons?: Array<{
    id: string;
    text: string;
    icon?: string;
  }>;
  priority?: 'low' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

interface NotificationSubscription {
  userId: string;
  playerId: string;
  deviceType: 'ios' | 'android' | 'web';
  tags: string[];
  isActive: boolean;
  createdAt: number;
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  sentAt: number;
  delivered: boolean;
  opened: boolean;
  data?: Record<string, any>;
}

class NotificationService {
  private config: NotificationConfig;
  private isInitialized: boolean = false;
  private playerId: string | null = null;
  private subscriptions: NotificationSubscription[] = [];
  private history: NotificationHistory[] = [];

  constructor() {
    this.config = {
      appId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || 'your_onesignal_app_id',
      restApiKey: process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY || 'your_rest_api_key',
    };

    console.log('🔔 Notification Service initialized:', {
      appId: this.config.appId,
      hasRestApiKey: !!this.config.restApiKey,
    });
  }

  /**
   * Initialize OneSignal (mock implementation for web compatibility)
   */
  async initialize(userId?: string): Promise<void> {
    try {
      console.log('🔔 Initializing push notifications...');

      // Mock OneSignal initialization for web compatibility
      // In a real React Native app, you would use @onesignal/react-native-onesignal
      
      // Request permission
      const permission = await this.requestPermission();
      if (!permission) {
        console.warn('⚠️ Push notification permission denied');
        return;
      }

      // Generate mock player ID for demo
      this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store player ID
      await Storage.setItem('onesignal_player_id', this.playerId);

      // Set user ID if provided
      if (userId) {
        await this.setUserId(userId);
      }

      // Load notification history
      await this.loadNotificationHistory();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized successfully');
      console.log('📱 Player ID:', this.playerId);

    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      
      // For React Native, this would use the OneSignal SDK
      return true; // Mock permission granted
    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Set user ID for targeted notifications
   */
  async setUserId(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In real implementation, this would call OneSignal.setExternalUserId()
      await Storage.setItem('onesignal_user_id', userId);
      
      console.log('✅ User ID set for notifications:', userId);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
    }
  }

  /**
   * Add tags for targeted notifications
   */
  async setTags(tags: Record<string, string>): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In real implementation, this would call OneSignal.sendTags()
      await Storage.setObject('onesignal_tags', tags);
      
      console.log('✅ Tags set for notifications:', tags);
    } catch (error) {
      console.error('❌ Failed to set tags:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const notificationData = {
        app_id: this.config.appId,
        filters: [
          { field: 'tag', key: 'user_id', relation: '=', value: userId }
        ],
        headings: { en: payload.title },
        contents: { en: payload.message },
        data: payload.data || {},
        priority: this.getPriorityValue(payload.priority),
        ...(payload.imageUrl && { big_picture: payload.imageUrl }),
        ...(payload.sound && { sound: payload.sound }),
        ...(payload.badge && { ios_badgeType: 'Increase', ios_badgeCount: payload.badge }),
      };

      const response = await this.sendNotificationRequest(notificationData);
      
      if (response.success) {
        await this.addToHistory({
          id: response.id || `notif_${Date.now()}`,
          title: payload.title,
          message: payload.message,
          sentAt: Date.now(),
          delivered: true,
          opened: false,
          data: payload.data,
        });
        
        console.log('✅ Notification sent to user:', userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to send notification to user:', error);
      return false;
    }
  }

  /**
   * Send notification to users with specific tags
   */
  async sendToTags(tags: Record<string, string>, payload: NotificationPayload): Promise<boolean> {
    try {
      const filters = Object.entries(tags).map(([key, value]) => ({
        field: 'tag',
        key,
        relation: '=',
        value,
      }));

      const notificationData = {
        app_id: this.config.appId,
        filters,
        headings: { en: payload.title },
        contents: { en: payload.message },
        data: payload.data || {},
        priority: this.getPriorityValue(payload.priority),
        ...(payload.imageUrl && { big_picture: payload.imageUrl }),
        ...(payload.sound && { sound: payload.sound }),
      };

      const response = await this.sendNotificationRequest(notificationData);
      
      if (response.success) {
        await this.addToHistory({
          id: response.id || `notif_${Date.now()}`,
          title: payload.title,
          message: payload.message,
          sentAt: Date.now(),
          delivered: true,
          opened: false,
          data: payload.data,
        });
        
        console.log('✅ Notification sent to tags:', tags);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to send notification to tags:', error);
      return false;
    }
  }

  /**
   * Send notification for new task assignment
   */
  async sendTaskAssignmentNotification(staffId: string, taskData: {
    taskType: string;
    propertyName: string;
    scheduledDate: string;
    priority: string;
  }): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'New Task Assignment',
      message: `${taskData.taskType} task assigned at ${taskData.propertyName}`,
      data: {
        type: 'task_assignment',
        staffId,
        ...taskData,
      },
      priority: taskData.priority === 'urgent' ? 'high' : 'normal',
      sound: taskData.priority === 'urgent' ? 'urgent_notification.wav' : 'default',
      actionButtons: [
        { id: 'accept', text: 'Accept', icon: 'check' },
        { id: 'view', text: 'View Details', icon: 'eye' },
      ],
    };

    return this.sendToUser(staffId, payload);
  }

  /**
   * Send notification for booking update
   */
  async sendBookingUpdateNotification(staffIds: string[], bookingData: {
    guestName: string;
    propertyName: string;
    status: string;
    checkIn: string;
  }): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Booking Update',
      message: `${bookingData.guestName}'s booking at ${bookingData.propertyName} is now ${bookingData.status}`,
      data: {
        type: 'booking_update',
        ...bookingData,
      },
      priority: 'normal',
      actionButtons: [
        { id: 'view', text: 'View Booking', icon: 'calendar' },
      ],
    };

    // Send to all assigned staff
    const results = await Promise.all(
      staffIds.map(staffId => this.sendToUser(staffId, payload))
    );

    return results.every(result => result);
  }

  /**
   * Send emergency maintenance alert
   */
  async sendEmergencyMaintenanceAlert(maintenanceData: {
    propertyName: string;
    issue: string;
    priority: string;
  }): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '🚨 Emergency Maintenance',
      message: `Urgent: ${maintenanceData.issue} at ${maintenanceData.propertyName}`,
      data: {
        type: 'emergency_maintenance',
        ...maintenanceData,
      },
      priority: 'high',
      sound: 'emergency_alert.wav',
      actionButtons: [
        { id: 'respond', text: 'Respond Now', icon: 'alert-triangle' },
        { id: 'call', text: 'Call Support', icon: 'phone' },
      ],
    };

    // Send to all maintenance staff
    return this.sendToTags({ role: 'maintenance' }, payload);
  }

  /**
   * Send sync completion notification
   */
  async sendSyncCompletionNotification(syncData: {
    itemsUpdated: number;
    conflictsResolved: number;
  }): Promise<boolean> {
    if (syncData.itemsUpdated === 0 && syncData.conflictsResolved === 0) {
      return true; // Don't send notification for no changes
    }

    const payload: NotificationPayload = {
      title: 'Data Sync Complete',
      message: `Updated ${syncData.itemsUpdated} items${syncData.conflictsResolved > 0 ? `, resolved ${syncData.conflictsResolved} conflicts` : ''}`,
      data: {
        type: 'sync_completion',
        ...syncData,
      },
      priority: 'low',
    };

    const userId = await Storage.getItem('onesignal_user_id');
    if (userId) {
      return this.sendToUser(userId, payload);
    }

    return false;
  }

  /**
   * Handle notification received (for analytics)
   */
  async handleNotificationReceived(notificationId: string): Promise<void> {
    try {
      const notification = this.history.find(n => n.id === notificationId);
      if (notification) {
        notification.delivered = true;
        await this.saveNotificationHistory();
      }
    } catch (error) {
      console.error('❌ Failed to handle notification received:', error);
    }
  }

  /**
   * Handle notification opened
   */
  async handleNotificationOpened(notificationId: string, actionId?: string): Promise<void> {
    try {
      const notification = this.history.find(n => n.id === notificationId);
      if (notification) {
        notification.opened = true;
        await this.saveNotificationHistory();
      }

      console.log('📱 Notification opened:', { notificationId, actionId });
      
      // Handle specific actions
      if (actionId) {
        await this.handleNotificationAction(notificationId, actionId);
      }
    } catch (error) {
      console.error('❌ Failed to handle notification opened:', error);
    }
  }

  /**
   * Handle notification action button pressed
   */
  private async handleNotificationAction(notificationId: string, actionId: string): Promise<void> {
    const notification = this.history.find(n => n.id === notificationId);
    if (!notification) return;

    switch (actionId) {
      case 'accept':
        // Handle task acceptance
        console.log('✅ Task accepted via notification');
        break;
      case 'view':
        // Navigate to details view
        console.log('👁️ View details requested');
        break;
      case 'respond':
        // Handle emergency response
        console.log('🚨 Emergency response initiated');
        break;
      case 'call':
        // Initiate phone call
        console.log('📞 Support call initiated');
        break;
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): NotificationHistory[] {
    return [...this.history];
  }

  /**
   * Clear notification history
   */
  async clearNotificationHistory(): Promise<void> {
    this.history = [];
    await Storage.remove('notification_history');
    console.log('🧹 Notification history cleared');
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    total: number;
    delivered: number;
    opened: number;
    openRate: number;
  } {
    const total = this.history.length;
    const delivered = this.history.filter(n => n.delivered).length;
    const opened = this.history.filter(n => n.opened).length;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;

    return { total, delivered, opened, openRate };
  }

  // Private helper methods
  private getPriorityValue(priority?: string): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  private async sendNotificationRequest(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Mock API call for demo - in real implementation, this would call OneSignal REST API
      console.log('📤 Sending notification:', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock successful response
      return {
        success: true,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      /* Real implementation would be:
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.config.restApiKey}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, id: result.id };
      } else {
        return { success: false, error: result.errors?.[0] || 'Unknown error' };
      }
      */
    } catch (error) {
      console.error('❌ Notification request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async loadNotificationHistory(): Promise<void> {
    try {
      const history = await Storage.getObject<NotificationHistory[]>('notification_history');
      if (history) {
        this.history = history;
      }
    } catch (error) {
      console.error('❌ Failed to load notification history:', error);
    }
  }

  private async saveNotificationHistory(): Promise<void> {
    try {
      await Storage.setObject('notification_history', this.history);
    } catch (error) {
      console.error('❌ Failed to save notification history:', error);
    }
  }

  private async addToHistory(notification: NotificationHistory): Promise<void> {
    this.history.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    
    await this.saveNotificationHistory();
  }

  /**
   * Cleanup on app close
   */
  destroy(): void {
    // Clean up any listeners or intervals
    console.log('🧹 Notification service destroyed');
  }
}

export const notificationService = new NotificationService();
export default notificationService;

// Export types
export type {
  NotificationPayload,
  NotificationSubscription,
  NotificationHistory,
};
