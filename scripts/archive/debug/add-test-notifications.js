const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
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

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

// Test notification data for Staff Member (IDJrsXWiL2dCHVpveH97)
const testNotifications = [
  {
    id: "test_notification_high_priority",
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "🚨 Urgent: Villa 101 Emergency",
    body: "Guest reported water leak in Villa 101 - immediate attention required",
    message: "Guest reported water leak in Villa 101 - immediate attention required",
    type: "job_assignment",
    priority: "high",
    read: false,
    timestamp: admin.firestore.Timestamp.now(),
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
    id: "test_notification_job_assignment",
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "New Job Assignment",
    body: "You have been assigned to Villa 205 housekeeping task for tomorrow 9 AM",
    message: "You have been assigned to Villa 205 housekeeping task for tomorrow 9 AM",
    type: "job_assignment",
    priority: "medium",
    read: false,
    timestamp: admin.firestore.Timestamp.now(),
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
    id: "test_notification_schedule_update",
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "📅 Schedule Update",
    body: "Your shift schedule has been updated - check your calendar",
    message: "Your shift schedule has been updated - check your calendar",
    type: "schedule_update",
    priority: "medium",
    read: false,
    timestamp: admin.firestore.Timestamp.now(),
    data: {
      scheduleDate: "2025-07-19",
      shiftTime: "09:00-17:00",
      changedBy: "Manager User"
    }
  },
  {
    id: "test_notification_welcome",
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "🎉 Welcome to Property Management",
    body: "Welcome! You can now receive job assignments and real-time updates.",
    message: "Welcome! You can now receive job assignments and real-time updates.",
    type: "welcome",
    priority: "low",
    read: false,
    timestamp: admin.firestore.Timestamp.now(),
    data: {
      welcomeVersion: "1.0",
      features: ["job_assignments", "real_time_updates", "schedule_management"]
    }
  },
  {
    id: "test_notification_completed_job",
    assignedTo: "IDJrsXWiL2dCHVpveH97",
    title: "✅ Job Completed",
    body: "Villa 103 cleaning has been marked as completed. Great work!",
    message: "Villa 103 cleaning has been marked as completed. Great work!",
    type: "job_update",
    priority: "low",
    read: true, // This one is already read
    timestamp: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1 day ago
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
    
    const batch = db.batch();
    const notificationsRef = db.collection('notifications');
    
    testNotifications.forEach((notification) => {
      const docRef = notificationsRef.doc(notification.id);
      batch.set(docRef, notification);
      console.log(`📝 Queued: ${notification.title} (${notification.priority} priority)`);
    });
    
    await batch.commit();
    
    console.log('✅ Successfully added all test notifications!');
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
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test notifications:', error);
    process.exit(1);
  }
}

// Run the script
addTestNotifications();
