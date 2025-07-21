/**
 * Staff Job Workflow Hook
 * Integrates JobStartWorkflow with existing staff job services
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { staffJobService } from '@/services/staffJobService';
import { jobLocationTrackingService } from '@/services/jobLocationTrackingService';
import { JobData } from '@/types/jobData';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface JobSession {
  id: string;
  jobId: string;
  staffId: string;
  startTime: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'in_progress';
  checklist?: ChecklistItem[];
  photos: JobPhoto[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
}

interface JobPhoto {
  id: string;
  uri: string;
  type: 'before' | 'progress' | 'after' | 'issue';
  description?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface UseStaffJobWorkflowState {
  isStartingJob: boolean;
  isWorkflowVisible: boolean;
  selectedJob: JobData | null;
  error: string | null;
}

interface UseStaffJobWorkflowActions {
  showStartWorkflow: (job: JobData) => void;
  hideStartWorkflow: () => void;
  handleJobStarted: (jobSession: JobSession) => Promise<void>;
  clearError: () => void;
}

export function useStaffJobWorkflow(): UseStaffJobWorkflowState & UseStaffJobWorkflowActions {
  const { currentProfile } = usePINAuth();
  const [state, setState] = useState<UseStaffJobWorkflowState>({
    isStartingJob: false,
    isWorkflowVisible: false,
    selectedJob: null,
    error: null,
  });

  const showStartWorkflow = useCallback((job: JobData) => {
    setState(prev => ({
      ...prev,
      selectedJob: job,
      isWorkflowVisible: true,
      error: null,
    }));
  }, []);

  const hideStartWorkflow = useCallback(() => {
    setState(prev => ({
      ...prev,
      isWorkflowVisible: false,
      selectedJob: null,
      error: null,
    }));
  }, []);

  const handleJobStarted = useCallback(async (jobSession: JobSession) => {
    if (!currentProfile?.id) {
      setState(prev => ({ ...prev, error: 'User profile not available' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isStartingJob: true, error: null }));

      // Update job status using staffJobService
      const statusUpdateResult = await staffJobService.updateJobStatus(
        jobSession.jobId,
        'in_progress',
        currentProfile.id,
        {
          startedAt: jobSession.startTime,
          startedBy: currentProfile.id,
          location: {
            latitude: jobSession.startLocation.latitude,
            longitude: jobSession.startLocation.longitude,
          },
          notes: jobSession.notes,
          sessionId: jobSession.id,
        }
      );

      if (!statusUpdateResult.success) {
        throw new Error(statusUpdateResult.error || 'Failed to update job status');
      }

      // Start GPS tracking if location is available
      if (jobSession.startLocation.latitude && jobSession.startLocation.longitude) {
        try {
          await jobLocationTrackingService.startRealTimeTracking(
            jobSession.jobId,
            currentProfile.id
          );
        } catch (trackingError) {
          console.warn('GPS tracking failed to start:', trackingError);
          // Don't fail the entire job start for tracking issues
        }
      }

      // Success feedback
      Alert.alert(
        'Job Started Successfully!',
        `You have successfully started "${state.selectedJob?.title}". GPS tracking is active and your progress is being recorded.`,
        [
          {
            text: 'Continue Working',
            onPress: () => {
              hideStartWorkflow();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error handling job start:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start job';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      
      Alert.alert(
        'Job Start Failed',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => setState(prev => ({ ...prev, error: null })) },
          { text: 'Cancel', onPress: hideStartWorkflow },
        ]
      );
    } finally {
      setState(prev => ({ ...prev, isStartingJob: false }));
    }
  }, [currentProfile, state.selectedJob, hideStartWorkflow]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    showStartWorkflow,
    hideStartWorkflow,
    handleJobStarted,
    clearError,
  };
}

export type { JobSession, ChecklistItem, JobPhoto };
