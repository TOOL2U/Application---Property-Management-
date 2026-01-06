# 🔍 LOGIN TROUBLESHOOTING GUIDE - cleaner@siamoon.com

**Issue:** Cannot log in to cleaner@siamoon.com profile  
**Date:** January 5, 2026

---

## 🎯 LIKELY CAUSES

### **1. Profile Not Showing in Selection Screen**

The mobile app filters profiles by:
```typescript
const isActive = data.status === 'active' || data.isActive === true;
```

**Possible Issues:**
- ❌ `isActive` field is `false` or missing
- ❌ `status` field is not `'active'`
- ❌ Profile doesn't exist in Firebase
- ❌ `name` or `email` fields are missing

---

## 🔧 IMMEDIATE CHECKS NEEDED

### **Check 1: Verify Profile Exists in Firebase**

1. Go to Firebase Console: https://console.firebase.google.com/project/operty-b54dc/firestore
2. Navigate to `staff_accounts` collection
3. Look for document with:
   - Email: `cleaner@siamoon.com`
   - Staff ID: `dEnHUdPyZU0Uutwt6Aj5`

### **Check 2: Verify Active Status**

The document should have **at least ONE** of these:
```javascript
{
  isActive: true,  // ← Should be true (boolean)
  // OR
  status: "active"  // ← Should be "active" (string)
}
```

### **Check 3: Verify Required Fields**

The document **MUST** have:
```javascript
{
  name: "Cleaner",        // ← Must exist and not be empty
  email: "cleaner@siamoon.com",  // ← Must exist
  role: "cleaner"         // ← Must be valid role
}
```

---

## 📋 EXPECTED DOCUMENT STRUCTURE

According to webapp team, the cleaner account should be:

```javascript
{
  // Required fields
  name: "Cleaner",
  email: "cleaner@siamoon.com",
  role: "cleaner",
  isActive: true,  // ← CRITICAL
  
  // Optional but important
  pin: "1234",
  userId: "6mywtFzF7wcNg76CKvpSh56Y0ND3",
  phone: "",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🚨 QUICK FIX OPTIONS

### **Option A: Fix in Firebase Console (IMMEDIATE)**

1. Open Firebase Console
2. Go to `staff_accounts` collection
3. Find document ID: `dEnHUdPyZU0Uutwt6Aj5`
4. Click "Edit"
5. **Add or update:**
   ```
   isActive: true
   ```
6. Click "Update"
7. Reload mobile app

### **Option B: Run Firebase CLI Command**

```bash
# Update the cleaner account
firebase firestore:update staff_accounts dEnHUdPyZU0Uutwt6Aj5 \
  isActive:boolean:true \
  status:string:active
```

### **Option C: Create Simple Test Script**

Create file: `fix-cleaner-account.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCleanerAccount() {
  try {
    await db.collection('staff_accounts').doc('dEnHUdPyZU0Uutwt6Aj5').update({
      isActive: true,
      status: 'active',
      name: 'Cleaner',
      email: 'cleaner@siamoon.com',
      role: 'cleaner'
    });
    
    console.log('✅ Cleaner account fixed!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCleanerAccount();
```

Run: `node fix-cleaner-account.js`

---

## 🔍 DEBUGGING STEPS

### **Step 1: Check Mobile App Console Logs**

When you open the app, look for:

```
📱 SelectProfile: staffProfiles state changed
```

**If you see 0 profiles:**
```
count: 0
profiles: []
```
→ Profiles not loading from Firebase

**If you see profiles but not cleaner:**
```
count: 3
profiles: [
  { id: 'xxx', name: 'John', email: 'john@...' },
  // cleaner is missing
]
```
→ Cleaner profile is filtered out (probably isActive is false)

### **Step 2: Check Firebase Query Logs**

Look for:
```
✅ StaffSyncService: Fetched X staff accounts from Firestore
```

If X = 0 or doesn't include cleaner → Profile is filtered

### **Step 3: Manual Firebase Query Test**

Open Firebase Console → Firestore → Run query:

```
Collection: staff_accounts
Where: email == cleaner@siamoon.com
```

**If document exists:**
- Check `isActive` field value
- Check `status` field value
- Check `name` field exists
- Check `email` matches exactly

**If no document:** Profile doesn't exist in Firebase!

---

## 💡 COMMON ISSUES & SOLUTIONS

### **Issue 1: Profile Exists But isActive = false**
**Solution:** Set `isActive: true` in Firebase Console

### **Issue 2: Profile Has status = "inactive"**
**Solution:** Set `status: "active"` in Firebase Console

### **Issue 3: Profile Missing name Field**
**Solution:** Add `name: "Cleaner"` in Firebase Console

### **Issue 4: Email Typo**
**Fix:** Verify email is exactly `cleaner@siamoon.com` (no spaces, correct domain)

### **Issue 5: Profile Doesn't Exist**
**Solution:** Create new document in `staff_accounts`:
```javascript
{
  id: "dEnHUdPyZU0Uutwt6Aj5",
  name: "Cleaner",
  email: "cleaner@siamoon.com",
  role: "cleaner",
  isActive: true,
  status: "active",
  pin: "1234",
  userId: "6mywtFzF7wcNg76CKvpSh56Y0ND3"
}
```

---

## 🎯 NEXT STEPS

1. **Check Firebase Console** - Verify profile exists and isActive = true
2. **Check Mobile Logs** - See if profile is being filtered
3. **Fix isActive** - Set to true if false
4. **Reload App** - Should see cleaner profile now
5. **Try PIN Login** - Use PIN 1234

---

## 📞 IF STILL NOT WORKING

### **Collect This Information:**

1. **Screenshot of Firebase document for cleaner@siamoon.com**
2. **Mobile app console logs** when opening select-profile screen
3. **Number of profiles showing** in mobile app
4. **Which profiles ARE showing** (if any)

### **Then:**

Share this info and we can diagnose further. Likely need to either:
- Fix the Firebase document
- Adjust the mobile app filter logic
- Clear app cache and reload

---

## ✅ EXPECTED OUTCOME

Once fixed, you should see:

```
Profile Selection Screen:
┌────────────────────────┐
│  👤 Cleaner           │
│  cleaner@siamoon.com   │
│  Role: Cleaner         │
│  [TAP TO LOGIN]        │
└────────────────────────┘
```

Tap → Enter PIN (1234) → Login Success ✅

---

**Status:** 🔴 BLOCKED - Needs Firebase document verification  
**Priority:** HIGH - Required for testing  
**Next Action:** Check Firebase Console for cleaner profile
