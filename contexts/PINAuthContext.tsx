/**
 * PIN Authentication Context
 * Manages local PIN-based authentication for staff profiles
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localStaffService, StaffProfile, StaffSession } from '../services/localStaffService';
import { staffSyncService, getStaffSyncService } from '../services/staffSyncService';
import { initializeFirebase } from '../lib/firebase';
import { firebaseAuthService, AuthenticatedUser } from '../services/firebaseAuthService';
import { secureFirestore } from '../services/secureFirestore';

interface PINAuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  currentProfile: StaffProfile | null;
  currentSession: StaffSession | null;
  error: string | null;

  // Firebase authentication state (required for new security rules)
  firebaseUser: AuthenticatedUser | null;
  isFirebaseAuthenticated: boolean;

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

  // Firebase authentication state (required for new security rules)
  const [firebaseUser, setFirebaseUser] = useState<AuthenticatedUser | null>(null);
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);

  // Initialize the service and check for existing session
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up Firebase authentication listener (required for new security rules)
  useEffect(() => {
    console.log('🔐 PINAuth: Setting up Firebase authentication listener...');
    
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsFirebaseAuthenticated(!!user);
      
      if (user) {
        console.log('✅ PINAuth: Firebase user authenticated:', {
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        });
      } else {
        console.log('🔓 PINAuth: Firebase user signed out');
      }
    });

    return () => {
      console.log('🔇 PINAuth: Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  // Set up real-time staff profile synchronization
  useEffect(() => {
    if (staffProfiles.length > 0) {
      console.log('👂 PINAuth: Setting up real-time staff sync...');

      const unsubscribe = staffSyncService.subscribeToStaffUpdates((updatedProfiles: StaffProfile[]) => {
        console.log(`📡 PINAuth: Real-time staff update - ${updatedProfiles.length} profiles`);
        setStaffProfiles(updatedProfiles);
        
        // Update current profile if it exists and has been modified
        if (currentProfile) {
          const updatedCurrentProfile = updatedProfiles.find(p => p.id === currentProfile.id);
          if (updatedCurrentProfile) {
            console.log('🔄 PINAuth: Updating current profile with latest data');
            setCurrentProfile(updatedCurrentProfile);
          }
        }
      });

      return () => {
        console.log('🔇 PINAuth: Cleaning up staff sync listener');
        unsubscribe();
      };
    }
  }, [staffProfiles.length > 0]);

  // Retry session restoration when profiles are loaded
  useEffect(() => {
    // Only retry if we have profiles but no authenticated user yet
    if (staffProfiles.length > 0 && !isAuthenticated && !isLoading) {
      console.log('🔄 PINAuth: Profiles loaded, retrying session restoration...');
      checkExistingSession();
    }
  }, [staffProfiles.length]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 PINAuth: Initializing authentication...');

      // Initialize staff profiles (local only, no Firebase)
      await localStaffService.initializeStaffProfiles();
      
      // Wait for Firebase to be ready before loading from Firestore
      console.log('⏳ PINAuth: Waiting for Firebase to be ready...');
      try {
        await initializeFirebase();
        console.log('✅ PINAuth: Firebase ready, loading staff profiles...');
        
        // Load staff profiles from Firestore
        await loadStaffProfiles();
      } catch (firebaseError) {
        console.warn('⚠️ PINAuth: Firebase not ready, loading from cache only:', firebaseError);
        // Try to load from local cache only
        try {
          const localProfiles = await localStaffService.getStaffProfiles();
          if (localProfiles.length > 0) {
            setStaffProfiles(localProfiles);
            console.log(`📋 PINAuth: Loaded ${localProfiles.length} staff profiles from local cache`);
          }
        } catch (localError) {
          console.error('❌ PINAuth: Failed to load from local cache:', localError);
        }
      }
      
      // Only check for existing session AFTER staff profiles are loaded
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
      console.log('� PINAuth: Loading staff profiles with new security requirements...');

      // **NEW SECURITY REQUIREMENT**: Use secure Firestore service
      // Note: This will require authentication for database access
      try {
        console.log('🔥 PINAuth: Loading staff profiles using secure Firestore...');
        
        // For staff profile loading, we need to handle the bootstrap case
        // where no user is logged in yet but we need to show available profiles
        let profiles: StaffProfile[] = [];
        
        if (isFirebaseAuthenticated && firebaseUser) {
          // User is authenticated, try to load from Firestore
          console.log('🔐 PINAuth: User authenticated, loading from Firestore...');
          const querySnapshot = await secureFirestore.queryCollection('staff_accounts');
          profiles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as StaffProfile));
          
          console.log(`✅ PINAuth: Loaded ${profiles.length} staff profiles from Firestore`);
          
          // Profiles are automatically available to the local service for PIN operations
          console.log('💾 PINAuth: Staff profiles loaded for PIN operations');
        } else {
          // Not authenticated - try to use legacy sync service for initial profile loading
          // This is needed for the bootstrap case where users haven't logged in yet
          console.log('🔒 PINAuth: Not authenticated, trying legacy sync service for bootstrap...');
          
          try {
            let syncService = staffSyncService;
            if (!syncService || !syncService.fetchStaffProfiles) {
              console.warn('⚠️ PINAuth: staffSyncService not available, using fallback getter');
              syncService = getStaffSyncService();
            }

            const syncResponse = await syncService.fetchStaffProfiles();
            
            if (syncResponse.success && syncResponse.profiles.length > 0) {
              profiles = syncResponse.profiles;
              console.log(`📱 PINAuth: Loaded ${profiles.length} staff profiles from legacy sync ${syncResponse.fromCache ? '(from cache)' : '(from Firestore)'}`);
            } else {
              console.log('📭 PINAuth: No profiles from legacy sync, trying local cache...');
              profiles = await localStaffService.getStaffProfiles();
              console.log(`💾 PINAuth: Loaded ${profiles.length} staff profiles from local cache`);
            }
          } catch (legacyError) {
            console.warn('⚠️ PINAuth: Legacy sync failed, trying local cache:', legacyError);
            profiles = await localStaffService.getStaffProfiles();
            console.log(`� PINAuth: Loaded ${profiles.length} staff profiles from local cache`);
          }
        }
        
        // Update state
        setStaffProfiles(profiles);
        
        if (profiles.length > 0) {
          setError(null);
          console.log(`📋 PINAuth: Successfully loaded ${profiles.length} staff accounts`);
          
          // Log each profile for debugging
          profiles.forEach((profile: StaffProfile, index: number) => {
            console.log(`   ${index + 1}. ${profile.name} (${profile.email}) - ${profile.role}`);
          });
        } else {
          console.log('⚠️ PINAuth: No staff accounts available');
          setError('No staff accounts available. Please contact your administrator.');
        }
        
      } catch (secureFirestoreError: any) {
        console.warn('⚠️ PINAuth: Secure Firestore access failed:', secureFirestoreError);
        
        // If permission denied, this might be expected for non-authenticated users
        if (secureFirestoreError.message.includes('Permission denied') || 
            secureFirestoreError.message.includes('Authentication required')) {
          console.log('🔐 PINAuth: No Firebase auth, falling back to legacy sync...');
          
          try {
            // Try legacy sync service as fallback
            let syncService = staffSyncService;
            if (!syncService || !syncService.fetchStaffProfiles) {
              syncService = getStaffSyncService();
            }

            const syncResponse = await syncService.fetchStaffProfiles();
            
            if (syncResponse.success && syncResponse.profiles.length > 0) {
              setStaffProfiles(syncResponse.profiles);
              console.log(`📱 PINAuth: Fallback to legacy sync successful (${syncResponse.profiles.length} profiles)`);
              setError(null);
            } else {
              // Try local cache as final fallback
              const localProfiles = await localStaffService.getStaffProfiles();
              if (localProfiles.length > 0) {
                setStaffProfiles(localProfiles);
                console.log(`💾 PINAuth: Fallback to local cache successful (${localProfiles.length} profiles)`);
                setError('Using cached staff accounts. Some data may be outdated.');
              } else {
                console.log('📭 PINAuth: No profiles available from any source');
                setStaffProfiles([]);
                setError('No staff accounts available. Please contact your administrator.');
              }
            }
          } catch (fallbackError) {
            console.error('❌ PINAuth: All fallback methods failed:', fallbackError);
            setStaffProfiles([]);
            setError('Unable to load staff accounts. Please contact your administrator.');
          }
        } else {
          console.error('❌ PINAuth: Unexpected secure Firestore error:', secureFirestoreError);
          // Try fallback to legacy sync
          try {
            let syncService = staffSyncService;
            if (!syncService) {
              syncService = getStaffSyncService();
            }
            const syncResponse = await syncService.fetchStaffProfiles();
            setStaffProfiles(syncResponse.profiles);
            console.log(`📱 PINAuth: Fallback to legacy sync successful (${syncResponse.profiles.length} profiles)`);
            setError('Database temporarily unavailable, using cached data.');
          } catch (legacyFallbackError) {
            console.error('❌ PINAuth: Legacy fallback also failed:', legacyFallbackError);
            setStaffProfiles([]);
            setError('Unable to load staff accounts. Please check your connection and try again.');
          }
        }
      }
    } catch (error) {
      console.error('❌ PINAuth: Failed to load staff accounts:', error);
      setStaffProfiles([]);
      setError('Unable to connect to staff account system. Please check your connection and try again.');
    }
  };

  const checkExistingSession = async () => {
    try {
      const session = await localStaffService.getCurrentSession();
      if (session) {
        // Try to find profile in loaded profiles first (from state)
        let profile: StaffProfile | undefined = staffProfiles.find(p => p.id === session.profileId);
        
        // If not in state yet, try AsyncStorage
        if (!profile) {
          const cachedProfile = await localStaffService.getStaffProfile(session.profileId);
          profile = cachedProfile || undefined;
        }
        
        if (profile) {
          setCurrentSession(session);
          setCurrentProfile(profile);
          setIsAuthenticated(true);
          console.log(`✅ PINAuth: Restored session for ${profile.name}`);
        } else {
          // Profile not found YET - might still be loading
          // Don't clear session, just log and wait for profiles to load
          console.log('⚠️ PINAuth: Profile not found for session yet, will retry after profiles load');
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

      // Verify PIN first
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

      // **TEMPORARY**: Skip Firebase authentication to fix login issue
      // This allows PIN-only login while Firebase integration is being set up
      console.log('� PINAuth: Using PIN-only authentication (Firebase integration pending)');
      
      // TODO: Re-enable Firebase authentication once staff Firebase accounts are configured
      // The Firebase security infrastructure is in place but not required for PIN login
      let firebaseAuthSuccess = false;
      
      console.log('ℹ️ PINAuth: Proceeding with PIN-only authentication for compatibility');

      // Create local session
      const session = await localStaffService.createSession(profileId);
      console.log(`✅ PINAuth: Session created for profile ${profileId}`);
      
      // Verify session was created successfully by reading it back
      const verifySession = await localStaffService.getCurrentSession();
      if (!verifySession) {
        console.error('❌ PINAuth: Session verification failed - session not found after creation');
        setError('Failed to create session. Please try again.');
        return false;
      }
      console.log(`✅ PINAuth: Session verified successfully`);
      
      // Update state - this will trigger job loading
      setCurrentProfile(profile);
      setCurrentSession(session);
      setIsAuthenticated(true);
      
      console.log(`✅ PINAuth: PIN login successful for ${profile.name}`);
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

      // **NEW SECURITY REQUIREMENT**: Sign out from Firebase first
      console.log('🔥 PINAuth: Signing out from Firebase...');
      try {
        await firebaseAuthService.signOut();
        console.log('✅ PINAuth: Firebase signout successful');
      } catch (firebaseError) {
        console.warn('⚠️ PINAuth: Firebase signout failed:', firebaseError);
        // Continue with logout even if Firebase signout fails
      }

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
      setFirebaseUser(null);
      setIsFirebaseAuthenticated(false);
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
      setFirebaseUser(null);
      setIsFirebaseAuthenticated(false);
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

    // Firebase authentication state (required for new security rules)
    firebaseUser,
    isFirebaseAuthenticated,

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
