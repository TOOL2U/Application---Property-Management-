import { Storage } from '../utils/storage';
import { realtimeDB, BookingData, StaffAssignment, PropertyStatus } from '../lib/realtimeDatabase';
import { webhookService } from './webhookService';
import { cloudinaryService } from './cloudinaryService';

interface SyncConfig {
  enableRealtimeSync: boolean;
  syncInterval: number;
  offlineStorageKey: string;
  maxOfflineDays: number;
  syncRetryAttempts: number;
  syncRetryDelay: number;
  enableBackgroundSync: boolean;
  backgroundSyncInterval: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTimestamp: number;
  pendingOperations: number;
  conflictCount: number;
  syncInProgress: boolean;
  realtimeConnected: boolean;
  webhookQueueSize: number;
}

interface ConflictResolution {
  id: string;
  type: 'booking' | 'assignment' | 'property';
  localData: any;
  remoteData: any;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merge';
}

class SyncService {
  private config: SyncConfig;
  private syncStatus: SyncStatus;
  private conflicts: ConflictResolution[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.config = {
      enableRealtimeSync: true,
      syncInterval: 5000,
      offlineStorageKey: 'villa_management_offline',
      maxOfflineDays: 7,
      syncRetryAttempts: 3,
      syncRetryDelay: 2000,
      enableBackgroundSync: true,
      backgroundSyncInterval: 30000,
    };

    this.syncStatus = {
      isOnline: true,
      lastSyncTimestamp: 0,
      pendingOperations: 0,
      conflictCount: 0,
      syncInProgress: false,
      realtimeConnected: false,
      webhookQueueSize: 0,
    };

    this.initialize();
  }

  private async initialize() {
    console.log('🔄 Initializing Sync Service...');

    // Load stored sync status
    await this.loadSyncStatus();
    
    // Load conflicts
    await this.loadConflicts();

    // Set up real-time listeners
    this.setupRealtimeListeners();

    // Start sync intervals
    this.startSyncIntervals();

    // Clean up old offline data
    await this.cleanupOfflineData();

    console.log('✅ Sync Service initialized');
  }

  // Status Management
  private async loadSyncStatus() {
    try {
      const storedStatus = await Storage.getObject<Partial<SyncStatus>>('sync_status');
      if (storedStatus) {
        this.syncStatus = { ...this.syncStatus, ...storedStatus };
      }
    } catch (error) {
      console.error('❌ Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus() {
    try {
      await Storage.setObject('sync_status', this.syncStatus);
    } catch (error) {
      console.error('❌ Failed to save sync status:', error);
    }
  }

  // Conflict Management
  private async loadConflicts() {
    try {
      const storedConflicts = await Storage.getObject<ConflictResolution[]>('sync_conflicts');
      if (storedConflicts) {
        this.conflicts = storedConflicts;
        this.syncStatus.conflictCount = storedConflicts.filter(c => !c.resolved).length;
      }
    } catch (error) {
      console.error('❌ Failed to load conflicts:', error);
    }
  }

  private async saveConflicts() {
    try {
      await Storage.setObject('sync_conflicts', this.conflicts);
      this.syncStatus.conflictCount = this.conflicts.filter(c => !c.resolved).length;
      await this.saveSyncStatus();
    } catch (error) {
      console.error('❌ Failed to save conflicts:', error);
    }
  }

  private async addConflict(conflict: Omit<ConflictResolution, 'timestamp' | 'resolved'>) {
    const newConflict: ConflictResolution = {
      ...conflict,
      timestamp: Date.now(),
      resolved: false,
    };

    this.conflicts.push(newConflict);
    await this.saveConflicts();
    
    console.log(`⚠️ Sync conflict detected: ${conflict.type} ${conflict.id}`);
  }

  // Real-time Listeners
  private setupRealtimeListeners() {
    if (!this.config.enableRealtimeSync) return;

    // Booking updates
    const bookingListener = realtimeDB.onBookingUpdated(async (booking) => {
      await this.handleRealtimeBookingUpdate(booking);
    });
    this.listeners.push(bookingListener);

    // Assignment updates
    const assignmentListener = realtimeDB.onAssignmentUpdated(async (assignment) => {
      await this.handleRealtimeAssignmentUpdate(assignment);
    });
    this.listeners.push(assignmentListener);

    // Property status updates
    const propertyListener = realtimeDB.onPropertyStatusChanged(async (status) => {
      await this.handleRealtimePropertyUpdate(status);
    });
    this.listeners.push(propertyListener);

    this.syncStatus.realtimeConnected = true;
    console.log('✅ Real-time listeners established');
  }

  // Real-time Update Handlers
  private async handleRealtimeBookingUpdate(booking: BookingData) {
    try {
      // Check for local conflicts
      const localBooking = await this.getLocalBooking(booking.id);
      
      if (localBooking && localBooking.lastUpdated > booking.lastUpdated) {
        // Local data is newer - potential conflict
        await this.addConflict({
          id: booking.id,
          type: 'booking',
          localData: localBooking,
          remoteData: booking,
        });
        return;
      }

      // Update local storage
      await this.storeLocalBooking(booking);
      
      // Sync with webhook if needed
      if (booking.syncStatus === 'pending') {
        await webhookService.syncBookingData({
          id: booking.id,
          propertyId: booking.propertyId,
          guestName: booking.guestName,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          totalAmount: booking.totalAmount,
          paymentStatus: booking.paymentStatus,
          assignedStaff: booking.assignedStaff,
        });
      }

      console.log(`✅ Processed realtime booking update: ${booking.id}`);
    } catch (error) {
      console.error('❌ Failed to handle realtime booking update:', error);
    }
  }

  private async handleRealtimeAssignmentUpdate(assignment: StaffAssignment) {
    try {
      // Check for local conflicts
      const localAssignment = await this.getLocalAssignment(assignment.id);
      
      if (localAssignment && localAssignment.lastUpdated > assignment.lastUpdated) {
        // Local data is newer - potential conflict
        await this.addConflict({
          id: assignment.id,
          type: 'assignment',
          localData: localAssignment,
          remoteData: assignment,
        });
        return;
      }

      // Update local storage
      await this.storeLocalAssignment(assignment);
      
      // Sync with webhook
      await webhookService.syncStaffAssignment({
        id: assignment.id,
        staffId: assignment.staffId,
        bookingId: assignment.bookingId,
        propertyId: assignment.propertyId,
        taskType: assignment.taskType,
        scheduledDate: assignment.scheduledDate,
        scheduledTime: assignment.scheduledTime,
        status: assignment.status,
        priority: assignment.priority,
        notes: assignment.notes,
      });

      console.log(`✅ Processed realtime assignment update: ${assignment.id}`);
    } catch (error) {
      console.error('❌ Failed to handle realtime assignment update:', error);
    }
  }

  private async handleRealtimePropertyUpdate(status: PropertyStatus) {
    try {
      // Update local storage
      await this.storeLocalPropertyStatus(status);
      console.log(`✅ Processed realtime property update: ${status.id}`);
    } catch (error) {
      console.error('❌ Failed to handle realtime property update:', error);
    }
  }

  // Local Storage Operations
  private async getLocalBooking(bookingId: string): Promise<BookingData | null> {
    try {
      const bookings = await Storage.getObject<Record<string, BookingData>>(`${this.config.offlineStorageKey}_bookings`) || {};
      return bookings[bookingId] || null;
    } catch (error) {
      console.error('❌ Failed to get local booking:', error);
      return null;
    }
  }

  private async storeLocalBooking(booking: BookingData) {
    try {
      const bookings = await Storage.getObject<Record<string, BookingData>>(`${this.config.offlineStorageKey}_bookings`) || {};
      bookings[booking.id] = booking;
      await Storage.setObject(`${this.config.offlineStorageKey}_bookings`, bookings);
    } catch (error) {
      console.error('❌ Failed to store local booking:', error);
    }
  }

  private async getLocalAssignment(assignmentId: string): Promise<StaffAssignment | null> {
    try {
      const assignments = await Storage.getObject<Record<string, StaffAssignment>>(`${this.config.offlineStorageKey}_assignments`) || {};
      return assignments[assignmentId] || null;
    } catch (error) {
      console.error('❌ Failed to get local assignment:', error);
      return null;
    }
  }

  private async storeLocalAssignment(assignment: StaffAssignment) {
    try {
      const assignments = await Storage.getObject<Record<string, StaffAssignment>>(`${this.config.offlineStorageKey}_assignments`) || {};
      assignments[assignment.id] = assignment;
      await Storage.setObject(`${this.config.offlineStorageKey}_assignments`, assignments);
    } catch (error) {
      console.error('❌ Failed to store local assignment:', error);
    }
  }

  private async storeLocalPropertyStatus(status: PropertyStatus) {
    try {
      const statuses = await Storage.getObject<Record<string, PropertyStatus>>(`${this.config.offlineStorageKey}_properties`) || {};
      statuses[status.id] = status;
      await Storage.setObject(`${this.config.offlineStorageKey}_properties`, statuses);
    } catch (error) {
      console.error('❌ Failed to store local property status:', error);
    }
  }

  // Sync Intervals
  private startSyncIntervals() {
    // Main sync interval
    if (this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        this.performIncrementalSync();
      }, this.config.syncInterval);
    }

    // Background sync interval
    if (this.config.enableBackgroundSync && this.config.backgroundSyncInterval > 0) {
      this.backgroundSyncInterval = setInterval(() => {
        this.performBackgroundSync();
      }, this.config.backgroundSyncInterval);
    }

    console.log('✅ Sync intervals started');
  }

  private stopSyncIntervals() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }

    console.log('🛑 Sync intervals stopped');
  }

  // Sync Operations
  async performFullSync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    this.syncStatus.syncInProgress = true;
    await this.saveSyncStatus();

    try {
      console.log('🔄 Starting full sync...');

      // Get last sync timestamp
      const lastSyncTimestamp = this.syncStatus.lastSyncTimestamp;

      // Perform full sync with webhook
      const syncResult = await webhookService.performFullSync(lastSyncTimestamp);

      if (syncResult.success && syncResult.data) {
        // Update local data with synced data
        if (syncResult.data.bookings) {
          for (const booking of syncResult.data.bookings) {
            await realtimeDB.syncBooking({
              id: booking.id,
              propertyId: booking.propertyId,
              guestName: booking.guestName,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              status: booking.status as any,
              assignedStaff: booking.assignedStaff || [],
              totalAmount: booking.totalAmount,
              paymentStatus: booking.paymentStatus as any,
              lastUpdated: Date.now(),
              syncStatus: 'synced',
            });
          }
        }

        if (syncResult.data.assignments) {
          for (const assignment of syncResult.data.assignments) {
            await realtimeDB.syncStaffAssignment({
              id: assignment.id,
              staffId: assignment.staffId,
              bookingId: assignment.bookingId,
              propertyId: assignment.propertyId,
              taskType: assignment.taskType as any,
              scheduledDate: assignment.scheduledDate,
              scheduledTime: assignment.scheduledTime,
              status: assignment.status as any,
              priority: assignment.priority as any,
              photos: [],
              notes: assignment.notes || '',
              lastUpdated: Date.now(),
            });
          }
        }

        // Update sync timestamp
        this.syncStatus.lastSyncTimestamp = syncResult.data.lastSyncTimestamp;
        console.log('✅ Full sync completed successfully');
      } else {
        throw new Error(syncResult.error || 'Full sync failed');
      }
    } catch (error) {
      console.error('❌ Full sync failed:', error);
    } finally {
      this.syncStatus.syncInProgress = false;
      await this.saveSyncStatus();
    }
  }

  private async performIncrementalSync(): Promise<void> {
    if (this.syncStatus.syncInProgress) return;

    try {
      // Update status indicators
      this.syncStatus.isOnline = webhookService.isNetworkOnline() && realtimeDB.isConnected();
      this.syncStatus.webhookQueueSize = webhookService.getQueueStatus().pending;
      this.syncStatus.pendingOperations = realtimeDB.getSyncQueueStatus().pending;

      await this.saveSyncStatus();

      // Process queued operations if online
      if (this.syncStatus.isOnline) {
        await webhookService.forceProcessQueue();
      }
    } catch (error) {
      console.error('❌ Incremental sync failed:', error);
    }
  }

  private async performBackgroundSync(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) return;

    try {
      console.log('🔄 Performing background sync...');
      
      // Light sync - just check for updates
      const now = Date.now();
      const timeSinceLastSync = now - this.syncStatus.lastSyncTimestamp;
      
      // Only perform full sync if it's been more than 5 minutes
      if (timeSinceLastSync > 5 * 60 * 1000) {
        await this.performFullSync();
      }
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }

  // Conflict Resolution
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    try {
      let resolvedData: any;

      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          // Simple merge strategy - prefer newer timestamps for individual fields
          resolvedData = {
            ...conflict.remoteData,
            ...conflict.localData,
            lastUpdated: Math.max(conflict.localData.lastUpdated, conflict.remoteData.lastUpdated),
          };
          break;
      }

      // Apply resolution based on conflict type
      switch (conflict.type) {
        case 'booking':
          await realtimeDB.syncBooking(resolvedData);
          await webhookService.syncBookingData(resolvedData);
          break;
        case 'assignment':
          await realtimeDB.syncStaffAssignment(resolvedData);
          await webhookService.syncStaffAssignment(resolvedData);
          break;
        case 'property':
          await realtimeDB.syncPropertyStatus(resolvedData.id, resolvedData);
          break;
      }

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolution = resolution;
      await this.saveConflicts();

      console.log(`✅ Resolved conflict ${conflictId} using ${resolution} strategy`);
    } catch (error) {
      console.error(`❌ Failed to resolve conflict ${conflictId}:`, error);
      throw error;
    }
  }

  // Cleanup
  private async cleanupOfflineData(): Promise<void> {
    try {
      const maxAge = this.config.maxOfflineDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - maxAge;

      // Clean up old bookings
      const bookings = await Storage.getObject<Record<string, BookingData>>(`${this.config.offlineStorageKey}_bookings`) || {};
      const cleanedBookings = Object.fromEntries(
        Object.entries(bookings).filter(([_, booking]) => booking.lastUpdated > cutoffTime)
      );
      await Storage.setObject(`${this.config.offlineStorageKey}_bookings`, cleanedBookings);

      // Clean up old assignments
      const assignments = await Storage.getObject<Record<string, StaffAssignment>>(`${this.config.offlineStorageKey}_assignments`) || {};
      const cleanedAssignments = Object.fromEntries(
        Object.entries(assignments).filter(([_, assignment]) => assignment.lastUpdated > cutoffTime)
      );
      await Storage.setObject(`${this.config.offlineStorageKey}_assignments`, cleanedAssignments);

      // Clean up resolved conflicts older than 7 days
      this.conflicts = this.conflicts.filter(conflict => 
        !conflict.resolved || (Date.now() - conflict.timestamp) < (7 * 24 * 60 * 60 * 1000)
      );
      await this.saveConflicts();

      console.log('🧹 Cleaned up old offline data');
    } catch (error) {
      console.error('❌ Failed to cleanup offline data:', error);
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getConflicts(): ConflictResolution[] {
    return [...this.conflicts];
  }

  getUnresolvedConflicts(): ConflictResolution[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  async forceSyncNow(): Promise<void> {
    await this.performFullSync();
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart intervals if they changed
    this.stopSyncIntervals();
    this.startSyncIntervals();
    
    console.log('✅ Sync configuration updated');
  }

  // Cleanup on app close
  destroy(): void {
    this.stopSyncIntervals();
    
    // Remove all listeners
    this.listeners.forEach(removeListener => removeListener());
    this.listeners = [];
    
    // Remove realtime listeners
    realtimeDB.removeAllListeners();
    
    console.log('🧹 Sync service destroyed');
  }
}

export const syncService = new SyncService();
export default syncService;

// Export types
export type { SyncConfig, SyncStatus, ConflictResolution };
