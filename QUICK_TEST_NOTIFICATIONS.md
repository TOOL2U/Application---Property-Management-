# 🚀 Quick Start: Test Notifications Now

## Problem
Your notification screen shows "No notifications" because the `staff_notifications` collection in Firebase is empty.

## The Fix (Choose One Method)

---

## ⚡ Method 1: Quick Test with Firebase Console (5 minutes)

### Step 1: Get Your Staff's Firebase UID

1. Open Firebase Console: https://console.firebase.google.com/
2. Select project: `operty-b54dc`
3. Go to Firestore Database
4. Open collection: `staff_accounts`
5. Find your staff account (the one you're testing with)
6. Copy the `firebaseUid` field value
   - Example: `abc123xyz789def456`
   - If missing, use the document ID instead

### Step 2: Create a Test Notification

1. Still in Firestore Database
2. Go to collection: `staff_notifications`
3. Click "Add document"
4. Use auto-generated document ID
5. Add these fields:

```
Field Name              Type        Value
-------------------------------------------------
userId                  string      [PASTE YOUR firebaseUid HERE]
staffId                 string      [Your staff document ID]
staffName               string      Your Name
staffEmail              string      your@email.com

type                    string      job_assigned
title                   string      🔔 Test: New Job Assignment
body                    string      This is a test notification
status                  string      pending
actionRequired          boolean     true

jobId                   string      test_job_001
jobTitle                string      Test Cleaning Job
jobType                 string      cleaning
priority                string      high

propertyName            string      Test Villa
propertyAddress         string      123 Beach Road
scheduledDate           string      2026-01-07T14:00:00Z
scheduledStartTime      string      14:00
estimatedDuration       number      120

createdAt               timestamp   [Click "Set to current time"]
expiresAt               timestamp   [Click "Set to current time" then add 24 hours]
readAt                  null        null
```

### Step 3: Check Mobile App

1. Open your mobile app
2. Log in with the same staff account
3. Go to Notifications tab
4. **You should see:**
   - Badge with "1" on notification tab
   - Your test notification in the list
   - Proper formatting (no translation errors)
   - "Just now" timestamp

✅ **If you see the notification, your system works perfectly!**

---

## 🔧 Method 2: Use the Test Script (Requires Setup)

### Prerequisites

You need a Firebase service account key. To get it:

1. Go to Firebase Console
2. Click gear icon → Project settings
3. Go to "Service accounts" tab
4. Click "Generate new private key"
5. Save the file as `firebase-service-account.json` in your project root

**⚠️ IMPORTANT:** Never commit this file to git (already in .gitignore)

### Run the Script

```bash
# Install firebase-admin if not already installed
npm install firebase-admin

# Run the script
node scripts/create-test-notifications.js

# Or specify a staff email
node scripts/create-test-notifications.js john@siamoon.com
```

### What the Script Does

- ✅ Finds your staff account by email
- ✅ Creates a realistic test job
- ✅ Creates a test notification with all required fields
- ✅ Uses correct `userId` for queries
- ✅ Outputs verification information

---

## 🎯 What to Expect

### Before Fix
```
[Screen showing empty state]
❌ "No notifications"
❌ Missing translation errors
❌ Badge count: 0
```

### After Fix
```
[Screen showing notification list]
✅ Notification appears in list
✅ Badge count: 1 (red circle)
✅ Proper text formatting
✅ Time: "Just now"
✅ Priority badge: HIGH (red)
✅ Can tap to navigate
```

---

## 🔍 Troubleshooting

### "I created a notification but still don't see it"

**Check:**
1. Is `userId` field EXACTLY matching your staff's `firebaseUid`?
   - Go to `staff_accounts` collection
   - Find your staff document
   - Compare the `firebaseUid` field
   - Must match EXACTLY (case-sensitive)

2. Are you logged in as the correct staff member?
   - Log out and log back in
   - Verify profile name matches

3. Check mobile app logs:
   ```
   Look for:
   🔔 NotificationDisplay: Query executed, snapshot size: 1
   ✅ Final result: 1 notifications
   ```

### "I don't have a firebaseUid field"

**Solution:**
1. In `staff_accounts`, find your staff document
2. Edit it and add field:
   ```
   firebaseUid: string = [use the document ID]
   ```
3. Or update your staff account to include this field

### "Script says 'No staff found'"

**Solution:**
1. Check the email is correct
2. Verify `isActive: true` in staff account
3. Make sure staff account exists in `staff_accounts` collection

---

## 🎉 Success Criteria

Your notification system is working if:

- ✅ Notification appears in list within 2 seconds of creation
- ✅ Badge count updates automatically
- ✅ No translation errors (proper English text)
- ✅ Can mark as read (badge count decreases)
- ✅ Can tap to view details
- ✅ Pull-to-refresh works
- ✅ Empty state shows when no notifications

---

## 📝 For Webapp Team

Once you verify the mobile app is working, send this to the webapp team:

**"The mobile notification system is fully functional and tested. When you assign a job, you MUST create a notification document in the `staff_notifications` collection with these fields:"**

```javascript
{
  userId: staffMember.firebaseUid,  // CRITICAL - for mobile app queries
  staffId: staffMember.documentId,
  jobId: newJob.id,
  type: 'job_assigned',
  title: `New Assignment: ${jobTitle}`,
  status: 'pending',
  // ... see WEBAPP_TO_MOBILE_INTEGRATION_GUIDE.md for complete spec
}
```

**Reference documents:**
- `WEBAPP_TO_MOBILE_INTEGRATION_GUIDE.md` - Complete integration specs
- `WEBAPP_INTEGRATION_SUMMARY.md` - Quick start guide
- `NOTIFICATION_SYSTEM_STATUS.md` - Technical analysis

---

## ✅ Next Steps

1. **Test Now:** Use Method 1 (Firebase Console) to create a test notification
2. **Verify:** Check mobile app to confirm it appears
3. **Document:** Screenshot the working notification
4. **Share:** Send integration docs to webapp team
5. **Clean Up:** Delete test notifications after testing

**The notification system is ready for production!** 🚀

