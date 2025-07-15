/**
 * Basic Job Assignment Integration Test
 * Tests Firebase integration and job assignment functionality
 * 
 * Run with: node scripts/test-job-assignment-basic.js
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
  serverTimestamp,
  updateDoc,
  doc,
  getDoc
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
    console.log('🔧 Initializing Firebase for job assignment test...');
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test 1: Validate environment and staff accounts
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
      return null;
    }
    
    const staffDoc = staffSnapshot.docs[0];
    const staffData = staffDoc.data();
    logTest('Staff Account Exists', true, `Found staff: ${staffData.name} (${staffData.role})`);
    
    // Check if admin account exists
    const adminQuery = query(
      collection(firestore, 'staff_accounts'),
      where('email', '==', TEST_CONFIG.adminId)
    );
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      logTest('Admin Account Exists', false, `Admin account ${TEST_CONFIG.adminId} not found`);
      return null;
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    logTest('Admin Account Exists', true, `Found admin: ${adminData.name} (${adminData.role})`);
    
    return { staffDoc, adminDoc };
  } catch (error) {
    logTest('Environment Setup Test', false, error.message);
    return null;
  }
}

// Test 2: Create job assignment directly in Firestore
async function testJobAssignmentCreation(staffDoc, adminDoc) {
  try {
    console.log('\n📋 Testing Job Assignment Creation...');
    
    const jobAssignment = {
      staffId: staffDoc.id,
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
      assignedBy: adminDoc.id,
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
      console.log(`   Scheduled: ${jobData.scheduledFor?.toDate?.()?.toLocaleString() || 'Invalid date'}`);
      
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

// Test 3: Test real-time listener functionality
async function testRealTimeListener(staffId) {
  return new Promise((resolve) => {
    console.log('\n🔄 Testing Real-time Job Listener...');
    
    let timeoutId;
    let unsubscribe;
    let jobsReceived = 0;
    
    const timeout = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      logTest('Real-time Job Listener', jobsReceived > 0, `Received ${jobsReceived} job updates`);
      resolve(jobsReceived > 0);
    }, 5000); // 5 second timeout
    
    // Listen for jobs assigned to this staff member
    const jobQuery = query(
      collection(firestore, 'job_assignments'),
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    unsubscribe = onSnapshot(jobQuery, (snapshot) => {
      jobsReceived = snapshot.size;
      console.log(`   📱 Real-time update: ${jobsReceived} jobs found for staff`);
      
      snapshot.forEach((doc) => {
        const job = doc.data();
        if (job.title && job.title.includes('Integration Test')) {
          console.log(`   🎯 Found test job: ${job.title} (${job.status})`);
        }
      });
    }, (error) => {
      clearTimeout(timeout);
      logTest('Real-time Job Listener', false, error.message);
      resolve(false);
    });
  });
}

// Test 4: Test job status update
async function testJobStatusUpdate(jobId, staffId) {
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
        console.log(`   Updated At: ${jobData.updatedAt?.toDate?.()?.toLocaleString() || 'Invalid date'}`);
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

// Test 5: Test job completion workflow
async function testJobCompletion(jobId, staffId) {
  try {
    console.log('\n🎉 Testing Job Completion...');
    
    const jobRef = doc(firestore, 'job_assignments', jobId);
    
    // First, start the job
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
        console.log(`   Requirements Completed: ${jobData.requirements?.filter(r => r.isCompleted).length || 0}/${jobData.requirements?.length || 0}`);
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

// Test 6: Test job events logging
async function testJobEventsLogging(jobId) {
  try {
    console.log('\n📊 Testing Job Events Logging...');
    
    // Create a job event
    const jobEvent = {
      type: 'job_status_changed',
      jobId: jobId,
      staffId: TEST_CONFIG.staffId,
      timestamp: serverTimestamp(),
      data: { 
        status: 'completed', 
        previousStatus: 'in_progress' 
      },
      triggeredBy: TEST_CONFIG.staffId,
      source: 'mobile'
    };
    
    const eventRef = await addDoc(collection(firestore, 'job_events'), jobEvent);
    
    // Query for events related to this job
    const eventsQuery = query(
      collection(firestore, 'job_events'),
      where('jobId', '==', jobId)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    
    if (eventsSnapshot.size > 0) {
      logTest('Job Events Logging', true, `Found ${eventsSnapshot.size} job events`);
      
      console.log('   Job Events:');
      eventsSnapshot.forEach((doc, index) => {
        const event = doc.data();
        console.log(`   ${index + 1}. ${event.type} - ${event.source} (${event.timestamp?.toDate?.()?.toLocaleString() || 'Invalid date'})`);
      });
      
      return true;
    } else {
      logTest('Job Events Logging', false, 'No job events found');
      return false;
    }
    
  } catch (error) {
    logTest('Job Events Logging', false, error.message);
    return false;
  }
}

// Main test function
async function runBasicIntegrationTests() {
  console.log('🚀 Basic Job Assignment Integration Test');
  console.log('========================================');
  console.log(`Staff ID: ${TEST_CONFIG.staffId}`);
  console.log(`Admin ID: ${TEST_CONFIG.adminId}`);
  console.log(`Property ID: ${TEST_CONFIG.propertyId}`);
  console.log('');
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test 1: Environment setup
    const accounts = await testEnvironmentSetup();
    if (!accounts) {
      console.log('❌ Environment setup failed. Stopping tests.');
      return;
    }
    
    // Test 2: Job assignment creation
    const createdJob = await testJobAssignmentCreation(accounts.staffDoc, accounts.adminDoc);
    if (!createdJob) {
      console.log('❌ Job assignment creation failed. Stopping tests.');
      return;
    }
    
    // Test 3: Real-time listener
    await testRealTimeListener(accounts.staffDoc.id);
    
    // Test 4: Job status update
    await testJobStatusUpdate(createdJob.id, accounts.staffDoc.id);
    
    // Test 5: Job completion
    await testJobCompletion(createdJob.id, accounts.staffDoc.id);
    
    // Test 6: Job events logging
    await testJobEventsLogging(createdJob.id);
    
  } catch (error) {
    console.error('❌ Integration test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 BASIC INTEGRATION TEST SUMMARY');
    console.log('==================================');
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
      console.log('\n🎉 All basic integration tests passed!');
      console.log('\n✅ JOB ASSIGNMENT INTEGRATION STATUS:');
      console.log('• Firebase connection working');
      console.log('• Job assignment creation functional');
      console.log('• Real-time synchronization operational');
      console.log('• Job status updates working');
      console.log('• Job completion workflow functional');
      console.log('• Audit trail being maintained');
    } else {
      console.log('\n⚠️  Some integration tests failed.');
      console.log('\n📋 NEXT STEPS:');
      console.log('• Check Firebase security rules');
      console.log('• Verify Firestore collections exist');
      console.log('• Validate environment configuration');
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runBasicIntegrationTests();
}

module.exports = {
  runBasicIntegrationTests,
  testResults
};
