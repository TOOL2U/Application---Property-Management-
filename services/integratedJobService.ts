/**
 * Integrated Job Service
 * Combines local Firebase jobs with web app API jobs
 */

import { webAppApiService, MobileJob } from './webappApiService';
import { firebaseUidService } from './firebaseUidService';
import { jobService as localJobService } from './jobService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IntegratedJob {
  id: string;
  title: string;
  description?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'pending';
  priority: 'low' | 'medium' | 'high';
  address?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration?: string;
  assignedTo: string;
  source: 'local' | 'webapp';
  createdAt: string;
  updatedAt?: string;
  mobileOptimized?: any;
}

interface JobSyncOptions {
  includeCompleted?: boolean;
  limit?: number;
  forceRefresh?: boolean;
}

const WEBAPP_JOBS_CACHE_KEY = 'webapp_jobs_cache';
const LAST_SYNC_KEY = 'last_webapp_sync';

class IntegratedJobService {
  private webAppJobs: MobileJob[] = [];
  private lastSyncTime: Date | null = null;
  private syncInterval: any = null;

  constructor() {
    this.loadCachedWebAppJobs();
    // Disable auto-sync temporarily due to network issues
    // this.startAutoSync();
    console.log('🔄 IntegratedJobs: Auto-sync disabled (using Firebase only)');
  }

  /**
   * Load cached web app jobs from storage
   */
  private async loadCachedWebAppJobs(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(WEBAPP_JOBS_CACHE_KEY);
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);

      if (cached) {
        this.webAppJobs = JSON.parse(cached);
        console.log('📱 IntegratedJobs: Loaded', this.webAppJobs.length, 'cached web app jobs');
      }

      if (lastSync) {
        this.lastSyncTime = new Date(lastSync);
        console.log('📱 IntegratedJobs: Last sync time:', this.lastSyncTime.toISOString());
      }
    } catch (error) {
      console.error('❌ IntegratedJobs: Failed to load cached jobs:', error);
    }
  }

  /**
   * Cache web app jobs to storage
   */
  private async cacheWebAppJobs(): Promise<void> {
    try {
      await AsyncStorage.setItem(WEBAPP_JOBS_CACHE_KEY, JSON.stringify(this.webAppJobs));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      console.log('💾 IntegratedJobs: Cached', this.webAppJobs.length, 'web app jobs');
    } catch (error) {
      console.error('❌ IntegratedJobs: Failed to cache jobs:', error);
    }
  }

  /**
   * Start automatic synchronization with web app
   */
  private startAutoSync(): void {
    // Sync every 30 seconds as recommended in the documentation
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncWithWebApp();
      } catch (error) {
        console.error('❌ IntegratedJobs: Auto-sync failed:', error);
      }
    }, 30000);

    console.log('🔄 IntegratedJobs: Auto-sync started (30s interval)');
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ IntegratedJobs: Auto-sync stopped');
    }
  }

  /**
   * Get jobs for a staff member (combines local and web app)
   */
  async getStaffJobs(
    staffId: string,
    options: JobSyncOptions = {}
  ): Promise<{
    success: boolean;
    jobs: IntegratedJob[];
    totalCount: number;
    sources: {
      local: number;
      webapp: number;
    };
  }> {
    try {
      console.log('📡 IntegratedJobs: Getting jobs for staff:', staffId);

      // Get Firebase UID for web app integration
      const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);

      // Get local Firebase jobs
      const localResult = await localJobService.getStaffJobs(staffId, {
        status: options.includeCompleted ? undefined : ['assigned', 'pending', 'in_progress'],
      });

      let localJobs: IntegratedJob[] = [];
      if (localResult.success && localResult.jobs) {
        localJobs = localResult.jobs.map(job => ({
          id: job.id,
          title: job.title || 'Untitled Job',
          description: job.description,
          status: this.mapLocalStatus(job.status),
          priority: this.mapLocalPriority(job.priority || 'medium'),
          address: job.location?.address || job.description || 'No address',
          scheduledDate: job.scheduledDate?.toISOString(),
          scheduledTime: this.extractTimeFromDate(job.scheduledDate),
          estimatedDuration: job.estimatedDuration?.toString() || '1 hour',
          assignedTo: job.assignedTo || staffId,
          source: 'local' as const,
          createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: job.updatedAt?.toISOString(),
        }));
      }

      // Get web app jobs if Firebase UID is available
      let webAppJobs: IntegratedJob[] = [];
      if (firebaseUid) {
        try {
          await this.syncWebAppJobs(firebaseUid, options);
          webAppJobs = this.webAppJobs.map(job => ({
            id: `webapp_${job.id}`,
            title: job.mobileOptimized?.title || job.title,
            description: job.title,
            status: job.status,
            priority: job.mobileOptimized?.priority || 'medium',
            address: job.mobileOptimized?.address,
            scheduledTime: job.mobileOptimized?.scheduledTime,
            estimatedDuration: job.mobileOptimized?.estimatedDuration,
            assignedTo: job.assignedStaffId,
            source: 'webapp' as const,
            createdAt: job.createdAt,
            mobileOptimized: job.mobileOptimized,
          }));
        } catch (error) {
          console.error('❌ IntegratedJobs: Web app sync failed, using cached data:', error);
          // Use cached data on error
          webAppJobs = this.webAppJobs.map(job => ({
            id: `webapp_${job.id}`,
            title: job.mobileOptimized?.title || job.title,
            description: job.title,
            status: job.status,
            priority: job.mobileOptimized?.priority || 'medium',
            address: job.mobileOptimized?.address,
            scheduledTime: job.mobileOptimized?.scheduledTime,
            estimatedDuration: job.mobileOptimized?.estimatedDuration,
            assignedTo: job.assignedStaffId,
            source: 'webapp' as const,
            createdAt: job.createdAt,
            mobileOptimized: job.mobileOptimized,
          }));
        }
      }

      // Combine and sort jobs
      const allJobs = [...localJobs, ...webAppJobs];
      
      // Sort by creation date (newest first)
      allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply limit if specified
      const limitedJobs = options.limit ? allJobs.slice(0, options.limit) : allJobs;

      console.log('✅ IntegratedJobs: Combined jobs:', {
        total: limitedJobs.length,
        local: localJobs.length,
        webapp: webAppJobs.length,
      });

      return {
        success: true,
        jobs: limitedJobs,
        totalCount: allJobs.length,
        sources: {
          local: localJobs.length,
          webapp: webAppJobs.length,
        },
      };

    } catch (error) {
      console.error('❌ IntegratedJobs: Failed to get staff jobs:', error);
      return {
        success: false,
        jobs: [],
        totalCount: 0,
        sources: { local: 0, webapp: 0 },
      };
    }
  }

  /**
   * Sync jobs with web app API
   */
  private async syncWebAppJobs(
    firebaseUid: string,
    options: JobSyncOptions = {}
  ): Promise<void> {
    try {
      console.log('🔄 IntegratedJobs: Syncing with web app for UID:', firebaseUid);

      const response = await webAppApiService.getStaffJobs(firebaseUid, {
        includeCompleted: options.includeCompleted,
        limit: options.limit,
      });

      if (response.success && response.data.jobs) {
        this.webAppJobs = response.data.jobs;
        this.lastSyncTime = new Date();
        await this.cacheWebAppJobs();

        console.log('✅ IntegratedJobs: Web app sync completed:', {
          jobCount: this.webAppJobs.length,
          syncTime: this.lastSyncTime.toISOString(),
        });
      }

    } catch (error) {
      console.error('❌ IntegratedJobs: Web app sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync with web app (public method for manual sync)
   */
  async syncWithWebApp(staffId?: string): Promise<void> {
    try {
      if (staffId) {
        const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
        if (firebaseUid) {
          await this.syncWebAppJobs(firebaseUid);
        }
      } else {
        // Sync with test account if no staff ID provided
        const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
        await this.syncWebAppJobs(testUid);
      }
    } catch (error) {
      console.error('❌ IntegratedJobs: Manual sync failed:', error);
      throw error;
    }
  }

  /**
   * Perform job action (accept, start, complete)
   */
  async performJobAction(
    jobId: string,
    action: 'accept' | 'start' | 'complete',
    staffId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🎯 IntegratedJobs: Performing action:', action, 'on job:', jobId);

      // Check if it's a web app job
      if (jobId.startsWith('webapp_')) {
        const webAppJobId = jobId.replace('webapp_', '');
        const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
        
        if (!firebaseUid) {
          throw new Error('Firebase UID not found for staff member');
        }

        const actionMap = {
          accept: 'accept_job',
          start: 'start_job',
          complete: 'complete_job',
        };

        await webAppApiService.performJobAction(
          actionMap[action] as any,
          webAppJobId,
          firebaseUid
        );

        // Refresh web app jobs after action
        await this.syncWebAppJobs(firebaseUid);

        return {
          success: true,
          message: `Web app job ${action} successful`,
        };
      } else {
        // Handle local Firebase job - use a simple success response for now
        // TODO: Implement proper local job action handling
        console.log('🔧 IntegratedJobs: Local job action not implemented yet:', action);
        return {
          success: true,
          message: `Local job ${action} noted (implementation pending)`,
        };
      }

    } catch (error) {
      console.error('❌ IntegratedJobs: Job action failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map local job status to standard format
   */
  private mapLocalStatus(status: string): 'assigned' | 'in_progress' | 'completed' | 'pending' {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'assigned':
        return 'assigned';
      case 'in_progress':
      case 'in-progress':
        return 'in_progress';
      case 'completed':
      case 'complete':
        return 'completed';
      default:
        return 'pending';
    }
  }

  /**
   * Map local job priority to standard format
   */
  private mapLocalPriority(priority: string): 'low' | 'medium' | 'high' {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'low';
      case 'high':
      case 'urgent':
        return 'high';
      case 'medium':
      default:
        return 'medium';
    }
  }

  /**
   * Extract time from date object
   */
  private extractTimeFromDate(date?: Date): string {
    if (!date) return '';
    try {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '';
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    lastSyncTime: Date | null;
    webAppJobsCount: number;
    autoSyncEnabled: boolean;
  } {
    return {
      lastSyncTime: this.lastSyncTime,
      webAppJobsCount: this.webAppJobs.length,
      autoSyncEnabled: this.syncInterval !== null,
    };
  }

  /**
   * Test connectivity with web app
   */
  async testWebAppConnection(): Promise<boolean> {
    try {
      return await webAppApiService.testConnection();
    } catch (error) {
      console.error('❌ IntegratedJobs: Connection test failed:', error);
      return false;
    }
  }

  /**
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    this.webAppJobs = [];
    this.lastSyncTime = null;
    await AsyncStorage.removeItem(WEBAPP_JOBS_CACHE_KEY);
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    console.log('🧹 IntegratedJobs: Cache cleared');
  }
}

// Export singleton instance
export const integratedJobService = new IntegratedJobService();
export type { IntegratedJob, JobSyncOptions };
