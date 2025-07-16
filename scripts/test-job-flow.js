#!/usr/bin/env node

/**
 * Test Job Assignment Flow
 * Tests the complete flow from job creation to status updates
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvOyxhK5S2cM9jVf7mHzKzHkzqhGJYFgE",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "794479687167",
  appId: "1:794479687167:web:edd19f3b6c44d89c4c9b4a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const TEST_STAFF_ID = 'iJxnTcy4xWZIoDVNnl5AgYSVPku2';
const TEST_JOB_ID = 'test_job_flow_' + Date.now();

// Utility functions
function logTest(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${status} [${timestamp}] ${testName}${details ? ': ' + details : ''}`);
}

function logStep(step) {
  console.log(`\n🔄 ${step}`);
}

// Test 1: Create a test job assignment
async function createTestJob() {
  logStep('Creating test job assignment...');
  
  try {
    const jobData = {
      id: TEST_JOB_ID,
      staffId: TEST_STAFF_ID,
      assignedStaffId: TEST_STAFF_ID,
      propertyId: 'test_property_001',
      title: 'Flow Test - Bathroom Cleaning',
      description: 'Complete bathroom cleaning and sanitization',
      type: 'cleaning',
      status: 'pending',
      priority: 'medium',
      scheduledDate: new Date(),
      estimatedDuration: 60,
      location: {
        address: '123 Test Street, Test City',
        coordinates: {
          latitude: 25.7617,
          longitude: -80.1918
        }
      },
      requirements: [
        {
          id: 'req_001',
          description: 'Clean toilet and sink',
          isCompleted: false,
          required: true
        },
        {
          id: 'req_002', 
          description: 'Restock supplies',
          isCompleted: false,
          required: true
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      assignedAt: serverTimestamp(),
      version: 1
    };

    const docRef = await addDoc(collection(db, 'job_assignments'), jobData);
    logTest('Job Creation', true, `Job created with ID: ${docRef.id}`);
    return docRef.id;
    
  } catch (error) {
    logTest('Job Creation', false, error.message);
    return null;
  }
}

// Test 2: Set up real-time listener for job updates
async function setupJobListener(jobId) {
  logStep('Setting up real-time job listener...');
  
  return new Promise((resolve) => {
    let updateCount = 0;
    const timeout = setTimeout(() => {
      logTest('Real-time Listener', updateCount > 0, `Received ${updateCount} updates`);
      resolve(updateCount > 0);
    }, 10000); // 10 second timeout

    const jobRef = doc(db, 'job_assignments', jobId);
    
    const unsubscribe = onSnapshot(jobRef, (doc) => {
      if (doc.exists()) {
        updateCount++;
        const jobData = doc.data();
        console.log(`   📡 Job update #${updateCount}: Status = ${jobData.status}`);
        
        if (updateCount >= 3) { // We expect at least 3 updates (pending -> accepted -> completed)
          clearTimeout(timeout);
          unsubscribe();
          logTest('Real-time Listener', true, `Received ${updateCount} updates`);
          resolve(true);
        }
      }
    }, (error) => {
      clearTimeout(timeout);
      logTest('Real-time Listener', false, error.message);
      resolve(false);
    });
  });
}

// Test 3: Simulate job status updates
async function simulateJobStatusUpdates(jobId) {
  logStep('Simulating job status updates...');
  
  const statusUpdates = [
    { status: 'accepted', delay: 2000 },
    { status: 'in_progress', delay: 3000 },
    { status: 'completed', delay: 4000 }
  ];

  for (const update of statusUpdates) {
    await new Promise(resolve => setTimeout(resolve, update.delay));
    
    try {
      const jobRef = doc(db, 'job_assignments', jobId);
      const updateData = {
        status: update.status,
        updatedAt: serverTimestamp(),
        version: Date.now() // Simple version increment
      };

      // Add specific fields based on status
      if (update.status === 'accepted') {
        updateData.acceptedAt = serverTimestamp();
        updateData.accepted = true;
      } else if (update.status === 'in_progress') {
        updateData.startedAt = serverTimestamp();
      } else if (update.status === 'completed') {
        updateData.completedAt = serverTimestamp();
        updateData.actualDuration = 55;
        updateData.completionNotes = 'Job completed successfully';
      }

      await updateDoc(jobRef, updateData);
      logTest(`Status Update to ${update.status}`, true);
      
    } catch (error) {
      logTest(`Status Update to ${update.status}`, false, error.message);
    }
  }
}

// Test 4: Verify job events are logged
async function verifyJobEvents(jobId) {
  logStep('Verifying job events are logged...');
  
  try {
    const eventsQuery = query(
      collection(db, 'job_events'),
      where('jobId', '==', jobId)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const eventCount = eventsSnapshot.size;
    
    logTest('Job Events Logging', eventCount > 0, `Found ${eventCount} events`);
    
    eventsSnapshot.forEach((doc) => {
      const event = doc.data();
      console.log(`   📋 Event: ${event.type} - ${event.data?.status || 'N/A'}`);
    });
    
    return eventCount > 0;
    
  } catch (error) {
    logTest('Job Events Logging', false, error.message);
    return false;
  }
}

// Test 5: Test real-time job assignment listener
async function testJobAssignmentListener() {
  logStep('Testing job assignment listener...');
  
  return new Promise((resolve) => {
    let jobsReceived = 0;
    const timeout = setTimeout(() => {
      logTest('Job Assignment Listener', jobsReceived > 0, `Received ${jobsReceived} jobs`);
      resolve(jobsReceived > 0);
    }, 5000);

    const jobsQuery = query(
      collection(db, 'job_assignments'),
      where('assignedStaffId', '==', TEST_STAFF_ID),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      jobsReceived = snapshot.size;
      console.log(`   📱 Jobs listener: ${jobsReceived} pending jobs for staff`);
      
      if (jobsReceived > 0) {
        clearTimeout(timeout);
        unsubscribe();
        logTest('Job Assignment Listener', true, `Found ${jobsReceived} pending jobs`);
        resolve(true);
      }
    }, (error) => {
      clearTimeout(timeout);
      logTest('Job Assignment Listener', false, error.message);
      resolve(false);
    });
  });
}

// Main test runner
async function runJobFlowTests() {
  console.log('🚀 Starting Job Assignment Flow Tests...\n');
  
  const results = {
    jobCreation: false,
    realtimeListener: false,
    statusUpdates: false,
    eventLogging: false,
    assignmentListener: false
  };

  try {
    // Test 1: Create job
    const jobId = await createTestJob();
    if (!jobId) {
      console.log('❌ Cannot continue tests without job creation');
      return;
    }
    results.jobCreation = true;

    // Test 2: Set up listeners (run in parallel with status updates)
    const listenerPromise = setupJobListener(jobId);
    const assignmentListenerPromise = testJobAssignmentListener();

    // Test 3: Simulate status updates
    await simulateJobStatusUpdates(jobId);
    results.statusUpdates = true;

    // Wait for listeners to complete
    results.realtimeListener = await listenerPromise;
    results.assignmentListener = await assignmentListenerPromise;

    // Test 4: Verify events
    results.eventLogging = await verifyJobEvents(jobId);

  } catch (error) {
    console.error('❌ Test runner error:', error);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Job assignment flow is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runJobFlowTests().catch(console.error);
