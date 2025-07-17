#!/usr/bin/env node

/**
 * Send Test Job from Web App to Mobile App
 * Usage: node send-test-job.js
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} = require('firebase/firestore');

// Firebase configuration
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Staff configuration
const STAFF_EMAIL = 'staff@siamoon.com';
const STAFF_ID = 'iJxnTcy4xWZIoDVNnl5AgYSVPku2'; // From the mobile app test

/**
 * Get staff account details
 */
async function getStaffAccount() {
  try {
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('email', '==', STAFF_EMAIL)
    );
    
    const snapshot = await getDocs(staffQuery);
    
    if (!snapshot.empty) {
      const staffDoc = snapshot.docs[0];
      return {
        id: staffDoc.id,
        ...staffDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting staff account:', error);
    return null;
  }
}

/**
 * Create and send test job
 */
async function sendTestJob() {
  console.log('🚀 Sending Test Job from Web App to Mobile App');
  console.log('===============================================');
  
  // Verify staff account exists
  const staffAccount = await getStaffAccount();
  if (!staffAccount) {
    console.error('❌ Staff account not found:', STAFF_EMAIL);
    console.log('   Please ensure the staff account exists in Firestore');
    return;
  }
  
  console.log('✅ Staff account found:', staffAccount.name || staffAccount.email);
  
  // Create job data
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  
  const jobData = {
    // Basic job information
    title: `🧪 Test Job - ${now.toLocaleTimeString()}`,
    description: 'This is a test job sent from your web app to the mobile app. Please check if it appears in the mobile app dashboard.',
    type: 'cleaning',
    priority: 'high',
    
    // Status and assignment
    status: 'pending',
    assignedTo: staffAccount.id,
    assignedStaffId: staffAccount.id, // For compatibility with mobile app
    assignedBy: 'web-app-admin',
    assignedAt: serverTimestamp(),
    
    // Scheduling
    scheduledDate: scheduledDate,
    estimatedDuration: 90,
    
    // Property and location
    propertyId: 'test_property_' + Date.now(),
    propertyName: 'Test Property - Sia Moon Resort',
    location: {
      address: '123 Resort Drive, Paradise City, FL 33101',
      city: 'Paradise City',
      state: 'FL',
      zipCode: '33101',
      room: 'Room 101',
      floor: 1,
      accessCodes: {
        door: '1234',
        gate: '5678'
      },
      specialInstructions: 'Use master key for room access. Check AC unit during cleaning.'
    },
    
    // Contacts
    contacts: [
      {
        name: 'Front Desk Manager',
        phone: '+1 (555) 123-4567',
        email: 'frontdesk@resort.com',
        role: 'property_manager',
        preferredContactMethod: 'phone'
      },
      {
        name: 'Maintenance Team',
        phone: '+1 (555) 987-6543',
        email: 'maintenance@resort.com',
        role: 'emergency',
        preferredContactMethod: 'phone'
      }
    ],
    
    // Requirements checklist
    requirements: [
      {
        id: 'req_001',
        description: 'Take before photos of room condition',
        isCompleted: false,
        required: true
      },
      {
        id: 'req_002',
        description: 'Clean bathroom thoroughly (toilet, sink, shower)',
        isCompleted: false,
        required: true
      },
      {
        id: 'req_003',
        description: 'Change bed linens and pillowcases',
        isCompleted: false,
        required: true
      },
      {
        id: 'req_004',
        description: 'Vacuum and mop floors',
        isCompleted: false,
        required: true
      },
      {
        id: 'req_005',
        description: 'Restock amenities (towels, toiletries, coffee)',
        isCompleted: false,
        required: true
      },
      {
        id: 'req_006',
        description: 'Take after photos of completed room',
        isCompleted: false,
        required: true
      }
    ],
    
    // Additional details
    specialInstructions: 'Guest checking in at 3:00 PM. Job must be completed by 2:30 PM. Report any maintenance issues immediately.',
    tools: ['vacuum', 'mop', 'cleaning supplies', 'fresh linens'],
    materials: ['toilet paper', 'towels', 'shampoo', 'coffee pods'],
    estimatedCost: 0,
    
    // Tracking and metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'web-app-admin',
    source: 'web-app-test',
    
    // Notifications
    notificationsEnabled: true,
    reminderSent: false,
    
    // Booking context (if applicable)
    bookingId: 'booking_' + Date.now(),
    guestName: 'John Doe',
    checkIn: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
    checkOut: new Date(now.getTime() + 27 * 60 * 60 * 1000), // Tomorrow + 3 hours
    
    // Version for conflict resolution
    version: 1
  };
  
  try {
    console.log('📝 Creating job assignment in Firestore...');
    
    // Add to jobs collection (for mobile app)
    const jobRef = await addDoc(collection(db, 'jobs'), jobData);
    
    console.log('✅ Test job created successfully!');
    console.log('');
    console.log('📋 Job Details:');
    console.log(`   Job ID: ${jobRef.id}`);
    console.log(`   Title: ${jobData.title}`);
    console.log(`   Staff: ${staffAccount.name || staffAccount.email}`);
    console.log(`   Priority: ${jobData.priority}`);
    console.log(`   Status: ${jobData.status}`);
    console.log(`   Scheduled: ${scheduledDate.toLocaleString()}`);
    console.log(`   Property: ${jobData.propertyName}`);
    console.log(`   Location: ${jobData.location.address}`);
    console.log(`   Requirements: ${jobData.requirements.length} items`);
    console.log('');
    
    // Also add to job_assignments collection (for web app tracking)
    const assignmentData = {
      jobId: jobRef.id,
      staffId: staffAccount.id,
      staffEmail: staffAccount.email,
      assignedBy: 'web-app-admin',
      assignedAt: serverTimestamp(),
      status: 'pending',
      jobTitle: jobData.title,
      propertyId: jobData.propertyId,
      scheduledDate: scheduledDate,
      createdAt: serverTimestamp()
    };
    
    const assignmentRef = await addDoc(collection(db, 'job_assignments'), assignmentData);
    console.log(`📊 Job assignment record created: ${assignmentRef.id}`);
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Open mobile app: http://localhost:8082');
    console.log('2. Login with: staff@siamoon.com / password123');
    console.log('3. Check Dashboard for the new job');
    console.log('4. Go to Jobs tab to accept/decline the job');
    console.log('');
    console.log('📱 Expected Results:');
    console.log('   ✓ Job appears in mobile app dashboard');
    console.log('   ✓ Real-time notification (if enabled)');
    console.log('   ✓ Staff can accept/decline the job');
    console.log('   ✓ Status updates sync back to web app');
    
    return {
      success: true,
      jobId: jobRef.id,
      assignmentId: assignmentRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creating test job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
sendTestJob()
  .then(result => {
    if (result.success) {
      console.log('');
      console.log('🎉 Test job sent successfully!');
      process.exit(0);
    } else {
      console.error('❌ Failed to send test job:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
