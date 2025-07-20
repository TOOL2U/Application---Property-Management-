/**
 * Enhanced Mobile Job Hook
 * React hook for managing progressive job data loading and UI state
 */

import { useState, useEffect, useCallback, useReducer } from 'react';
import {
  EnhancedMobileJob,
  CriticalJobData,
  JobDetailsData,
  PropertyContextData,
  CompletionData,
  JobUIState,
  JobAction
} from '../types/enhancedMobileJob';
import enhancedMobileJobService from '../services/enhancedMobileJobService';

// UI State Reducer
const jobUIReducer = (state: JobUIState, action: JobAction): JobUIState => {
  switch (action.type) {
    case 'LOAD_CRITICAL_DATA':
      return {
        ...state,
        criticalDataLoaded: true
      };
    case 'LOAD_JOB_DETAILS':
      return {
        ...state,
        jobDetailsLoaded: true
      };
    case 'LOAD_PROPERTY_CONTEXT':
      return {
        ...state,
        propertyContextLoaded: true,
        showPropertyContext: true
      };
    case 'LOAD_COMPLETION_DATA':
      return {
        ...state,
        completionDataLoaded: true
      };
    case 'ACCEPT_JOB':
      return {
        ...state,
        isAccepted: true
      };
    case 'START_JOB':
      return {
        ...state,
        isStarted: true
      };
    case 'UPDATE_CHECKLIST':
      return {
        ...state,
        checklistProgress: {
          ...state.checklistProgress,
          [action.payload.id]: action.payload.completed
        }
      };
    case 'UPDATE_PHOTO':
      return {
        ...state,
        photosCompleted: {
          ...state.photosCompleted,
          [action.payload.requirementId]: action.payload.photoUrl
        }
      };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reportProgress: {
          ...state.reportProgress,
          [action.payload.fieldId]: action.payload.value
        }
      };
    case 'COMPLETE_JOB':
      return {
        ...state,
        isSubmittingCompletion: false
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined
      };
    default:
      return state;
  }
};

// Initial UI State
const initialUIState: JobUIState = {
  criticalDataLoaded: false,
  jobDetailsLoaded: false,
  propertyContextLoaded: false,
  completionDataLoaded: false,
  isAccepted: false,
  isStarted: false,
  checklistProgress: {},
  photosCompleted: {},
  reportProgress: {},
  isExpanded: false,
  activeTab: 'details',
  showPropertyContext: false,
  isSubmittingCompletion: false
};

export const useEnhancedMobileJob = (jobId: string, staffId: string) => {
  // Job data state
  const [criticalData, setCriticalData] = useState<CriticalJobData | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetailsData | null>(null);
  const [propertyContext, setPropertyContext] = useState<PropertyContextData | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  
  // UI state management
  const [uiState, dispatch] = useReducer(jobUIReducer, initialUIState);
  
  // Loading states
  const [isLoading, setIsLoading] = useState<{
    critical: boolean;
    details: boolean;
    property: boolean;
    completion: boolean;
  }>({
    critical: true,
    details: false,
    property: false,
    completion: false
  });
  
  const [error, setError] = useState<string | null>(null);

  // Load critical data immediately
  useEffect(() => {
    loadCriticalData();
  }, [jobId]);

  const loadCriticalData = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, critical: true }));
      setError(null);
      
      const response = await enhancedMobileJobService.loadCriticalJobData(jobId);
      
      if (response.success && response.data) {
        setCriticalData(response.data);
        dispatch({ type: 'LOAD_CRITICAL_DATA', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load critical data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job data';
      setError(errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      setIsLoading(prev => ({ ...prev, critical: false }));
    }
  }, [jobId]);

  const loadJobDetails = useCallback(async () => {
    if (jobDetails || isLoading.details) return;
    
    try {
      setIsLoading(prev => ({ ...prev, details: true }));
      
      const response = await enhancedMobileJobService.loadJobDetails(jobId);
      
      if (response.success && response.data) {
        setJobDetails(response.data);
        dispatch({ type: 'LOAD_JOB_DETAILS', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load job details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job details';
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, details: false }));
    }
  }, [jobId, jobDetails, isLoading.details]);

  const loadPropertyContext = useCallback(async () => {
    if (propertyContext || isLoading.property) return;
    
    try {
      setIsLoading(prev => ({ ...prev, property: true }));
      
      const response = await enhancedMobileJobService.loadPropertyContext(jobId);
      
      if (response.success && response.data) {
        setPropertyContext(response.data);
        dispatch({ type: 'LOAD_PROPERTY_CONTEXT', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load property context');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load property context';
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, property: false }));
    }
  }, [jobId, propertyContext, isLoading.property]);

  const loadCompletionData = useCallback(async () => {
    if (completionData || isLoading.completion) return;
    
    try {
      setIsLoading(prev => ({ ...prev, completion: true }));
      
      const response = await enhancedMobileJobService.loadCompletionData(jobId);
      
      if (response.success && response.data) {
        setCompletionData(response.data);
        dispatch({ type: 'LOAD_COMPLETION_DATA', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load completion data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load completion data';
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, completion: false }));
    }
  }, [jobId, completionData, isLoading.completion]);

  // Job actions
  const acceptJob = useCallback(async () => {
    try {
      const success = await enhancedMobileJobService.acceptJob(jobId, staffId);
      if (success) {
        dispatch({ type: 'ACCEPT_JOB' });
        // Automatically load job details after acceptance
        loadJobDetails();
      } else {
        throw new Error('Failed to accept job');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept job';
      setError(errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [jobId, staffId, loadJobDetails]);

  const startJob = useCallback(async () => {
    try {
      const success = await enhancedMobileJobService.startJob(jobId, staffId);
      if (success) {
        dispatch({ type: 'START_JOB' });
        // Automatically load completion data when starting
        loadCompletionData();
      } else {
        throw new Error('Failed to start job');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start job';
      setError(errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [jobId, staffId, loadCompletionData]);

  const completeJob = useCallback(async (completionFormData: any) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: 'Submitting completion...' });
      
      const success = await enhancedMobileJobService.completeJob(jobId, staffId, {
        checklistProgress: uiState.checklistProgress,
        photosCompleted: uiState.photosCompleted,
        reportProgress: uiState.reportProgress,
        ...completionFormData
      });
      
      if (success) {
        dispatch({ type: 'COMPLETE_JOB' });
        dispatch({ type: 'CLEAR_ERROR' });
      } else {
        throw new Error('Failed to complete job');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete job';
      setError(errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [jobId, staffId, uiState]);

  // Update functions for UI state
  const updateChecklistItem = useCallback((id: string, completed: boolean) => {
    dispatch({ type: 'UPDATE_CHECKLIST', payload: { id, completed } });
  }, []);

  const updatePhoto = useCallback((requirementId: string, photoUrl: string) => {
    dispatch({ type: 'UPDATE_PHOTO', payload: { requirementId, photoUrl } });
  }, []);

  const updateReportField = useCallback((fieldId: string, value: any) => {
    dispatch({ type: 'UPDATE_REPORT', payload: { fieldId, value } });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Calculate progress percentages
  const getProgress = useCallback(() => {
    const dataProgress = {
      critical: uiState.criticalDataLoaded ? 100 : (isLoading.critical ? 50 : 0),
      details: uiState.jobDetailsLoaded ? 100 : (isLoading.details ? 50 : 0),
      property: uiState.propertyContextLoaded ? 100 : (isLoading.property ? 50 : 0),
      completion: uiState.completionDataLoaded ? 100 : (isLoading.completion ? 50 : 0)
    };

    const checklistProgress = jobDetails ? 
      (Object.values(uiState.checklistProgress).filter(Boolean).length / jobDetails.checklist.length) * 100 : 0;

    const photoProgress = completionData ? 
      (Object.keys(uiState.photosCompleted).length / completionData.photoRequirements.length) * 100 : 0;

    return {
      data: dataProgress,
      checklist: checklistProgress,
      photos: photoProgress,
      overall: (dataProgress.critical + checklistProgress + photoProgress) / 3
    };
  }, [uiState, jobDetails, completionData, isLoading]);

  return {
    // Data
    criticalData,
    jobDetails,
    propertyContext,
    completionData,
    
    // UI State
    uiState,
    isLoading,
    error,
    
    // Actions
    acceptJob,
    startJob,
    completeJob,
    
    // Data Loading
    loadJobDetails,
    loadPropertyContext,
    loadCompletionData,
    
    // UI Updates
    updateChecklistItem,
    updatePhoto,
    updateReportField,
    clearError,
    
    // Progress
    getProgress,
    
    // Utility
    isJobAccepted: uiState.isAccepted,
    isJobStarted: uiState.isStarted,
    canStartJob: uiState.isAccepted && uiState.jobDetailsLoaded,
    canCompleteJob: uiState.isStarted && uiState.completionDataLoaded,
    hasAllCriticalData: uiState.criticalDataLoaded && !isLoading.critical
  };
};

export default useEnhancedMobileJob;
