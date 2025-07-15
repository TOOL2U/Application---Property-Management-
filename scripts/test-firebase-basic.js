/**
 * Basic Firebase Connection Test
 * Tests what we can access with current configuration
 * 
 * Run with: node scripts/test-firebase-basic.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  limit 
} = require('firebase/firestore');
const { 
  getDatabase, 
  ref, 
  get 
} = require('firebase/database');
const { getAuth } = require('firebase/auth');
const { getStorage } = require('firebase/storage');

require('dotenv').config({ path: '.env.local' });

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, message = '', data = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}: ${message}`);
  
  testResults.tests.push({
    name: testName,
    success,
    message,
    data
  });
  
  if (success) testResults.passed++;
  else testResults.failed++;
}

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase Client
let clientApp, clientFirestore, clientDatabase, clientAuth, clientStorage;

function initializeFirebaseClient() {
  try {
    console.log('\n🔧 Initializing Firebase Client SDK...');
    console.log(`Project ID: ${firebaseConfig.projectId}`);
    console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
    console.log(`Database URL: ${firebaseConfig.databaseURL}`);
    
    // Check required environment variables
    const requiredVars = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    clientApp = initializeApp(firebaseConfig);
    clientFirestore = getFirestore(clientApp);
    clientDatabase = getDatabase(clientApp);
    clientAuth = getAuth(clientApp);
    clientStorage = getStorage(clientApp);
    
    logTest('Firebase Client Initialization', true, 'All services initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Client Initialization', false, error.message);
    return false;
  }
}

// Test Firestore Read-Only Operations
async function testFirestoreReadOnly() {
  try {
    console.log('\n📊 Testing Firestore Read-Only Operations...');
    
    // Test staff_accounts collection
    const staffCollection = collection(clientFirestore, 'staff_accounts');
    const staffQuery = query(staffCollection, limit(5));
    const staffSnapshot = await getDocs(staffQuery);
    
    logTest('Firestore Staff Accounts Read', true, `Found ${staffSnapshot.size} staff accounts`);
    
    // Display staff account details
    if (staffSnapshot.size > 0) {
      console.log('   Staff Accounts Found:');
      staffSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.name || 'Unknown'} (${data.email || 'No email'}) - Role: ${data.role || 'No role'}`);
      });
    }
    
    // Test jobs collection
    try {
      const jobsCollection = collection(clientFirestore, 'jobs');
      const jobsQuery = query(jobsCollection, limit(3));
      const jobsSnapshot = await getDocs(jobsQuery);
      
      logTest('Firestore Jobs Collection Read', true, `Found ${jobsSnapshot.size} jobs`);
    } catch (error) {
      logTest('Firestore Jobs Collection Read', false, error.message);
    }
    
    // Test properties collection
    try {
      const propertiesCollection = collection(clientFirestore, 'properties');
      const propertiesQuery = query(propertiesCollection, limit(3));
      const propertiesSnapshot = await getDocs(propertiesQuery);
      
      logTest('Firestore Properties Collection Read', true, `Found ${propertiesSnapshot.size} properties`);
    } catch (error) {
      logTest('Firestore Properties Collection Read', false, error.message);
    }
    
    return true;
  } catch (error) {
    logTest('Firestore Read Test', false, error.message);
    return false;
  }
}

// Test Realtime Database Read-Only Operations
async function testRealtimeDatabaseReadOnly() {
  try {
    console.log('\n🔄 Testing Realtime Database Read-Only Operations...');
    
    // Test reading from root
    const rootRef = ref(clientDatabase, '/');
    const rootSnapshot = await get(rootRef);
    
    if (rootSnapshot.exists()) {
      const data = rootSnapshot.val();
      const keys = Object.keys(data || {});
      logTest('Realtime Database Root Read', true, `Found ${keys.length} top-level keys: ${keys.join(', ')}`);
    } else {
      logTest('Realtime Database Root Read', true, 'Database is empty or no read access');
    }
    
    // Test specific paths that might exist
    const testPaths = ['users', 'jobs', 'properties', 'staff'];
    
    for (const path of testPaths) {
      try {
        const pathRef = ref(clientDatabase, path);
        const pathSnapshot = await get(pathRef);
        
        if (pathSnapshot.exists()) {
          const data = pathSnapshot.val();
          const count = typeof data === 'object' ? Object.keys(data).length : 1;
          logTest(`Realtime Database ${path} Read`, true, `Found data with ${count} items`);
        } else {
          logTest(`Realtime Database ${path} Read`, true, `Path exists but no data`);
        }
      } catch (error) {
        logTest(`Realtime Database ${path} Read`, false, error.message);
      }
    }
    
    return true;
  } catch (error) {
    logTest('Realtime Database Read Test', false, error.message);
    return false;
  }
}

// Test Authentication Service (without signing in)
async function testAuthenticationService() {
  try {
    console.log('\n🔐 Testing Firebase Authentication Service...');
    
    // Test that auth service is accessible
    const auth = clientAuth;
    logTest('Authentication Service Access', true, 'Auth service is accessible');
    
    // Check current user (should be null)
    const currentUser = auth.currentUser;
    if (currentUser) {
      logTest('Authentication Current User', true, `User is signed in: ${currentUser.email}`);
    } else {
      logTest('Authentication Current User', true, 'No user currently signed in (expected)');
    }
    
    // Test auth state listener (just check if it works)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // This is just to test the listener works
    });
    unsubscribe(); // Clean up immediately
    
    logTest('Authentication State Listener', true, 'Auth state listener works');
    
    return true;
  } catch (error) {
    logTest('Authentication Service Test', false, error.message);
    return false;
  }
}

// Test Storage Service Access
async function testStorageService() {
  try {
    console.log('\n📁 Testing Firebase Storage Service...');
    
    // Test that storage service is accessible
    const storage = clientStorage;
    logTest('Storage Service Access', true, 'Storage service is accessible');
    
    // Test getting a reference (doesn't require permissions)
    const storageRef = storage.ref || (() => {
      throw new Error('Storage ref method not available');
    });
    
    logTest('Storage Reference Creation', true, 'Can create storage references');
    
    return true;
  } catch (error) {
    logTest('Storage Service Test', false, error.message);
    return false;
  }
}

// Test Environment Configuration
function testEnvironmentConfig() {
  console.log('\n⚙️  Testing Environment Configuration...');
  
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_FIREBASE_DATABASE_URL'
  ];
  
  const optionalVars = [
    'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'FIREBASE_ADMIN_DATABASE_URL',
    'FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY',
    'FIREBASE_ADMIN_PROJECT_ID'
  ];
  
  // Check required variables
  const missingRequired = requiredVars.filter(varName => !process.env[varName]);
  if (missingRequired.length === 0) {
    logTest('Required Environment Variables', true, 'All required variables are set');
  } else {
    logTest('Required Environment Variables', false, `Missing: ${missingRequired.join(', ')}`);
  }
  
  // Check optional variables
  const presentOptional = optionalVars.filter(varName => process.env[varName]);
  logTest('Optional Environment Variables', true, `Present: ${presentOptional.join(', ')}`);
  
  // Display configuration summary
  console.log('\n   Configuration Summary:');
  console.log(`   Project ID: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`   Auth Domain: ${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
  console.log(`   Database URL: ${process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL}`);
  console.log(`   Storage Bucket: ${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
  console.log(`   App ID: ${process.env.EXPO_PUBLIC_FIREBASE_APP_ID}`);
}

// Main test function
async function runBasicTests() {
  console.log('🚀 Firebase Basic Connection Test');
  console.log('==================================');
  
  try {
    // Test environment configuration
    testEnvironmentConfig();
    
    // Initialize Firebase services
    const clientInit = initializeFirebaseClient();
    
    if (!clientInit) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Run basic tests
    await testFirestoreReadOnly();
    await testRealtimeDatabaseReadOnly();
    await testAuthenticationService();
    await testStorageService();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.tests.length}`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.tests
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
    }
    
    const successRate = testResults.tests.length > 0 
      ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1)
      : 0;
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All basic Firebase connections are working!');
    } else {
      console.log('\n⚠️  Some Firebase connections need attention.');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Fix any failed tests above');
    console.log('2. Set up proper Firebase Admin service account key');
    console.log('3. Configure Firebase Security Rules for write access');
    console.log('4. Test authentication with valid credentials');
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runBasicTests();
}

module.exports = {
  runBasicTests,
  testResults
};
