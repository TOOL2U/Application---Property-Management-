/**
 * Direct Firebase Job Assignment Script
 * 
 * This script directly creates a job assignment in Firebase Firestore
 * for staff@siamoon.com to test the mobile app dashboard.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let adminApp;
try {
  // Parse the service account key from environment
  const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY not found in environment');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = getFirestore(adminApp);

/**
 * Create a test job assignment directly in Firestore
 */
async function createTestJobAssignment() {
  const staffEmail = 'staff@siamoon.com';
  const jobData = {
    // Job identification
    title: 'Test Cleaning Assignment',
    description: 'This is a test job assignment sent directly to staff@siamoon.com dashboard for verification',
    type: 'cleaning',
    priority: 'high',
    
    // Assignment details
    assignedStaffId: staffEmail,
    assignedBy: 'admin@siamoon.com',
    assignedAt: Timestamp.now(),
    
    // Scheduling
    scheduledDate: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
    dueDate: Timestamp.fromDate(new Date(Date.now() + 8 * 60 * 60 * 1000)), // 8 hours from now
    estimatedDuration: 90, // minutes
    
    // Status
    status: 'pending',
    
    // Location
    propertyId: `test_property_${Date.now()}`,
    propertyName: 'Test Property - Sia Moon',
    location: {
      address: '123 Test Property Street, Test City, TC 12345',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    
    // Booking details
    bookingId: `test_booking_${Date.now()}`,
    bookingDetails: {
      guestName: 'Test Guest',
      checkIn: Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000)),
      checkOut: Timestamp.fromDate(new Date(Date.now() + 28 * 60 * 60 * 1000)),
      roomNumber: 'Test Room 101',
      specialRequests: 'Extra towels, late checkout requested'
    },
    
    // Requirements
    requirements: [
      {
        id: `req_${Date.now()}_1`,
        type: 'photo',
        description: 'Take before and after photos of all rooms',
        isRequired: true,
        isCompleted: false
      },
      {
        id: `req_${Date.now()}_2`,
        type: 'checklist',
        description: 'Complete standard cleaning checklist',
        isRequired: true,
        isCompleted: false
      },
      {
        id: `req_${Date.now()}_3`,
        type: 'inspection',
        description: 'Perform quality inspection before guest arrival',
        isRequired: false,
        isCompleted: false
      }
    ],
    
    // Tracking
    photos: [],
    notes: [],
    
    // Timestamps
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    
    // Metadata
    source: 'test_script',
    version: 1
  };

  try {
    console.log('📝 Creating job assignment in Firestore...');
    
    // Add to jobs collection
    const jobRef = await db.collection('jobs').add(jobData);
    
    console.log('✅ Job assignment created successfully!');
    console.log('📋 Job Details:');
    console.log(`   Job ID: ${jobRef.id}`);
    console.log(`   Staff: ${staffEmail}`);
    console.log(`   Title: ${jobData.title}`);
    console.log(`   Priority: ${jobData.priority}`);
    console.log(`   Status: ${jobData.status}`);
    console.log(`   Scheduled: ${jobData.scheduledDate.toDate().toLocaleString()}`);
    console.log(`   Property: ${jobData.propertyName}`);
    
    return {
      success: true,
      jobId: jobRef.id,
      jobData
    };
    
  } catch (error) {
    console.error('❌ Error creating job assignment:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify the staff account exists
 */
async function verifyStaffAccount(staffEmail) {
  try {
    console.log('🔍 Checking if staff account exists...');
    
    const staffQuery = await db.collection('staff_accounts')
      .where('email', '==', staffEmail)
      .limit(1)
      .get();
    
    if (staffQuery.empty) {
      console.log('⚠️  Staff account not found in staff_accounts collection');
      console.log('   The job will still be created, but login might not work');
      return false;
    } else {
      const staffDoc = staffQuery.docs[0];
      const staffData = staffDoc.data();
      console.log('✅ Staff account found:');
      console.log(`   Email: ${staffData.email}`);
      console.log(`   Role: ${staffData.role}`);
      console.log(`   Name: ${staffData.name || 'Not set'}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking staff account:', error.message);
    return false;
  }
}

/**
 * Check if there are existing jobs for this staff member
 */
async function checkExistingJobs(staffEmail) {
  try {
    console.log('📊 Checking existing jobs for staff...');
    
    const jobsQuery = await db.collection('jobs')
      .where('assignedStaffId', '==', staffEmail)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`📋 Found ${jobsQuery.size} existing jobs for ${staffEmail}`);
    
    if (!jobsQuery.empty) {
      console.log('   Recent jobs:');
      jobsQuery.docs.forEach((doc, index) => {
        const job = doc.data();
        console.log(`   ${index + 1}. ${job.title} (${job.status}) - ${job.createdAt.toDate().toLocaleDateString()}`);
      });
    }
    
    return jobsQuery.size;
  } catch (error) {
    console.error('❌ Error checking existing jobs:', error.message);
    return 0;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting direct Firebase job assignment test...');
  console.log('');
  
  const staffEmail = 'staff@siamoon.com';
  
  // Verify staff account
  await verifyStaffAccount(staffEmail);
  console.log('');
  
  // Check existing jobs
  await checkExistingJobs(staffEmail);
  console.log('');
  
  // Create test job
  const result = await createTestJobAssignment();
  
  if (result.success) {
    console.log('');
    console.log('🎉 Test job assignment completed successfully!');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Open the mobile app: http://localhost:8083');
    console.log('2. Login with: staff@siamoon.com');
    console.log('3. Check the Dashboard for the new job notification');
    console.log('4. Go to Jobs tab to see the assigned job');
    console.log('');
    console.log('📱 The job should appear in:');
    console.log('   - Dashboard (pending jobs section)');
    console.log('   - Jobs tab (pending jobs list)');
    console.log('   - Real-time notifications (if enabled)');
    console.log('');
    console.log('🔍 If the job doesn\'t appear:');
    console.log('   - Check the browser console for errors');
    console.log('   - Verify Firebase connection in the app');
    console.log('   - Check that the staff account can login');
    console.log('   - Look for the job in Firebase Console > Firestore > jobs collection');
    
  } else {
    console.log('');
    console.log('❌ Test failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  createTestJobAssignment,
  verifyStaffAccount,
  checkExistingJobs
};
