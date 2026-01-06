# 📱 How to Send Jobs from Webapp to Mobile App

**Quick Reference Guide for Webapp Team**

---

## ✅ Working Test Profile

**Use this profile to test job assignments:**

- **Email:** `cleaner@siamoon.com`
- **PIN:** `1234`
- **Staff Document ID:** `dEnHUdPyZU0Uutwt6Aj5`
- **Firebase UID:** `6mywtFzF7wcNg76CKvpSh56Y0ND3`
- **Role:** `cleaner`
- **Status:** ✅ Active and working in mobile app

---

## 🎯 Step-by-Step: Create Job in Firestore

### 1. Collection
Create document in: **`jobs`** collection

### 2. Required Field
**Most Important:**
```javascript
assignedTo: "dEnHUdPyZU0Uutwt6Aj5"  // Staff document ID
```

### 3. Minimal Job Document

```javascript
{
  // WHO - Assignment (REQUIRED)
  "assignedTo": "dEnHUdPyZU0Uutwt6Aj5",
  "assignedStaffName": "Cleaner",
  
  // WHAT - Job Details (REQUIRED)
  "title": "Post-checkout Cleaning",
  "description": "Clean the villa after guest checkout",
  "status": "assigned",
  "priority": "high",
  "jobType": "cleaning",
  
  // WHEN - Scheduling (REQUIRED)
  "scheduledDate": firebase.firestore.Timestamp.now(),
  "estimatedDuration": 120,
  
  // WHERE - Location (REQUIRED)
  "location": {
    "address": "123 Beach Road",
    "city": "Phuket",
    "state": "Phuket",
    "zipCode": "83000",
    "googleMapsLink": "https://maps.google.com/?q=7.8804,98.3923"
  },
  
  // PROPERTY INFO (Required for mobile app display)
  "propertyName": "Beachfront Villa",
  "propertyId": "villa-123",
  "propertyPhotos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  
  // BOOKING INFO (Required for cleaning jobs)
  "guestName": "John Smith",
  "guestCount": 4,
  "checkInDate": firebase.firestore.Timestamp.fromDate(new Date("2026-01-10")),
  "checkOutDate": firebase.firestore.Timestamp.fromDate(new Date("2026-01-15")),
  
  // ACCESS (Required for field staff)
  "accessInstructions": "Gate code: 1234. WiFi: villa123",
  
  // METADATA (Auto-generated)
  "createdAt": firebase.firestore.FieldValue.serverTimestamp(),
  "updatedAt": firebase.firestore.FieldValue.serverTimestamp(),
  "createdBy": "admin-user-id"
}
```

---

## 🚨 Common Mistakes

### ❌ DON'T DO THIS:
```javascript
"assignedStaffId": "6mywtFzF7wcNg76CKvpSh56Y0ND3"  // Firebase UID - mobile checks this second
"assignedTo": "some-other-id"  // Wrong ID
```

### ✅ DO THIS:
```javascript
"assignedTo": "dEnHUdPyZU0Uutwt6Aj5"  // Staff document ID from staff_accounts
```

---

## 📋 Field Mapping Guide

### Mobile App Required Fields

| Mobile App Field | Firestore Field | Type | Example |
|-----------------|-----------------|------|---------|
| Property Name | `propertyName` | string | "Beachfront Villa" |
| Property Photos | `propertyPhotos` | array | ["url1", "url2"] |
| Access Instructions | `accessInstructions` | string | "Gate code: 1234" |
| Google Maps | `location.googleMapsLink` | string | "https://maps.google.com/..." |
| Guest Count | `guestCount` | number | 4 |
| Check-in | `checkInDate` | Timestamp | Timestamp |
| Check-out | `checkOutDate` | Timestamp | Timestamp |

---

## 🔍 How to Find Staff IDs

### Method 1: Firestore Console
1. Go to Firestore Database
2. Open `staff_accounts` collection
3. Find the staff member
4. **Document ID** = Use this for `assignedTo`

### Method 2: Query by Email
```javascript
const db = firebase.firestore();
const staffQuery = await db.collection('staff_accounts')
  .where('email', '==', 'cleaner@siamoon.com')
  .get();

const staffId = staffQuery.docs[0].id;  // "dEnHUdPyZU0Uutwt6Aj5"
```

---

## 🧪 Testing Steps

### 1. Create Job in Firestore
- Use the minimal document example above
- Set `assignedTo: "dEnHUdPyZU0Uutwt6Aj5"`

### 2. Check Mobile App
- Open mobile app
- Login as `cleaner@siamoon.com` (PIN: 1234)
- Go to **Jobs** tab
- Job should appear immediately (auto-refresh on focus)

### 3. Verify Job Appears
Console logs should show:
```
LOG ✅ Found 1 jobs using 'assignedTo'
LOG ✅ StaffJobService: Successfully loaded 1 jobs
LOG 🔍 useStaffJobs: Job details: [{"assignedTo": "dEnHUdPyZU0Uutwt6Aj5", ...}]
```

---

## 🔧 Troubleshooting

### Job Not Appearing?

**Check 1: Correct Staff ID?**
```javascript
// In your job document:
assignedTo: "dEnHUdPyZU0Uutwt6Aj5"  // Must match exactly
```

**Check 2: Status Field?**
```javascript
status: "assigned"  // Must be "assigned", not "pending"
```

**Check 3: Collection Name?**
- Must be in `jobs` collection
- NOT `completed_jobs` collection

**Check 4: Staff Account Exists?**
```javascript
// Query to verify:
db.collection('staff_accounts').doc('dEnHUdPyZU0Uutwt6Aj5').get()
```

---

## 📱 Mobile App Compatibility

### Supported Field Names (Mobile checks both):

1. **Primary (Preferred):**
   - `assignedTo` → Staff document ID

2. **Fallback (Also supported):**
   - `assignedStaffId` → Firebase UID

**Best Practice:** Always use `assignedTo` with staff document ID

---

## 🎯 Quick Copy-Paste Example

```javascript
// JavaScript/Node.js code for webapp
const admin = require('firebase-admin');
const db = admin.firestore();

// Create job for mobile app
await db.collection('jobs').add({
  // ASSIGNMENT - Use staff document ID
  assignedTo: "dEnHUdPyZU0Uutwt6Aj5",
  assignedStaffName: "Cleaner",
  
  // JOB BASICS
  title: "Post-checkout Cleaning",
  description: "Clean villa after guest checkout",
  status: "assigned",
  priority: "high",
  jobType: "cleaning",
  
  // TIMING
  scheduledDate: admin.firestore.Timestamp.now(),
  estimatedDuration: 120,
  
  // LOCATION
  location: {
    address: "123 Beach Road, Phuket",
    city: "Phuket",
    state: "Phuket",
    zipCode: "83000",
    googleMapsLink: "https://maps.google.com/?q=7.8804,98.3923"
  },
  
  // PROPERTY
  propertyName: "Beachfront Villa",
  propertyId: "villa-123",
  propertyPhotos: [
    "https://firebasestorage.googleapis.com/...photo1.jpg",
    "https://firebasestorage.googleapis.com/...photo2.jpg"
  ],
  
  // BOOKING
  guestName: "John Smith",
  guestCount: 4,
  checkInDate: admin.firestore.Timestamp.fromDate(new Date("2026-01-10")),
  checkOutDate: admin.firestore.Timestamp.fromDate(new Date("2026-01-15")),
  
  // ACCESS
  accessInstructions: "Gate code: 1234\nWiFi: BeachVilla123",
  
  // METADATA
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: "webapp-admin"
});

console.log("✅ Job created for mobile app!");
```

---

## 📊 Status Flow

```
assigned → accepted → in_progress → completed
  ↓          ↓            ↓             ↓
Mobile     Mobile       Mobile      Moved to
receives   accepts      works       completed_jobs
job        job          on job      collection
```

---

## ✅ Checklist for Webapp Team

- [ ] Job document in `jobs` collection
- [ ] `assignedTo: "dEnHUdPyZU0Uutwt6Aj5"`
- [ ] `status: "assigned"`
- [ ] All 7 required fields present (propertyName, propertyPhotos, accessInstructions, googleMapsLink, guestCount, checkInDate, checkOutDate)
- [ ] `scheduledDate` is a Firestore Timestamp
- [ ] `location` object with all fields
- [ ] Test by logging into mobile app

---

## 🆘 Still Not Working?

**Send this info to mobile team:**

1. Job document ID: `_______________`
2. `assignedTo` value: `_______________`
3. `status` value: `_______________`
4. Collection name: `_______________`
5. Screenshot of job document in Firestore

**Mobile team will check:**
- Staff account exists
- Job query is working
- Real-time listener is active
- Field mapping is correct

---

## 🎉 Success Criteria

When it works, mobile app will show:
- ✅ Job appears in Jobs tab immediately
- ✅ Job has yellow "ACCEPT JOB" button with glow effect
- ✅ All 7 required fields display correctly
- ✅ Staff can tap to open acceptance modal
- ✅ Staff can accept → start → complete job

---

**Questions? Contact Mobile Team**

Mobile app is ready and tested. Just need webapp to create job with correct `assignedTo` field! 🚀
