/**
 * useFieldOpsAI Hook
 * React hook for Field Operations AI assistant functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { fieldOpsAIService, FieldOpsContext, FieldOpsResponse, AIChecklistItem } from '@/services/fieldOpsAIService';
import { aiLoggingService } from '@/services/aiLoggingService';
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
  checklist: AIChecklistItem[];
  showChecklist: boolean;
  conversationHistory: Array<{
    question: string;
    response: FieldOpsResponse;
    timestamp: Date;
    messageId?: string;
  }>;
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
}

interface UseFieldOpsAIActions {
  loadJobGuidance: (job: Job, generateChecklist?: boolean) => Promise<FieldOpsResponse | null>;
  askQuestion: (question: string, job: Job) => Promise<FieldOpsResponse | null>;
  getPhotoGuidance: (job: Job) => Promise<FieldOpsResponse | null>;
  getSafetyRecommendations: (job: Job) => Promise<FieldOpsResponse | null>;
  getTimeEstimation: (job: Job) => Promise<FieldOpsResponse | null>;
  generateChecklist: (job: Job) => Promise<void>;
  updateChecklist: (checklist: AIChecklistItem[]) => void;
  toggleChecklist: () => void;
  rateResponse: (messageId: string, useful: boolean) => Promise<void>;
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
    checklist: [],
    showChecklist: false,
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
  const loadJobGuidance = useCallback(async (job: Job, generateChecklist: boolean = false): Promise<FieldOpsResponse | null> => {
    if (!currentProfile) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context: FieldOpsContext = {
        job,
        staffRole: currentProfile.role || 'staff',
        staffId: currentProfile.id,
        location: state.currentLocation || undefined,
      };

      const response = await fieldOpsAIService.getJobCompletionGuidance(context, generateChecklist);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          jobGuidance: response,
          lastResponse: response,
          conversationHistory: [
            ...prev.conversationHistory,
            {
              question: `Job completion guidance for ${job.title}`,
              response,
              timestamp: new Date(),
              messageId: `guidance-${Date.now()}`,
            }
          ],
          // Update checklist if generated
          checklist: response.checklist || prev.checklist,
          showChecklist: generateChecklist || prev.showChecklist,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load job guidance',
          isLoading: false,
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load job guidance';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return null;
    }
  }, [currentProfile, state.currentLocation]);  // Ask a specific question about the job
  const askQuestion = useCallback(async (question: string, job: Job): Promise<FieldOpsResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context = buildContext(job);
      const response = await fieldOpsAIService.askJobQuestion(question, context);
      
      // Auto-log AI interaction
      if (response.success && currentProfile?.id) {
        try {
          await aiLoggingService.logAIInteraction({
            jobId: job.id,
            staffId: currentProfile.id,
            question,
            response: response.data || 'AI response received',
            aiFunction: 'chat',
          });
        } catch (logError) {
          console.error('❌ Failed to log AI interaction:', logError);
        }
      }
      
      // Add to conversation history
      if (response.success) {
        const messageId = `msg_${Date.now()}`;
        setState(prev => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            {
              question,
              response,
              timestamp: new Date(),
              messageId,
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

  // Generate detailed checklist for a job
  const generateChecklist = useCallback(async (job: Job) => {
    if (!currentProfile?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context: FieldOpsContext = {
        job,
        staffRole: currentProfile.role || 'staff',
        staffId: currentProfile.id,
        location: state.currentLocation || undefined,
      };

      const checklist = await fieldOpsAIService.generateDetailedChecklist(context);
      
      setState(prev => ({
        ...prev,
        checklist,
        showChecklist: true,
        isLoading: false,
      }));

    } catch (error) {
      console.error('❌ Error generating checklist:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate checklist',
        isLoading: false,
      }));
    }
  }, [currentProfile, state.currentLocation]);

  // Update checklist state
  const updateChecklist = useCallback((checklist: AIChecklistItem[]) => {
    setState(prev => ({ ...prev, checklist }));
  }, []);

  // Toggle checklist visibility
  const toggleChecklist = useCallback(() => {
    setState(prev => ({ ...prev, showChecklist: !prev.showChecklist }));
  }, []);

  // Rate AI response usefulness
  const rateResponse = useCallback(async (messageId: string, useful: boolean) => {
    try {
      await aiLoggingService.rateAIResponse(messageId, useful);
      
      // Update conversation history to reflect rating
      setState(prev => ({
        ...prev,
        conversationHistory: prev.conversationHistory.map(item =>
          item.messageId === messageId 
            ? { ...item, response: { ...item.response, useful } }
            : item
        ),
      }));
    } catch (error) {
      console.error('❌ Error rating response:', error);
    }
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
    generateChecklist,
    updateChecklist,
    toggleChecklist,
    rateResponse,
    clearError,
    clearHistory,
    isConfigured,
    refreshLocation,
  };
}

export default useFieldOpsAI;
