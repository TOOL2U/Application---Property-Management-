// Test script to add sample notifications to Firestore
// Run this in Firebase Console or use Firebase Admin SDK

// Sample notification data structure:
const sampleNotifications = [
  {
    id: "test_notification_1",
    staffId: "IDJrsXWiL2dCHVpveH97", // Staff Member ID
    title: "New Job Assignment",
    body: "You have been assigned to Villa 101 cleaning task",
    type: "job_assignment",
    priority: "high",
    data: {
      jobId: "job_123",
      propertyId: "villa_101"
    },
    read: false,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "test_notification_2", 
    staffId: "IDJrsXWiL2dCHVpveH97",
    title: "Schedule Update",
    body: "Your shift schedule has been updated for next week",
    type: "schedule_update",
    priority: "medium",
    data: {
      scheduleId: "schedule_456"
    },
    read: false,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "test_notification_3",
    staffId: "IDJrsXWiL2dCHVpveH97",
    title: "Welcome Message",
    body: "Welcome to the Property Management System!",
    type: "welcome",
    priority: "low",
    data: {},
    read: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

// Add these to Firestore collection: notifications
// Each document ID should match the notification ID
