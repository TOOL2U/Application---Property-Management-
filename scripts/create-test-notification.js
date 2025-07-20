/**
 * Script to create test notifications for the current user
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config (same as in the app)
const firebaseConfig = {
  apiKey: "AIzaSyAuE_a_a5TfQYx2hUYu4Lx2Q-BwwEUdGSE",
  authDomain: "property-management-f68bf.firebaseapp.com",
  projectId: "property-management-f68bf",
  storageBucket: "property-management-f68bf.appspot.com",
  messagingSenderId: "926380456174",
  appId: "1:926380456174:web:c05b4e25e80bf7d6b2fcf6"
};

async function createTestNotifications() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const staffId = 'IDJrsXWiL2dCHVpveH97';
    const firebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';

    console.log('Creating test notifications for:');
    console.log('- Staff ID:', staffId);
    console.log('- Firebase UID:', firebaseUid);

    // Create test notifications with different field patterns
    const notifications = [
      {
        // Notification using userId field (primary pattern)
        userId: firebaseUid,
        staffId: staffId,
        staffEmail: 'staff@siamoon.com',
        staffName: 'Test Staff',
        type: 'job_assigned',
        jobId: 'test-job-001',
        jobTitle: 'Bathroom Cleaning',
        jobType: 'cleaning',
        propertyName: 'Sunset Apartment Complex',
        propertyAddress: '123 Main Street, Unit 4B',
        priority: 'medium',
        status: 'assigned',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM tomorrow
        estimatedDuration: '2 hours',
        specialInstructions: 'Focus on deep cleaning the shower and mirrors',
        actionRequired: true,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        // Notification using staffId field (fallback pattern)
        staffId: staffId,
        userId: firebaseUid,
        type: 'job_updated',
        jobId: 'test-job-002',
        jobTitle: 'Kitchen Maintenance',
        jobType: 'maintenance',
        propertyName: 'Ocean View Condos',
        propertyAddress: '456 Ocean Drive, Unit 12A',
        priority: 'high',
        status: 'updated',
        updateType: 'Schedule Changed',
        updateReason: 'Owner requested earlier start time',
        actionRequired: false,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        // Notification using assignedTo field (another fallback)
        assignedTo: staffId,
        userId: firebaseUid,
        type: 'reminder',
        reminderType: 'Daily Tasks',
        title: 'Daily Task Reminder',
        message: 'Don\'t forget to complete your scheduled tasks for today',
        priority: 'low',
        actionRequired: false,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
      }
    ];

    const notificationsRef = collection(db, 'staff_notifications');

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      console.log(`\nCreating notification ${i + 1}:`, notification.type);
      
      const docRef = await addDoc(notificationsRef, notification);
      console.log(`✅ Created notification with ID: ${docRef.id}`);
    }

    console.log('\n🎉 Successfully created', notifications.length, 'test notifications!');
    console.log('The notifications should now appear in your app.');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
}

// Run the script
createTestNotifications();
