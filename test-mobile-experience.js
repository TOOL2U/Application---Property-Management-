/**
 * Mobile App Staff Service Test
 * Tests and optimizes the mobile app experience
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  data: {},
  async getItem(key) {
    return this.data[key] || null;
  },
  async setItem(key, value) {
    this.data[key] = value;
  },
  async removeItem(key) {
    delete this.data[key];
  }
};

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Simulate the mobile app experience
async function simulateMobileAppExperience() {
  console.log('📱 Simulating Mobile App Staff Loading Experience\n');

  // Step 1: App starts - show loading state
  console.log('🚀 App Starting...');
  console.log('⏳ Loading staff profiles...');

  // Step 2: Check cache first (instant)
  console.log('\n📦 Checking cache...');
  const cachedData = await mockAsyncStorage.getItem('staff_profiles_cache');
  
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    console.log(`✅ Found ${parsed.profiles.length} cached profiles - showing immediately`);
    console.log('👥 Displaying cached staff profiles to user');
  } else {
    console.log('⚠️ No cache found - user sees loading spinner');
  }

  // Step 3: Initialize Firebase (this is what's taking time)
  console.log('\n🔥 Initializing Firebase...');
  const startTime = Date.now();
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Simulate the delay the mobile app is experiencing
    console.log('⏳ Waiting for Firestore to be ready...');
    
    // Try to make a simple query
    const testQuery = query(
      collection(db, 'staff_accounts'),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(testQuery);
    const initTime = Date.now() - startTime;
    
    console.log(`✅ Firebase ready after ${initTime}ms`);
    console.log(`📊 Found ${snapshot.size} staff profiles from Firestore`);
    
    // Step 4: Update cache and UI
    const profiles = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      profiles.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        isActive: data.isActive,
        hasUserId: !!data.userId
      });
    });
    
    // Cache the fresh data
    const cacheData = {
      profiles,
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    
    await mockAsyncStorage.setItem('staff_profiles_cache', JSON.stringify(cacheData));
    console.log('💾 Updated cache with fresh data');
    console.log('📱 UI updated with latest profiles');
    
    // Summary for mobile app team
    console.log('\n📊 MOBILE APP PERFORMANCE SUMMARY:');
    console.log(`   Firebase Init Time: ${initTime}ms`);
    console.log(`   Cache Strategy: ${cachedData ? 'Cache-first (instant)' : 'Network-only (slow)'}`);
    console.log(`   User Experience: ${cachedData ? 'Good (immediate display)' : 'Poor (loading wait)'}`);
    console.log(`   Total Profiles: ${profiles.length}`);
    
    if (initTime > 10000) {
      console.log('\n⚠️ PERFORMANCE ISSUE DETECTED:');
      console.log('   Firebase taking >10 seconds to initialize');
      console.log('   Recommendation: Implement cache-first strategy');
    }
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.log(`❌ Firebase failed after ${errorTime}ms: ${error.message}`);
    console.log('📱 User sees error state or cached data only');
  }
}

simulateMobileAppExperience();
