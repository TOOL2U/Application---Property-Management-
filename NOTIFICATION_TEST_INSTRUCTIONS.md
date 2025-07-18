// Firebase Console Instructions for Testing Notifications
// Go to: https://console.firebase.google.com/project/operty-b54dc/firestore/data

// 1. Create Collection: "notifications"
// 2. Add these test documents:

// Document 1 ID: "test_notification_staff_1"
{
  "assignedTo": "IDJrsXWiL2dCHVpveH97",
  "title": "New Job Assignment",
  "body": "You have been assigned to Villa 101 cleaning task",
  "message": "You have been assigned to Villa 101 cleaning task",
  "type": "job_assignment",
  "priority": "high",
  "read": false,
  "timestamp": new Date(),
  "jobId": "job_villa_101",
  "data": {
    "jobId": "job_villa_101",
    "propertyName": "Villa 101",
    "taskType": "cleaning"
  }
}

// Document 2 ID: "test_notification_staff_2" 
{
  "assignedTo": "IDJrsXWiL2dCHVpveH97",
  "title": "Schedule Update",
  "body": "Your shift schedule has been updated for tomorrow",
  "message": "Your shift schedule has been updated for tomorrow",
  "type": "schedule_update", 
  "priority": "medium",
  "read": false,
  "timestamp": new Date(),
  "data": {
    "scheduleDate": "2025-07-19",
    "shiftTime": "09:00-17:00"
  }
}

// Document 3 ID: "test_notification_staff_3"
{
  "assignedTo": "IDJrsXWiL2dCHVpveH97", 
  "title": "Welcome to Property Management",
  "body": "Welcome! You can now receive job assignments and updates.",
  "message": "Welcome! You can now receive job assignments and updates.",
  "type": "welcome",
  "priority": "low", 
  "read": false,
  "timestamp": new Date(),
  "data": {}
}

// After adding these, the notification icon should show:
// - Red badge with number "3" 
// - Pulse animation for new notifications
// - Tapping opens modal with notification list
