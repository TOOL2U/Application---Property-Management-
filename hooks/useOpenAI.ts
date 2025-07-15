import { useState, useCallback } from 'react';
import { openaiService, OpenAIResponse, PropertyData, MaintenanceIssue, GuestMessage } from '../services/openaiService';

interface UseOpenAIState {
  isLoading: boolean;
  error: string | null;
  lastResponse: string | null;
}

interface UseOpenAIActions {
  generatePropertyDescription: (property: PropertyData) => Promise<string | null>;
  generateMaintenanceSuggestions: (issue: MaintenanceIssue) => Promise<string | null>;
  generateGuestResponse: (message: GuestMessage) => Promise<string | null>;
  generatePricingOptimization: (data: {
    propertyName: string;
    currentRate: number;
    occupancyRate: number;
    seasonality: 'peak' | 'shoulder' | 'off-season';
    localEvents?: string[];
    competitorRates?: number[];
  }) => Promise<string | null>;
  generateTaskSuggestions: (propertyType: string, season: string, lastMaintenanceDate?: string) => Promise<string | null>;
  clearError: () => void;
  isConfigured: () => boolean;
}

export function useOpenAI(): UseOpenAIState & UseOpenAIActions {
  const [state, setState] = useState<UseOpenAIState>({
    isLoading: false,
    error: null,
    lastResponse: null,
  });

  const handleResponse = useCallback((response: OpenAIResponse): string | null => {
    if (response.success && response.data) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        lastResponse: response.data!,
      }));
      return response.data;
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error || 'Unknown error occurred',
        lastResponse: null,
      }));
      return null;
    }
  }, []);

  const generatePropertyDescription = useCallback(async (property: PropertyData): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generatePropertyDescription(property);
      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate property description',
      }));
      return null;
    }
  }, [handleResponse]);

  const generateMaintenanceSuggestions = useCallback(async (issue: MaintenanceIssue): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateMaintenanceSuggestions(issue);
      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate maintenance suggestions',
      }));
      return null;
    }
  }, [handleResponse]);

  const generateGuestResponse = useCallback(async (message: GuestMessage): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateGuestResponse(message);
      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate guest response',
      }));
      return null;
    }
  }, [handleResponse]);

  const generatePricingOptimization = useCallback(async (data: {
    propertyName: string;
    currentRate: number;
    occupancyRate: number;
    seasonality: 'peak' | 'shoulder' | 'off-season';
    localEvents?: string[];
    competitorRates?: number[];
  }): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generatePricingOptimization(data);
      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate pricing optimization',
      }));
      return null;
    }
  }, [handleResponse]);

  const generateTaskSuggestions = useCallback(async (
    propertyType: string, 
    season: string, 
    lastMaintenanceDate?: string
  ): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await openaiService.generateTaskSuggestions(propertyType, season, lastMaintenanceDate);
      return handleResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate task suggestions',
      }));
      return null;
    }
  }, [handleResponse]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const isConfigured = useCallback(() => {
    return openaiService.isConfigured();
  }, []);

  return {
    ...state,
    generatePropertyDescription,
    generateMaintenanceSuggestions,
    generateGuestResponse,
    generatePricingOptimization,
    generateTaskSuggestions,
    clearError,
    isConfigured,
  };
}

export default useOpenAI;
