/**
 * Staff Job Service - Enhanced job fetching with PIN authentication integration
 * Provides offline-first caching and real-time updates for staff-specific jobs
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Job, JobStatus, JobFilter } from '@/types/job';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedJobData {
  jobs: Job[];
  timestamp: number;
  staffId: string;
}

interface StaffJobServiceResponse {
  success: boolean;
  jobs: Job[];
  error?: string;
  fromCache?: boolean;
}

class StaffJobService {
  private readonly JOBS_COLLECTION = 'jobs';
  private readonly CACHE_KEY_PREFIX = 'staff_jobs_';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private unsubscribeCallbacks: Map<string, Unsubscribe> = new Map();

  /**
   * Get jobs assigned to a specific staff member with offline-first caching
   */
  async getStaffJobs(
    staffId: string, 
    filters?: JobFilter,
    useCache: boolean = true
  ): Promise<StaffJobServiceResponse> {
    try {
      console.log('🔍 StaffJobService: Getting jobs for staff:', staffId);

      // Try to get from cache first if enabled
      if (useCache) {
        const cachedData = await this.getCachedJobs(staffId);
        if (cachedData) {
          console.log('📦 StaffJobService: Returning cached jobs');
          return {
            success: true,
            jobs: this.applyFilters(cachedData.jobs, filters),
            fromCache: true,
          };
        }
      }

      // Fetch from Firestore
      const db = await getDb();
      const jobsRef = collection(db, this.JOBS_COLLECTION);
      let q = query(
        jobsRef,
        where('assignedTo', '==', staffId),
        orderBy('scheduledDate', 'desc')
      );

      // Apply status filter if provided
      if (filters?.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const job = this.mapFirestoreDataToJob(doc.id, data);
        jobs.push(job);
      });

      // Cache the results
      await this.cacheJobs(staffId, jobs);

      console.log(`✅ StaffJobService: Retrieved ${jobs.length} jobs for staff ${staffId}`);
      
      return {
        success: true,
        jobs: this.applyFilters(jobs, filters),
        fromCache: false,
      };

    } catch (error) {
      console.error('❌ StaffJobService: Error getting staff jobs:', error);
      
      // Try to return cached data as fallback
      const cachedData = await this.getCachedJobs(staffId, false);
      if (cachedData) {
        console.log('📦 StaffJobService: Returning stale cached jobs as fallback');
        return {
          success: true,
          jobs: this.applyFilters(cachedData.jobs, filters),
          fromCache: true,
        };
      }

      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      };
    }
  }

  /**
   * Get active jobs (accepted and in_progress) for a staff member
   */
  async getActiveJobs(staffId: string): Promise<StaffJobServiceResponse> {
    return this.getStaffJobs(staffId, {
      status: ['accepted', 'in_progress']
    });
  }

  /**
   * Get pending jobs for a staff member
   */
  async getPendingJobs(staffId: string): Promise<StaffJobServiceResponse> {
    return this.getStaffJobs(staffId, {
      status: ['pending']
    });
  }

  /**
   * Subscribe to real-time job updates for a staff member
   */
  subscribeToStaffJobs(
    staffId: string,
    callback: (jobs: Job[]) => void,
    filters?: JobFilter
  ): () => void {
    console.log('👂 StaffJobService: Setting up real-time listener for staff:', staffId);

    let unsubscribe: (() => void) | null = null;

    // Initialize async and set up listener
    (async () => {
      try {
        const db = await getDb();
        const jobsRef = collection(db, this.JOBS_COLLECTION);
        let q = query(
          jobsRef,
          where('assignedTo', '==', staffId),
          orderBy('scheduledDate', 'desc')
        );

        // Apply status filter if provided
        if (filters?.status && filters.status.length > 0) {
          q = query(q, where('status', 'in', filters.status));
        }

        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const jobs: Job[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const job = this.mapFirestoreDataToJob(doc.id, data);
              jobs.push(job);
            });

            console.log(`📡 StaffJobService: Real-time update - ${jobs.length} jobs for staff ${staffId}`);

            // Update cache
            this.cacheJobs(staffId, jobs);

            // Apply filters and call callback
            const filteredJobs = this.applyFilters(jobs, filters);
            callback(filteredJobs);
          },
          (error) => {
            console.error('❌ StaffJobService: Real-time listener error:', error);
          }
        );

        // Store unsubscribe callback
        this.unsubscribeCallbacks.set(staffId, unsubscribe);
      } catch (error) {
        console.error('❌ StaffJobService: Error setting up real-time listener:', error);
      }
    })();

    return () => {
      console.log('🔇 StaffJobService: Unsubscribing from real-time updates for staff:', staffId);
      if (unsubscribe) {
        unsubscribe();
        this.unsubscribeCallbacks.delete(staffId);
      }
    };
  }

  /**
   * Update job status (accept, start, complete, etc.)
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    staffId: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 StaffJobService: Updating job ${jobId} status to ${status}`);

      const db = await getDb();
      const jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      const updateData: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      // Add status-specific timestamps
      switch (status) {
        case 'accepted':
          updateData.acceptedAt = serverTimestamp();
          break;
        case 'in_progress':
          updateData.startedAt = serverTimestamp();
          break;
        case 'completed':
          updateData.completedAt = serverTimestamp();
          break;
      }

      await updateDoc(jobRef, updateData);

      // Invalidate cache for this staff member
      await this.invalidateCache(staffId);

      console.log(`✅ StaffJobService: Job ${jobId} status updated to ${status}`);
      return { success: true };

    } catch (error) {
      console.error('❌ StaffJobService: Error updating job status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job status',
      };
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    console.log('🧹 StaffJobService: Cleaning up all subscriptions');
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  /**
   * Enable offline mode
   */
  async enableOfflineMode(): Promise<void> {
    try {
      const db = await getDb();
      await disableNetwork(db);
      console.log('📴 StaffJobService: Offline mode enabled');
    } catch (error) {
      console.error('❌ StaffJobService: Error enabling offline mode:', error);
    }
  }

  /**
   * Disable offline mode
   */
  async disableOfflineMode(): Promise<void> {
    try {
      const db = await getDb();
      await enableNetwork(db);
      console.log('📶 StaffJobService: Online mode enabled');
    } catch (error) {
      console.error('❌ StaffJobService: Error disabling offline mode:', error);
    }
  }

  // Private helper methods

  private async getCachedJobs(staffId: string, checkExpiry: boolean = true): Promise<CachedJobData | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${staffId}`;
      const cachedDataString = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedDataString) {
        return null;
      }

      const cachedData: CachedJobData = JSON.parse(cachedDataString);
      
      // Check if cache is expired
      if (checkExpiry && Date.now() - cachedData.timestamp > this.CACHE_DURATION) {
        console.log('⏰ StaffJobService: Cache expired for staff:', staffId);
        return null;
      }

      // Parse dates back from strings
      cachedData.jobs = cachedData.jobs.map(job => ({
        ...job,
        scheduledDate: new Date(job.scheduledDate),
        assignedAt: new Date(job.assignedAt),
        acceptedAt: job.acceptedAt ? new Date(job.acceptedAt) : undefined,
        startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
        completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      }));

      return cachedData;
    } catch (error) {
      console.error('❌ StaffJobService: Error getting cached jobs:', error);
      return null;
    }
  }

  private async cacheJobs(staffId: string, jobs: Job[]): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${staffId}`;
      const cacheData: CachedJobData = {
        jobs,
        timestamp: Date.now(),
        staffId,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 StaffJobService: Cached ${jobs.length} jobs for staff ${staffId}`);
    } catch (error) {
      console.error('❌ StaffJobService: Error caching jobs:', error);
    }
  }

  private async invalidateCache(staffId: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${staffId}`;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`🗑️ StaffJobService: Cache invalidated for staff ${staffId}`);
    } catch (error) {
      console.error('❌ StaffJobService: Error invalidating cache:', error);
    }
  }

  private applyFilters(jobs: Job[], filters?: JobFilter): Job[] {
    if (!filters) return jobs;

    return jobs.filter(job => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(job.status)) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(job.priority)) return false;
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(job.type)) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const jobDate = job.scheduledDate;
        if (jobDate < filters.dateRange.start || jobDate > filters.dateRange.end) {
          return false;
        }
      }

      // Property filter
      if (filters.propertyId && job.propertyId !== filters.propertyId) {
        return false;
      }

      return true;
    });
  }

  private mapFirestoreDataToJob(id: string, data: any): Job {
    return {
      id,
      title: data.title || 'Untitled Job',
      description: data.description || '',
      type: data.type || 'general',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy || data.createdBy,
      assignedAt: data.assignedAt?.toDate() || data.createdAt?.toDate() || new Date(),
      acceptedAt: data.acceptedAt?.toDate(),
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      scheduledDate: data.scheduledDate?.toDate() || new Date(),
      estimatedDuration: data.estimatedDuration || 60,
      propertyId: data.propertyId || '',
      location: {
        address: data.location?.address || '',
        city: data.location?.city || '',
        state: data.location?.state || '',
        zipCode: data.location?.zipCode || '',
        coordinates: data.location?.coordinates || { latitude: 0, longitude: 0 },
      },
      contacts: data.contacts || [],
      requirements: data.requirements || [],
      photos: data.photos || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || '',
      notificationsEnabled: data.notificationsEnabled ?? true,
      reminderSent: data.reminderSent ?? false,
    };
  }
}

// Export singleton instance
export const staffJobService = new StaffJobService();
export default staffJobService;
