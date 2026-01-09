# 🔥 CRITICAL QUESTION FOR WEBAPP TEAM

**Date:** January 5, 2026  
**From:** Mobile App Team  
**Priority:** 🔴 **URGENT - BLOCKING MOBILE APP TESTING**

---

## ⚠️ FIELD NAME MISMATCH DETECTED

We have a **critical field name inconsistency** that's blocking mobile app from loading jobs.

---

## 📊 THE ISSUE

### **Webapp Documentation Says:**
```typescript
// From MOBILE_TEAM_STAFF_ACCOUNTS.md
const jobsQuery = query(
  collection(db, 'jobs'),
  where('assignedTo', '==', currentStaffId),  // ← Uses 'assignedTo'
  where('status', 'in', ['assigned', 'in_progress']),
  orderBy('scheduledDate', 'asc')
);
```

### **Mobile App Currently Uses:**
```typescript
// From services/secureFirestore.ts
const querySnap = await this.queryCollection('jobs', [
  where('assignedStaffId', '==', targetStaffId),  // ← Uses 'assignedStaffId'
  orderBy('scheduledDate', 'asc')
]);
```

### **Firebase Indexes Exist For:**
- ✅ `assignedStaffId` + `scheduledDate` (ASC)
- ✅ `assignedStaffId` + `status`
- ✅ `assignedTo` + `scheduledDate` (ASC)
- ✅ `assignedTo` + `status`

---

## 🎯 QUESTIONS FOR WEBAPP TEAM

### **1. Which Field Does the Test Job Actually Use?**

The test job (ID: `RydDY5qscBUptuRcCC1g`) assigned to `cleaner@siamoon.com`:

**Does it have:**
- Option A: `assignedTo: "6mywtFzF7wcNg76CKvpSh56Y0ND3"` ✅ or ❌
- Option B: `assignedStaffId: "6mywtFzF7wcNg76CKvpSh56Y0ND3"` ✅ or ❌
- Option C: Both fields exist ✅ or ❌

### **2. What Should Mobile App Query?**

Which field should we query to find jobs for a staff member?
- Option A: `where('assignedTo', '==', userId)`
- Option B: `where('assignedStaffId', '==', userId)`

### **3. What is the Correct Value Format?**

When assigning jobs, what value goes in the field?
- Option A: **Staff Document ID** (e.g., `dEnHUdPyZU0Uutwt6Aj5`)
- Option B: **Firebase Auth UID** (e.g., `6mywtFzF7wcNg76CKvpSh56Y0ND3`)

---

## 📸 PLEASE VERIFY IN FIREBASE CONSOLE

### **Steps to Check:**

1. Go to Firebase Console: https://console.firebase.google.com/project/operty-b54dc/firestore
2. Navigate to `jobs` collection
3. Open job document: `RydDY5qscBUptuRcCC1g`
4. **Screenshot or copy the EXACT field names**

Please confirm:
- [ ] What is the exact field name? `assignedTo` or `assignedStaffId` or both?
- [ ] What is the value in that field? Staff Document ID or Firebase Auth UID?
- [ ] Are there any other assignment-related fields we should know about?

---

## 🔍 WHY THIS MATTERS

**Current Situation:**
- Mobile app queries: `where('assignedStaffId', '==', userId)`
- Error: "The query requires an index"
- Index exists for `assignedStaffId` ✅
- But if webapp uses `assignedTo`, the data won't match!

**Impact:**
- ❌ Mobile app can't find any jobs
- ❌ Test account sees 0 jobs (even though job is assigned)
- ❌ Integration test fails

---

## ✅ WHAT WE NEED FROM YOU

### **Immediate Action:**

1. **Check the test job in Firebase Console**
   - Job ID: `RydDY5qscBUptuRcCC1g`
   - Collection: `jobs`
   
2. **Tell us the EXACT field name(s) used for job assignment:**
   ```
   Field name: _____________
   Field value: _____________
   ```

3. **Confirm the standard going forward:**
   - Should we always use `assignedTo`?
   - Should we always use `assignedStaffId`?
   - Should we use Firebase Auth UID or Staff Document ID?

---

## 🚀 ONCE WE KNOW, WE CAN:

1. Update mobile app query to use correct field
2. Update documentation to be consistent
3. Test with test account `cleaner@siamoon.com`
4. Verify job displays correctly
5. Move forward with integration

---

## 📞 URGENT RESPONSE NEEDED

This is **blocking mobile app testing**. 

Please respond with:
1. Screenshot of test job document from Firebase Console
2. Confirmation of field name standard
3. Confirmation of value format (Staff ID vs Firebase UID)

**We're ready to update mobile app immediately once we have this info!**

---

## 🔧 TEMPORARY WORKAROUND

While we wait, should we:
- [ ] Query BOTH fields (`assignedTo` OR `assignedStaffId`)?
- [ ] Create a migration script to standardize field names?
- [ ] Update job creation to populate both fields?

---

**Priority:** 🔴 URGENT  
**Status:** ⏸️ BLOCKED - Waiting for webapp team confirmation  
**Impact:** Cannot test mobile app until resolved

---

**Generated:** January 5, 2026  
**By:** Mobile App Team  
**Waiting For:** Webapp Team Field Name Confirmation
