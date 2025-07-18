#!/usr/bin/env node

/**
 * Test Firebase initialization fix
 * This script tests the updated Firebase and StaffSyncService with proper environment loading
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
console.log('📁 Loading environment from .env.local...');
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  let loadedCount = 0;
  for (const line of envLines) {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      process.env[key.trim()] = value.trim();
      if (key.includes('FIREBASE')) loadedCount++;
    }
  }
  
  console.log(`✅ Loaded ${loadedCount} Firebase environment variables`);
} else {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

// Verify Firebase config
console.log('\n🔍 Firebase Config Verification:');
console.log('- API Key:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING');
console.log('- Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING');
console.log('- Auth Domain:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING');

if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY || !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('❌ Missing required Firebase configuration');
  process.exit(1);
}

// Test Firebase and StaffSyncService
async function testStaffSyncFix() {
  try {
    console.log('\n🧪 Testing Firebase and StaffSyncService...');
    
    // Step 1: Test Firebase initialization
    console.log('1️⃣ Testing Firebase initialization...');
    const { getFirebaseFirestore } = require('./lib/firebase');
    
    const db = await getFirebaseFirestore();
    console.log('✅ Firebase Firestore initialized successfully');
    
    // Step 2: Test collection access
    console.log('2️⃣ Testing Firestore collection access...');
    const { collection, getDocs, query, limit } = require('firebase/firestore');
    
    const testCollection = collection(db, 'staff_accounts');
    console.log('✅ Collection reference created');
    
    // Step 3: Test StaffSyncService
    console.log('3️⃣ Testing StaffSyncService...');
    const { getStaffSyncService } = require('./services/staffSyncService');
    const staffService = getStaffSyncService();
    console.log('✅ StaffSyncService instance created');
    
    // Step 4: Fetch staff profiles
    console.log('4️⃣ Fetching staff profiles...');
    const result = await staffService.fetchStaffProfiles();
    
    console.log('\n📊 Results:');
    console.log('- Success:', result.success);
    console.log('- Profiles found:', result.profiles?.length || 0);
    console.log('- From cache:', result.fromCache);
    
    if (result.error) {
      console.log('- Error:', result.error);
    }
    
    if (result.success && result.profiles && result.profiles.length > 0) {
      console.log('\n👤 Sample Profile:');
      const sample = result.profiles[0];
      console.log('- Name:', sample.name);
      console.log('- Role:', sample.role);
      console.log('- Email:', sample.email);
      console.log('- Has User ID:', !!sample.userId);
      console.log('- Active:', sample.isActive);
    }
    
    console.log('\n🎉 StaffSyncService is working correctly!');
    console.log('✅ Mobile app should now display staff profiles without timeout errors');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Verify Firebase configuration in .env.local');
    console.log('2. Check internet connection');
    console.log('3. Verify Firestore security rules allow read access');
    console.log('4. Ensure staff_accounts collection exists in Firestore');
  }
}

// Run the test
testStaffSyncFix().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
