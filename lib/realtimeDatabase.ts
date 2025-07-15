import { getDatabase, ref, onValue, set, push, update, remove, off, serverTimestamp } from 'firebase/database';
import app from './firebase';
import { Storage } from '../utils/storage';

// Initialize Realtime Database
const rtdb = getDatabase(app);

export interface BookingData {
  id: string;
  propertyId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  assignedStaff: string[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  lastUpdated: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  bookingId: string;
  propertyId: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'checkout';
  scheduledDate: string;
  scheduledTime: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  photos: string[];
  notes: string;
  completedAt?: number;
  lastUpdated: number;
}

export interface PropertyStatus {
  id: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  lastUpdated: number;
  currentBooking?: string;
  nextBooking?: string;
  maintenanceNotes?: string;
  cleaningStatus: 'pending' | 'in-progress' | 'completed';
}

export interface SyncUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'cleaner' | 'maintenance';
  phone: string;
  isActive: boolean;
  lastSeen: number;
}

class RealtimeDatabaseService {
  private listeners: Map<string, any> = new Map();
  private isOnline: boolean = true;
  private syncQueue: Array<{ path: string; data: any; action: 'set' | 'update' | 'remove' }> = [];

  constructor() {
    this.initializeConnectionListener();
    this.loadSyncQueue();
  }

  // Connection monitoring
  private initializeConnectionListener() {
    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isOnline = snapshot.val() === true;
      console.log(`🔗 Firebase Realtime Database: ${this.isOnline ? 'Connected' : 'Disconnected'}`);
      
      if (this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  // Sync queue management for offline operations
  private async loadSyncQueue() {
    try {
      const queue = await Storage.getObject<typeof this.syncQueue>('sync_queue');
      if (queue) {
        this.syncQueue = queue;
        console.log(`📦 Loaded ${queue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue() {
    try {
      await Storage.setObject('sync_queue', this.syncQueue);
    } catch (error) {
      console.error('❌ Failed to save sync queue:', error);
    }
  }

  private async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log(`🔄 Processing ${this.syncQueue.length} queued sync operations`);
    
    const processedItems: number[] = [];
    
    for (let i = 0; i < this.syncQueue.length; i++) {
      const item = this.syncQueue[i];
      try {
        const dbRef = ref(rtdb, item.path);
        
        switch (item.action) {
          case 'set':
            await set(dbRef, item.data);
            break;
          case 'update':
            await update(dbRef, item.data);
            break;
          case 'remove':
            await remove(dbRef);
            break;
        }
        
        processedItems.push(i);
        console.log(`✅ Synced queued operation: ${item.action} ${item.path}`);
      } catch (error) {
        console.error(`❌ Failed to sync queued operation: ${item.action} ${item.path}`, error);
      }
    }

    // Remove processed items from queue
    this.syncQueue = this.syncQueue.filter((_, index) => !processedItems.includes(index));
    await this.saveSyncQueue();
  }

  private async queueOperation(path: string, data: any, action: 'set' | 'update' | 'remove') {
    this.syncQueue.push({ path, data, action });
    await this.saveSyncQueue();
    console.log(`📝 Queued ${action} operation for ${path}`);
  }

  // Booking Management
  async syncBooking(bookingData: BookingData): Promise<void> {
    const path = `bookings/${bookingData.id}`;
    const data = {
      ...bookingData,
      lastUpdated: serverTimestamp(),
      syncStatus: 'synced'
    };

    try {
      if (this.isOnline) {
        await set(ref(rtdb, path), data);
        console.log(`✅ Synced booking: ${bookingData.id}`);
      } else {
        await this.queueOperation(path, data, 'set');
      }
    } catch (error) {
      console.error('❌ Failed to sync booking:', error);
      await this.queueOperation(path, data, 'set');
    }
  }

  async fetchBookings(propertyId?: string, dateRange?: { start: string; end: string }): Promise<BookingData[]> {
    try {
      const bookingsRef = ref(rtdb, 'bookings');
      
      return new Promise((resolve, reject) => {
        onValue(bookingsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve([]);
            return;
          }

          let bookings: BookingData[] = Object.values(data);

          // Apply filters
          if (propertyId) {
            bookings = bookings.filter(booking => booking.propertyId === propertyId);
          }

          if (dateRange) {
            bookings = bookings.filter(booking => 
              booking.checkIn >= dateRange.start && booking.checkOut <= dateRange.end
            );
          }

          resolve(bookings);
        }, reject);
      });
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error);
      return [];
    }
  }

  async updateBookingStatus(bookingId: string, status: BookingData['status']): Promise<void> {
    const path = `bookings/${bookingId}`;
    const updates = {
      status,
      lastUpdated: serverTimestamp(),
      syncStatus: 'synced'
    };

    try {
      if (this.isOnline) {
        await update(ref(rtdb, path), updates);
        console.log(`✅ Updated booking status: ${bookingId} -> ${status}`);
      } else {
        await this.queueOperation(path, updates, 'update');
      }
    } catch (error) {
      console.error('❌ Failed to update booking status:', error);
      await this.queueOperation(path, updates, 'update');
    }
  }

  // Staff Assignment Management
  async syncStaffAssignment(assignmentData: StaffAssignment): Promise<void> {
    const path = `staff_assignments/${assignmentData.id}`;
    const data = {
      ...assignmentData,
      lastUpdated: serverTimestamp()
    };

    try {
      if (this.isOnline) {
        await set(ref(rtdb, path), data);
        console.log(`✅ Synced staff assignment: ${assignmentData.id}`);
      } else {
        await this.queueOperation(path, data, 'set');
      }
    } catch (error) {
      console.error('❌ Failed to sync staff assignment:', error);
      await this.queueOperation(path, data, 'set');
    }
  }

  async fetchStaffAssignments(staffId?: string, date?: string): Promise<StaffAssignment[]> {
    try {
      const assignmentsRef = ref(rtdb, 'staff_assignments');
      
      return new Promise((resolve, reject) => {
        onValue(assignmentsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve([]);
            return;
          }

          let assignments: StaffAssignment[] = Object.values(data);

          // Apply filters
          if (staffId) {
            assignments = assignments.filter(assignment => assignment.staffId === staffId);
          }

          if (date) {
            assignments = assignments.filter(assignment => assignment.scheduledDate === date);
          }

          resolve(assignments);
        }, reject);
      });
    } catch (error) {
      console.error('❌ Failed to fetch staff assignments:', error);
      return [];
    }
  }

  async updateAssignmentStatus(assignmentId: string, status: StaffAssignment['status']): Promise<void> {
    const path = `staff_assignments/${assignmentId}`;
    const updates: any = {
      status,
      lastUpdated: serverTimestamp()
    };

    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }

    try {
      if (this.isOnline) {
        await update(ref(rtdb, path), updates);
        console.log(`✅ Updated assignment status: ${assignmentId} -> ${status}`);
      } else {
        await this.queueOperation(path, updates, 'update');
      }
    } catch (error) {
      console.error('❌ Failed to update assignment status:', error);
      await this.queueOperation(path, updates, 'update');
    }
  }

  async completeAssignment(assignmentId: string, notes: string, photos: string[]): Promise<void> {
    const path = `staff_assignments/${assignmentId}`;
    const updates = {
      status: 'completed' as const,
      notes,
      photos,
      completedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    try {
      if (this.isOnline) {
        await update(ref(rtdb, path), updates);
        console.log(`✅ Completed assignment: ${assignmentId}`);
      } else {
        await this.queueOperation(path, updates, 'update');
      }
    } catch (error) {
      console.error('❌ Failed to complete assignment:', error);
      await this.queueOperation(path, updates, 'update');
    }
  }

  // Property Status Management
  async syncPropertyStatus(propertyId: string, statusData: Omit<PropertyStatus, 'id'>): Promise<void> {
    const path = `property_status/${propertyId}`;
    const data = {
      id: propertyId,
      ...statusData,
      lastUpdated: serverTimestamp()
    };

    try {
      if (this.isOnline) {
        await set(ref(rtdb, path), data);
        console.log(`✅ Synced property status: ${propertyId}`);
      } else {
        await this.queueOperation(path, data, 'set');
      }
    } catch (error) {
      console.error('❌ Failed to sync property status:', error);
      await this.queueOperation(path, data, 'set');
    }
  }

  async fetchPropertyStatus(propertyId: string): Promise<PropertyStatus | null> {
    try {
      const statusRef = ref(rtdb, `property_status/${propertyId}`);
      
      return new Promise((resolve, reject) => {
        onValue(statusRef, (snapshot) => {
          const data = snapshot.val();
          resolve(data || null);
        }, reject);
      });
    } catch (error) {
      console.error('❌ Failed to fetch property status:', error);
      return null;
    }
  }

  // Real-time Listeners
  onBookingUpdated(callback: (booking: BookingData) => void): () => void {
    const listenerId = 'bookings_listener';
    const bookingsRef = ref(rtdb, 'bookings');
    
    const listener = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((booking: any) => {
          callback(booking);
        });
      }
    });

    this.listeners.set(listenerId, { ref: bookingsRef, listener });
    
    return () => {
      const listenerData = this.listeners.get(listenerId);
      if (listenerData) {
        off(listenerData.ref, 'value', listenerData.listener);
        this.listeners.delete(listenerId);
      }
    };
  }

  onAssignmentUpdated(callback: (assignment: StaffAssignment) => void): () => void {
    const listenerId = 'assignments_listener';
    const assignmentsRef = ref(rtdb, 'staff_assignments');
    
    const listener = onValue(assignmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((assignment: any) => {
          callback(assignment);
        });
      }
    });

    this.listeners.set(listenerId, { ref: assignmentsRef, listener });
    
    return () => {
      const listenerData = this.listeners.get(listenerId);
      if (listenerData) {
        off(listenerData.ref, 'value', listenerData.listener);
        this.listeners.delete(listenerId);
      }
    };
  }

  onPropertyStatusChanged(callback: (status: PropertyStatus) => void): () => void {
    const listenerId = 'property_status_listener';
    const statusRef = ref(rtdb, 'property_status');
    
    const listener = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.values(data).forEach((status: any) => {
          callback(status);
        });
      }
    });

    this.listeners.set(listenerId, { ref: statusRef, listener });
    
    return () => {
      const listenerData = this.listeners.get(listenerId);
      if (listenerData) {
        off(listenerData.ref, 'value', listenerData.listener);
        this.listeners.delete(listenerId);
      }
    };
  }

  // Cleanup
  removeAllListeners(): void {
    this.listeners.forEach((listenerData, listenerId) => {
      off(listenerData.ref, 'value', listenerData.listener);
    });
    this.listeners.clear();
    console.log('🧹 Removed all realtime listeners');
  }

  // Connection status
  isConnected(): boolean {
    return this.isOnline;
  }

  // Get sync queue status
  getSyncQueueStatus(): { pending: number; items: any[] } {
    return {
      pending: this.syncQueue.length,
      items: this.syncQueue
    };
  }
}

export const realtimeDB = new RealtimeDatabaseService();
export default realtimeDB;
