# 📱 Web App Integration - Quick Start Summary

## For: Web Application Development Team

---

## 🎯 What You Need to Know

Your web app needs to **assign jobs to staff members** who will receive them on their mobile devices. This document summarizes the **critical fields and exact database structure** you must use.

---

## 🔥 Firebase Project

```
Project ID: operty-b54dc
Database: Cloud Firestore
Region: asia-southeast1
```

---

## 📋 The 3 Critical Collections

### 1. `staff_accounts` - Staff Profiles

**Purpose:** Store all staff member information and authentication

**Key Fields You MUST Use:**
```typescript
{
  email: string;              // Login email
  firebaseUid: string;        // ⚠️ CRITICAL - Used for job assignment
  name: string;               // Display name
  role: string;               // 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff'
  isActive: boolean;          // Can receive jobs?
  fcmToken?: string;          // For push notifications
}
```

**Example:**
```json
{
  "email": "john@siamoon.com",
  "firebaseUid": "abc123xyz789",
  "name": "John Doe",
  "role": "maintenance",
  "isActive": true
}
```

---

### 2. `jobs` - Job Assignments

**Purpose:** Store all job assignments for staff

**Key Fields You MUST Use:**
```typescript
{
  // Assignment (USE BOTH FIELDS):
  assignedTo: string;         // ⚠️ CRITICAL - Staff's firebaseUid
  assignedStaffId: string;    // ⚠️ CRITICAL - Staff's firebaseUid (same value)
  
  // Basic Info:
  title: string;
  description: string;
  type: 'cleaning' | 'maintenance' | 'repair' | 'emergency';
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Scheduling:
  scheduledDate: Timestamp;   // When job should be done
  estimatedDuration: number;  // Minutes
  
  // Property:
  propertyId: string;
  propertyName: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  
  // Timestamps:
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Example:**
```json
{
  "assignedTo": "abc123xyz789",
  "assignedStaffId": "abc123xyz789",
  "title": "Clean Villa Sunset",
  "description": "Full property cleaning before guest check-in",
  "type": "cleaning",
  "status": "assigned",
  "priority": "high",
  "scheduledDate": "2026-01-07T10:00:00Z",
  "estimatedDuration": 180,
  "propertyId": "prop_001",
  "propertyName": "Villa Sunset",
  "location": {
    "address": "123 Beach Road",
    "city": "Koh Phangan",
    "state": "Surat Thani"
  }
}
```

---

### 3. `staff_notifications` - Push Notifications

**Purpose:** Trigger push notifications on mobile devices

**Key Fields You MUST Use:**
```typescript
{
  jobId: string;              // ⚠️ CRITICAL - Link to jobs collection
  staffId: string;            // ⚠️ CRITICAL - staff_accounts document ID
  userId: string;             // ⚠️ CRITICAL - Staff's firebaseUid
  
  type: 'job_assigned';
  title: string;
  status: 'pending';
  
  // Job summary:
  jobTitle: string;
  jobType: string;
  priority: string;
  propertyName: string;
  scheduledDate: string;      // ISO date string
  
  createdAt: Timestamp;
  expiresAt: Timestamp;       // 24 hours from now
}
```

**Example:**
```json
{
  "jobId": "job_xyz789",
  "staffId": "staff_doc_123",
  "userId": "abc123xyz789",
  "type": "job_assigned",
  "title": "New Job: Clean Villa Sunset",
  "status": "pending",
  "jobTitle": "Clean Villa Sunset",
  "jobType": "cleaning",
  "priority": "high",
  "propertyName": "Villa Sunset",
  "scheduledDate": "2026-01-07T10:00:00Z"
}
```

---

## 🚀 Step-by-Step: Assign a Job

### Step 1: Get Staff Information

```typescript
// Query staff by email or ID
const staffDoc = await getDoc(doc(db, 'staff_accounts', staffDocId));
const staffData = staffDoc.data();

// Get the critical firebaseUid
const firebaseUid = staffData.firebaseUid;
```

### Step 2: Create Job Document

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const jobDoc = await addDoc(collection(db, 'jobs'), {
  // ⚠️ CRITICAL: Use staff's firebaseUid for BOTH fields
  assignedTo: firebaseUid,
  assignedStaffId: firebaseUid,
  
  // Job details
  title: "Clean Villa Sunset",
  description: "Full property cleaning",
  type: "cleaning",
  status: "assigned",
  priority: "high",
  
  // Scheduling
  scheduledDate: Timestamp.fromDate(new Date('2026-01-07T10:00:00Z')),
  estimatedDuration: 180,
  
  // Property
  propertyId: "prop_001",
  propertyName: "Villa Sunset",
  location: {
    address: "123 Beach Road",
    city: "Koh Phangan",
    state: "Surat Thani",
  },
  
  // Required arrays
  contacts: [],
  requirements: [],
  photos: [],
  
  // Flags
  notificationsEnabled: true,
  reminderSent: false,
  
  // Timestamps
  assignedBy: currentUserId,
  assignedAt: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: currentUserId,
});

console.log('Job created:', jobDoc.id);
```

### Step 3: Create Notification (Required!)

```typescript
// Create notification so mobile app shows alert
await addDoc(collection(db, 'staff_notifications'), {
  // ⚠️ CRITICAL: Link to job and staff
  jobId: jobDoc.id,
  staffId: staffDocId,           // Document ID from staff_accounts
  userId: firebaseUid,           // Firebase UID for queries
  
  // Notification details
  type: 'job_assigned',
  title: `New Job: Clean Villa Sunset`,
  body: 'You have been assigned a cleaning job',
  status: 'pending',
  actionRequired: true,
  
  // Job summary (for quick display in app)
  jobTitle: "Clean Villa Sunset",
  jobType: "cleaning",
  priority: "high",
  propertyName: "Villa Sunset",
  scheduledDate: "2026-01-07T10:00:00Z",
  estimatedDuration: 180,
  
  // Staff info
  staffName: staffData.name,
  staffEmail: staffData.email,
  
  // Timestamps
  createdAt: Timestamp.now(),
  expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24h
});

console.log('Notification created');
```

### Step 4: Done! ✅

The mobile app will:
1. Receive real-time notification
2. Show push alert to staff
3. Display job in their "Assigned" list
4. Allow staff to accept/reject
5. Update job status in real-time

---

## ⚠️ Common Mistakes to Avoid

### ❌ WRONG - Using Staff Email for Assignment
```typescript
{
  assignedTo: "john@siamoon.com"  // ❌ WRONG - Don't use email!
}
```

### ✅ CORRECT - Using Firebase UID
```typescript
{
  assignedTo: "abc123xyz789",      // ✅ CORRECT - Use firebaseUid
  assignedStaffId: "abc123xyz789"  // ✅ CORRECT - Same value
}
```

---

### ❌ WRONG - Only Setting One Field
```typescript
{
  assignedTo: "abc123xyz789"       // ❌ INCOMPLETE - Set both!
}
```

### ✅ CORRECT - Setting Both Fields
```typescript
{
  assignedTo: "abc123xyz789",      // ✅ CORRECT
  assignedStaffId: "abc123xyz789"  // ✅ CORRECT
}
```

---

### ❌ WRONG - Forgetting Notification
```typescript
// Only created job, no notification
await addDoc(collection(db, 'jobs'), {...});
// ❌ Mobile app won't alert staff!
```

### ✅ CORRECT - Creating Both
```typescript
// Create job
const jobDoc = await addDoc(collection(db, 'jobs'), {...});

// Create notification (REQUIRED)
await addDoc(collection(db, 'staff_notifications'), {
  jobId: jobDoc.id,
  userId: firebaseUid,
  // ...
});
// ✅ Mobile app will show alert!
```

---

## 🔍 How Mobile App Queries Jobs

The mobile app queries **BOTH** field names for compatibility:

```typescript
// Tries first:
where('assignedStaffId', '==', staffFirebaseUid)

// If no results, tries:
where('assignedTo', '==', staffFirebaseUid)
```

**That's why you should set BOTH fields!**

---

## 📊 Job Status Flow

When you assign a job, here's what happens:

```
WEB APP                           MOBILE APP
   |                                  |
   | 1. Create job                    |
   |    assignedTo = firebaseUid      |
   |    status = "assigned"           |
   |                                  |
   | 2. Create notification           |
   |    userId = firebaseUid          |
   |                                  |
   |--------------------------------->| 3. Push notification appears
   |                                  | 4. Staff sees job in app
   |                                  | 5. Staff clicks "Accept"
   |                                  |
   | 6. Job status updated            |<--
   |    status = "accepted"           |
   |    acceptedAt = Timestamp        |
   |                                  |
   | 7. See update in web UI          | 8. Staff clicks "Start"
   |<---------------------------------|
   |    status = "in_progress"        |
   |    startedAt = Timestamp         |
   |                                  |
   |                                  | 9. Staff works on job
   |                                  | 10. Staff uploads photos
   |                                  | 11. Staff clicks "Complete"
   |                                  |
   | 12. Job completed                |<--
   |     status = "completed"         |
   |     completedAt = Timestamp      |
   |     completionNotes = "..."      |
   |     photos = [...]               |
   |                                  |
   | 13. Admin verifies               |
   |     status = "verified"          |
   |     verifiedAt = Timestamp       |
```

---

## 🧪 Testing Your Integration

### Test Staff Account
```
Email: staff@siamoon.com
Check staff_accounts collection for firebaseUid
```

### Quick Test
1. Get staff's firebaseUid from Firestore
2. Create job with assignedTo = firebaseUid
3. Create notification with userId = firebaseUid
4. Open mobile app → Job should appear
5. Accept job in mobile → Check web app for status update

### Debug Queries

**Check if job was assigned correctly:**
```typescript
const jobsQuery = query(
  collection(db, 'jobs'),
  where('assignedTo', '==', 'STAFF_FIREBASE_UID')
);
const jobs = await getDocs(jobsQuery);
console.log('Jobs found:', jobs.size);
```

**Check if notification was created:**
```typescript
const notifsQuery = query(
  collection(db, 'staff_notifications'),
  where('userId', '==', 'STAFF_FIREBASE_UID')
);
const notifs = await getDocs(notifsQuery);
console.log('Notifications found:', notifs.size);
```

---

## ✅ Integration Checklist

Before going live:

- [ ] All staff have `firebaseUid` in their profile
- [ ] Jobs use BOTH `assignedTo` AND `assignedStaffId` fields
- [ ] Both fields contain staff's `firebaseUid` (not email or doc ID)
- [ ] Notification created for every job assignment
- [ ] Notification `userId` matches staff `firebaseUid`
- [ ] Job has complete `location` object
- [ ] Job has `propertyName` field
- [ ] Using Firebase `Timestamp.now()` not JavaScript `Date`
- [ ] Tested with real staff account end-to-end
- [ ] Can see job status updates in real-time

---

## 📞 Need Help?

1. **Read the full guide:** `WEBAPP_TO_MOBILE_INTEGRATION_GUIDE.md`
2. **Check Firebase Console:** Verify document structure
3. **Test with sample account:** staff@siamoon.com
4. **Check security rules:** Ensure staff can read/write

---

## 🎯 TL;DR - Absolute Minimum

To assign a job to a staff member:

1. **Get their `firebaseUid`** from `staff_accounts` collection
2. **Create job** with `assignedTo` = firebaseUid AND `assignedStaffId` = firebaseUid
3. **Create notification** with `userId` = firebaseUid and `jobId` = job document ID
4. **Done!** Staff will see it on their mobile device

**That's it!** 🎉

