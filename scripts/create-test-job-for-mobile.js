/**
 * Create Test Job for Mobile App
 * Creates the specific test job that the mobile app is listening for
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc,
  setDoc,
  serverTimestamp,
  Timestamp 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOqKJGJGJGJGJGJGJGJGJGJGJGJGJGJGJG",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test job configuration - EXACTLY what the mobile app is listening for
const TEST_JOB_ID = 'test_job_001';
const TARGET_STAFF_ID = 'iJxnTcy4xWZIoDVNnl5AgYSVPku2';

const testJobData = {
  // Basic job info
  title: '🧪 TEST: Pool Cleaning from Web App',
  description: 'This is a test job created by the web application to verify real-time synchronization with the mobile app. Clean the pool, check chemical levels, and ensure proper filtration.',
  type: 'cleaning',
  status: 'pending',
  priority: 'high',
  
  // Assignment details
  assignedStaffId: TARGET_STAFF_ID,
  assignedBy: 'web-app-admin',
  assignedAt: serverTimestamp(),
  
  // Scheduling
  scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  estimatedDuration: 120, // 2 hours
  
  // Location and property
  propertyId: 'test-property-001',
  propertyName: 'Ocean View Test Villa',
  location: {
    address: '123 Test Beach Drive',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33139',
    coordinates: {
      latitude: 25.7907,
      longitude: -80.1300
    },
    specialInstructions: 'Pool equipment is located in the back shed. Use the side gate entrance.'
  },
  
  // Contacts
  contacts: [
    {
      name: 'Test Property Manager',
      phone: '+1 (555) 123-4567',
      email: 'test@siamoon.com',
      role: 'property_manager',
      preferredContactMethod: 'phone'
    },
    {
      name: 'Emergency Contact',
      phone: '+1 (555) 911-0000',
      email: 'emergency@siamoon.com',
      role: 'emergency',
      preferredContactMethod: 'phone'
    }
  ],
  
  // Job requirements
  requirements: [
    {
      id: 'req-1',
      description: 'Clean pool surface and walls',
      isCompleted: false
    },
    {
      id: 'req-2',
      description: 'Check and balance chemical levels',
      isCompleted: false
    },
    {
      id: 'req-3',
      description: 'Clean pool filter system',
      isCompleted: false
    },
    {
      id: 'req-4',
      description: 'Test pool equipment functionality',
      isCompleted: false
    }
  ],
  
  // Photos (empty initially)
  photos: [],
  
  // Metadata
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: 'web-app-admin',
  
  // Additional fields
  specialInstructions: '🧪 TEST JOB: This job is created to test real-time sync between web app and mobile app. Please accept or decline to verify the workflow.',
  tools: ['Pool skimmer', 'Pool vacuum', 'Chemical test kit', 'Pool brush'],
  materials: ['Pool chemicals', 'Cleaning supplies'],
  estimatedCost: 150,
  
  // Notifications
  notificationsEnabled: true,
  reminderSent: false,
  
  // Test metadata
  isTestJob: true,
  testCreatedFrom: 'web-app-script',
  testPurpose: 'verify-real-time-sync'
};

async function createTestJob() {
  try {
    console.log('🧪 Creating test job for mobile app sync verification...');
    console.log('📋 Job ID:', TEST_JOB_ID);
    console.log('👤 Target Staff ID:', TARGET_STAFF_ID);
    console.log('📱 Mobile app should detect this job in real-time!');
    console.log('');

    // Create the test job document
    const jobRef = doc(db, 'jobs', TEST_JOB_ID);
    await setDoc(jobRef, testJobData);

    console.log('✅ Test job created successfully!');
    console.log('');
    console.log('🎯 TESTING INSTRUCTIONS:');
    console.log('1. Open the mobile app');
    console.log('2. Login with any staff account');
    console.log('3. Go to Dashboard tab');
    console.log('4. You should see a notification popup: "🎯 TEST JOB RECEIVED!"');
    console.log('5. The job should appear in the pending jobs list');
    console.log('6. Tap Accept or Decline to test the workflow');
    console.log('7. Check Firebase to verify status updates');
    console.log('');
    console.log('📊 JOB DETAILS:');
    console.log('- Title:', testJobData.title);
    console.log('- Type:', testJobData.type);
    console.log('- Priority:', testJobData.priority);
    console.log('- Location:', testJobData.location.address);
    console.log('- Scheduled:', new Date(testJobData.scheduledDate).toLocaleString());
    console.log('- Duration:', testJobData.estimatedDuration, 'minutes');
    console.log('');
    console.log('🔍 WHAT TO EXPECT:');
    console.log('✅ Real-time notification popup');
    console.log('✅ Job appears in pending jobs list');
    console.log('✅ Accept button updates status to "accepted"');
    console.log('✅ Decline button updates status to "rejected"');
    console.log('✅ Job moves to Active Jobs tab when accepted');
    console.log('');
    console.log('🚨 If you don\'t see the job:');
    console.log('- Check console logs for Firebase listener errors');
    console.log('- Verify staff ID matches:', TARGET_STAFF_ID);
    console.log('- Ensure mobile app is connected to Firebase');
    console.log('- Try refreshing the dashboard');

  } catch (error) {
    console.error('❌ Error creating test job:', error);
  }
}

async function deleteTestJob() {
  try {
    console.log('🗑️ Deleting test job...');
    
    const { deleteDoc } = await import('firebase/firestore');
    const jobRef = doc(db, 'jobs', TEST_JOB_ID);
    await deleteDoc(jobRef);
    
    console.log('✅ Test job deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting test job:', error);
  }
}

async function checkTestJob() {
  try {
    console.log('🔍 Checking test job status...');

    const { getDoc } = require('firebase/firestore');
    const jobRef = doc(db, 'jobs', TEST_JOB_ID);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const jobData = jobSnap.data();
      console.log('📋 Test job exists!');
      console.log('- Status:', jobData.status);
      console.log('- Title:', jobData.title);
      console.log('- Priority:', jobData.priority);
      console.log('- Assigned to:', jobData.assignedStaffId);
      console.log('- Created:', jobData.createdAt?.toDate?.()?.toLocaleString() || 'Unknown');
      console.log('- Updated:', jobData.updatedAt?.toDate?.()?.toLocaleString() || 'Unknown');

      if (jobData.acceptedAt) {
        console.log('- ✅ Accepted at:', jobData.acceptedAt.toDate().toLocaleString());
      }
      if (jobData.rejectedAt) {
        console.log('- ❌ Rejected at:', jobData.rejectedAt.toDate().toLocaleString());
        console.log('- Rejection reason:', jobData.rejectionReason);
      }

      console.log('');
      console.log('🎯 MOBILE APP TEST STATUS:');
      if (jobData.status === 'pending') {
        console.log('✅ Job is ready for mobile app detection');
        console.log('📱 Should appear in pending jobs list');
        console.log('🔔 Should trigger notification popup');
      } else if (jobData.status === 'accepted') {
        console.log('✅ Job has been accepted by mobile app');
        console.log('📱 Should have moved to Active Jobs tab');
        console.log('🎉 Real-time sync working correctly!');
      } else if (jobData.status === 'rejected') {
        console.log('❌ Job has been declined by mobile app');
        console.log('📱 Should have been removed from pending jobs');
        console.log('🎉 Real-time sync working correctly!');
      }
    } else {
      console.log('❌ Test job does not exist');
      console.log('💡 Run: node scripts/create-test-job-for-mobile.js create');
    }
  } catch (error) {
    console.error('❌ Error checking test job:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'create') {
  createTestJob();
} else if (command === 'delete') {
  deleteTestJob();
} else if (command === 'check') {
  checkTestJob();
} else {
  console.log('📋 Usage:');
  console.log('  node scripts/create-test-job-for-mobile.js create  - Create test job');
  console.log('  node scripts/create-test-job-for-mobile.js delete  - Delete test job');
  console.log('  node scripts/create-test-job-for-mobile.js check   - Check test job status');
  console.log('');
  console.log('🎯 This script creates a test job that the mobile app listens for in real-time.');
  console.log('📱 Use this to verify web app → mobile app synchronization.');
}
