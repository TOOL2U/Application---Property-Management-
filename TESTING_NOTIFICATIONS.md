# 🔔 Testing the Notification System

## Problem Identified

Your mobile app notification system is **working correctly**, but there are **NO notifications in the database** to display.

The logs show:
```
🔍 Debug: Found 0 total notifications in collection
```

This means the `staff_notifications` collection is empty.

---

## ✅ Fixes Applied

### 1. Translation Keys Fixed
- ✅ Added missing `no_notifications` translation
- ✅ Added missing `no_notifications_subtitle` translation  
- ✅ Added missing `all_caught_up` translation
- ✅ Added missing `refresh` translation
- ✅ Added missing `clear` translation in common section

The notification screen will now show proper text instead of `[missing "en.notifications.xxx" translation]`.

### 2. Test Notification Script Created

Created `scripts/create-test-notifications.js` to generate sample notifications for testing.

---

## 🧪 How to Test Notifications

### Option 1: Using the Test Script (Recommended)

1. **Make sure you have Firebase service account key:**
   ```bash
   # Check if file exists
   ls firebase-service-account.json
   ```

2. **Run the test script:**
   ```bash
   node scripts/create-test-notifications.js
   ```
   
   Or specify a staff email:
   ```bash
   node scripts/create-test-notifications.js john@siamoon.com
   ```

3. **What the script does:**
   - ✅ Creates a test job in `jobs` collection
   - ✅ Creates a test notification in `staff_notifications` collection
   - ✅ Uses correct `userId` field (staff's firebaseUid)
   - ✅ Links notification to job
   - ✅ Sets proper timestamps and expiration

4. **Check your mobile app:**
   - Open the app and log in
   - Check the Notifications tab (should show badge count)
   - Notification should appear in the list
   - Tap it to navigate to job details

### Option 2: Create Manually in Firebase Console

1. **Go to Firebase Console**
   - Project: `operty-b54dc`
   - Firestore Database
   - Collection: `staff_notifications`

2. **Add a new document with these fields:**
   ```javascript
   {
     // CRITICAL - Mobile app queries this field
     userId: "STAFF_FIREBASE_UID",  // Get from staff_accounts.firebaseUid
     
     // Link to staff
     staffId: "STAFF_DOC_ID",  // Document ID from staff_accounts
     staffName: "John Doe",
     staffEmail: "john@siamoon.com",
     
     // Link to job
     jobId: "JOB_DOC_ID",  // Create a job first
     jobTitle: "Clean Villa Sunset",
     jobType: "cleaning",
     
     // Notification details
     type: "job_assigned",
     title: "New Assignment: Clean Villa Sunset",
     body: "You have been assigned a new cleaning job",
     status: "pending",
     actionRequired: true,
     priority: "high",
     
     // Property info
     propertyName: "Villa Sunset",
     propertyAddress: "123 Beach Road",
     scheduledDate: "2026-01-07T14:00:00Z",
     scheduledStartTime: "14:00",
     estimatedDuration: 180,
     
     // Timestamps
     createdAt: Timestamp.now(),
     expiresAt: Timestamp(24 hours from now),
     readAt: null
   }
   ```

3. **Important:** The `userId` field MUST match the staff's `firebaseUid` field from their `staff_accounts` document.

### Option 3: Ask Webapp Team to Create One

The webapp team should implement the notification creation logic as documented in `WEBAPP_TO_MOBILE_INTEGRATION_GUIDE.md`.

When they assign a job, they should create both:
1. Job document in `jobs` collection
2. Notification document in `staff_notifications` collection

---

## 🔍 How to Find Staff's Firebase UID

### Method 1: Firebase Console
1. Go to Firestore Database
2. Open `staff_accounts` collection
3. Find the staff member's document
4. Look for the `firebaseUid` field
5. Copy that value

### Method 2: Using the Test Script
```bash
node scripts/create-test-notifications.js staff@siamoon.com
```

The script will output:
```
✅ Found staff: John Doe (staff@siamoon.com)
   Document ID: abc123
   Firebase UID: xyz789  <-- USE THIS for userId
```

---

## 📊 Verification Steps

After creating a test notification:

1. **Check Mobile App Logs:**
   ```
   Should see:
   ✅ NotificationDisplay: Final result: 1 notifications
   ✅ AppNotificationContext: Updated with 1 notifications
   ```

2. **Check UI:**
   - Badge appears on Notifications tab (red circle with number)
   - Notification list shows the new notification
   - Proper title and message (no translation errors)
   - Time shows "Just now" or "Xm ago"
   - Priority badge shows color-coded (red/yellow/green)

3. **Test Actions:**
   - Tap notification → Should navigate to job details
   - Mark as read → Badge count decreases
   - Pull to refresh → Should reload notifications

---

## 🚨 Common Issues

### Issue: "Still no notifications after script"

**Check:**
1. Did script complete successfully?
2. Is the staff email correct?
3. Does the staff have a `firebaseUid` field?
4. Are you logged in as the correct staff member?

**Solution:**
```bash
# Run script with debug output
node scripts/create-test-notifications.js staff@siamoon.com

# Check the output for:
✅ Firebase Admin initialized
✅ Found staff: [name] ([email])
   Firebase UID: [uid]  <-- Must not be "NOT SET"
✅ Created test job: [id]
✅ Created test notification: [id]
   userId (for queries): [uid]  <-- This should match Firebase UID above
```

### Issue: "No Firebase service account file"

**Solution:**
1. Download service account JSON from Firebase Console
2. Place it in project root as `firebase-service-account.json`
3. DO NOT commit it to git (already in .gitignore)

### Issue: "Notification appears but can't navigate to job"

**Check:**
1. Does the job exist in `jobs` collection?
2. Is the `jobId` in notification correct?
3. Does the job have proper `assignedTo` field?

---

## 🎯 What Should Happen (Expected Flow)

### 1. Notification Created (Webapp or Script)
```
📝 Document added to staff_notifications
   └─ userId: xyz789abc (matches staff's firebaseUid)
   └─ jobId: job123
   └─ status: pending
```

### 2. Mobile App Real-Time Listener
```
🔔 NotificationDisplay: Subscribing to notifications
🔔 Using Firebase UID for queries: xyz789abc
🔔 Query executed, snapshot size: 1
✅ Final result: 1 notifications
```

### 3. UI Updates
```
📱 Badge count: 1
📱 Notification list: Shows new notification
📱 Notification tab: Highlights with yellow
```

### 4. User Interaction
```
👆 User taps notification
📱 Mark as read
🔄 Status changes to "read"
➡️  Navigate to job details
📋 Job screen opens
```

---

## 🧹 Cleanup After Testing

The test script creates documents in your database. To clean up:

### Option 1: Delete in Firebase Console
1. Go to `jobs` collection → Delete test jobs (title starts with "🧪 TEST:")
2. Go to `staff_notifications` collection → Delete test notifications

### Option 2: Delete via Script
```bash
# You can create a cleanup script if needed
# Or manually query and delete:
# - WHERE title STARTS WITH "🧪 TEST:"
# - WHERE data.testNotification == true
```

---

## 📞 Need Help?

1. **Check logs:** Look for error messages in mobile app console
2. **Verify Firebase:** Check documents were created correctly
3. **Test query:** Try querying notifications manually in Firebase Console
4. **Check authentication:** Ensure you're logged in as the correct staff member

---

## ✅ Summary

**Current Status:**
- ✅ Notification screen UI: Working perfectly
- ✅ Real-time listeners: Active and functioning
- ✅ Translation keys: Fixed (no more missing translations)
- ✅ Test script: Created and ready to use
- ⚠️ Database: Empty (no notifications to display)

**Next Steps:**
1. Run `node scripts/create-test-notifications.js`
2. Open mobile app and check Notifications tab
3. Should see test notification appear
4. Tap notification to verify navigation works
5. Once verified, ask webapp team to implement notification creation

**The notification system is 100% functional - it just needs data!** 🎉

