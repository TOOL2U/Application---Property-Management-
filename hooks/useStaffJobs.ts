/**
 * Custom hook for staff job management with PIN authentication integration
 * Provides offline-first caching, real-time updates, and job actions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { staffJobService } from '@/services/staffJobService';
import { Job, JobStatus, JobFilter } from '@/types/job';

interface UseStaffJobsOptions {
  filters?: JobFilter;
  enableRealtime?: boolean;
  enableCache?: boolean;
}

interface UseStaffJobsReturn {
  // Data
  jobs: Job[];
  activeJobs: Job[];
  pendingJobs: Job[];
  completedJobs: Job[];
  
  // States
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fromCache: boolean;
  
  // Actions
  refreshJobs: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<boolean>;
  startJob: (jobId: string) => Promise<boolean>;
  completeJob: (jobId: string, notes?: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: JobStatus, additionalData?: Record<string, any>) => Promise<boolean>;
  
  // Utility
  getJobById: (jobId: string) => Job | undefined;
  getJobsByStatus: (status: JobStatus) => Job[];
  clearError: () => void;
}

export function useStaffJobs(options: UseStaffJobsOptions = {}): UseStaffJobsReturn {
  const {
    filters,
    enableRealtime = true,
    enableCache = true,
  } = options;

  const { currentProfile } = usePINAuth();
  
  // Use refs for stable references
  const filtersRef = useRef(filters);
  const enableCacheRef = useRef(enableCache);
  
  // Update refs when props change
  filtersRef.current = filters;
  enableCacheRef.current = enableCache;
  
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Derived state
  const activeJobs = jobs.filter(job => ['accepted', 'in_progress'].includes(job.status));
  const pendingJobs = jobs.filter(job => job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');

  // Load jobs function - stabilized dependencies
  const loadJobs = useCallback(async (useCache?: boolean) => {
    if (!currentProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 useStaffJobs: Loading jobs for staff:', currentProfile.id);
      
      const response = await staffJobService.getStaffJobs(
        currentProfile.id,
        filtersRef.current,
        useCache ?? enableCacheRef.current
      );

      if (response.success) {
        setJobs(response.jobs);
        setFromCache(response.fromCache || false);
        setError(null);
        console.log(`✅ useStaffJobs: Loaded ${response.jobs.length} jobs (from cache: ${response.fromCache})`);
      } else {
        setError(response.error || 'Failed to load jobs');
        console.error('❌ useStaffJobs: Failed to load jobs:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ useStaffJobs: Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.id]); // Only depend on currentProfile.id

  // Refresh jobs function
  const refreshJobs = useCallback(async () => {
    setRefreshing(true);
    await loadJobs(false); // Force fresh data
    setRefreshing(false);
  }, [loadJobs]);

  // Job action functions
  const acceptJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!currentProfile?.id) return false;

    try {
      console.log('✅ useStaffJobs: Accepting job:', jobId);
      
      const result = await staffJobService.updateJobStatus(
        jobId,
        'accepted',
        currentProfile.id,
        { acceptedBy: currentProfile.id }
      );

      if (result.success) {
        // Update local state optimistically
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'accepted' as JobStatus, acceptedAt: new Date() }
              : job
          )
        );
        console.log('✅ useStaffJobs: Job accepted successfully');
        return true;
      } else {
        setError(result.error || 'Failed to accept job');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept job';
      setError(errorMessage);
      console.error('❌ useStaffJobs: Error accepting job:', err);
      return false;
    }
  }, [currentProfile?.id]);

  const startJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!currentProfile?.id) return false;

    try {
      console.log('🚀 useStaffJobs: Starting job:', jobId);
      
      const result = await staffJobService.updateJobStatus(
        jobId,
        'in_progress',
        currentProfile.id,
        { startedBy: currentProfile.id }
      );

      if (result.success) {
        // Update local state optimistically
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'in_progress' as JobStatus, startedAt: new Date() }
              : job
          )
        );
        console.log('✅ useStaffJobs: Job started successfully');
        return true;
      } else {
        setError(result.error || 'Failed to start job');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start job';
      setError(errorMessage);
      console.error('❌ useStaffJobs: Error starting job:', err);
      return false;
    }
  }, [currentProfile?.id]);

  const completeJob = useCallback(async (jobId: string, notes?: string): Promise<boolean> => {
    if (!currentProfile?.id) return false;

    try {
      console.log('🏁 useStaffJobs: Completing job:', jobId);
      
      const additionalData: Record<string, any> = {
        completedBy: currentProfile.id,
      };

      if (notes) {
        additionalData.completionNotes = notes;
      }

      const result = await staffJobService.updateJobStatus(
        jobId,
        'completed',
        currentProfile.id,
        additionalData
      );

      if (result.success) {
        // Update local state optimistically
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'completed' as JobStatus, completedAt: new Date() }
              : job
          )
        );
        console.log('✅ useStaffJobs: Job completed successfully');
        return true;
      } else {
        setError(result.error || 'Failed to complete job');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete job';
      setError(errorMessage);
      console.error('❌ useStaffJobs: Error completing job:', err);
      return false;
    }
  }, [currentProfile?.id]);

  const updateJobStatus = useCallback(async (
    jobId: string, 
    status: JobStatus, 
    additionalData?: Record<string, any>
  ): Promise<boolean> => {
    if (!currentProfile?.id) return false;

    try {
      console.log(`🔄 useStaffJobs: Updating job ${jobId} status to ${status}`);
      
      const result = await staffJobService.updateJobStatus(
        jobId,
        status,
        currentProfile.id,
        additionalData
      );

      if (result.success) {
        // Update local state optimistically
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId 
              ? { ...job, status, ...additionalData }
              : job
          )
        );
        console.log(`✅ useStaffJobs: Job ${jobId} status updated to ${status}`);
        return true;
      } else {
        setError(result.error || 'Failed to update job status');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job status';
      setError(errorMessage);
      console.error('❌ useStaffJobs: Error updating job status:', err);
      return false;
    }
  }, [currentProfile?.id]);

  // Utility functions
  const getJobById = useCallback((jobId: string): Job | undefined => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getJobsByStatus = useCallback((status: JobStatus): Job[] => {
    return jobs.filter(job => job.status === status);
  }, [jobs]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Effects
  useEffect(() => {
    if (currentProfile?.id) {
      loadJobs();
    } else {
      setJobs([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile?.id]);

  // Set up real-time listener
  useEffect(() => {
    if (!enableRealtime || !currentProfile?.id) {
      return;
    }

    console.log('👂 useStaffJobs: Setting up real-time listener');
    
    const unsubscribe = staffJobService.subscribeToStaffJobs(
      currentProfile.id,
      (updatedJobs) => {
        console.log(`📡 useStaffJobs: Real-time update - ${updatedJobs.length} jobs`);
        setJobs(updatedJobs);
        setFromCache(false);
      },
      filtersRef.current
    );

    return () => {
      console.log('🔇 useStaffJobs: Cleaning up real-time listener');
      unsubscribe();
    };
    // Only re-subscribe when currentProfile.id or enableRealtime changes, not on filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile?.id, enableRealtime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      staffJobService.cleanup();
    };
  }, []);

  return {
    // Data
    jobs,
    activeJobs,
    pendingJobs,
    completedJobs,
    
    // States
    loading,
    refreshing,
    error,
    fromCache,
    
    // Actions
    refreshJobs,
    acceptJob,
    startJob,
    completeJob,
    updateJobStatus,
    
    // Utility
    getJobById,
    getJobsByStatus,
    clearError,
  };
}

export default useStaffJobs;
