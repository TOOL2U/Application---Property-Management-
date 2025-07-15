/**
 * Job Assignment Write Test
 * Tests job assignment creation and updates with new Firestore rules
 * 
 * Run with: node scripts/test-job-assignment-write.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  deleteDoc
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
  propertyId: 'test-property-001',
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
    console.log('🔧 Initializing Firebase for write test...');
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test 1: Create job assignment
async function testJobAssignmentCreation() {
  try {
    console.log('\n📋 Testing Job Assignment Creation...');
    
    const jobAssignment = {
      staffId: TEST_CONFIG.staffId,
      propertyId: TEST_CONFIG.propertyId,
      title: 'Integration Test - Deep Clean Apartment',
      description: 'This is a test job assignment created by the integration test script.',
      type: 'cleaning',
      priority: 'medium',
      estimatedDuration: 90,
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      location: {
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        accessInstructions: 'Use the side entrance'
      },
      requirements: [
        {
          id: 'req_1',
          description: 'Clean all surfaces thoroughly',
          isRequired: true,
          isCompleted: false
        },
        {
          id: 'req_2',
          description: 'Vacuum all carpets',
          isRequired: true,
          isCompleted: false
        }
      ],
      assignedBy: TEST_CONFIG.adminId,
      assignedAt: serverTimestamp(),
      status: 'assigned',
      accepted: false,
      photos: [],
      notificationsSent: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1
    };
    
    console.log('📤 Creating job assignment in Firestore...');
    
    const docRef = await addDoc(collection(firestore, 'job_assignments'), jobAssignment);
    
    logTest('Job Assignment Creation', true, `Job created with ID: ${docRef.id}`);
    
    // Verify the job was created
    const createdJob = await getDoc(docRef);
    if (createdJob.exists()) {
      const jobData = createdJob.data();
      console.log(`   Job Title: ${jobData.title}`);
      console.log(`   Status: ${jobData.status}`);
      console.log(`   Staff ID: ${jobData.staffId}`);
      
      return { id: docRef.id, ...jobData };
    } else {
      logTest('Job Verification', false, 'Created job not found');
      return null;
    }
    
  } catch (error) {
    logTest('Job Assignment Creation', false, error.message);
    return null;
  }
}

// Test 2: Update job status (simulate mobile app acceptance)
async function testJobStatusUpdate(jobId) {
  try {
    console.log('\n📱 Testing Job Status Update...');
    
    const jobRef = doc(firestore, 'job_assignments', jobId);
    
    // Update job status to accepted
    const updateData = {
      status: 'accepted',
      accepted: true,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 2
    };
    
    console.log('📤 Updating job status to accepted...');
    
    await updateDoc(jobRef, updateData);
    
    // Verify the update
    const updatedJob = await getDoc(jobRef);
    if (updatedJob.exists()) {
      const jobData = updatedJob.data();
      
      if (jobData.status === 'accepted' && jobData.accepted === true) {
        logTest('Job Status Update', true, `Job status updated to: ${jobData.status}`);
        console.log(`   Accepted: ${jobData.accepted}`);
        return true;
      } else {
        logTest('Job Status Update', false, 'Status update not reflected correctly');
        return false;
      }
    } else {
      logTest('Job Status Update', false, 'Job not found after update');
      return false;
    }
    
  } catch (error) {
    logTest('Job Status Update', false, error.message);
    return false;
  }
}

// Test 3: Create job event (audit trail)
async function testJobEventCreation(jobId) {
  try {
    console.log('\n📊 Testing Job Event Creation...');
    
    const jobEvent = {
      type: 'job_status_changed',
      jobId: jobId,
      staffId: TEST_CONFIG.staffId,
      timestamp: serverTimestamp(),
      data: { 
        status: 'accepted', 
        previousStatus: 'assigned' 
      },
      triggeredBy: TEST_CONFIG.staffId,
      source: 'mobile'
    };
    
    console.log('📤 Creating job event...');
    
    const eventRef = await addDoc(collection(firestore, 'job_events'), jobEvent);
    
    logTest('Job Event Creation', true, `Job event created with ID: ${eventRef.id}`);
    
    // Verify the event was created
    const createdEvent = await getDoc(eventRef);
    if (createdEvent.exists()) {
      const eventData = createdEvent.data();
      console.log(`   Event Type: ${eventData.type}`);
      console.log(`   Job ID: ${eventData.jobId}`);
      console.log(`   Source: ${eventData.source}`);
      
      return { id: eventRef.id, ...eventData };
    } else {
      logTest('Job Event Verification', false, 'Created event not found');
      return null;
    }
    
  } catch (error) {
    logTest('Job Event Creation', false, error.message);
    return null;
  }
}

// Test 4: Query job assignments by staff
async function testStaffJobQuery() {
  try {
    console.log('\n🔍 Testing Staff Job Query...');
    
    const staffJobsQuery = query(
      collection(firestore, 'job_assignments'),
      where('staffId', '==', TEST_CONFIG.staffId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const staffJobsSnapshot = await getDocs(staffJobsQuery);
    
    logTest('Staff Job Query', true, `Found ${staffJobsSnapshot.size} jobs for staff ${TEST_CONFIG.staffId}`);
    
    if (staffJobsSnapshot.size > 0) {
      console.log(`   Jobs for ${TEST_CONFIG.staffId}:`);
      staffJobsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.title || 'Untitled'} - Status: ${data.status || 'No status'}`);
      });
    }
    
    return true;
  } catch (error) {
    logTest('Staff Job Query', false, error.message);
    return false;
  }
}

// Test 5: Complete job workflow
async function testJobCompletion(jobId) {
  try {
    console.log('\n🎉 Testing Job Completion Workflow...');
    
    const jobRef = doc(firestore, 'job_assignments', jobId);
    
    // Start the job
    await updateDoc(jobRef, {
      status: 'in_progress',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 3
    });
    
    logTest('Job Start', true, 'Job started successfully');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Complete the job
    const completeData = {
      status: 'completed',
      completedAt: serverTimestamp(),
      actualDuration: 85,
      completionNotes: 'Job completed successfully. All requirements met.',
      updatedAt: serverTimestamp(),
      version: 4,
      requirements: [
        {
          id: 'req_1',
          description: 'Clean all surfaces thoroughly',
          isRequired: true,
          isCompleted: true,
          completedAt: serverTimestamp()
        },
        {
          id: 'req_2',
          description: 'Vacuum all carpets',
          isRequired: true,
          isCompleted: true,
          completedAt: serverTimestamp()
        }
      ]
    };
    
    console.log('📤 Completing job...');
    
    await updateDoc(jobRef, completeData);
    
    // Verify completion
    const completedJob = await getDoc(jobRef);
    if (completedJob.exists()) {
      const jobData = completedJob.data();
      
      if (jobData.status === 'completed') {
        logTest('Job Completion', true, 'Job completed successfully');
        console.log(`   Actual Duration: ${jobData.actualDuration} minutes`);
        console.log(`   Completion Notes: ${jobData.completionNotes}`);
        return true;
      } else {
        logTest('Job Completion', false, 'Job completion not reflected correctly');
        return false;
      }
    } else {
      logTest('Job Completion', false, 'Job not found after completion');
      return false;
    }
    
  } catch (error) {
    logTest('Job Completion', false, error.message);
    return false;
  }
}

// Test 6: Clean up test data
async function testCleanup(jobId, eventId) {
  try {
    console.log('\n🧹 Testing Cleanup...');
    
    // Delete test job
    if (jobId) {
      await deleteDoc(doc(firestore, 'job_assignments', jobId));
      logTest('Job Cleanup', true, 'Test job deleted successfully');
    }
    
    // Delete test event
    if (eventId) {
      await deleteDoc(doc(firestore, 'job_events', eventId));
      logTest('Event Cleanup', true, 'Test event deleted successfully');
    }
    
    return true;
  } catch (error) {
    logTest('Cleanup', false, error.message);
    return false;
  }
}

// Main test function
async function runWriteTests() {
  console.log('🚀 Job Assignment Write Test Suite');
  console.log('===================================');
  console.log(`Staff ID: ${TEST_CONFIG.staffId}`);
  console.log(`Admin ID: ${TEST_CONFIG.adminId}`);
  console.log(`Property ID: ${TEST_CONFIG.propertyId}`);
  console.log('');
  
  let createdJobId = null;
  let createdEventId = null;
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test 1: Create job assignment
    const createdJob = await testJobAssignmentCreation();
    if (createdJob) {
      createdJobId = createdJob.id;
    }
    
    // Test 2: Update job status
    if (createdJobId) {
      await testJobStatusUpdate(createdJobId);
    }
    
    // Test 3: Create job event
    if (createdJobId) {
      const createdEvent = await testJobEventCreation(createdJobId);
      if (createdEvent) {
        createdEventId = createdEvent.id;
      }
    }
    
    // Test 4: Query staff jobs
    await testStaffJobQuery();
    
    // Test 5: Complete job workflow
    if (createdJobId) {
      await testJobCompletion(createdJobId);
    }
    
    // Test 6: Cleanup
    await testCleanup(createdJobId, createdEventId);
    
  } catch (error) {
    console.error('❌ Write test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 WRITE TEST SUMMARY');
    console.log('======================');
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
      console.log('\n🎉 All write tests passed!');
      console.log('\n✅ JOB ASSIGNMENT INTEGRATION STATUS:');
      console.log('• Job assignment creation working');
      console.log('• Job status updates functional');
      console.log('• Job event logging operational');
      console.log('• Staff job queries working');
      console.log('• Complete job workflow functional');
      console.log('• Data cleanup successful');
      console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
    } else {
      console.log('\n⚠️  Some write tests failed.');
      console.log('\n📋 NEXT STEPS:');
      console.log('• Check Firestore security rules');
      console.log('• Verify Firebase permissions');
      console.log('• Update security rules if needed');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runWriteTests();
}

module.exports = {
  runWriteTests,
  testResults
};
