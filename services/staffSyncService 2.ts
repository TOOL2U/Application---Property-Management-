/**
 * Staff Sync Service - Syncs staff profiles between web app and mobile app
 * Fetches staff data from Firestore and caches locally for offline access
 */

import {
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffProfile } from './localStaffService';

interface StaffSyncResponse {
  success: boolean;
  profiles: StaffProfile[];
  error?: string;
  fromCache?: boolean;
}

class StaffSyncService {
  private readonly STAFF_COLLECTION = 'staff_accounts'; // Your web app's staff accounts collection
  private readonly CACHE_KEY = '@synced_staff_profiles';
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private unsubscribeCallback: Unsubscribe | null = null;
  private initializationRetries = 0;
  private readonly MAX_RETRIES = 3;

  /**
   * Check if Firebase is ready with enhanced retry mechanism
   */
  private async waitForFirebaseInit(maxWaitMs: number = 25000): Promise<boolean> {
    const startTime = Date.now();
    let attemptCount = 0;

    console.log('🔍 StaffSyncService: Waiting for Firebase to be ready...');

    while (Date.now() - startTime < maxWaitMs) {
      attemptCount++;
      
      try {
        // Multiple readiness checks
        const testCollection = collection(db, 'staff_accounts');
        
        // Test 1: Basic collection reference
        if (!testCollection || !testCollection.firestore) {
          throw new Error('Collection reference not ready');
        }

        // Test 2: Try to get a count (lightweight operation)
        const countQuery = query(testCollection, limit(1));
        await getDocs(countQuery);
        
        console.log(`✅ StaffSyncService: Firebase ready after ${attemptCount} attempts (${Date.now() - startTime}ms)`);
        return true;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`🔄 StaffSyncService: Attempt ${attemptCount} failed (${errorMsg}), retrying...`);
      }

      // Progressive wait times: 500ms, 1000ms, 2000ms, 3000ms, then 3000ms
      const waitTime = attemptCount === 1 ? 500 :
                      attemptCount === 2 ? 1000 :
                      attemptCount === 3 ? 2000 : 3000;
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    console.warn(`⚠️ StaffSyncService: Firebase not ready after ${attemptCount} attempts (${Date.now() - startTime}ms)`);
    return false;
  }

  /**
   * Fetch staff profiles from Firestore with cache-first strategy for mobile performance
   */
  async fetchStaffProfiles(useCache: boolean = false): Promise<StaffSyncResponse> {
    try {
      console.log('👥 StaffSyncService: Fetching staff accounts from Firestore...');
      console.log('🔍 StaffSyncService: useCache =', useCache);

      // ALWAYS try cache first for mobile app performance
      const cachedData = await this.getCachedProfiles();
      
      if (cachedData && cachedData.profiles.length > 0) {
        console.log(`📦 StaffSyncService: Found ${cachedData.profiles.length} cached profiles - returning immediately`);
        
        // If cache is recent (less than 5 minutes), just return it
        const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge < fiveMinutes && !useCache) {
          console.log('✅ StaffSyncService: Cache is fresh, returning cached data');
          return {
            success: true,
            profiles: cachedData.profiles,
            fromCache: true,
          };
        }
        
        // Cache exists but might be stale - return it first, then refresh in background
        console.log('🔄 StaffSyncService: Cache exists, returning immediately and refreshing in background');
        
        // Start background refresh (don't await)
        this.refreshDataInBackground();
        
        return {
          success: true,
          profiles: cachedData.profiles,
          fromCache: true,
        };
      }

      // No cache available - must wait for Firebase
      console.log('⚠️ StaffSyncService: No cache found, must wait for Firebase...');
      return await this.fetchFreshData();

    } catch (error) {
      console.error('❌ StaffSyncService: Error in fetchStaffProfiles:', error);
      
      // Try to return cached data as fallback
      const cachedData = await this.getCachedProfiles(false);
      if (cachedData) {
        console.log('📦 StaffSyncService: Returning stale cached profiles as fallback');
        return {
          success: true,
          profiles: cachedData.profiles,
          fromCache: true,
        };
      }
      
      return {
        success: false,
        profiles: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Background refresh for cache-first strategy
   */
  private async refreshDataInBackground(): Promise<void> {
    try {
      console.log('🔄 StaffSyncService: Starting background refresh...');
      const freshData = await this.fetchFreshData();
      if (freshData.success && !freshData.fromCache) {
        console.log('✅ StaffSyncService: Background refresh completed successfully');
      }
    } catch (error) {
      console.warn('⚠️ StaffSyncService: Background refresh failed:', error);
    }
  }

  /**
   * Fetch fresh data from Firebase (separated for reuse)
   */
  private async fetchFreshData(): Promise<StaffSyncResponse> {
    // Check if Firebase is properly initialized with retry
    const isFirebaseReady = await this.waitForFirebaseInit(25000); // Increased to 25 seconds
    if (!isFirebaseReady) {
      console.warn('⚠️ StaffSyncService: Firebase Firestore is not ready after waiting, using cache only');

      // Try to return cached data as fallback
      const cachedData = await this.getCachedProfiles(false);
      if (cachedData && cachedData.profiles.length > 0) {
        console.log(`📦 StaffSyncService: Returning ${cachedData.profiles.length} cached profiles (Firebase not ready)`);
        return {
          success: true,
          profiles: cachedData.profiles,
          fromCache: true,
        };
      }

      // If no cache available, return empty but don't fail completely
      console.warn('📦 StaffSyncService: No cache available, returning empty list');
      return {
        success: false,
        profiles: [],
        fromCache: false,
        error: 'Firebase not ready and no cache available'
      };
    }

    // Fetch from Firestore staff_accounts collection
    // Note: Some accounts use 'status: active', others use 'isActive: true'
    // We'll fetch all and filter in memory to handle both patterns
    const staffRef = collection(db, this.STAFF_COLLECTION);

    const querySnapshot = await getDocs(staffRef);
    const profiles: StaffProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Filter for active accounts - handle both 'status: active' and 'isActive: true'
      const isActive = data.status === 'active' || data.isActive === true;

      if (isActive) {
        const profile = this.mapStaffAccountToStaffProfile(doc.id, data);
        if (profile) {
          profiles.push(profile);
        }
      }
    });

    // Cache the results
    await this.cacheProfiles(profiles);

    console.log(`✅ StaffSyncService: Fetched ${profiles.length} staff accounts from Firestore`);
    
    return {
      success: true,
      profiles,
      fromCache: false,
    };
  }
          success: true,
          profiles: cachedData.profiles,
          fromCache: true,
        };
      }

      return {
        success: false,
        profiles: [],
        error: error instanceof Error ? error.message : 'Failed to fetch staff profiles',
      };
    }
  }

  /**
   * Subscribe to real-time staff profile updates
   */
  subscribeToStaffUpdates(callback: (profiles: StaffProfile[]) => void): () => void {
    console.log('👂 StaffSyncService: Setting up real-time staff accounts listener');

    try {
      // Check if Firebase is properly initialized
      if (!db) {
        console.warn('⚠️ StaffSyncService: Firebase Firestore is not initialized, cannot set up real-time listener');
        return () => {
          console.log('🔇 StaffSyncService: Dummy unsubscribe called (Firebase not ready)');
        };
      }

      const staffRef = collection(db, this.STAFF_COLLECTION);
      // Fetch all documents and filter in memory to handle both status patterns

    this.unsubscribeCallback = onSnapshot(
      staffRef,
      (querySnapshot) => {
        const profiles: StaffProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Filter for active accounts - handle both 'status: active' and 'isActive: true'
          const isActive = data.status === 'active' || data.isActive === true;

          if (isActive) {
            const profile = this.mapStaffAccountToStaffProfile(doc.id, data);
            if (profile) {
              profiles.push(profile);
            }
          }
        });

        console.log(`📡 StaffSyncService: Real-time update - ${profiles.length} staff profiles`);
        
        // Update cache
        this.cacheProfiles(profiles);
        
        // Call callback with updated profiles
        callback(profiles);
      },
      (error) => {
        console.error('❌ StaffSyncService: Real-time listener error:', error);
      }
    );

    return () => {
      console.log('🔇 StaffSyncService: Unsubscribing from staff updates');
      if (this.unsubscribeCallback) {
        this.unsubscribeCallback();
        this.unsubscribeCallback = null;
      }
    };

    } catch (error) {
      console.error('❌ StaffSyncService: Error setting up real-time listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  /**
   * Get staff profile by ID
   */
  async getStaffProfileById(profileId: string): Promise<StaffProfile | null> {
    try {
      const response = await this.fetchStaffProfiles();
      if (response.success) {
        return response.profiles.find(profile => profile.id === profileId) || null;
      }
      return null;
    } catch (error) {
      console.error('❌ StaffSyncService: Error getting staff profile by ID:', error);
      return null;
    }
  }

  /**
   * Force refresh staff profiles from Firestore
   */
  async refreshStaffProfiles(): Promise<StaffSyncResponse> {
    console.log('🔄 StaffSyncService: Force refreshing staff accounts...');
    await this.clearCache();
    return this.fetchStaffProfiles(false);
  }

  /**
   * Clear cached staff profiles
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ StaffSyncService: Cache cleared');
    } catch (error) {
      console.error('❌ StaffSyncService: Error clearing cache:', error);
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
      this.unsubscribeCallback = null;
    }
  }

  // Private helper methods

  private async getCachedProfiles(checkExpiry: boolean = true): Promise<{ profiles: StaffProfile[]; timestamp: number } | null> {
    try {
      const cachedDataString = await AsyncStorage.getItem(this.CACHE_KEY);
      
      if (!cachedDataString) {
        return null;
      }

      const cachedData = JSON.parse(cachedDataString);
      
      // Check if cache is expired
      if (checkExpiry && Date.now() - cachedData.timestamp > this.CACHE_DURATION) {
        console.log('⏰ StaffSyncService: Cache expired');
        return null;
      }

      // Parse dates back from strings
      cachedData.profiles = cachedData.profiles.map((profile: any) => ({
        ...profile,
        createdAt: new Date(profile.createdAt),
        lastLogin: profile.lastLogin ? new Date(profile.lastLogin) : undefined,
      }));

      return cachedData;
    } catch (error) {
      console.error('❌ StaffSyncService: Error getting cached profiles:', error);
      return null;
    }
  }

  private async cacheProfiles(profiles: StaffProfile[]): Promise<void> {
    try {
      const cacheData = {
        profiles,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 StaffSyncService: Cached ${profiles.length} staff profiles`);
    } catch (error) {
      console.error('❌ StaffSyncService: Error caching profiles:', error);
    }
  }

  private mapStaffAccountToStaffProfile(id: string, data: any): StaffProfile | null {
    try {
      // Map staff_accounts collection structure to mobile app's StaffProfile interface
      return {
        id: id,
        name: data.displayName || data.name || data.fullName || 'Unknown Staff',
        email: data.email || '',
        role: this.mapRole(data.role || data.accountType || data.userRole || 'staff'),
        isActive: data.status === 'active' || data.isActive === true, // Handle both status patterns
        department: data.department || data.division || 'General',
        phone: data.phoneNumber || data.phone || '',
        avatar: data.photoURL || data.avatar || data.profileImage || data.photo,
        createdAt: data.createdAt?.toDate() || data.dateCreated?.toDate() || new Date(),
        lastLogin: data.lastLoginAt?.toDate() || data.lastLogin?.toDate(),
      };
    } catch (error) {
      console.error('❌ StaffSyncService: Error mapping staff_accounts data:', error);
      return null;
    }
  }

  private mapRole(webAppRole: string): 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff' {
    // Map staff_accounts role names to mobile app's role types
    const roleMapping: Record<string, 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff'> = {
      'administrator': 'admin',
      'admin': 'admin',
      'system_admin': 'admin',
      'manager': 'manager',
      'supervisor': 'manager',
      'team_lead': 'manager',
      'lead': 'manager',
      'cleaner': 'cleaner',
      'cleaning': 'cleaner',
      'housekeeper': 'cleaner',
      'housekeeping': 'cleaner',
      'maintenance': 'maintenance',
      'technician': 'maintenance',
      'repair': 'maintenance',
      'engineer': 'maintenance',
      'maintenance_tech': 'maintenance',
      'staff': 'staff',
      'employee': 'staff',
      'worker': 'staff',
      'user': 'staff',
      'member': 'staff',
    };

    const normalizedRole = webAppRole.toLowerCase().trim();
    return roleMapping[normalizedRole] || 'staff';
  }
}

// Export singleton instance
export const staffSyncService = new StaffSyncService();
export default staffSyncService;
