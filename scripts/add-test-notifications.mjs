/**
 * Add Test Notifications using Firebase Client SDK
 * This uses the same Firebase configuration as the mobile app
 */

// Import Firebase using the same setup as the mobile app
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration (same as mobile app)
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

// Test notification data for Staff Member (IDJrsXWiL2dCHVpveH97)
const testNotifications = [
  {
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "🚨 Urgent: Villa 101 Emergency",
    body: "Guest reported water leak in Villa 101 - immediate attention required",
    message: "Guest reported water leak in Villa 101 - immediate attention required",
    type: "job_assignment",
    priority: "high",
    read: false,
    timestamp: Timestamp.now(),
    jobId: "emergency_villa_101",
    data: {
      jobId: "emergency_villa_101",
      propertyName: "Villa 101",
      taskType: "emergency_maintenance",
      guestId: "guest_789",
      urgencyLevel: "critical"
    }
  },
  {
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "New Job Assignment",
    body: "You have been assigned to Villa 205 housekeeping task for tomorrow 9 AM",
    message: "You have been assigned to Villa 205 housekeeping task for tomorrow 9 AM",
    type: "job_assignment",
    priority: "medium",
    read: false,
    timestamp: Timestamp.now(),
    jobId: "hk_villa_205",
    data: {
      jobId: "hk_villa_205",
      propertyName: "Villa 205",
      taskType: "housekeeping",
      scheduledTime: "2025-07-19T09:00:00Z",
      estimatedDuration: "2 hours"
    }
  },
  {
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "📅 Schedule Update",
    body: "Your shift schedule has been updated - check your calendar",
    message: "Your shift schedule has been updated - check your calendar",
    type: "schedule_update",
    priority: "medium",
    read: false,
    timestamp: Timestamp.now(),
    data: {
      scheduleDate: "2025-07-19",
      shiftTime: "09:00-17:00",
      changedBy: "Manager User"
    }
  },
  {
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "🎉 Welcome to Property Management",
    body: "Welcome! You can now receive job assignments and real-time updates.",
    message: "Welcome! You can now receive job assignments and real-time updates.",
    type: "welcome",
    priority: "low",
    read: false,
    timestamp: Timestamp.now(),
    data: {
      welcomeVersion: "1.0",
      features: ["job_assignments", "real_time_updates", "schedule_management"]
    }
  },
  {
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "✅ Job Completed",
    body: "Villa 103 cleaning has been marked as completed. Great work!",
    message: "Villa 103 cleaning has been marked as completed. Great work!",
    type: "job_update",
    priority: "low",
    read: true, // This one is already read
    timestamp: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
    jobId: "completed_villa_103",
    data: {
      jobId: "completed_villa_103",
      propertyName: "Villa 103",
      taskType: "cleaning",
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      rating: 5
    }
  }
];

async function addTestNotifications() {
  try {
    console.log('🔔 Adding test notifications to Firestore...');
    console.log(`📱 Target Staff ID: IDJrsXWiL2dCHVpveH97 (Staff Member)`);
    console.log(`🔥 Project: ${firebaseConfig.projectId}`);
    
    const notificationsRef = collection(db, 'notifications');
    
    for (let i = 0; i < testNotifications.length; i++) {
      const notification = testNotifications[i];
      
      try {
        const docRef = await addDoc(notificationsRef, notification);
        console.log(`✅ Added: ${notification.title} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`❌ Failed to add: ${notification.title}`, error);
      }
    }
    
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`   - Total notifications: ${testNotifications.length}`);
    console.log(`   - Unread notifications: ${testNotifications.filter(n => !n.read).length}`);
    console.log(`   - High priority: ${testNotifications.filter(n => n.priority === 'high').length}`);
    console.log(`   - Medium priority: ${testNotifications.filter(n => n.priority === 'medium').length}`);
    console.log(`   - Low priority: ${testNotifications.filter(n => n.priority === 'low').length}`);
    console.log('');
    console.log('🎯 The mobile app should now show:');
    console.log('   - Notification icon with badge showing unread count');
    console.log('   - Pulse animation for new notifications');
    console.log('   - Tap to open notification modal');
    console.log('');
    console.log('📱 Check your mobile app now - notifications should appear immediately!');
    
  } catch (error) {
    console.error('❌ Error adding test notifications:', error);
    process.exit(1);
  }
}

// Run the script
addTestNotifications()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
