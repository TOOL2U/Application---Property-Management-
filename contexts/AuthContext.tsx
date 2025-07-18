import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, StaffAccount } from '../services/authService';
import { sharedAuthService } from '../services/sharedAuthService';
import { AppState, AppStateStatus } from 'react-native';
import { Storage } from '../utils/storage';
import {
  StaffProfile,
  clearSavedStaffData
} from '../services/staffProfileService';
import { auth } from '../lib/firebase';

// Storage keys
const STORAGE_KEY = '@staff_auth_user';
const SESSION_KEY = '@staff_auth_session';

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
  selectedStaff: StaffProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInShared: () => Promise<void>;
  selectStaffProfile: (staffProfile: StaffProfile) => Promise<void>;
  setUserFromStaffAccount: (staffAccount: StaffAccount) => Promise<void>;
  signOut: () => Promise<void>;
  signOutToProfileSelection: () => Promise<void>;
  isAuthenticated: boolean;
  isStaffSelected: boolean;
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
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    loadStoredAuth().catch(error => {
      console.error('❌ Error loading stored auth:', error);
      setIsLoading(false);
    });

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
      console.log('👋 AuthContext: Starting complete sign out process...');
      console.log('🔍 AuthContext: Current user before sign out:', user?.email);

      // Clear individual staff session first
      await authService.signOut();
      console.log('✅ AuthService: Individual session cleared');

      // Clear shared auth service data (includes Firebase signOut)
      await sharedAuthService.signOutShared();
      console.log('✅ SharedAuthService: Firebase auth and shared data cleared');

      // Clear all auth state immediately
      setUser(null);
      setSelectedStaff(null);
      setUserRole(null);
      setError(null);
      setIsSessionValid(false);

      // Clear saved staff data
      await clearSavedStaffData();
      console.log('✅ AuthContext: Staff profile data cleared');

      // Clear any additional storage items
      await Storage.removeMultiple([
        STORAGE_KEY,
        SESSION_KEY,
        '@staff_auth_token_secure',
        '@staff_auth_user_id',
        '@selected_staff_id',
        '@remember_staff_id'
      ]);
      console.log('✅ AuthContext: All storage items cleared');

      console.log('✅ AuthContext: Complete sign out finished - all auth state cleared');
      console.log('🔍 AuthContext: Auth state after sign out:', {
        user: null,
        userRole: null,
        isSessionValid: false,
        isAuthenticated: false,
        isStaffSelected: false
      });

    } catch (error) {
      console.error('❌ AuthContext: Sign out error:', error);

      // Even if there's an error, clear the user state to ensure logout
      setUser(null);
      setSelectedStaff(null);
      setUserRole(null);
      setIsSessionValid(false);

      // Set a user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Sign out completed with warnings: ${errorMessage}`);

      console.log('⚠️ AuthContext: Sign out completed with warnings - auth state cleared anyway');

      // Re-throw error so UI can handle it appropriately
      throw new Error('Logout completed but some cleanup operations failed');
    } finally {
      setIsLoading(false);
      console.log('🏁 AuthContext: Sign out process finished');
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

  /**
   * Sign in with shared Firebase Auth credentials
   */
  const signInShared = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 AuthContext: Attempting shared Firebase Auth login...');

      // Check if auth is ready before using it
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      // Additional check for auth readiness
      if (typeof auth.onAuthStateChanged !== 'function') {
        throw new Error('Firebase Auth is not ready');
      }

      // Note: Shared credentials authentication is deprecated
      // The app now uses PIN authentication with staff_accounts collection exclusively
      throw new Error('Shared credentials authentication is deprecated. Please use PIN authentication.');
    } catch (error) {
      console.error('❌ AuthContext: Shared authentication error:', error);
      setError(error instanceof Error ? error.message : 'Shared authentication failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select staff profile after PIN validation
   */
  const selectStaffProfile = async (staffProfile: StaffProfile): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('👤 AuthContext: Selecting staff profile:', staffProfile.name);

      setSelectedStaff(staffProfile);
      setUser({
        id: staffProfile.id,
        email: staffProfile.email,
        name: staffProfile.name,
        role: staffProfile.role,
        department: staffProfile.department,
        isActive: staffProfile.isActive,
        lastLogin: staffProfile.lastLogin
      });
      setUserRole(staffProfile.role);

      // Store selected staff data
      await Storage.setItem(STORAGE_KEY, JSON.stringify({
        id: staffProfile.id,
        email: staffProfile.email,
        name: staffProfile.name,
        role: staffProfile.role,
        department: staffProfile.department,
        isActive: staffProfile.isActive,
        lastLogin: staffProfile.lastLogin
      }));

      console.log('✅ Staff profile selected successfully:', staffProfile.name);
    } catch (error) {
      console.error('❌ Staff profile selection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to select staff profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set user from staff account after PIN verification
   */
  const setUserFromStaffAccount = async (staffAccount: StaffAccount) => {
    try {
      console.log('👤 AuthContext: Setting user from staff account:', staffAccount.name);

      const staffUser: StaffUser = {
        id: staffAccount.id,
        email: staffAccount.email,
        name: staffAccount.name,
        phone: staffAccount.phone,
        address: staffAccount.address,
        role: staffAccount.role,
        department: staffAccount.department,
        isActive: staffAccount.isActive,
        lastLogin: staffAccount.lastLogin
      };

      setUser(staffUser);
      setUserRole(staffUser.role);
      setIsSessionValid(true);

      // Store user data for session persistence
      await Storage.setItem(STORAGE_KEY, JSON.stringify(staffUser));

      console.log('✅ AuthContext: User set successfully from staff account');
      console.log('👤 User role:', staffUser.role);
    } catch (error) {
      console.error('❌ AuthContext: Failed to set user from staff account:', error);
      throw error;
    }
  };

  /**
   * Sign out to profile selection (keeps shared Firebase Auth active)
   * This allows switching between staff profiles without full logout
   */
  const signOutToProfileSelection = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 AuthContext: Signing out to profile selection...');
      console.log('🔍 AuthContext: Current user before profile switch:', user?.email);

      // Clear individual staff session but keep shared Firebase Auth
      await authService.signOut();
      console.log('✅ AuthService: Individual session cleared');

      // Clear selected staff data but keep shared auth active
      await sharedAuthService.clearSelectedStaff();
      console.log('✅ SharedAuthService: Selected staff cleared');

      // Clear user state but keep Firebase Auth session
      setUser(null);
      setSelectedStaff(null);
      setUserRole(null);
      setError(null);
      setIsSessionValid(false);

      // Clear specific storage items but keep Firebase auth
      await Storage.removeMultiple([
        STORAGE_KEY,
        SESSION_KEY,
        '@selected_staff_id'
      ]);
      console.log('✅ Storage: Profile-specific items cleared');

      console.log('✅ AuthContext: Signed out to profile selection - shared auth preserved');

    } catch (error) {
      console.error('❌ AuthContext: Sign out to profile selection error:', error);

      // Even if there's an error, clear the user state
      setUser(null);
      setSelectedStaff(null);
      setUserRole(null);
      setIsSessionValid(false);

      // Set a user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Profile switch completed with warnings: ${errorMessage}`);

      console.log('⚠️ AuthContext: Profile switch completed with warnings - user state cleared anyway');

      // Re-throw error so UI can handle it appropriately
      throw new Error('Profile switch completed but some cleanup operations failed');
    } finally {
      setIsLoading(false);
      console.log('🏁 AuthContext: Sign out to profile selection finished');
    }
  };

  const value: AuthContextType = {
    user,
    selectedStaff,
    isLoading,
    signIn,
    signInShared,
    selectStaffProfile,
    setUserFromStaffAccount,
    signOut,
    signOutToProfileSelection,
    isAuthenticated: !!user,
    isStaffSelected: !!selectedStaff,
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
