/**
 * Initialize Staff Cache for Mobile App
 * Pre-populates AsyncStorage with staff data for instant mobile app loading
 */

// This would be integrated into the mobile app's initialization
const CACHE_KEY = 'staff_profiles_cache';

// Sample staff data that exactly matches our Firestore data
const initialStaffData = [
  {
    id: 'myo_001',
    name: 'Myo',
    email: 'myo@gmail.com',
    phone: '+66123456789',
    role: 'housekeeper',
    isActive: true,
    userId: 'NIdU472cgoSFav5MkOxEPitz0mg2'
  },
  {
    id: 'admin_001',
    name: 'Admin User',
    email: 'admin@siamoon.com',
    phone: '+66987654321',
    role: 'admin',
    isActive: true,
    userId: 'PPffPHRd2reOgE0Ni1QrNXGUFq12'
  },
  {
    id: 'manager_001',
    name: 'Manager User',
    email: 'manager@siamoon.com',
    phone: '+66555666777',
    role: 'manager',
    isActive: true,
    userId: 'vCLj3bNKcyZmixQaeI5HMrLjPyt2'
  },
  {
    id: 'alan_001',
    name: 'Alan Ducker',
    email: 'alan@example.com',
    phone: '+66444555666',
    role: 'maintenance',
    isActive: true,
    userId: 'PDrUitnDyLYLf0eba5Y0chQcEm92'
  },
  {
    id: 'cleaner_001',
    name: 'Cleaner',
    email: 'cleaner@siamoon.com',
    phone: '+66333444555',
    role: 'cleaner',
    isActive: true,
    userId: 'CleanerUserId123'
  },
  {
    id: 'thai_001',
    name: 'Thai@gmail.com',
    email: 'shaun@siamoon.com',
    phone: '+66222333444',
    role: 'staff',
    isActive: true,
    userId: 'ThaiUserId123'
  }
];

/**
 * Initialize cache with staff data
 * Call this during app startup before any staff profile requests
 */
async function initializeStaffCache(AsyncStorage) {
  try {
    console.log('🌱 Initializing staff cache for mobile app...');
    
    // Check if cache already exists
    const existingCache = await AsyncStorage.getItem(CACHE_KEY);
    
    if (existingCache) {
      const parsed = JSON.parse(existingCache);
      const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      if (cacheAge < maxAge) {
        console.log('📦 Recent cache found, keeping existing data');
        return true;
      }
    }
    
    // Create fresh cache data
    const cacheData = {
      profiles: initialStaffData,
      lastUpdated: new Date().toISOString(),
      version: 1,
      source: 'initial_seed'
    };
    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    
    console.log(`✅ Staff cache initialized with ${initialStaffData.length} profiles`);
    console.log('📱 Mobile app will now show staff profiles immediately');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize staff cache:', error);
    return false;
  }
}

/**
 * Get cached staff profiles (what the mobile app sees immediately)
 */
async function getCachedStaffProfiles(AsyncStorage) {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return null;
    }
    
    const parsed = JSON.parse(cachedData);
    return parsed.profiles;
    
  } catch (error) {
    console.error('❌ Failed to get cached profiles:', error);
    return null;
  }
}

// Instructions for mobile app integration
const integrationInstructions = `
📱 MOBILE APP INTEGRATION INSTRUCTIONS:

1. Add to app startup (before any staff profile requests):
   import { initializeStaffCache } from './services/staffCacheInit';
   await initializeStaffCache(AsyncStorage);

2. The staffSyncService will now find cache immediately and display profiles

3. Firebase sync will happen in background and update cache when ready

4. User Experience:
   - App loads → Profiles appear instantly (from cache)
   - Background → Firebase syncs fresh data
   - Result → Always fast, always up-to-date

5. Cache Strategy:
   - Cache expires after 5 minutes
   - Fresh data overwrites cache when available
   - Fallback to cache if Firebase fails
`;

console.log(integrationInstructions);

module.exports = {
  initializeStaffCache,
  getCachedStaffProfiles,
  initialStaffData,
  CACHE_KEY
};
