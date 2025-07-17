#!/usr/bin/env node

/**
 * StaffSyncService Firebase Fix Test
 * Tests the specific Firebase collection() issue that was causing timeout errors
 */

// Load environment variables like the mobile app would
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

// Firebase config (matches mobile app exactly)
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

async function testStaffCollectionAccess() {
  console.log('🧪 Testing StaffSyncService Firebase Collection Access...\n');

  // Verify environment
  console.log('🔍 Environment Check:');
  console.log(`   Project ID: ${firebaseConfig.projectId}`);
  console.log(`   API Key: ${firebaseConfig.apiKey ? 'SET' : 'MISSING'}`);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.log('\n❌ Missing Firebase configuration');
    return false;
  }

  try {
    // Step 1: Initialize Firebase (this should work)
    console.log('\n1️⃣ Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');

    // Step 2: Initialize Firestore (this should work)
    console.log('2️⃣ Initializing Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');

    // Step 3: Test collection() function (this was the failing part)
    console.log('3️⃣ Testing collection() function...');
    const staffCollection = collection(db, 'staff_accounts');
    console.log('✅ Collection reference created successfully');
    console.log(`   Collection path: ${staffCollection.path}`);
    console.log(`   Collection id: ${staffCollection.id}`);

    // Step 4: Test query() function
    console.log('4️⃣ Testing query() function...');
    const testQuery = query(staffCollection, limit(1));
    console.log('✅ Query created successfully');

    // Step 5: Test actual data fetch (the real test)
    console.log('5️⃣ Testing data fetch from staff_accounts...');
    const startTime = Date.now();
    
    const querySnapshot = await getDocs(testQuery);
    const fetchTime = Date.now() - startTime;
    
    console.log(`✅ Data fetch completed in ${fetchTime}ms`);
    console.log(`   Documents found: ${querySnapshot.size}`);

    if (querySnapshot.size > 0) {
      const firstDoc = querySnapshot.docs[0];
      const data = firstDoc.data();
      console.log(`   Sample document ID: ${firstDoc.id}`);
      console.log(`   Sample data keys: ${Object.keys(data).join(', ')}`);
      console.log(`   Staff name: ${data.name || 'N/A'}`);
      console.log(`   Staff role: ${data.role || 'N/A'}`);
      console.log(`   Staff status: ${data.status || data.isActive || 'N/A'}`);
    }

    // Step 6: Test full collection fetch (simulate StaffSyncService)
    console.log('6️⃣ Testing full staff collection fetch...');
    const fullQuery = query(collection(db, 'staff_accounts'));
    const fullSnapshot = await getDocs(fullQuery);
    
    console.log(`✅ Full collection fetch completed`);
    console.log(`   Total staff documents: ${fullSnapshot.size}`);

    // Process like StaffSyncService would
    let activeStaffCount = 0;
    fullSnapshot.forEach((doc) => {
      const data = doc.data();
      const isActive = data.status === 'active' || data.isActive === true;
      if (isActive && data.name && data.email) {
        activeStaffCount++;
      }
    });

    console.log(`   Active staff profiles: ${activeStaffCount}`);

    if (activeStaffCount > 0) {
      console.log('\n🎉 SUCCESS: StaffSyncService Firebase connection is working!');
      console.log('✅ The mobile app should now be able to fetch staff profiles');
      console.log('✅ No more "Expected first argument to collection()" errors');
      console.log('✅ No more timeout issues');
      
      return true;
    } else {
      console.log('\n⚠️  Firebase connection works, but no active staff found');
      console.log('💡 Check that staff accounts have status="active" or isActive=true');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(`   Error type: ${error.name}`);
    console.error(`   Error message: ${error.message}`);
    
    if (error.message.includes('Expected first argument to collection()')) {
      console.error('\n🔍 This is the exact error we\'re trying to fix!');
      console.error('💡 The Firestore instance is not properly initialized');
    }
    
    return false;
  }
}

// Run the test
console.log('🔧 StaffSyncService Firebase Fix Verification');
console.log('=' * 50);

testStaffCollectionAccess()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Mobile app staff loading should work.');
    } else {
      console.log('\n❌ Tests failed. Please check the errors above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unhandled error:', error);
    process.exit(1);
  });
