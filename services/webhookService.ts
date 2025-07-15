import { Storage } from '../utils/storage';

// API Configuration for your webapp
const API_CONFIG = {
  // Your webapp endpoints
  webappBaseUrl: 'https://sia-moon-property-management.vercel.app',
  bookingsEndpoint: 'https://sia-moon-property-management.vercel.app/api/bookings',
  mobileReceiveEndpoint: 'https://sia-moon-property-management.vercel.app/api/mobile/receive',
  mobileSyncEndpoint: 'https://sia-moon-property-management.vercel.app/api/mobile/sync',
  assignmentsEndpoint: 'https://sia-moon-property-management.vercel.app/api/mobile/assignments',
  
  // Authentication
  apiKey: 'sia-moon-mobile-app-2025-secure-key',
  mobileSecret: 'mobile-app-sync-2025-secure',
  syncEncryptionKey: 'vms-encrypt-2025-key',
};

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

interface ApprovedBookingData {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  status: 'approved' | 'confirmed' | 'in-progress' | 'completed';
  totalAmount: number;
  paymentStatus: string;
  specialRequests?: string;
  assignedStaff?: string[];
  tasks?: BookingTask[];
  createdAt: string;
  approvedAt: string;
}

interface BookingTask {
  id: string;
  type: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'checkout';
  title: string;
  description: string;
  assignedTo?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
}

interface StaffAssignmentData {
  id: string;
  staffId: string;
  staffName: string;
  bookingId: string;
  propertyId: string;
  taskType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  priority: string;
  notes?: string;
}

interface SyncData {
  bookings?: ApprovedBookingData[];
  assignments?: StaffAssignmentData[];
  properties?: any[];
  lastSyncTimestamp: number;
}

class WebhookService {
  private requestQueue: Array<{
    url: string;
    options: RequestInit;
    retryCount: number;
    timestamp: number;
  }> = [];
  
  private isOnline: boolean = true;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  constructor() {
    this.loadRequestQueue();
    this.initializeNetworkMonitoring();
  }

  // Network monitoring
  private initializeNetworkMonitoring() {
    // Monitor network status
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('🌐 Network: Online - Processing queued requests');
        this.processRequestQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('🌐 Network: Offline - Queueing requests');
      });

      this.isOnline = navigator.onLine;
    }
  }

  // Request queue management
  private async loadRequestQueue() {
    try {
      const queue = await Storage.getObject<typeof this.requestQueue>('webhook_queue');
      if (queue) {
        this.requestQueue = queue;
        console.log(`📦 Loaded ${queue.length} queued webhook requests`);
      }
    } catch (error) {
      console.error('❌ Failed to load webhook queue:', error);
    }
  }

  private async saveRequestQueue() {
    try {
      await Storage.setObject('webhook_queue', this.requestQueue);
    } catch (error) {
      console.error('❌ Failed to save webhook queue:', error);
    }
  }

  private async processRequestQueue() {
    if (this.requestQueue.length === 0) return;

    console.log(`🔄 Processing ${this.requestQueue.length} queued webhook requests`);
    
    const processedIndices: number[] = [];

    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuedRequest = this.requestQueue[i];
      
      try {
        const response = await this.makeRequest(queuedRequest.url, queuedRequest.options);
        if (response.success) {
          processedIndices.push(i);
          console.log(`✅ Processed queued request to ${queuedRequest.url}`);
        } else if (queuedRequest.retryCount >= this.maxRetries) {
          processedIndices.push(i);
          console.error(`❌ Max retries exceeded for ${queuedRequest.url}`);
        } else {
          this.requestQueue[i].retryCount++;
        }
      } catch (error) {
        if (queuedRequest.retryCount >= this.maxRetries) {
          processedIndices.push(i);
          console.error(`❌ Max retries exceeded for ${queuedRequest.url}:`, error);
        } else {
          this.requestQueue[i].retryCount++;
        }
      }
    }

    // Remove processed requests
    this.requestQueue = this.requestQueue.filter((_, index) => !processedIndices.includes(index));
    await this.saveRequestQueue();
  }

  private async queueRequest(url: string, options: RequestInit) {
    this.requestQueue.push({
      url,
      options,
      retryCount: 0,
      timestamp: Date.now()
    });
    await this.saveRequestQueue();
    console.log(`📝 Queued webhook request to ${url}`);
  }

  // Core request method
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<WebhookResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-API-Key': API_CONFIG.apiKey,
        'X-Mobile-Secret': API_CONFIG.mobileSecret,
        'User-Agent': 'SiaMoon-Mobile/1.0.0',
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('❌ Webhook request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        timestamp: Date.now(),
      };
    }
  }

  // Fetch approved bookings from webapp
  async fetchApprovedBookings(): Promise<WebhookResponse<ApprovedBookingData[]>> {
    try {
      console.log('📋 Fetching approved bookings from webapp...');
      
      const response = await this.makeRequest<ApprovedBookingData[]>(
        `${API_CONFIG.bookingsEndpoint}?status=approved&mobile=true`,
        {
          method: 'GET',
        }
      );

      if (response.success && response.data) {
        // Store fetched bookings locally
        await Storage.setObject('approved_bookings', response.data);
        console.log(`✅ Fetched ${response.data.length} approved bookings`);
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch approved bookings:', error);
      return {
        success: false,
        error: 'Failed to fetch approved bookings',
        timestamp: Date.now(),
      };
    }
  }

  // Send booking status update back to webapp
  async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled',
    updateData: {
      staffId: string;
      notes?: string;
      photos?: string[];
      checklistCompleted?: string[];
      timeSpent?: number;
    }
  ): Promise<WebhookResponse> {
    const payload = {
      status,
      updatedBy: updateData.staffId,
      notes: updateData.notes,
      photos: updateData.photos,
      checklistCompleted: updateData.checklistCompleted,
      timeSpent: updateData.timeSpent,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.isOnline) {
        const response = await this.makeRequest(`${API_CONFIG.bookingsEndpoint}/${bookingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        
        console.log(`✅ Updated booking ${bookingId} status to ${status}`);
        return response;
      } else {
        // Queue for later when online
        await this.queueRequest(`${API_CONFIG.bookingsEndpoint}/${bookingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        
        // Also store pending update locally
        await this.storePendingUpdate('booking', bookingId, payload);
        
        return {
          success: true,
          message: 'Booking status update queued for when online',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to update booking status:', error);
      
      // Queue for retry
      await this.queueRequest(`${API_CONFIG.bookingsEndpoint}/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      
      await this.storePendingUpdate('booking', bookingId, payload);
      
      return {
        success: false,
        error: 'Booking status update queued due to error',
        timestamp: Date.now(),
      };
    }
  }

  // Fetch staff assignments for specific staff member
  async fetchStaffAssignments(staffId: string, date?: string): Promise<WebhookResponse<StaffAssignmentData[]>> {
    try {
      console.log(`👥 Fetching assignments for staff ${staffId}...`);
      
      const params = new URLSearchParams({
        staffId,
        ...(date && { date }),
      });
      
      const response = await this.makeRequest<StaffAssignmentData[]>(
        `${API_CONFIG.assignmentsEndpoint}?${params}`,
        {
          method: 'GET',
        }
      );

      if (response.success && response.data) {
        // Store assignments locally
        await Storage.setObject(`assignments_${staffId}`, response.data);
        console.log(`✅ Fetched ${response.data.length} assignments for staff ${staffId}`);
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch staff assignments:', error);
      return {
        success: false,
        error: 'Failed to fetch staff assignments',
        timestamp: Date.now(),
      };
    }
  }

  // Update assignment status
  async updateAssignmentStatus(
    assignmentId: string,
    status: 'accepted' | 'in-progress' | 'completed' | 'cancelled',
    updateData: {
      staffId: string;
      notes?: string;
      photos?: string[];
      timeSpent?: number;
    }
  ): Promise<WebhookResponse> {
    const payload = {
      status,
      notes: updateData.notes,
      photos: updateData.photos,
      timeSpent: updateData.timeSpent,
      updatedBy: updateData.staffId,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.isOnline) {
        const response = await this.makeRequest(`${API_CONFIG.assignmentsEndpoint}/${assignmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        
        console.log(`✅ Updated assignment ${assignmentId} status to ${status}`);
        return response;
      } else {
        await this.queueRequest(`${API_CONFIG.assignmentsEndpoint}/${assignmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        
        await this.storePendingUpdate('assignment', assignmentId, payload);
        
        return {
          success: true,
          message: 'Assignment status update queued for when online',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to update assignment status:', error);
      
      await this.queueRequest(`${API_CONFIG.assignmentsEndpoint}/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      
      await this.storePendingUpdate('assignment', assignmentId, payload);
      
      return {
        success: false,
        error: 'Assignment status update queued due to error',
        timestamp: Date.now(),
      };
    }
  }

  // Sync with webapp - get all updates since last sync
  async syncWithWebApp(data: {
    lastSyncTimestamp?: number;
    staffId?: string;
    deviceId?: string;
  }): Promise<WebhookResponse<SyncData>> {
    try {
      console.log('🔄 Syncing with web application...');
      
      const payload = {
        lastSyncTimestamp: data.lastSyncTimestamp || 0,
        staffId: data.staffId,
        deviceId: data.deviceId,
        platform: 'mobile',
        pendingChanges: await this.getPendingChanges(),
      };
      
      const response = await this.makeRequest<SyncData>(API_CONFIG.mobileSyncEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success && response.data) {
        console.log('✅ Web app sync successful');
        await this.processSyncedData(response.data);
        
        // Clear pending changes that were successfully synced
        await this.clearSyncedPendingChanges();
      }

      return response;
    } catch (error) {
      console.error('❌ Web app sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: Date.now(),
      };
    }
  }

  // Store pending updates when offline
  private async storePendingUpdate(type: 'booking' | 'assignment', id: string, data: any): Promise<void> {
    try {
      const key = `pending_${type}_updates`;
      const pending = await Storage.getObject(key) || [];
      
      // Ensure pending is an array
      const pendingArray = Array.isArray(pending) ? pending : [];
      
      // Remove any existing update for the same item
      const filtered = pendingArray.filter((item: any) => item.id !== id);
      
      // Add new update
      filtered.push({
        id,
        type,
        data,
        timestamp: Date.now(),
      });
      
      await Storage.setObject(key, filtered);
      console.log(`💾 Stored pending ${type} update for ${id}`);
    } catch (error) {
      console.error('Failed to store pending update:', error);
    }
  }

  // Get pending local changes to send to webapp
  private async getPendingChanges(): Promise<any> {
    try {
      const pendingBookings = await Storage.getObject('pending_booking_updates') || [];
      const pendingAssignments = await Storage.getObject('pending_assignment_updates') || [];
      
      return {
        bookings: pendingBookings,
        assignments: pendingAssignments,
      };
    } catch (error) {
      console.error('Failed to get pending changes:', error);
      return {};
    }
  }

  // Process data received from webapp
  private async processSyncedData(data: SyncData): Promise<void> {
    try {
      // Update local storage with new approved bookings
      if (data.bookings && data.bookings.length > 0) {
        await Storage.setObject('approved_bookings', data.bookings);
        console.log(`📋 Received ${data.bookings.length} booking updates`);
      }

      // Update local storage with new staff assignments
      if (data.assignments && data.assignments.length > 0) {
        await Storage.setObject('staff_assignments', data.assignments);
        console.log(`👥 Received ${data.assignments.length} assignment updates`);
      }

      // Update local storage with property updates
      if (data.properties && data.properties.length > 0) {
        await Storage.setObject('properties', data.properties);
        console.log(`🏠 Received ${data.properties.length} property updates`);
      }

      // Update last sync timestamp
      await Storage.setItem('last_sync_timestamp', data.lastSyncTimestamp.toString());
      
    } catch (error) {
      console.error('Failed to process synced data:', error);
    }
  }

  // Clear pending changes after successful sync
  private async clearSyncedPendingChanges(): Promise<void> {
    try {
      await Storage.remove('pending_booking_updates');
      await Storage.remove('pending_assignment_updates');
      console.log('🧹 Cleared synced pending changes');
    } catch (error) {
      console.error('Failed to clear pending changes:', error);
    }
  }

  // Register device for push notifications (if you implement them later)
  async registerDevice(deviceToken: string, staffId: string): Promise<WebhookResponse> {
    const payload = {
      deviceToken,
      staffId,
      platform: 'mobile',
      timestamp: new Date().toISOString(),
    };

    return this.makeRequest(`${API_CONFIG.webappBaseUrl}/api/mobile/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Utility methods
  getQueueStatus(): { pending: number; items: any[] } {
    return {
      pending: this.requestQueue.length,
      items: this.requestQueue
    };
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  async clearQueue(): Promise<void> {
    this.requestQueue = [];
    await this.saveRequestQueue();
    console.log('🧹 Cleared webhook request queue');
  }

  async forceProcessQueue(): Promise<void> {
    await this.processRequestQueue();
  }

  // Get stored data
  async getStoredBookings(): Promise<ApprovedBookingData[]> {
    return await Storage.getObject('approved_bookings') || [];
  }

  async getStoredAssignments(staffId?: string): Promise<StaffAssignmentData[]> {
    if (staffId) {
      return await Storage.getObject(`assignments_${staffId}`) || [];
    }
    return await Storage.getObject('staff_assignments') || [];
  }

  // Test connectivity to webapp
  async testConnection(): Promise<WebhookResponse> {
    try {
      console.log('🧪 Testing connection to webapp...');
      
      const response = await this.makeRequest(`${API_CONFIG.webappBaseUrl}/api/health`, {
        method: 'GET',
      });

      if (response.success) {
        console.log('✅ Connection test successful');
      } else {
        console.error('❌ Connection test failed:', response.error);
      }

      return response;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: Date.now(),
      };
    }
  }
}

export const webhookService = new WebhookService();
export default webhookService;

// Export types
export type {
  WebhookResponse,
  ApprovedBookingData,
  BookingTask,
  StaffAssignmentData,
  SyncData,
};
