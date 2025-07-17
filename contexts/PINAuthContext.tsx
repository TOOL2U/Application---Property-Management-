/**
 * PIN Authentication Context
 * Manages local PIN-based authentication for staff profiles
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localStaffService, StaffProfile, StaffSession } from '../services/localStaffService';
import { staffSyncService, getStaffSyncService } from '../services/staffSyncService';

interface PINAuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  currentProfile: StaffProfile | null;
  currentSession: StaffSession | null;
  error: string | null;

  // Staff profiles
  staffProfiles: StaffProfile[];
  
  // Authentication methods
  loginWithPIN: (profileId: string, pin: string) => Promise<boolean>;
  createPIN: (profileId: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Profile methods
  getStaffProfiles: () => Promise<void>;
  hasProfilePIN: (profileId: string) => Promise<boolean>;
  
  // Utility methods
  clearError: () => void;
  refreshSession: () => Promise<void>;
  refreshStaffProfiles: () => Promise<void>;
}

const PINAuthContext = createContext<PINAuthContextType | undefined>(undefined);

interface PINAuthProviderProps {
  children: ReactNode;
}

export function PINAuthProvider({ children }: PINAuthProviderProps) {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<StaffProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<StaffSession | null>(null);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize the service and check for existing session
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up real-time staff profile synchronization
  useEffect(() => {
    if (staffProfiles.length > 0) {
      console.log('👂 PINAuth: Setting up real-time staff sync...');

      const unsubscribe = staffSyncService.subscribeToStaffUpdates((updatedProfiles: StaffProfile[]) => {
        console.log(`📡 PINAuth: Real-time staff update - ${updatedProfiles.length} profiles`);
        setStaffProfiles(updatedProfiles);
      });

      return () => {
        console.log('🔇 PINAuth: Cleaning up staff sync listener');
        unsubscribe();
      };
    }
  }, [staffProfiles.length > 0]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 PINAuth: Initializing authentication...');

      // Initialize staff profiles
      await localStaffService.initializeStaffProfiles();
      
      // Load staff profiles
      await loadStaffProfiles();
      
      // Check for existing session
      await checkExistingSession();
      
      console.log('✅ PINAuth: Authentication initialized');
    } catch (error) {
      console.error('❌ PINAuth: Failed to initialize:', error);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffProfiles = async () => {
    try {
      console.log('🔄 PINAuth: Starting loadStaffProfiles...');

      // Get the service instance with fallback
      let syncService = staffSyncService;
      if (!syncService || !syncService.fetchStaffProfiles) {
        console.warn('⚠️ PINAuth: staffSyncService not available, using fallback getter');
        syncService = getStaffSyncService();
      }

      // Get staff profiles exclusively from staff_accounts collection in Firestore
      const syncResponse = await syncService.fetchStaffProfiles();

      console.log('📊 PINAuth: Sync response received:', {
        success: syncResponse.success,
        profileCount: syncResponse.profiles.length,
        fromCache: syncResponse.fromCache
      });

      if (syncResponse.success && syncResponse.profiles.length > 0) {
        console.log('✅ PINAuth: Setting staff profiles in state...');
        setStaffProfiles(syncResponse.profiles);
        console.log(`📋 PINAuth: Loaded ${syncResponse.profiles.length} staff accounts ${syncResponse.fromCache ? '(from cache)' : '(from Firestore)'}`);

        // Log each profile for debugging
        syncResponse.profiles.forEach((profile: StaffProfile, index: number) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.email}) - ${profile.role}`);
        });

        // Clear any existing error
        setError(null);
      } else {
        // No fallback to local profiles - rely exclusively on staff_accounts collection
        console.log('❌ PINAuth: No profiles to set, clearing staff profiles array');
        setStaffProfiles([]);
        if (syncResponse.success && syncResponse.profiles.length === 0) {
          console.log('⚠️ PINAuth: No active staff accounts found in staff_accounts collection');
          setError('No staff accounts available. Please contact your administrator.');
        } else {
          console.log('⚠️ PINAuth: Failed to sync staff accounts from Firestore');
          setError('Unable to load staff accounts. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('❌ PINAuth: Failed to load staff accounts:', error);

      // No fallback to local profiles - show appropriate error message
      setStaffProfiles([]);
      setError('Unable to connect to staff account system. Please check your connection and try again.');
    }
  };

  const checkExistingSession = async () => {
    try {
      const session = await localStaffService.getCurrentSession();
      if (session) {
        const profile = await localStaffService.getStaffProfile(session.profileId);
        if (profile) {
          setCurrentSession(session);
          setCurrentProfile(profile);
          setIsAuthenticated(true);
          console.log(`✅ PINAuth: Restored session for ${profile.name}`);
        } else {
          // Profile not found, clear invalid session
          await localStaffService.clearSession();
          console.log('⚠️ PINAuth: Profile not found for session, cleared session');
        }
      } else {
        console.log('🔍 PINAuth: No existing session found');
      }
    } catch (error) {
      console.error('❌ PINAuth: Failed to check existing session:', error);
    }
  };

  const loginWithPIN = async (profileId: string, pin: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔐 PINAuth: Attempting login for profile ${profileId}`);

      // Verify PIN
      const isValidPIN = await localStaffService.verifyStaffPIN(profileId, pin);
      if (!isValidPIN) {
        setError('Invalid PIN. Please try again.');
        return false;
      }


      // Get profile from in-memory state
      const profile = staffProfiles.find(p => p.id === profileId);
      if (!profile) {
        setError('Profile not found.');
        return false;
      }

      if (profile.isActive === false) {
        setError('This profile is not active. Please contact an administrator.');
        return false;
      }

      // Create session
      const session = await localStaffService.createSession(profileId);
      
      // Update state
      setCurrentProfile(profile);
      setCurrentSession(session);
      setIsAuthenticated(true);
      
      console.log(`✅ PINAuth: Login successful for ${profile.name}`);
      console.log(`🔑 PINAuth: Authentication state updated - isAuthenticated: true`);
      console.log(`👤 PINAuth: Current profile set:`, {
        id: profile.id,
        name: profile.name,
        role: profile.role
      });
      
      return true;
    } catch (error) {
      console.error('❌ PINAuth: Login failed:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createPIN = async (profileId: string, pin: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔐 PINAuth: Creating PIN for profile ${profileId}`);

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        setError('PIN must be exactly 4 digits.');
        return false;
      }

      // Check if profile exists in our state (not AsyncStorage)
      const profile = staffProfiles.find(p => p.id === profileId);
      if (!profile) {
        console.error(`❌ PINAuth: Profile ${profileId} not found in staff profiles`);
        setError('Profile not found.');
        return false;
      }

      console.log(`🔍 PINAuth: Found profile ${profile.name} (${profile.email})`);

      // Set PIN
      const success = await localStaffService.setStaffPIN(profileId, pin);
      if (!success) {
        setError('Failed to create PIN. Please try again.');
        return false;
      }

      console.log(`✅ PINAuth: PIN created successfully for ${profile.name}`);
      return true;
    } catch (error) {
      console.error('❌ PINAuth: Failed to create PIN:', error);
      setError('Failed to create PIN. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🚪 PINAuth: Starting comprehensive logout process...');

      // Clear all session data
      await localStaffService.clearSession();

      // Clear all cached authentication data
      console.log('🧹 PINAuth: Clearing cached authentication data...');

      // Clear staff sync cache if available
      try {
        if (staffSyncService && typeof staffSyncService.clearCache === 'function') {
          await staffSyncService.clearCache();
          console.log('🗑️ PINAuth: Staff sync cache cleared');
        }
      } catch (cacheError) {
        console.warn('⚠️ PINAuth: Could not clear staff sync cache:', cacheError);
      }

      // Clean up any active subscriptions
      try {
        if (staffSyncService && typeof staffSyncService.cleanup === 'function') {
          staffSyncService.cleanup();
          console.log('🔇 PINAuth: Staff sync subscriptions cleaned up');
        }
      } catch (cleanupError) {
        console.warn('⚠️ PINAuth: Could not cleanup subscriptions:', cleanupError);
      }

      // Reset all authentication state
      setCurrentProfile(null);
      setCurrentSession(null);
      setIsAuthenticated(false);
      setError(null);

      // Clear any other cached data
      console.log('🔄 PINAuth: Resetting authentication state...');

      console.log('✅ PINAuth: Comprehensive logout completed successfully');
    } catch (error) {
      console.error('❌ PINAuth: Logout failed:', error);

      // Even if logout fails, clear the state for security
      setCurrentProfile(null);
      setCurrentSession(null);
      setIsAuthenticated(false);
      setError('Logout completed with some issues. You have been signed out for security.');

      // Re-throw the error so the UI can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffProfiles = async (): Promise<void> => {
    await loadStaffProfiles();
  };

  const hasProfilePIN = async (profileId: string): Promise<boolean> => {
    try {
      return await localStaffService.hasPIN(profileId);
    } catch (error) {
      console.error('❌ PINAuth: Failed to check PIN existence:', error);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshSession = async (): Promise<void> => {
    if (currentSession && currentProfile) {
      try {
        // Create new session to extend expiry
        const newSession = await localStaffService.createSession(currentProfile.id);
        setCurrentSession(newSession);
        console.log('🔄 PINAuth: Session refreshed');
      } catch (error) {
        console.error('❌ PINAuth: Failed to refresh session:', error);
      }
    }
  };

  const refreshStaffProfiles = async () => {
    try {
      console.log('🔄 PINAuth: Manually refreshing staff profiles...');
      const syncResponse = await staffSyncService.refreshStaffProfiles();

      if (syncResponse.success) {
        setStaffProfiles(syncResponse.profiles);
        console.log(`✅ PINAuth: Refreshed ${syncResponse.profiles.length} staff profiles`);
      } else {
        console.error('❌ PINAuth: Failed to refresh staff profiles:', syncResponse.error);
        setError('Failed to refresh staff profiles');
      }
    } catch (error) {
      console.error('❌ PINAuth: Error refreshing staff profiles:', error);
      setError('Failed to refresh staff profiles');
    }
  };

  const value: PINAuthContextType = {
    // Authentication state
    isAuthenticated,
    isLoading,
    currentProfile,
    currentSession,
    error,

    // Staff profiles
    staffProfiles,
    
    // Authentication methods
    loginWithPIN,
    createPIN,
    logout,
    
    // Profile methods
    getStaffProfiles,
    hasProfilePIN,
    
    // Utility methods
    clearError,
    refreshSession,
    refreshStaffProfiles,
  };

  return (
    <PINAuthContext.Provider value={value}>
      {children}
    </PINAuthContext.Provider>
  );
}

export function usePINAuth(): PINAuthContextType {
  const context = useContext(PINAuthContext);
  if (context === undefined) {
    throw new Error('usePINAuth must be used within a PINAuthProvider');
  }
  return context;
}

export default PINAuthContext;
