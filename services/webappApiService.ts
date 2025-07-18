/**
 * Web App API Integration Service
 * Connects mobile app with the villa management web application backend
 */

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  mobileSecret: string;
}

interface MobileJob {
  id: string;
  title: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assignedStaffId: string;
  createdAt: string;
  mobileOptimized: {
    title: string;
    address: string;
    scheduledTime: string;
    priority: 'low' | 'medium' | 'high';
    status: string;
    estimatedDuration: string;
  };
}

interface MobileNotification {
  id: string;
  staffId: string;
  jobId?: string;
  type: 'job_assigned' | 'job_updated' | 'general';
  title: string;
  body: string;
  read: boolean;
  delivered: boolean;
  createdAt: string;
  jobData?: {
    id: string;
    title: string;
    priority: string;
    status: string;
  };
}

interface JobsResponse {
  success: boolean;
  data: {
    jobs: MobileJob[];
    totalCount: number;
    filters: {
      staffId: string;
      status: string | null;
      includeCompleted: boolean;
    };
    syncTimestamp: string;
  };
}

interface NotificationsResponse {
  success: boolean;
  notifications: MobileNotification[];
  count: number;
  staffId: string;
}

class WebAppApiService {
  private config: ApiConfig;
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.config = {
      // Default to localhost for development, will be updated for production
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      apiKey: 'sia-moon-mobile-app-2025-secure-key',
      mobileSecret: 'mobile-app-sync-2025-secure',
    };

    console.log('🌐 WebAppApiService initialized:', {
      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey,
    });
  }

  /**
   * Get mobile headers for authenticated requests
   */
  private getMobileHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Mobile-Secret': this.config.mobileSecret,
    };
  }

  /**
   * Get jobs for a staff member using Firebase UID
   */
  async getStaffJobs(
    firebaseUid: string,
    options: {
      status?: 'assigned' | 'in_progress' | 'completed';
      limit?: number;
      includeCompleted?: boolean;
    } = {}
  ): Promise<JobsResponse> {
    try {
      console.log('📡 WebAppApi: Fetching jobs for staff:', firebaseUid);

      const params = new URLSearchParams({
        staffId: firebaseUid,
        ...(options.status && { status: options.status }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.includeCompleted !== undefined && { 
          includeCompleted: options.includeCompleted.toString() 
        }),
      });

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/jobs?${params}`,
        {
          method: 'GET',
          headers: this.getMobileHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: JobsResponse = await response.json();
      
      // Update sync timestamp
      if (data.data?.syncTimestamp) {
        this.lastSyncTimestamp = data.data.syncTimestamp;
      }

      console.log('✅ WebAppApi: Jobs fetched successfully:', {
        count: data.data?.jobs?.length || 0,
        syncTimestamp: data.data?.syncTimestamp,
      });

      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Failed to fetch jobs:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a staff member using Firebase UID
   */
  async getStaffNotifications(
    firebaseUid: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<NotificationsResponse> {
    try {
      console.log('📡 WebAppApi: Fetching notifications for staff:', firebaseUid);

      const params = new URLSearchParams({
        staffId: firebaseUid,
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.unreadOnly !== undefined && { 
          unreadOnly: options.unreadOnly.toString() 
        }),
      });

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/notifications?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: NotificationsResponse = await response.json();

      console.log('✅ WebAppApi: Notifications fetched successfully:', {
        count: data.count,
        unread: data.notifications?.filter(n => !n.read).length || 0,
      });

      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Perform job actions (accept, start, complete)
   */
  async performJobAction(
    action: 'accept_job' | 'start_job' | 'complete_job' | 'update_status',
    jobId: string,
    firebaseUid: string,
    additionalData?: any
  ): Promise<any> {
    try {
      console.log('📡 WebAppApi: Performing job action:', { action, jobId, firebaseUid });

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/jobs`,
        {
          method: 'POST',
          headers: this.getMobileHeaders(),
          body: JSON.stringify({
            action,
            jobId,
            staffId: firebaseUid,
            ...additionalData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ WebAppApi: Job action completed successfully:', action);
      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Job action failed:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(
    notificationId: string,
    firebaseUid: string
  ): Promise<any> {
    try {
      console.log('📡 WebAppApi: Marking notification as read:', notificationId);

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'mark_read',
            notificationId,
            staffId: firebaseUid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ WebAppApi: Notification marked as read successfully');
      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(firebaseUid: string): Promise<any> {
    try {
      console.log('📡 WebAppApi: Marking all notifications as read for:', firebaseUid);

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'mark_all_read',
            staffId: firebaseUid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ WebAppApi: All notifications marked as read successfully');
      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Register FCM token for push notifications
   */
  async registerFCMToken(
    firebaseUid: string,
    fcmToken: string
  ): Promise<any> {
    try {
      console.log('📡 WebAppApi: Registering FCM token for:', firebaseUid);

      const response = await fetch(
        `${this.config.baseUrl}/api/mobile/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'register_fcm_token',
            staffId: firebaseUid,
            fcmToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ WebAppApi: FCM token registered successfully');
      return data;
    } catch (error) {
      console.error('❌ WebAppApi: Failed to register FCM token:', error);
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 WebAppApi: Testing connection to:', this.config.baseUrl);

      // Test with the test staff account
      const testFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      
      const response = await this.getStaffJobs(testFirebaseUid, { limit: 1 });
      
      console.log('✅ WebAppApi: Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ WebAppApi: Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTimestamp(): string | null {
    return this.lastSyncTimestamp;
  }

  /**
   * Update API base URL (for production deployment)
   */
  updateBaseUrl(newBaseUrl: string): void {
    this.config.baseUrl = newBaseUrl;
    console.log('🔄 WebAppApi: Base URL updated to:', newBaseUrl);
  }
}

// Export singleton instance
export const webAppApiService = new WebAppApiService();
export type { MobileJob, MobileNotification, JobsResponse, NotificationsResponse };
