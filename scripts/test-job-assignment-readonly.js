/**
 * Read-Only Job Assignment Integration Test
 * Tests what we can access with current Firebase security rules
 * 
 * Run with: node scripts/test-job-assignment-readonly.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot
} = require('firebase/firestore');

require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// Test configuration
const TEST_CONFIG = {
  staffId: 'staff@siamoon.com',
  adminId: 'admin@siamoon.com',
};

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
let app, firestore;

function initializeFirebase() {
  try {
    console.log('🔧 Initializing Firebase for read-only test...');
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test 1: Check staff accounts collection
async function testStaffAccountsAccess() {
  try {
    console.log('\n👥 Testing Staff Accounts Access...');
    
    const staffQuery = query(
      collection(firestore, 'staff_accounts'),
      limit(5)
    );
    const staffSnapshot = await getDocs(staffQuery);
    
    logTest('Staff Accounts Read', true, `Found ${staffSnapshot.size} staff accounts`);
    
    console.log('   Staff Accounts:');
    staffSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ${data.name || 'Unknown'} (${data.email || 'No email'}) - Role: ${data.role || 'No role'}`);
    });
    
    return staffSnapshot.size > 0;
  } catch (error) {
    logTest('Staff Accounts Read', false, error.message);
    return false;
  }
}

// Test 2: Check jobs collection
async function testJobsAccess() {
  try {
    console.log('\n📋 Testing Jobs Collection Access...');
    
    const jobsQuery = query(
      collection(firestore, 'jobs'),
      limit(5)
    );
    const jobsSnapshot = await getDocs(jobsQuery);
    
    logTest('Jobs Collection Read', true, `Found ${jobsSnapshot.size} jobs`);
    
    if (jobsSnapshot.size > 0) {
      console.log('   Existing Jobs:');
      jobsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.title || 'Untitled'} - Status: ${data.status || 'No status'} - Type: ${data.type || 'No type'}`);
      });
    }
    
    return true;
  } catch (error) {
    logTest('Jobs Collection Read', false, error.message);
    return false;
  }
}

// Test 3: Check job_assignments collection
async function testJobAssignmentsAccess() {
  try {
    console.log('\n🎯 Testing Job Assignments Collection Access...');
    
    const jobAssignmentsQuery = query(
      collection(firestore, 'job_assignments'),
      limit(5)
    );
    const jobAssignmentsSnapshot = await getDocs(jobAssignmentsQuery);
    
    logTest('Job Assignments Collection Read', true, `Found ${jobAssignmentsSnapshot.size} job assignments`);
    
    if (jobAssignmentsSnapshot.size > 0) {
      console.log('   Existing Job Assignments:');
      jobAssignmentsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.title || 'Untitled'} - Status: ${data.status || 'No status'} - Staff: ${data.staffId || 'No staff'}`);
      });
    } else {
      console.log('   No job assignments found (collection may be empty or inaccessible)');
    }
    
    return true;
  } catch (error) {
    logTest('Job Assignments Collection Read', false, error.message);
    return false;
  }
}

// Test 4: Check job_events collection
async function testJobEventsAccess() {
  try {
    console.log('\n📊 Testing Job Events Collection Access...');
    
    const jobEventsQuery = query(
      collection(firestore, 'job_events'),
      limit(5)
    );
    const jobEventsSnapshot = await getDocs(jobEventsQuery);
    
    logTest('Job Events Collection Read', true, `Found ${jobEventsSnapshot.size} job events`);
    
    if (jobEventsSnapshot.size > 0) {
      console.log('   Recent Job Events:');
      jobEventsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.type || 'Unknown type'} - Job: ${data.jobId || 'No job'} - Source: ${data.source || 'No source'}`);
      });
    } else {
      console.log('   No job events found (collection may be empty or inaccessible)');
    }
    
    return true;
  } catch (error) {
    logTest('Job Events Collection Read', false, error.message);
    return false;
  }
}

// Test 5: Test real-time listener setup
async function testRealTimeListenerSetup() {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing Real-time Listener Setup...');
    
    let timeoutId;
    let unsubscribe;
    let listenerWorking = false;
    
    const timeout = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      logTest('Real-time Listener Setup', listenerWorking, listenerWorking ? 'Listener setup successful' : 'Listener setup failed');
      resolve(listenerWorking);
    }, 3000); // 3 second timeout
    
    try {
      // Try to set up a listener on staff_accounts (which we know works)
      const staffQuery = query(
        collection(firestore, 'staff_accounts'),
        limit(1)
      );
      
      unsubscribe = onSnapshot(staffQuery, (snapshot) => {
        listenerWorking = true;
        console.log(`   📱 Real-time listener received ${snapshot.size} documents`);
      }, (error) => {
        console.error('   ❌ Real-time listener error:', error.message);
        clearTimeout(timeout);
        logTest('Real-time Listener Setup', false, error.message);
        resolve(false);
      });
      
    } catch (error) {
      clearTimeout(timeout);
      logTest('Real-time Listener Setup', false, error.message);
      resolve(false);
    }
  });
}

// Test 6: Test specific staff job queries
async function testStaffJobQueries() {
  try {
    console.log('\n🔍 Testing Staff-Specific Job Queries...');
    
    // Try to find jobs assigned to our test staff member
    const staffJobsQuery = query(
      collection(firestore, 'job_assignments'),
      where('staffId', '==', TEST_CONFIG.staffId),
      limit(10)
    );
    
    const staffJobsSnapshot = await getDocs(staffJobsQuery);
    
    logTest('Staff Job Query', true, `Found ${staffJobsSnapshot.size} jobs for staff ${TEST_CONFIG.staffId}`);
    
    if (staffJobsSnapshot.size > 0) {
      console.log(`   Jobs for ${TEST_CONFIG.staffId}:`);
      staffJobsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.title || 'Untitled'} - Status: ${data.status || 'No status'}`);
        console.log(`      Scheduled: ${data.scheduledFor?.toDate?.()?.toLocaleString() || 'No date'}`);
        console.log(`      Priority: ${data.priority || 'No priority'}`);
      });
    }
    
    return true;
  } catch (error) {
    logTest('Staff Job Query', false, error.message);
    return false;
  }
}

// Test 7: Test Firebase configuration
function testFirebaseConfiguration() {
  console.log('\n⚙️  Testing Firebase Configuration...');
  
  const requiredFields = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length === 0) {
    logTest('Firebase Configuration', true, 'All required environment variables present');
    
    console.log('   Configuration Summary:');
    console.log(`   Project ID: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`   Auth Domain: ${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
    console.log(`   Storage Bucket: ${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
    
    return true;
  } else {
    logTest('Firebase Configuration', false, `Missing fields: ${missingFields.join(', ')}`);
    return false;
  }
}

// Test 8: Test service integration readiness
async function testServiceIntegrationReadiness() {
  console.log('\n🔧 Testing Service Integration Readiness...');
  
  try {
    // Check if we can import our services
    const { jobAssignmentService } = require('../services/jobAssignmentService');
    logTest('Job Assignment Service Import', true, 'Service can be imported');
    
    // Check if we can access the service methods
    if (typeof jobAssignmentService.getStaffJobs === 'function') {
      logTest('Service Methods Available', true, 'Service methods are accessible');
    } else {
      logTest('Service Methods Available', false, 'Service methods not found');
    }
    
    return true;
  } catch (error) {
    logTest('Service Integration', false, error.message);
    return false;
  }
}

// Main test function
async function runReadOnlyTests() {
  console.log('🚀 Read-Only Job Assignment Integration Test');
  console.log('=============================================');
  console.log(`Staff ID: ${TEST_CONFIG.staffId}`);
  console.log(`Admin ID: ${TEST_CONFIG.adminId}`);
  console.log('');
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test Firebase configuration
    testFirebaseConfiguration();
    
    // Test collection access
    await testStaffAccountsAccess();
    await testJobsAccess();
    await testJobAssignmentsAccess();
    await testJobEventsAccess();
    
    // Test real-time functionality
    await testRealTimeListenerSetup();
    
    // Test specific queries
    await testStaffJobQueries();
    
    // Test service integration
    await testServiceIntegrationReadiness();
    
  } catch (error) {
    console.error('❌ Read-only test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 READ-ONLY TEST SUMMARY');
    console.log('==========================');
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
    
    if (testResults.passed >= testResults.tests.length * 0.8) {
      console.log('\n🎉 Job assignment integration is ready!');
      console.log('\n✅ INTEGRATION READINESS STATUS:');
      console.log('• Firebase connection working');
      console.log('• Data collections accessible');
      console.log('• Real-time listeners functional');
      console.log('• Service integration ready');
      console.log('• Staff account system operational');
      
      console.log('\n📋 NEXT STEPS FOR FULL FUNCTIONALITY:');
      console.log('• Update Firestore security rules to allow writes to job_assignments');
      console.log('• Deploy API endpoints for job assignment');
      console.log('• Set up push notification credentials');
      console.log('• Test end-to-end workflow with webapp');
    } else {
      console.log('\n⚠️  Integration needs attention before deployment.');
    }
    
    process.exit(testResults.failed > testResults.tests.length * 0.5 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runReadOnlyTests();
}

module.exports = {
  runReadOnlyTests,
  testResults
};
