import { useState, useEffect, useCallback } from 'react';
import { apiService, AuthResponse, LoginCredentials } from '../services/apiService';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthResponse['user'] | null;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<boolean>;
}

export function usePINAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const isAuth = apiService.isAuthenticated();
      
      if (isAuth) {
        // Try to refresh token to verify it's still valid
        const refreshSuccess = await apiService.refreshToken();
        if (refreshSuccess) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }));
        } else {
          // Token refresh failed, user needs to login again
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status',
      }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          user: response.data!.user,
          error: null,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: response.error || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const success = await apiService.refreshToken();
      if (!success) {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: 'Failed to refresh authentication',
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    clearError,
    refreshAuth,
  };
}

export default usePINAuth;
