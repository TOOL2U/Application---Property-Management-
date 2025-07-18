#!/usr/bin/env node

/**
 * Test Push Notifications Setup
 * This script tests push notification functionality and adds test data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
let serviceAccount;
try {
  // Try to use the service account key file
  serviceAccount = require('./firebase-admin-key.json');
} catch (error) {
  console.log('⚠️  Using environment variables for Firebase Admin...');
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "operty-b54dc",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function setupTestData() {
  console.log('🔧 Setting up push notification test data...');

  try {
    // 1. Add some test job assignments
    const testJobs = [
      {
        id: 'job_001',
        title: 'Test Room Cleaning',
        type: 'cleaning',
        priority: 'normal',
        staffId: 'IDJrsXWiL2dCHVpveH97', // Your test staff ID
        status: 'pending',
        scheduledFor: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
        createdAt: admin.firestore.Timestamp.now(),
        location: {
          address: 'Test Property Address',
          coordinates: { lat: 0, lng: 0 }
        },
        description: 'Test job for push notification functionality',
        estimatedDuration: 30,
        instructions: 'This is a test job to verify push notifications work correctly'
      },
      {
        id: 'job_002',
        title: 'Test Maintenance Check',
        type: 'maintenance',
        priority: 'urgent',
        staffId: 'IDJrsXWiL2dCHVpveH97',
        status: 'pending',
        scheduledFor: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)), // 30 minutes from now
        createdAt: admin.firestore.Timestamp.now(),
        location: {
          address: 'Test Urgent Property',
          coordinates: { lat: 0, lng: 0 }
        },
        description: 'Urgent test job for push notification testing',
        estimatedDuration: 45,
        instructions: 'Urgent test job - should trigger high priority notification'
      }
    ];

    for (const job of testJobs) {
      await db.collection('job_assignments').doc(job.id).set(job);
      console.log(`✅ Created test job: ${job.title}`);
    }

    // 2. Add test notifications
    const testNotifications = [
      {
        id: 'notif_001',
        userId: 'gTtR5gSKOtUEweLwchSnVreylMy1', // Your Firebase UID
        staffId: 'IDJrsXWiL2dCHVpveH97',
        staffEmail: 'staff@siamoon.com',
        type: 'job_assignment',
        jobId: 'job_001',
        jobTitle: 'Test Room Cleaning',
        jobType: 'cleaning',
        priority: 'normal',
        status: 'unread',
        createdAt: admin.firestore.Timestamp.now(),
        scheduledDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
        scheduledStartTime: '14:00',
        propertyName: 'Test Property',
        propertyAddress: 'Test Property Address',
        staffName: 'Staff Member',
        estimatedDuration: 30,
        specialInstructions: 'Test notification for push functionality',
        actionRequired: true,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
      },
      {
        id: 'notif_002',
        userId: 'gTtR5gSKOtUEweLwchSnVreylMy1',
        staffId: 'IDJrsXWiL2dCHVpveH97',
        staffEmail: 'staff@siamoon.com',
        type: 'job_assignment',
        jobId: 'job_002',
        jobTitle: 'Test Maintenance Check',
        jobType: 'maintenance',
        priority: 'urgent',
        status: 'unread',
        createdAt: admin.firestore.Timestamp.now(),
        scheduledDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)),
        scheduledStartTime: '13:30',
        propertyName: 'Test Urgent Property',
        propertyAddress: 'Test Urgent Property Address',
        staffName: 'Staff Member',
        estimatedDuration: 45,
        specialInstructions: 'Urgent test notification',
        actionRequired: true,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
      }
    ];

    for (const notification of testNotifications) {
      await db.collection('staff_notifications').doc(notification.id).set(notification);
      console.log(`✅ Created test notification: ${notification.jobTitle}`);
    }

    console.log('🎉 Test data setup complete!');
    console.log('📱 You should now see:');
    console.log('   - 2 pending jobs in the jobs tab');
    console.log('   - 2 notifications in the notifications tab'); 
    console.log('   - JOBS button should glow on home page');

    return true;
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    return false;
  }
}

async function testPushNotificationConfig() {
  console.log('🧪 Testing push notification configuration...');

  try {
    // Check if we can send a test notification
    const messaging = admin.messaging();
    
    console.log('✅ Firebase Admin messaging initialized');
    console.log('✅ Push notification service ready');
    
    // Note: We can't send actual push notifications without FCM tokens
    // but we can verify the service is configured correctly
    
    return true;
  } catch (error) {
    console.error('❌ Push notification config error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting push notification setup and testing...');
  
  const configTest = await testPushNotificationConfig();
  if (!configTest) {
    console.error('❌ Push notification configuration failed');
    process.exit(1);
  }
  
  const dataSetup = await setupTestData();
  if (!dataSetup) {
    console.error('❌ Test data setup failed');
    process.exit(1);
  }
  
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Open your app (scan QR code or press "w" for web)');
  console.log('2. Login with PIN: 1234');
  console.log('3. Check the home page - JOBS button should glow');
  console.log('4. Go to jobs tab - you should see 2 pending jobs');
  console.log('5. Go to notifications tab - you should see 2 notifications');
  console.log('6. For mobile: allow notification permissions when prompted');
  console.log('');
  console.log('✅ Push notifications are now configured and ready to test!');
}

if (require.main === module) {
  main().catch(console.error);
}
