/**
 * Custom hook for staff job management with PIN authentication integration
 * Provides offline-first caching, real-time updates, and job actions
 * Now uses JobContext for real-time operational_jobs support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useJobContext } from '@/contexts/JobContext';
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
  
  // Use JobContext for real-time operational_jobs support
  const jobContext = useJobContext();
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Get data from JobContext (includes both jobs + operational_jobs collections)
  const jobs = jobContext.jobs as unknown as Job[];
  const loading = jobContext.loading;
  const [refreshing, setRefreshing] = useState(false);

  // Derived state - Filter jobs based on status
  // pendingJobs now includes UNASSIGNED operational_jobs (status: pending, assignedStaffId: null)
  const pendingJobs = jobs.filter(job => 
    job.status === 'pending' || 
    job.status === 'assigned'
  );
  const activeJobs = jobs.filter(job => 
    job.status === 'accepted' || 
    job.status === 'in_progress'
  );
  const completedJobs = jobs.filter(job => job.status === 'completed');

  // Refresh jobs function - uses JobContext
  const refreshJobs = useCallback(async () => {
    setRefreshing(true);
    await jobContext.refreshJobs();
    setRefreshing(false);
  }, [jobContext.refreshJobs]);

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
        console.log('✅ useStaffJobs: Job accepted successfully');
        // JobContext real-time listener will update automatically
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
        console.log('✅ useStaffJobs: Job started successfully');
        // JobContext real-time listener will update automatically
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
        console.log('✅ useStaffJobs: Job completed successfully');
        // JobContext real-time listener will update automatically
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
        console.log(`✅ useStaffJobs: Job ${jobId} status updated to ${status}`);
        // JobContext real-time listener will update automatically
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
    jobContext.error && console.log('Cleared JobContext error');
  }, [jobContext.error]);

  // Log job count for debugging
  useEffect(() => {
    if (jobs.length > 0) {
      console.log(`📊 useStaffJobs: ${jobs.length} total jobs (pending: ${pendingJobs.length}, active: ${activeJobs.length}, completed: ${completedJobs.length})`);
      console.log('🔍 useStaffJobs: Job details:', jobs.map(job => ({
        id: job.id,
        title: job.title || 'Untitled',
        status: job.status,
        propertyName: job.propertyName || 'Unknown'
      })));
    }
  }, [jobs.length, pendingJobs.length, activeJobs.length, completedJobs.length]);

  return {
    // Data
    jobs,
    activeJobs,
    pendingJobs,
    completedJobs,
    
    // States
    loading,
    refreshing,
    error: error || jobContext.error,
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
