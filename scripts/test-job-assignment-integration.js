/**
 * End-to-End Job Assignment Integration Test
 * Tests complete workflow from webapp assignment to mobile acceptance
 * 
 * Run with: node scripts/test-job-assignment-integration.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} = require('firebase/firestore');
// Use dynamic import for node-fetch since it's ESM
let fetch;
(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
})();

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
  staffId: 'staff@siamoon.com', // Use existing staff account
  adminId: 'admin@siamoon.com',
  propertyId: 'test-property-001',
  apiBaseUrl: 'http://localhost:3000/api', // Adjust based on your setup
  testTimeout: 30000 // 30 seconds
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
    console.log('🔧 Initializing Firebase for integration test...');
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test 1: Validate test environment
async function testEnvironmentSetup() {
  try {
    console.log('\n🔍 Testing Environment Setup...');
    
    // Check if staff account exists
    const staffQuery = query(
      collection(firestore, 'staff_accounts'),
      where('email', '==', TEST_CONFIG.staffId)
    );
    const staffSnapshot = await getDocs(staffQuery);
    
    if (staffSnapshot.empty) {
      logTest('Staff Account Exists', false, `Staff account ${TEST_CONFIG.staffId} not found`);
      return false;
    }
    
    const staffData = staffSnapshot.docs[0].data();
    logTest('Staff Account Exists', true, `Found staff: ${staffData.name} (${staffData.role})`);
    
    // Check if admin account exists
    const adminQuery = query(
      collection(firestore, 'staff_accounts'),
      where('email', '==', TEST_CONFIG.adminId)
    );
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      logTest('Admin Account Exists', false, `Admin account ${TEST_CONFIG.adminId} not found`);
      return false;
    }
    
    const adminData = adminSnapshot.docs[0].data();
    logTest('Admin Account Exists', true, `Found admin: ${adminData.name} (${adminData.role})`);
    
    return true;
  } catch (error) {
    logTest('Environment Setup Test', false, error.message);
    return false;
  }
}

// Test 2: Create job assignment via API
async function testJobAssignmentAPI() {
  try {
    console.log('\n📋 Testing Job Assignment API...');
    
    const jobRequest = {
      staffId: TEST_CONFIG.staffId,
      propertyId: TEST_CONFIG.propertyId,
      title: 'Integration Test - Deep Clean Apartment',
      description: 'This is a test job assignment created by the integration test script.',
      type: 'cleaning',
      priority: 'medium',
      estimatedDuration: 90,
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      location: {
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        accessInstructions: 'Use the side entrance'
      },
      requirements: [
        {
          description: 'Clean all surfaces thoroughly',
          isRequired: true
        },
        {
          description: 'Vacuum all carpets',
          isRequired: true
        },
        {
          description: 'Take before and after photos',
          isRequired: false
        }
      ],
      assignedBy: TEST_CONFIG.adminId
    };
    
    console.log('📤 Sending job assignment request...');
    
    const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/job-assignment/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logTest('Job Assignment API', false, `HTTP ${response.status}: ${errorText}`);
      return null;
    }
    
    const result = await response.json();
    
    if (result.success) {
      logTest('Job Assignment API', true, `Job created with ID: ${result.jobId}`);
      return result.job;
    } else {
      logTest('Job Assignment API', false, result.error || 'Unknown error');
      return null;
    }
    
  } catch (error) {
    logTest('Job Assignment API', false, error.message);
    return null;
  }
}

// Test 3: Verify real-time job appears in Firestore
async function testRealTimeJobCreation(expectedJobId) {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing Real-time Job Creation...');
    
    let timeoutId;
    let unsubscribe;
    
    const timeout = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      logTest('Real-time Job Creation', false, 'Timeout waiting for job to appear');
      resolve(false);
    }, 10000); // 10 second timeout
    
    // Listen for the specific job
    const jobQuery = query(
      collection(firestore, 'job_assignments'),
      where('staffId', '==', TEST_CONFIG.staffId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    unsubscribe = onSnapshot(jobQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const job = doc.data();
        if (doc.id === expectedJobId || job.title.includes('Integration Test')) {
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          
          logTest('Real-time Job Creation', true, `Job found in Firestore: ${doc.id}`);
          console.log(`   Job Title: ${job.title}`);
          console.log(`   Status: ${job.status}`);
          console.log(`   Scheduled: ${job.scheduledFor?.toDate?.()?.toLocaleString() || job.scheduledFor}`);
          
          resolve(doc.id);
        }
      });
    }, (error) => {
      clearTimeout(timeout);
      logTest('Real-time Job Creation', false, error.message);
      resolve(false);
    });
  });
}

// Test 4: Simulate mobile app job acceptance
async function testJobAcceptance(jobId) {
  try {
    console.log('\n📱 Testing Job Acceptance from Mobile...');
    
    const statusUpdate = {
      jobId: jobId,
      staffId: TEST_CONFIG.staffId,
      status: 'accepted',
      accepted: true
    };
    
    console.log('📤 Sending job acceptance request...');
    
    const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/job-assignment/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusUpdate)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logTest('Job Acceptance API', false, `HTTP ${response.status}: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      logTest('Job Acceptance API', true, `Job accepted successfully`);
      console.log(`   Updated Status: ${result.job.status}`);
      console.log(`   Accepted At: ${result.job.acceptedAt}`);
      return true;
    } else {
      logTest('Job Acceptance API', false, result.error || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    logTest('Job Acceptance API', false, error.message);
    return false;
  }
}

// Test 5: Verify status update propagation
async function testStatusUpdatePropagation(jobId) {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing Status Update Propagation...');
    
    let timeoutId;
    let unsubscribe;
    
    const timeout = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      logTest('Status Update Propagation', false, 'Timeout waiting for status update');
      resolve(false);
    }, 10000); // 10 second timeout
    
    // Listen for status changes
    const jobQuery = query(
      collection(firestore, 'job_assignments'),
      where('staffId', '==', TEST_CONFIG.staffId),
      where('status', '==', 'accepted')
    );
    
    unsubscribe = onSnapshot(jobQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === jobId) {
          const job = doc.data();
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          
          logTest('Status Update Propagation', true, `Status updated to: ${job.status}`);
          console.log(`   Accepted: ${job.accepted}`);
          console.log(`   Accepted At: ${job.acceptedAt?.toDate?.()?.toLocaleString() || job.acceptedAt}`);
          
          resolve(true);
        }
      });
    }, (error) => {
      clearTimeout(timeout);
      logTest('Status Update Propagation', false, error.message);
      resolve(false);
    });
  });
}

// Test 6: Test job completion workflow
async function testJobCompletion(jobId) {
  try {
    console.log('\n🎉 Testing Job Completion Workflow...');
    
    // First, start the job
    const startUpdate = {
      jobId: jobId,
      staffId: TEST_CONFIG.staffId,
      status: 'in_progress',
      startedAt: new Date().toISOString()
    };
    
    let response = await fetch(`${TEST_CONFIG.apiBaseUrl}/job-assignment/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(startUpdate)
    });
    
    if (response.ok) {
      logTest('Job Start', true, 'Job started successfully');
    } else {
      logTest('Job Start', false, `Failed to start job: ${response.status}`);
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Complete the job
    const completeUpdate = {
      jobId: jobId,
      staffId: TEST_CONFIG.staffId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      actualDuration: 85,
      completionNotes: 'Job completed successfully. All requirements met.',
      requirementUpdates: [
        { requirementId: 'req_1', isCompleted: true, notes: 'All surfaces cleaned' },
        { requirementId: 'req_2', isCompleted: true, notes: 'Carpets vacuumed' }
      ]
    };
    
    response = await fetch(`${TEST_CONFIG.apiBaseUrl}/job-assignment/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completeUpdate)
    });
    
    if (response.ok) {
      const result = await response.json();
      logTest('Job Completion', true, 'Job completed successfully');
      console.log(`   Actual Duration: ${result.job.actualDuration} minutes`);
      console.log(`   Completion Notes: ${result.job.completionNotes}`);
      return true;
    } else {
      const errorText = await response.text();
      logTest('Job Completion', false, `Failed to complete job: ${response.status} - ${errorText}`);
      return false;
    }
    
  } catch (error) {
    logTest('Job Completion', false, error.message);
    return false;
  }
}

// Test 7: Verify audit trail
async function testAuditTrail(jobId) {
  try {
    console.log('\n📊 Testing Audit Trail...');
    
    // Check job events
    const eventsQuery = query(
      collection(firestore, 'job_events'),
      where('jobId', '==', jobId),
      orderBy('timestamp', 'asc')
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    
    if (eventsSnapshot.empty) {
      logTest('Audit Trail', false, 'No job events found');
      return false;
    }
    
    const events = [];
    eventsSnapshot.forEach((doc) => {
      events.push(doc.data());
    });
    
    logTest('Audit Trail', true, `Found ${events.length} audit events`);
    
    console.log('   Audit Events:');
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.type} - ${event.source} (${event.timestamp?.toDate?.()?.toLocaleString() || event.timestamp})`);
    });
    
    return true;
  } catch (error) {
    logTest('Audit Trail', false, error.message);
    return false;
  }
}

// Main test function
async function runIntegrationTests() {
  console.log('🚀 Job Assignment Integration Test Suite');
  console.log('=========================================');
  console.log(`Staff ID: ${TEST_CONFIG.staffId}`);
  console.log(`Admin ID: ${TEST_CONFIG.adminId}`);
  console.log(`API Base URL: ${TEST_CONFIG.apiBaseUrl}`);
  console.log('');
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test 1: Environment setup
    const envReady = await testEnvironmentSetup();
    if (!envReady) {
      console.log('❌ Environment setup failed. Stopping tests.');
      return;
    }
    
    // Test 2: Job assignment API
    const createdJob = await testJobAssignmentAPI();
    if (!createdJob) {
      console.log('❌ Job assignment failed. Stopping tests.');
      return;
    }
    
    // Test 3: Real-time job creation
    const jobId = await testRealTimeJobCreation(createdJob.id);
    if (!jobId) {
      console.log('❌ Real-time job creation failed. Stopping tests.');
      return;
    }
    
    // Test 4: Job acceptance
    const accepted = await testJobAcceptance(jobId);
    if (!accepted) {
      console.log('❌ Job acceptance failed. Continuing with remaining tests...');
    }
    
    // Test 5: Status update propagation
    if (accepted) {
      await testStatusUpdatePropagation(jobId);
    }
    
    // Test 6: Job completion
    await testJobCompletion(jobId);
    
    // Test 7: Audit trail
    await testAuditTrail(jobId);
    
  } catch (error) {
    console.error('❌ Integration test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 INTEGRATION TEST SUMMARY');
    console.log('============================');
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
      console.log('\n🎉 All integration tests passed!');
      console.log('\n✅ JOB ASSIGNMENT INTEGRATION STATUS:');
      console.log('• Webapp to mobile job assignment working');
      console.log('• Real-time synchronization functional');
      console.log('• Mobile job acceptance workflow operational');
      console.log('• Status updates propagating correctly');
      console.log('• Audit trail being maintained');
      console.log('• End-to-end workflow complete');
    } else {
      console.log('\n⚠️  Some integration tests failed.');
      console.log('\n📋 NEXT STEPS:');
      console.log('• Fix failed test components');
      console.log('• Verify API endpoints are running');
      console.log('• Check Firebase security rules');
      console.log('• Validate environment configuration');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  testResults
};
