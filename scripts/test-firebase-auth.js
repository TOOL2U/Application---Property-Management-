/**
 * Firebase Authentication Test
 * Tests authentication with known staff accounts
 * 
 * Run with: node scripts/test-firebase-auth.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut 
} = require('firebase/auth');

require('dotenv').config({ path: '.env.local' });

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

// Test accounts from our staff_accounts collection
const testAccounts = [
  { email: 'admin@siamoon.com', password: 'admin123', role: 'admin' },
  { email: 'staff@siamoon.com', password: 'staff123', role: 'staff' },
  { email: 'alan@example.com', password: 'alan123', role: 'maintenance' },
  { email: 'test@example.com', password: 'test123', role: 'manager' }
];

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

// Initialize Firebase
let app, auth;

function initializeFirebase() {
  try {
    console.log('🔧 Initializing Firebase for Authentication Test...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test authentication with a specific account
async function testAccountAuthentication(account) {
  try {
    console.log(`\n🔐 Testing authentication for: ${account.email} (${account.role})`);
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
    const user = userCredential.user;
    
    logTest(`Auth Sign In - ${account.email}`, true, `Successfully signed in`);
    
    // Get user details
    console.log(`   User ID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Creation Time: ${user.metadata.creationTime}`);
    console.log(`   Last Sign In: ${user.metadata.lastSignInTime}`);
    
    // Get ID token
    const idToken = await user.getIdToken();
    logTest(`Auth Token - ${account.email}`, true, `ID token retrieved (${idToken.length} chars)`);
    
    // Get ID token result with claims
    const idTokenResult = await user.getIdTokenResult();
    console.log(`   Token Claims:`, idTokenResult.claims);
    
    if (idTokenResult.claims.role) {
      logTest(`Auth Role Claims - ${account.email}`, true, `Role: ${idTokenResult.claims.role}`);
    } else {
      logTest(`Auth Role Claims - ${account.email}`, false, 'No role claim found');
    }
    
    // Sign out
    await signOut(auth);
    logTest(`Auth Sign Out - ${account.email}`, true, 'Successfully signed out');
    
    return true;
  } catch (error) {
    logTest(`Auth Test - ${account.email}`, false, error.message);
    
    // Try to sign out in case of partial success
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (signOutError) {
      // Ignore sign out errors
    }
    
    return false;
  }
}

// Test authentication state persistence
async function testAuthStatePersistence() {
  try {
    console.log('\n🔄 Testing Authentication State Persistence...');
    
    // Sign in with admin account
    const adminAccount = testAccounts.find(acc => acc.role === 'admin');
    if (!adminAccount) {
      throw new Error('Admin account not found in test accounts');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, adminAccount.email, adminAccount.password);
    const user = userCredential.user;
    
    logTest('Auth State - Sign In', true, `Signed in as ${user.email}`);
    
    // Check current user
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === user.uid) {
      logTest('Auth State - Current User', true, 'Current user matches signed in user');
    } else {
      logTest('Auth State - Current User', false, 'Current user does not match');
    }
    
    // Test auth state listener
    let listenerTriggered = false;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      listenerTriggered = true;
      console.log(`   Auth state changed: ${user ? user.email : 'signed out'}`);
    });
    
    // Wait a moment for listener to trigger
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (listenerTriggered) {
      logTest('Auth State - Listener', true, 'Auth state listener triggered');
    } else {
      logTest('Auth State - Listener', false, 'Auth state listener not triggered');
    }
    
    unsubscribe();
    
    // Sign out
    await signOut(auth);
    logTest('Auth State - Sign Out', true, 'Successfully signed out');
    
    return true;
  } catch (error) {
    logTest('Auth State Persistence Test', false, error.message);
    return false;
  }
}

// Test password validation
async function testPasswordValidation() {
  try {
    console.log('\n🔒 Testing Password Validation...');
    
    const testAccount = testAccounts[0];
    
    // Test with wrong password
    try {
      await signInWithEmailAndPassword(auth, testAccount.email, 'wrong_password');
      logTest('Password Validation - Wrong Password', false, 'Should have failed with wrong password');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        logTest('Password Validation - Wrong Password', true, 'Correctly rejected wrong password');
      } else {
        logTest('Password Validation - Wrong Password', false, `Unexpected error: ${error.message}`);
      }
    }
    
    // Test with non-existent email
    try {
      await signInWithEmailAndPassword(auth, 'nonexistent@example.com', 'any_password');
      logTest('Password Validation - Non-existent Email', false, 'Should have failed with non-existent email');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        logTest('Password Validation - Non-existent Email', true, 'Correctly rejected non-existent email');
      } else {
        logTest('Password Validation - Non-existent Email', false, `Unexpected error: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logTest('Password Validation Test', false, error.message);
    return false;
  }
}

// Main test function
async function runAuthTests() {
  console.log('🚀 Firebase Authentication Test Suite');
  console.log('======================================');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
  console.log('');
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test each account
    for (const account of testAccounts) {
      await testAccountAuthentication(account);
    }
    
    // Test auth state persistence
    await testAuthStatePersistence();
    
    // Test password validation
    await testPasswordValidation();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 AUTHENTICATION TEST SUMMARY');
    console.log('===============================');
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
      console.log('\n🎉 All authentication tests passed!');
      console.log('\n✅ AUTHENTICATION STATUS:');
      console.log('• Firebase Authentication is working correctly');
      console.log('• All test accounts can sign in successfully');
      console.log('• Password validation is working');
      console.log('• Auth state management is functional');
    } else {
      console.log('\n⚠️  Some authentication tests failed.');
      console.log('\n📋 RECOMMENDATIONS:');
      console.log('• Check if test account passwords are correct');
      console.log('• Verify Firebase Authentication is enabled');
      console.log('• Check Firebase Security Rules');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runAuthTests();
}

module.exports = {
  runAuthTests,
  testResults
};
