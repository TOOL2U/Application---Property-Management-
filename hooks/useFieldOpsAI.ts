/**
 * useFieldOpsAI Hook
 * React hook for Field Operations AI assistant functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { fieldOpsAIService, FieldOpsContext, FieldOpsResponse } from '@/services/fieldOpsAIService';
import { Job } from '@/types/job';
import { usePINAuth } from '@/contexts/PINAuthContext';
import * as Location from 'expo-location';

interface UseFieldOpsAIState {
  isLoading: boolean;
  error: string | null;
  lastResponse: FieldOpsResponse | null;
  jobGuidance: FieldOpsResponse | null;
  photoGuidance: FieldOpsResponse | null;
  safetyRecommendations: FieldOpsResponse | null;
  timeEstimation: FieldOpsResponse | null;
  conversationHistory: Array<{
    question: string;
    response: FieldOpsResponse;
    timestamp: Date;
  }>;
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
}

interface UseFieldOpsAIActions {
  loadJobGuidance: (job: Job) => Promise<FieldOpsResponse | null>;
  askQuestion: (question: string, job: Job) => Promise<FieldOpsResponse | null>;
  getPhotoGuidance: (job: Job) => Promise<FieldOpsResponse | null>;
  getSafetyRecommendations: (job: Job) => Promise<FieldOpsResponse | null>;
  getTimeEstimation: (job: Job) => Promise<FieldOpsResponse | null>;
  clearError: () => void;
  clearHistory: () => void;
  isConfigured: () => boolean;
  refreshLocation: () => Promise<void>;
}

export function useFieldOpsAI(): UseFieldOpsAIState & UseFieldOpsAIActions {
  const { currentProfile } = usePINAuth();
  
  const [state, setState] = useState<UseFieldOpsAIState>({
    isLoading: false,
    error: null,
    lastResponse: null,
    jobGuidance: null,
    photoGuidance: null,
    safetyRecommendations: null,
    timeEstimation: null,
    conversationHistory: [],
    currentLocation: null,
  });

  // Get current location for context
  const refreshLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setState(prev => ({
        ...prev,
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0] ? `${address[0].street || ''} ${address[0].city || ''}`.trim() : undefined,
        },
      }));
    } catch (error) {
      console.log('Failed to get location:', error);
    }
  }, []);

  // Get current time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Build context object for AI requests
  const buildContext = useCallback((job: Job): FieldOpsContext => {
    return {
      job,
      staffRole: currentProfile?.role || 'staff',
      location: state.currentLocation || undefined,
      timeOfDay: getTimeOfDay(),
      // Could add weather data here in the future
    };
  }, [currentProfile?.role, state.currentLocation]);

  // Handle AI responses
  const handleResponse = useCallback((response: FieldOpsResponse): FieldOpsResponse | null => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      lastResponse: response,
      error: response.success ? null : response.error || 'Unknown error occurred',
    }));

    return response.success ? response : null;
  }, []);

  // Load comprehensive job guidance
  const loadJobGuidance = useCallback(async (job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.getJobCompletionGuidance(context);
      
      setState(prev => ({
        ...prev,
        jobGuidance: response.success ? response : null,
      }));

      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load job guidance',
      }));
      return null;
    }
  }, [buildContext, handleResponse]);

  // Ask a specific question about the job
  const askQuestion = useCallback(async (question: string, job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.askJobQuestion(question, context);
      
      // Add to conversation history
      if (response.success) {
        setState(prev => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            {
              question,
              response,
              timestamp: new Date(),
            },
          ],
        }));
      }

      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process question',
      }));
      return null;
    }
  }, [buildContext, handleResponse]);

  // Get photo documentation guidance
  const getPhotoGuidance = useCallback(async (job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.getPhotoGuidance(context);
      
      setState(prev => ({
        ...prev,
        photoGuidance: response.success ? response : null,
      }));

      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get photo guidance',
      }));
      return null;
    }
  }, [buildContext, handleResponse]);

  // Get safety recommendations
  const getSafetyRecommendations = useCallback(async (job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.getSafetyRecommendations(context);
      
      setState(prev => ({
        ...prev,
        safetyRecommendations: response.success ? response : null,
      }));

      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get safety recommendations',
      }));
      return null;
    }
  }, [buildContext, handleResponse]);

  // Get time estimation
  const getTimeEstimation = useCallback(async (job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.getTimeEstimation(context);
      
      setState(prev => ({
        ...prev,
        timeEstimation: response.success ? response : null,
      }));

      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get time estimation',
      }));
      return null;
    }
  }, [buildContext, handleResponse]);

  // Utility functions
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, conversationHistory: [] }));
  }, []);

  const isConfigured = useCallback(() => {
    return fieldOpsAIService.isConfigured();
  }, []);

  // Auto-refresh location when hook mounts
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    ...state,
    loadJobGuidance,
    askQuestion,
    getPhotoGuidance,
    getSafetyRecommendations,
    getTimeEstimation,
    clearError,
    clearHistory,
    isConfigured,
    refreshLocation,
  };
}

export default useFieldOpsAI;
