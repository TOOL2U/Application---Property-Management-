# Firebase Index Setup - Quick Fix 🔥

## 🚨 Error: Missing Indexes for operational_jobs

The mobile app needs Firebase indexes to query the `operational_jobs` collection. Firebase has provided automatic index creation links.

---

## 🔗 Click These Links to Auto-Create Indexes

Firebase will automatically create the indexes when you click these links:

### Index 1: Unassigned Jobs Query
**Query:** `requiredRole == 'cleaner' AND status IN ['pending', 'offered'] ORDER BY createdAt DESC`

**Click this link:**
```
https://console.firebase.google.com/v1/r/project/operty-b54dc/firestore/indexes?create_composite=ClVwcm9qZWN0cy9vcGVydHktYjU0ZGMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL29wZXJhdGlvbmFsX2pvYnMvaW5kZXhlcy9fEAEaEAoMcmVxdWlyZWRSb2xlEAEaCgoGc3RhdHVzEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

**Index will be:**
- Collection: `operational_jobs`
- Fields:
  - `requiredRole` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

---

### Index 2: Assigned Operational Jobs Query
**Query:** `assignedStaffId == [uid] ORDER BY createdAt DESC`

**Click this link:**
```
https://console.firebase.google.com/v1/r/project/operty-b54dc/firestore/indexes?create_composite=ClVwcm9qZWN0cy9vcGVydHktYjU0ZGMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL29wZXJhdGlvbmFsX2pvYnMvaW5kZXhlcy9fEAEaEwoPYXNzaWduZWRTdGFmZklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

**Index will be:**
- Collection: `operational_jobs`
- Fields:
  - `assignedStaffId` (Ascending)
  - `createdAt` (Descending)

---

## 📝 Steps to Create Indexes

### Option 1: Automatic (Recommended) ⚡

1. **Click the first link above** → Creates "Unassigned Jobs" index
2. **Wait 2-3 minutes** for index to build
3. **Click the second link above** → Creates "Assigned Jobs" index
4. **Wait 2-3 minutes** for index to build
5. **Reload your app** → Jobs should appear!

### Option 2: Manual Creation 🔧

If the links don't work, create manually:

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/operty-b54dc/firestore/indexes
   ```

2. **Click "Create Index"**

3. **Index 1 (Unassigned Jobs):**
   - Collection: `operational_jobs`
   - Field 1: `requiredRole` → Ascending
   - Field 2: `status` → Ascending
   - Field 3: `createdAt` → Descending
   - Query scope: Collection
   - Click "Create Index"

4. **Index 2 (Assigned Jobs):**
   - Collection: `operational_jobs`
   - Field 1: `assignedStaffId` → Ascending
   - Field 2: `createdAt` → Descending
   - Query scope: Collection
   - Click "Create Index"

5. **Wait for indexes to build** (usually 2-5 minutes)

---

## ✅ How to Verify Indexes Are Ready

### Check in Firebase Console

1. Go to: https://console.firebase.google.com/project/operty-b54dc/firestore/indexes
2. Look for these two indexes:
   ```
   operational_jobs: requiredRole, status, createdAt
   operational_jobs: assignedStaffId, createdAt
   ```
3. Status should be: **"Enabled"** (green checkmark)

### Check in Mobile App

**After indexes are created, reload the app and check console:**

**Expected logs:**
```
✅ JobContext: Connected
🔄 JobContext: Mobile app assigned jobs updated - 0 jobs
🔄 JobContext: Webapp assigned operational jobs updated - 0 jobs
🔄 JobContext: Unassigned operational jobs updated - 1 pending jobs available
```

**Should NOT see:**
```
❌ JobContext: Unassigned jobs listener error: [FirebaseError: The query requires an index...]
❌ JobContext: Operational jobs listener error: [FirebaseError: The query requires an index...]
```

---

## 🚀 After Indexes Are Created

**Test the job:**

1. **Reload the app** (press 'r' in Metro terminal)
2. **Log in** as `cleaner@siamoon.com`
3. **Open Jobs tab**
4. **Expected:** Job "Post-Checkout Cleaning - Mountain Retreat Cabin" appears in "Available Jobs"
5. **Tap "Accept"** → Job should move to "My Jobs"

---

## ⏱️ Index Build Time

- **Simple indexes:** 1-3 minutes
- **Large datasets:** 5-10 minutes
- **Very large datasets:** 10-30 minutes

Your dataset is small (1 test job), so indexes should be ready in **2-3 minutes**.

---

## 🔍 Troubleshooting

### If indexes don't appear after 10 minutes:

1. **Refresh the Firebase Console page**
2. **Check "Indexes" tab** (not "Single field exemptions")
3. **Look for "Building..." status** → Wait a bit more
4. **Check for errors** in Firebase Console

### If app still shows errors after indexes are created:

1. **Hard reload the app:**
   - Close the app completely
   - In Metro terminal, press 'r' to reload
   - Log in again

2. **Check Firebase UID mapping:**
   ```typescript
   // Should see this in console:
   🔍 JobContext: Using Firebase UID for queries: [your UID]
   ```

3. **Verify job document:**
   - Go to Firebase Console → Firestore Database
   - Navigate to `operational_jobs` collection
   - Find job `cOlnK6OzyEc9fqL79oHt`
   - Verify fields: `requiredRole`, `status`, `createdAt`

---

## 📊 Why These Indexes Are Needed

### Unassigned Jobs Query (Listener #3)
```typescript
query(
  collection(db, 'operational_jobs'),
  where('requiredRole', '==', 'cleaner'),    // ← Filter 1
  where('status', 'in', ['pending', 'offered']), // ← Filter 2
  orderBy('createdAt', 'desc')               // ← Order by
)
```
**Needs index:** `requiredRole + status + createdAt`

### Assigned Jobs Query (Listener #2)
```typescript
query(
  collection(db, 'operational_jobs'),
  where('assignedStaffId', '==', firebaseUid), // ← Filter
  orderBy('createdAt', 'desc')                 // ← Order by
)
```
**Needs index:** `assignedStaffId + createdAt`

---

## 🎯 Summary

**Problem:** Firebase queries need composite indexes when using multiple `where()` clauses with `orderBy()`

**Solution:** Create indexes using the auto-creation links or manually in Firebase Console

**Time:** 2-3 minutes to create and enable

**Result:** Jobs will appear in mobile app instantly after indexes are ready

---

## 🔗 Quick Links

1. **Firebase Console:** https://console.firebase.google.com/project/operty-b54dc
2. **Firestore Indexes:** https://console.firebase.google.com/project/operty-b54dc/firestore/indexes
3. **Firestore Database:** https://console.firebase.google.com/project/operty-b54dc/firestore/data

---

**Click the index creation links above and wait 2-3 minutes. Then reload the app!** 🚀
