/**
 * Staff Sync Service - Syncs staff profiles between web app and mobile app
 * Fetches staff data from Firestore and caches locally for offline access
 * Optimized for mobile app performance with cache-first strategy
 */

import {
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe,
  query,
  limit,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy import of db to avoid initialization issues
let db: any = null;
let dbPromise: Promise<any> | null = null;

const getDb = async () => {
  if (db) {
    return db;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const { getFirebaseFirestore } = require('../lib/firebase');
        db = await getFirebaseFirestore();
        console.log('✅ StaffSyncService: Database instance ready');
        return db;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn('⚠️ StaffSyncService: Firebase db not available:', errorMsg);
        throw new Error(`Firebase not initialized: ${errorMsg}`);
      }
    })();
  }

  return await dbPromise;
};

// Staff profile type matching the localStaffService interface
export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff' | 'cleaner' | 'maintenance' | 'housekeeper' | 'concierge';
  isActive: boolean;
  userId?: string | null;
  createdAt: Date;
  lastLogin?: Date;
  department?: string;
  avatar?: string;
}

// Response type for sync operations
export interface StaffSyncResponse {
  success: boolean;
  profiles: StaffProfile[];
  fromCache?: boolean;
  error?: string;
}

// Cache data structure
interface CacheData {
  profiles: StaffProfile[];
  lastUpdated: string;
  version: number;
}

/**
 * Staff Sync Service Class
 * Handles syncing staff profiles with optimizations for mobile performance
 */
export class StaffSyncService {
  private readonly STAFF_COLLECTION = 'staff_accounts';
  private readonly CACHE_KEY = 'staff_profiles_cache';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private unsubscribeCallback: Unsubscribe | null = null;

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
        const db = await getDb();
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
   * Fetch staff profiles with cache-first strategy for optimal mobile performance
   */
  async fetchStaffProfiles(forceRefresh: boolean = false): Promise<StaffSyncResponse> {
    try {
      console.log('👥 StaffSyncService: Fetching staff accounts...');
      console.log('🔍 StaffSyncService: forceRefresh =', forceRefresh);

      // ALWAYS try cache first for mobile app performance
      const cachedData = await this.getCachedProfiles();
      
      if (cachedData && cachedData.profiles.length > 0 && !forceRefresh) {
        console.log(`📦 StaffSyncService: Found ${cachedData.profiles.length} cached profiles - returning immediately`);
        
        // Check if cache is fresh (less than 5 minutes)
        const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime();
        
        if (cacheAge < this.CACHE_EXPIRY_MS) {
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
      const cachedData = await this.getCachedProfiles();
      if (cachedData && cachedData.profiles.length > 0) {
        console.log('📦 StaffSyncService: Returning cached profiles due to error');
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
    const isFirebaseReady = await this.waitForFirebaseInit(25000);
    
    if (!isFirebaseReady) {
      console.warn('⚠️ StaffSyncService: Firebase not ready after waiting');
      
      // Try to return cached data as fallback
      const cachedData = await this.getCachedProfiles();
      if (cachedData && cachedData.profiles.length > 0) {
        console.log(`📦 StaffSyncService: Returning ${cachedData.profiles.length} cached profiles (Firebase not ready)`);
        return {
          success: true,
          profiles: cachedData.profiles,
          fromCache: true,
        };
      }

      return {
        success: false,
        profiles: [],
        fromCache: false,
        error: 'Firebase not ready and no cache available'
      };
    }

    // Fetch from Firestore staff_accounts collection
    const db = await getDb();
    const staffRef = collection(db, this.STAFF_COLLECTION);
    const querySnapshot = await getDocs(staffRef);
    const profiles: StaffProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter for active accounts - handle both 'status: active' and 'isActive: true'
      const isActive = data.status === 'active' || data.isActive === true;

      if (isActive && data.name && data.email) {
        // Map role to valid type
        const validRoles = ['admin', 'manager', 'staff', 'cleaner', 'maintenance', 'housekeeper', 'concierge'];
        const role = validRoles.includes(data.role) ? data.role : 'staff';
        
        const profile: StaffProfile = {
          id: doc.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: role as StaffProfile['role'],
          isActive: true,
          userId: data.userId || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined,
          department: data.department || undefined,
          avatar: data.avatar || undefined,
        };
        profiles.push(profile);
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

  /**
   * Get cached staff profiles
   */
  private async getCachedProfiles(): Promise<CacheData | null> {
    try {
      const cachedJson = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cachedJson) {
        return null;
      }

      const cacheData: CacheData = JSON.parse(cachedJson);
      return cacheData;
    } catch (error) {
      console.warn('⚠️ StaffSyncService: Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache staff profiles
   */
  private async cacheProfiles(profiles: StaffProfile[]): Promise<void> {
    try {
      const cacheData: CacheData = {
        profiles,
        lastUpdated: new Date().toISOString(),
        version: 1,
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 StaffSyncService: Cached ${profiles.length} staff profiles`);
    } catch (error) {
      console.warn('⚠️ StaffSyncService: Error caching profiles:', error);
    }
  }

  /**
   * Subscribe to real-time staff updates
   */
  subscribeToStaffUpdates(callback: (profiles: StaffProfile[]) => void): () => void {
    console.log('👂 StaffSyncService: Setting up real-time staff accounts listener');

    // Set up async subscription
    const setupSubscription = async () => {
      try {
        const db = await getDb();
        const staffRef = collection(db, this.STAFF_COLLECTION);

        this.unsubscribeCallback = onSnapshot(
          staffRef,
          (snapshot) => {
            console.log('📡 StaffSyncService: Real-time update received');
            const profiles: StaffProfile[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              const isActive = data.status === 'active' || data.isActive === true;

              if (isActive && data.name && data.email) {
                // Map role to valid type
                const validRoles = ['admin', 'manager', 'staff', 'cleaner', 'maintenance', 'housekeeper', 'concierge'];
                const role = validRoles.includes(data.role) ? data.role : 'staff';
                
                const profile: StaffProfile = {
                  id: doc.id,
                  name: data.name,
                  email: data.email,
                  phone: data.phone || '',
                  role: role as StaffProfile['role'],
                  isActive: true,
                  userId: data.userId || null,
                  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                  lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined,
                  department: data.department || undefined,
                  avatar: data.avatar || undefined,
                };
                profiles.push(profile);
              }
            });

            console.log(`🔄 StaffSyncService: Real-time update: ${profiles.length} staff profiles`);
            
            // Update cache
            this.cacheProfiles(profiles);
            
            // Notify callback
            callback(profiles);
          },
          (error) => {
            console.error('❌ StaffSyncService: Real-time listener error:', error);
          }
        );
      } catch (error) {
        console.error('❌ StaffSyncService: Error setting up real-time listener:', error);
      }
    };

    // Start setup asynchronously
    setupSubscription();

    return () => {
      if (this.unsubscribeCallback) {
        this.unsubscribeCallback();
        this.unsubscribeCallback = null;
        console.log('🔌 StaffSyncService: Real-time listener unsubscribed');
      }
    };
  }

  /**
   * Get a specific staff profile by ID
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
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ StaffSyncService: Cache cleared');
    } catch (error) {
      console.warn('⚠️ StaffSyncService: Error clearing cache:', error);
    }
  }

  /**
   * Refresh staff profiles (force refresh from Firestore)
   */
  async refreshStaffProfiles(): Promise<StaffSyncResponse> {
    console.log('🔄 StaffSyncService: Force refreshing staff profiles...');
    return await this.fetchStaffProfiles(true);
  }

  /**
   * Cleanup method for context teardown
   */
  cleanup(): void {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
      this.unsubscribeCallback = null;
      console.log('🔌 StaffSyncService: Cleaned up real-time listener');
    }
  }
}

// Create and export singleton instance with error handling
let staffSyncServiceInstance: StaffSyncService | null = null;

// Initialize in a try-catch to prevent import errors
const initializeService = () => {
  try {
    if (!staffSyncServiceInstance) {
      staffSyncServiceInstance = new StaffSyncService();
      console.log('✅ StaffSyncService: Instance created successfully');
    }
    return staffSyncServiceInstance;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ StaffSyncService: Failed to create instance:', errorMsg);
    
    // Return a stub object to prevent "undefined" errors
    return {
      fetchStaffProfiles: async () => ({
        success: false,
        profiles: [],
        error: 'Service initialization failed'
      }),
      refreshStaffProfiles: async () => ({
        success: false,
        profiles: [],
        error: 'Service initialization failed'
      }),
      clearCache: async () => {},
      cleanup: () => {},
      subscribeToStaffUpdates: () => () => {},
      getStaffProfileById: async () => null
    } as any;
  }
};

// Export both the class and the instance
export const staffSyncService = initializeService();
export default staffSyncService;

// Also export a function that returns the service for better compatibility
export const getStaffSyncService = () => {
  return staffSyncServiceInstance || initializeService();
};
