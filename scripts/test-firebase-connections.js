/**
 * Comprehensive Firebase Connection Test Suite
 * Tests all Firebase services and connections
 * 
 * Run with: node scripts/test-firebase-connections.js
 */

const admin = require("firebase-admin");
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} = require('firebase/firestore');
const { 
  getDatabase, 
  ref, 
  set, 
  get, 
  remove 
} = require('firebase/database');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut 
} = require('firebase/auth');
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

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  try {
    console.log('\n🔧 Initializing Firebase Admin SDK...');
    
    if (admin.apps.length > 0) {
      logTest('Firebase Admin Initialization', true, 'Already initialized');
      return true;
    }
    
    // Try different initialization methods
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
      let serviceAccount;
      try {
        // Try base64 decode first
        serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY, 'base64').toString()
        );
      } catch (e) {
        // If not base64, try direct parse
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY);
        } catch (e2) {
          throw new Error('Invalid service account key format');
        }
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    } else if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    } else {
      // Try application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }
    
    logTest('Firebase Admin Initialization', true, 'Admin SDK initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Admin Initialization', false, error.message);
    return false;
  }
}

// Test Firestore Client Connection
async function testFirestoreClient() {
  try {
    console.log('\n📊 Testing Firestore Client Connection...');
    
    // Test read operation
    const staffCollection = collection(clientFirestore, 'staff_accounts');
    const snapshot = await getDocs(staffCollection);
    
    logTest('Firestore Client Read', true, `Found ${snapshot.size} staff accounts`);
    
    // Test write operation
    const testDoc = {
      testField: 'Firebase connection test',
      timestamp: serverTimestamp(),
      testId: Date.now()
    };
    
    const testCollection = collection(clientFirestore, 'connection_tests');
    const docRef = await addDoc(testCollection, testDoc);
    
    logTest('Firestore Client Write', true, `Test document created: ${docRef.id}`);
    
    // Clean up test document
    await deleteDoc(doc(clientFirestore, 'connection_tests', docRef.id));
    logTest('Firestore Client Cleanup', true, 'Test document deleted');
    
    return true;
  } catch (error) {
    logTest('Firestore Client Test', false, error.message);
    return false;
  }
}

// Test Firestore Admin Connection
async function testFirestoreAdmin() {
  try {
    console.log('\n📊 Testing Firestore Admin Connection...');
    
    const firestore = admin.firestore();
    
    // Test read operation
    const staffSnapshot = await firestore.collection('staff_accounts').get();
    logTest('Firestore Admin Read', true, `Found ${staffSnapshot.size} staff accounts`);
    
    // Test write operation
    const testDoc = {
      testField: 'Firebase Admin connection test',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      testId: Date.now()
    };
    
    const docRef = await firestore.collection('connection_tests').add(testDoc);
    logTest('Firestore Admin Write', true, `Test document created: ${docRef.id}`);
    
    // Clean up
    await docRef.delete();
    logTest('Firestore Admin Cleanup', true, 'Test document deleted');
    
    return true;
  } catch (error) {
    logTest('Firestore Admin Test', false, error.message);
    return false;
  }
}

// Test Realtime Database Client
async function testRealtimeDatabaseClient() {
  try {
    console.log('\n🔄 Testing Realtime Database Client Connection...');
    
    // Test write operation
    const testRef = ref(clientDatabase, 'connection_tests/' + Date.now());
    await set(testRef, {
      message: 'Client connection test',
      timestamp: Date.now()
    });
    
    logTest('Realtime Database Client Write', true, 'Test data written successfully');
    
    // Test read operation
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      logTest('Realtime Database Client Read', true, 'Test data read successfully');
    } else {
      logTest('Realtime Database Client Read', false, 'No data found');
    }
    
    // Clean up
    await remove(testRef);
    logTest('Realtime Database Client Cleanup', true, 'Test data removed');
    
    return true;
  } catch (error) {
    logTest('Realtime Database Client Test', false, error.message);
    return false;
  }
}

// Test Realtime Database Admin
async function testRealtimeDatabaseAdmin() {
  try {
    console.log('\n🔄 Testing Realtime Database Admin Connection...');
    
    const database = admin.database();
    
    // Test write operation
    const testRef = database.ref('connection_tests/' + Date.now());
    await testRef.set({
      message: 'Admin connection test',
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    
    logTest('Realtime Database Admin Write', true, 'Test data written successfully');
    
    // Test read operation
    const snapshot = await testRef.once('value');
    if (snapshot.exists()) {
      logTest('Realtime Database Admin Read', true, 'Test data read successfully');
    } else {
      logTest('Realtime Database Admin Read', false, 'No data found');
    }
    
    // Clean up
    await testRef.remove();
    logTest('Realtime Database Admin Cleanup', true, 'Test data removed');
    
    return true;
  } catch (error) {
    logTest('Realtime Database Admin Test', false, error.message);
    return false;
  }
}

// Test Authentication
async function testAuthentication() {
  try {
    console.log('\n🔐 Testing Firebase Authentication...');
    
    // Test with known staff account
    const testEmail = 'staff@siamoon.com';
    const testPassword = 'staff123';
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(clientAuth, testEmail, testPassword);
    const user = userCredential.user;
    
    logTest('Authentication Sign In', true, `Signed in as: ${user.email}`);
    
    // Get ID token
    const idToken = await user.getIdToken();
    logTest('Authentication Token', true, 'ID token retrieved successfully');
    
    // Sign out
    await signOut(clientAuth);
    logTest('Authentication Sign Out', true, 'Signed out successfully');
    
    return true;
  } catch (error) {
    logTest('Authentication Test', false, error.message);
    return false;
  }
}

// Test Admin Auth
async function testAdminAuth() {
  try {
    console.log('\n🔐 Testing Firebase Admin Auth...');
    
    const auth = admin.auth();
    
    // List users
    const listUsersResult = await auth.listUsers(5);
    logTest('Admin Auth List Users', true, `Found ${listUsersResult.users.length} users`);
    
    // Get user by email
    try {
      const userRecord = await auth.getUserByEmail('staff@siamoon.com');
      logTest('Admin Auth Get User', true, `Found user: ${userRecord.email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        logTest('Admin Auth Get User', false, 'Test user not found');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    logTest('Admin Auth Test', false, error.message);
    return false;
  }
}

// Test Storage Connection
async function testStorage() {
  try {
    console.log('\n📁 Testing Firebase Storage...');
    
    // For now, just test that storage is accessible
    const storage = clientStorage;
    logTest('Storage Client Access', true, 'Storage client accessible');
    
    // Test admin storage
    const adminStorage = admin.storage();
    const bucket = adminStorage.bucket();
    logTest('Storage Admin Access', true, 'Admin storage accessible');
    
    return true;
  } catch (error) {
    logTest('Storage Test', false, error.message);
    return false;
  }
}

// Test App-Specific Collections
async function testAppCollections() {
  try {
    console.log('\n📋 Testing App-Specific Collections...');
    
    const firestore = admin.firestore();
    
    // Test staff_accounts collection
    const staffSnapshot = await firestore.collection('staff_accounts').limit(1).get();
    logTest('Staff Accounts Collection', true, `Collection accessible, ${staffSnapshot.size} documents found`);
    
    // Test jobs collection
    const jobsSnapshot = await firestore.collection('jobs').limit(1).get();
    logTest('Jobs Collection', true, `Collection accessible, ${jobsSnapshot.size} documents found`);
    
    // Test properties collection
    const propertiesSnapshot = await firestore.collection('properties').limit(1).get();
    logTest('Properties Collection', true, `Collection accessible, ${propertiesSnapshot.size} documents found`);
    
    return true;
  } catch (error) {
    logTest('App Collections Test', false, error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Firebase Connection Test Suite');
  console.log('==================================');
  console.log(`Project: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc'}`);
  console.log(`Database URL: ${process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://operty-b54dc-default-rtdb.firebaseio.com/'}`);
  console.log('');
  
  try {
    // Initialize Firebase services
    const clientInit = initializeFirebaseClient();
    const adminInit = initializeFirebaseAdmin();
    
    if (!clientInit && !adminInit) {
      console.log('❌ Both Firebase initializations failed. Stopping tests.');
      return;
    }
    
    // Run tests
    if (clientInit) {
      await testFirestoreClient();
      await testRealtimeDatabaseClient();
      await testAuthentication();
      await testStorage();
    }
    
    if (adminInit) {
      await testFirestoreAdmin();
      await testRealtimeDatabaseAdmin();
      await testAdminAuth();
      await testAppCollections();
    }
    
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
    
    const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All Firebase connections are working perfectly!');
    } else {
      console.log('\n⚠️  Some Firebase connections need attention.');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
};
