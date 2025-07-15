import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, StaffAccount, AuthSession } from '../services/authService';
import { AppState, AppStateStatus } from 'react-native';

// Rename User to StaffUser for clarity
interface StaffUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: string;
  department?: string;
  isActive: boolean;
  lastLogin?: any;
}

interface AuthContextType {
  user: StaffUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  userRole: string | null;
  refreshSession: () => Promise<void>;
  isSessionValid: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    loadStoredAuth();

    // Listen for app state changes to validate session
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        refreshSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Auto-refresh session every 30 minutes when app is active
    if (user && isSessionValid) {
      const interval = setInterval(() => {
        refreshSession();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [user, isSessionValid]);

  const loadStoredAuth = async () => {
    try {
      console.log('🔍 Loading stored authentication...');
      setIsLoading(true);

      // Use the enhanced authService to validate session
      const validatedUser = await authService.validateSession();

      if (validatedUser) {
        console.log('✅ Valid session found, user authenticated:', validatedUser.email);
        console.log('👤 User role:', validatedUser.role);

        const staffUser: StaffUser = {
          id: validatedUser.id,
          email: validatedUser.email,
          name: validatedUser.name,
          phone: validatedUser.phone,
          address: validatedUser.address,
          role: validatedUser.role,
          department: validatedUser.department,
          isActive: validatedUser.isActive,
          lastLogin: validatedUser.lastLogin
        };

        setUser(staffUser);
        setUserRole(validatedUser.role);
        setIsSessionValid(true);
      } else {
        console.log('ℹ️ No valid session found');
        setIsSessionValid(false);
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await Promise.all([
        Storage.remove(STORAGE_KEY),
        Storage.remove(SESSION_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 AuthContext: Attempting authentication for:', email);

      // Use enhanced authService for authentication
      const authResult = await authService.authenticateUser(email, password);

      if (!authResult.success) {
        console.log('❌ AuthContext: Authentication failed:', authResult.error);
        setIsSessionValid(false);
        throw new Error(authResult.error || 'Authentication failed');
      }

      if (!authResult.user) {
        console.log('❌ AuthContext: No user data returned');
        setIsSessionValid(false);
        throw new Error('Authentication failed - no user data');
      }

      // Create user object for context
      const authenticatedUser: StaffUser = {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        phone: authResult.user.phone,
        address: authResult.user.address,
        role: authResult.user.role,
        department: authResult.user.department,
        isActive: authResult.user.isActive,
        lastLogin: authResult.user.lastLogin
      };

      setUser(authenticatedUser);
      setUserRole(authenticatedUser.role);
      setIsSessionValid(true);
      console.log('✅ AuthContext: Authentication successful for:', email);
      console.log('👤 User role:', authenticatedUser.role);

    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage = 'Authentication failed';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'Access denied. Please contact your administrator.';
        } else if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('👋 Signing out user');

      // Use authService to properly clear session
      await authService.signOut();

      // Clear all auth state immediately
      setUser(null);
      setUserRole(null);
      setError(null);
      setIsSessionValid(false);

      console.log('✅ Sign out completed - all auth state cleared');
    } catch (error) {
      console.error('❌ Sign out error:', error);

      // Even if there's an error, clear the user state
      setUser(null);
      setUserRole(null);
      setIsSessionValid(false);
      setError('Sign out completed with warnings');
      
      console.log('⚠️ Sign out completed with warnings - auth state cleared anyway');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...');

      const validatedUser = await authService.validateSession();

      if (validatedUser) {
        const staffUser: StaffUser = {
          id: validatedUser.id,
          email: validatedUser.email,
          name: validatedUser.name,
          phone: validatedUser.phone,
          address: validatedUser.address,
          role: validatedUser.role,
          department: validatedUser.department,
          isActive: validatedUser.isActive,
          lastLogin: validatedUser.lastLogin
        };

        setUser(staffUser);
        setUserRole(validatedUser.role);
        setIsSessionValid(true);
        console.log('✅ Session refreshed successfully');
      } else {
        console.log('❌ Session validation failed, signing out');
        setUser(null);
        setUserRole(null);
        setIsSessionValid(false);
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      setUser(null);
      setUserRole(null);
      setIsSessionValid(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    error,
    clearError,
    userRole,
    refreshSession,
    isSessionValid,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
