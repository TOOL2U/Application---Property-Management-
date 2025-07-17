/**
 * Simple Job Creation Script using Firebase Client SDK
 * 
 * This script creates a test job directly in Firestore using the client SDK
 * to test the staff@siamoon.com dashboard functionality.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase Client SDK (same as used in the app)
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} = require('firebase/firestore');

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase Client SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

/**
 * Create a test job assignment
 */
async function createTestJob() {
  const staffEmail = 'staff@siamoon.com';
  const now = new Date();
  
  const jobData = {
    // Basic job info
    title: 'Test Job Assignment - Dashboard Verification',
    description: 'This is a test job created to verify the staff dashboard functionality. Please check if this appears in the mobile app.',
    type: 'cleaning',
    priority: 'high',
    
    // Assignment
    assignedStaffId: staffEmail,
    assignedBy: 'admin@siamoon.com',
    assignedAt: Timestamp.fromDate(now),
    
    // Scheduling
    scheduledDate: Timestamp.fromDate(new Date(now.getTime() + 2 * 60 * 60 * 1000)), // 2 hours from now
    dueDate: Timestamp.fromDate(new Date(now.getTime() + 8 * 60 * 60 * 1000)), // 8 hours from now
    estimatedDuration: 90,
    
    // Status
    status: 'pending',
    
    // Location
    propertyId: `test_prop_${Date.now()}`,
    propertyName: 'Test Property - Sia Moon Resort',
    location: {
      address: '123 Test Resort Drive, Paradise City',
      room: 'Room 101'
    },
    
    // Booking info
    bookingId: `booking_${Date.now()}`,
    guestName: 'Test Guest',
    checkIn: Timestamp.fromDate(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
    checkOut: Timestamp.fromDate(new Date(now.getTime() + 28 * 60 * 60 * 1000)),
    
    // Requirements
    requirements: [
      'Take before and after photos',
      'Complete cleaning checklist',
      'Check all amenities are working'
    ],
    
    // Metadata
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    source: 'test_script'
  };

  try {
    console.log('📝 Creating test job in Firestore...');
    
    const jobRef = await addDoc(collection(db, 'jobs'), jobData);
    
    console.log('✅ Test job created successfully!');
    console.log('');
    console.log('📋 Job Details:');
    console.log(`   Job ID: ${jobRef.id}`);
    console.log(`   Staff: ${staffEmail}`);
    console.log(`   Title: ${jobData.title}`);
    console.log(`   Priority: ${jobData.priority}`);
    console.log(`   Status: ${jobData.status}`);
    console.log(`   Scheduled: ${jobData.scheduledDate.toDate().toLocaleString()}`);
    console.log(`   Property: ${jobData.propertyName}`);
    console.log(`   Location: ${jobData.location.address}`);
    
    return {
      success: true,
      jobId: jobRef.id,
      jobData
    };
    
  } catch (error) {
    console.error('❌ Error creating test job:', error.message);
    console.error('   Full error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if staff account exists
 */
async function checkStaffAccount(staffEmail) {
  try {
    console.log('🔍 Checking staff account...');
    
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('email', '==', staffEmail)
    );
    
    const querySnapshot = await getDocs(staffQuery);
    
    if (querySnapshot.empty) {
      console.log('⚠️  Staff account not found in staff_accounts collection');
      console.log('   You may need to create the account first');
      return false;
    } else {
      const staffDoc = querySnapshot.docs[0];
      const staffData = staffDoc.data();
      console.log('✅ Staff account found:');
      console.log(`   Email: ${staffData.email}`);
      console.log(`   Role: ${staffData.role || 'Not set'}`);
      console.log(`   Name: ${staffData.name || 'Not set'}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking staff account:', error.message);
    return false;
  }
}

/**
 * Check existing jobs for the staff member
 */
async function checkExistingJobs(staffEmail) {
  try {
    console.log('📊 Checking existing jobs...');
    
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('assignedStaffId', '==', staffEmail)
    );
    
    const querySnapshot = await getDocs(jobsQuery);
    
    console.log(`📋 Found ${querySnapshot.size} existing jobs for ${staffEmail}`);
    
    if (!querySnapshot.empty) {
      console.log('   Recent jobs:');
      querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const job = doc.data();
        const createdDate = job.createdAt?.toDate?.() || new Date();
        console.log(`   ${index + 1}. ${job.title || 'Untitled'} (${job.status || 'unknown'}) - ${createdDate.toLocaleDateString()}`);
      });
    }
    
    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error checking existing jobs:', error.message);
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating test job for staff@siamoon.com dashboard...');
  console.log('');
  
  const staffEmail = 'staff@siamoon.com';
  
  // Check staff account
  await checkStaffAccount(staffEmail);
  console.log('');
  
  // Check existing jobs
  await checkExistingJobs(staffEmail);
  console.log('');
  
  // Create test job
  const result = await createTestJob();
  
  if (result.success) {
    console.log('');
    console.log('🎉 Test job created successfully!');
    console.log('');
    console.log('🎯 Next Steps to Test:');
    console.log('1. Open the mobile app: http://localhost:8083');
    console.log('2. Login with: staff@siamoon.com');
    console.log('3. Check the Dashboard for the new job');
    console.log('4. Go to Jobs tab to see the pending job');
    console.log('');
    console.log('📱 Expected Results:');
    console.log('   ✓ Job appears in Dashboard pending jobs section');
    console.log('   ✓ Job appears in Jobs tab with "pending" status');
    console.log('   ✓ Job shows correct title, priority, and schedule');
    console.log('   ✓ Real-time updates work (if implemented)');
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   - If job doesn\'t appear, check browser console for errors');
    console.log('   - Verify Firebase connection in the mobile app');
    console.log('   - Check Firestore rules allow reading jobs collection');
    console.log('   - Ensure staff account can authenticate successfully');
    console.log('');
    console.log('📊 Firebase Console:');
    console.log('   - Check Firestore > jobs collection for the new document');
    console.log(`   - Document ID: ${result.jobId}`);
    
  } else {
    console.log('');
    console.log('❌ Failed to create test job');
    console.log('Please check the error messages above and try again.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  createTestJob,
  checkStaffAccount,
  checkExistingJobs
};
