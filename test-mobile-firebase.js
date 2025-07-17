#!/usr/bin/env node

/**
 * Firebase Mobile App Connection Test
 * Tests the exact same Firebase configuration used by the mobile app
 */

// Load environment variables like the mobile app would
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase config (matches mobile app)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

async function testMobileAppFirebaseConfig() {
  console.log('📱 Testing Mobile App Firebase Configuration...\n');

  // Check environment variables
  console.log('🔍 Environment Variables Check:');
  console.log('   API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
  console.log('   Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
  console.log('   Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
  console.log('   App ID:', firebaseConfig.appId ? '✅ Set' : '❌ Missing');

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.log('\n❌ Missing required Firebase configuration');
    return false;
  }

  try {
    // Initialize Firebase like the mobile app does
    console.log('\n🔥 Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');

    // Initialize Firestore
    console.log('📊 Initializing Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore initialized successfully');

    // Test staff_accounts collection (like mobile app does)
    console.log('\n👥 Testing staff_accounts collection...');
    const staffRef = collection(db, 'staff_accounts');
    
    const startTime = Date.now();
    const querySnapshot = await getDocs(staffRef);
    const fetchTime = Date.now() - startTime;
    
    console.log(`✅ Successfully fetched staff accounts in ${fetchTime}ms`);
    console.log(`📊 Found ${querySnapshot.size} total documents`);

    // Analyze staff data
    let activeStaff = 0;
    let staffWithUserId = 0;
    const staffList = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const isActive = data.status === 'active' || data.isActive === true;
      
      if (isActive) {
        activeStaff++;
        if (data.userId) staffWithUserId++;
        
        staffList.push({
          id: doc.id,
          name: data.displayName || data.name || 'Unknown',
          email: data.email || 'No email',
          role: data.role || 'No role',
          hasUserId: !!data.userId
        });
      }
    });

    console.log(`📈 Active staff accounts: ${activeStaff}`);
    console.log(`🔗 Staff with userId: ${staffWithUserId}`);

    if (activeStaff > 0) {
      console.log('\n📋 Active Staff Members:');
      staffList.forEach((staff, index) => {
        console.log(`${index + 1}. ${staff.name} (${staff.email})`);
        console.log(`   Role: ${staff.role}`);
        console.log(`   Has userId: ${staff.hasUserId ? '✅' : '❌'}`);
      });
    }

    // Test jobs collection
    console.log('\n💼 Testing jobs collection...');
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(jobsRef);
    console.log(`📊 Found ${jobsSnapshot.size} jobs in collection`);

    let jobsWithUserId = 0;
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId) jobsWithUserId++;
    });
    
    console.log(`🔗 Jobs with userId: ${jobsWithUserId}/${jobsSnapshot.size}`);

    console.log('\n🎉 Mobile App Firebase Test SUCCESSFUL!');
    console.log('📱 The mobile app should be able to connect to Firebase');

    if (activeStaff === 0) {
      console.log('\n⚠️  No active staff found - mobile app will show empty list');
    } else if (staffWithUserId === 0) {
      console.log('\n⚠️  No staff have userId fields - mobile login will fail');
      console.log('💡 Run staff-fix.js to add userId fields');
    } else {
      console.log('\n✅ Staff setup looks good for mobile app!');
    }

    return true;

  } catch (error) {
    console.error('\n❌ Mobile app Firebase test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMobileAppFirebaseConfig().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testMobileAppFirebaseConfig };
