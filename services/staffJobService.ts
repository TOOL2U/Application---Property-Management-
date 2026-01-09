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
import { secureFirestore } from './secureFirestore';

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
  private readonly OPERATIONAL_JOBS_COLLECTION = 'operational_jobs'; // NEW: Webapp jobs
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
        if (cachedData && !this.isCacheExpired(cachedData)) {
          console.log('📦 StaffJobService: Returning cached jobs');
          return {
            success: true,
            jobs: this.applyFilters(cachedData.jobs, filters),
            fromCache: true,
          };
        } else if (cachedData) {
          console.log('⏰ StaffJobService: Cache expired for staff:', staffId);
        }
      }

      // **NEW SECURITY REQUIREMENT**: Use secure Firestore service for authenticated access
      try {
        console.log('🔐 StaffJobService: Using secure Firestore service for job queries...');
        
        // Use secure Firestore service to get staff jobs
        const jobs = await secureFirestore.getStaffJobs(staffId);
        
        console.log(`✅ StaffJobService: Successfully loaded ${jobs.length} jobs from secure Firestore`);
        
        // Cache the jobs for offline access
        await this.cacheJobs(staffId, jobs);
        
        return {
          success: true,
          jobs: this.applyFilters(jobs, filters),
          fromCache: false,
        };
        
      } catch (secureFirestoreError: any) {
        console.warn('⚠️ StaffJobService: Secure Firestore access failed:', secureFirestoreError.message);
        
        // If authentication is required, try to fallback to cached data
        if (secureFirestoreError.message.includes('Authentication required') || 
            secureFirestoreError.message.includes('Permission denied')) {
          console.log('� StaffJobService: Authentication required, falling back to cached data...');
          
          const cachedData = await this.getCachedJobs(staffId);
          if (cachedData) {
            console.log('📦 StaffJobService: Returning stale cached jobs as fallback');
            return {
              success: true,
              jobs: this.applyFilters(cachedData.jobs, filters),
              fromCache: true,
            };
          } else {
            console.log('❌ StaffJobService: No cached data available');
            return {
              success: false,
              jobs: [],
              error: 'Authentication required and no cached data available. Please ensure you are logged in.',
            };
          }
        } else {
          // Some other error, try fallback to cached data
          console.error('❌ StaffJobService: Unexpected error, trying cache fallback:', secureFirestoreError);
          
          const cachedData = await this.getCachedJobs(staffId);
          if (cachedData) {
            console.log('� StaffJobService: Returning stale cached jobs as fallback');
            return {
              success: true,
              jobs: this.applyFilters(cachedData.jobs, filters),
              fromCache: true,
            };
          } else {
            return {
              success: false,
              jobs: [],
              error: `Failed to load jobs: ${secureFirestoreError.message}`,
            };
          }
        }
      }
      
    } catch (error) {
      console.error('❌ StaffJobService: Error getting staff jobs:', error);
      
      // Try to return cached data as fallback
      const cachedData = await this.getCachedJobs(staffId);
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
        
        // Get Firebase UID for this staff member (same logic as getStaffJobs)
        const staffAccountsRef = collection(db, 'staff_accounts');
        const staffQuery = query(staffAccountsRef, where('__name__', '==', staffId));
        const staffSnapshot = await getDocs(staffQuery);
        
        let firebaseUid = null;
        if (!staffSnapshot.empty) {
          const staffData = staffSnapshot.docs[0].data();
          firebaseUid = staffData.userId;
          console.log('👂 StaffJobService: Real-time listener using Firebase UID:', firebaseUid);
        } else {
          console.warn('⚠️ StaffJobService: Cannot set up real-time listener - no staff account found for:', staffId);
          callback([]);
          return;
        }

        if (!firebaseUid) {
          console.warn('⚠️ StaffJobService: Cannot set up real-time listener - no Firebase UID found for staff:', staffId);
          callback([]);
          return;
        }
        
        const jobsRef = collection(db, this.JOBS_COLLECTION);
        
        // Use assignedStaffId (Firebase UID) like the main getStaffJobs method
        let q = query(
          jobsRef,
          where('assignedStaffId', '==', firebaseUid),
          orderBy('createdAt', 'desc')
        );

        // Apply status filter if provided
        if (filters?.status && filters.status.length > 0) {
          q = query(q, where('status', 'in', filters.status));
        }        unsubscribe = onSnapshot(
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
   * Supports BOTH 'jobs' and 'operational_jobs' collections
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
      
      // Try to find job in both collections
      let jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      let jobDoc = await getDoc(jobRef);
      let collection = this.JOBS_COLLECTION;

      // If not found in 'jobs', try 'operational_jobs'
      if (!jobDoc.exists()) {
        jobRef = doc(db, this.OPERATIONAL_JOBS_COLLECTION, jobId);
        jobDoc = await getDoc(jobRef);
        collection = this.OPERATIONAL_JOBS_COLLECTION;
      }

      if (!jobDoc.exists()) {
        console.error(`❌ StaffJobService: Job ${jobId} not found in any collection`);
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const updateData: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      // Add status-specific timestamps and fields
      switch (status) {
        case 'accepted':
          updateData.acceptedAt = serverTimestamp();
          // If job was unassigned, assign it to this staff member
          const jobData = jobDoc.data();
          if (!jobData?.assignedStaffId || jobData.assignedStaffId === null) {
            updateData.assignedStaffId = staffId;
            updateData.assignedTo = staffId;
            console.log('📌 StaffJobService: Assigning unassigned job to staff:', staffId);
          }
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

      console.log(`✅ StaffJobService: Job ${jobId} status updated to ${status} in ${collection} collection`);
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

  private isCacheExpired(cachedData: CachedJobData): boolean {
    const now = Date.now();
    const isExpired = (now - cachedData.timestamp) > this.CACHE_DURATION;
    if (isExpired) {
      console.log('⏰ StaffJobService: Cache expired for staff:', cachedData.staffId);
    }
    return isExpired;
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

  /**
   * Safely converts a value to a Date object
   * Handles Firestore Timestamps, JavaScript Dates, and strings
   */
  private safeToDate(value: any): Date | undefined {
    if (!value) return undefined;
    
    try {
      // If it's a Firestore Timestamp with toDate method
      if (value && typeof value.toDate === 'function') {
        return value.toDate();
      }
      
      // If it's already a Date object
      if (value instanceof Date) {
        return value;
      }
      
      // If it's a string or number, try to parse it
      if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      }
      
      // If it has seconds and nanoseconds (Firestore timestamp format)
      if (value.seconds !== undefined) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
      }
      
      return undefined;
    } catch (error) {
      console.warn('⚠️ StaffJobService: Failed to parse date:', value, error);
      return undefined;
    }
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
      assignedAt: this.safeToDate(data.assignedAt) || this.safeToDate(data.createdAt) || new Date(),
      acceptedAt: this.safeToDate(data.acceptedAt),
      startedAt: this.safeToDate(data.startedAt),
      completedAt: this.safeToDate(data.completedAt),
      scheduledDate: this.safeToDate(data.scheduledDate) || this.safeToDate(data.scheduledStartTime) || new Date(),
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
      createdAt: this.safeToDate(data.createdAt) || new Date(),
      updatedAt: this.safeToDate(data.updatedAt) || new Date(),
      createdBy: data.createdBy || '',
      notificationsEnabled: data.notificationsEnabled ?? true,
      reminderSent: data.reminderSent ?? false,
    };
  }
}

// Export singleton instance
export const staffJobService = new StaffJobService();
export default staffJobService;
