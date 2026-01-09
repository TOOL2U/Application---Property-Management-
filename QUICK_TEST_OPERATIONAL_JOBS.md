# Quick Test Guide - Operational Jobs Fix

## 🚀 Quick Test (2 minutes)

### Step 1: Reload the App
```bash
# In your terminal where Metro is running
# Press 'r' to reload
```

### Step 2: Log In
- Email: `cleaner@siamoon.com`
- PIN: Your set PIN (or create one if first time)

### Step 3: Check Jobs Tab
1. Open the Jobs tab
2. Look for: **"Post-Checkout Cleaning - Mountain Retreat Cabin"**
3. Expected status: **"pending"** or **"Available Jobs"** section

### Step 4: Verify in Console
Look for these logs in Metro:
```
🔄 JobContext: Mobile app assigned jobs updated - X jobs
🔄 JobContext: Webapp assigned operational jobs updated - X jobs
🔄 JobContext: Unassigned operational jobs updated - 1 pending jobs available
```

---

## ✅ Success Checklist

- [ ] Job appears in mobile app
- [ ] Job shows property: "Mountain Retreat Cabin"
- [ ] Job shows location: "Ban Tai, Koh Phangan"
- [ ] Console shows "1 pending jobs available"
- [ ] Can tap job to see details
- [ ] Can accept/decline job

---

## 📊 What Changed

**The Fix:**
- Mobile app now queries BOTH `jobs` + `operational_jobs` collections
- 3 real-time listeners ensure all jobs appear instantly
- Firebase indexes added for efficient queries

**Your Test Job:**
- ID: `cOlnK6OzyEc9fqL79oHt`
- Collection: `operational_jobs`
- Status: `pending`
- Assigned: `null` (all cleaners can see it)

---

## 🔧 If Job Doesn't Appear

### Check 1: Firebase Connection
```typescript
// In console, you should see:
✅ JobContext: Connected
🔄 JobContext: Jobs updated
```

### Check 2: Firebase Indexes
If you see an index error, Firebase will show a link to create it. Click the link or run:
```bash
firebase deploy --only firestore:indexes
```

### Check 3: Query the Job Directly
```typescript
import { doc, getDoc } from 'firebase/firestore';

const db = await getDb();
const jobRef = doc(db, 'operational_jobs', 'cOlnK6OzyEc9fqL79oHt');
const jobSnap = await getDoc(jobRef);

if (jobSnap.exists()) {
  console.log('✅ Job exists:', jobSnap.data());
} else {
  console.log('❌ Job not found');
}
```

---

## 📱 Expected Console Output

```
🔥 Firebase initialized successfully
🔍 JobContext: Using Firebase UID for queries: abc123xyz
🔄 JobContext: Mobile app assigned jobs updated - 0 jobs
🔄 JobContext: Webapp assigned operational jobs updated - 0 jobs
🔄 JobContext: Unassigned operational jobs updated - 1 pending jobs available
✅ JobContext: Connected
```

---

## 🎯 What Should Happen

1. **Job Appears** in Jobs tab under "Available Jobs"
2. **Tap job** → See full details (property, location, dates, priority)
3. **Accept job** → Job moves to "My Jobs" section
4. **Real-time update** → Job disappears for other cleaners

---

## 📝 Full Documentation

For detailed information, see: **OPERATIONAL_JOBS_INTEGRATION_COMPLETE.md**

---

**Ready to test!** 🚀
