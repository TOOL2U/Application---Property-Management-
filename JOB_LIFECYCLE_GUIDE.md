# Job Lifecycle Guide - Complete Flow

## 📋 Table of Contents
1. [Job Status States](#job-status-states)
2. [Job Lifecycle Flow](#job-lifecycle-flow)
3. [What Happens at Each Stage](#what-happens-at-each-stage)
4. [Real-Time Updates](#real-time-updates)
5. [Collection Management](#collection-management)
6. [Code Implementation](#code-implementation)

---

## 🔄 Job Status States

```typescript
type JobStatus = 
  | 'pending'      // Created by webapp, awaiting assignment
  | 'offered'      // Offered to specific cleaner(s)
  | 'accepted'     // Cleaner accepted the job
  | 'assigned'     // Admin assigned to specific cleaner
  | 'in_progress'  // Cleaner started working on it
  | 'completed'    // Cleaner finished the job
  | 'declined'     // Cleaner declined the job
  | 'cancelled';   // Admin cancelled the job
```

---

## 🎯 Job Lifecycle Flow

### Flow Diagram

```
┌──────────────┐
│   WEBAPP     │
│ Creates Job  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│  operational_jobs       │
│  status: 'pending'      │
│  assignedStaffId: null  │
└──────┬──────────────────┘
       │
       │ ┌─────────────────────────────┐
       ├─┤ Mobile App (All Cleaners)  │
       │ │ - Sees job in Available    │
       │ │ - Can accept or decline    │
       │ └─────────────────────────────┘
       │
       ▼ (Cleaner taps "Accept")
┌─────────────────────────┐
│  status: 'accepted'     │
│  assignedStaffId: [UID] │
│  acceptedAt: [timestamp]│
└──────┬──────────────────┘
       │
       │ ┌─────────────────────────────┐
       └─┤ Moves to "My Jobs" section │
         │ - Job disappears for others │
         │ - Only this cleaner sees it │
         └───────┬─────────────────────┘
                 │
                 ▼ (Cleaner taps "Start Job")
         ┌─────────────────────────┐
         │  status: 'in_progress'  │
         │  startedAt: [timestamp] │
         └──────┬──────────────────┘
                │
                │ ┌─────────────────────────────┐
                └─┤ Cleaner working on job     │
                  │ - Checklist appears         │
                  │ - Can upload photos         │
                  │ - GPS tracking active       │
                  └───────┬─────────────────────┘
                          │
                          ▼ (Cleaner taps "Complete Job")
                  ┌─────────────────────────┐
                  │  status: 'completed'    │
                  │  completedAt: [timestamp]│
                  │  completionPhotos: [...]│
                  └──────┬──────────────────┘
                         │
                         │ ┌─────────────────────────────┐
                         └─┤ Job archived                │
                           │ - Appears in Completed tab  │
                           │ - Visible to admin/manager  │
                           │ - Read-only for cleaner     │
                           └─────────────────────────────┘
```

---

## 🔧 What Happens at Each Stage

### 1. **PENDING** (Initial State)

**Created by:** Webapp (admin/manager)

**Firebase Document:**
```json
{
  "id": "cOlnK6OzyEc9fqL79oHt",
  "status": "pending",
  "requiredRole": "cleaner",
  "assignedStaffId": null,
  "propertyId": "xapwbYmKxzyKH23gcq9L",
  "propertyName": "Mountain Retreat Cabin",
  "title": "Post-Checkout Cleaning",
  "scheduledDate": Timestamp,
  "createdAt": Timestamp
}
```

**Mobile App Behavior:**
- ✅ **ALL cleaners see this job** in "Available Jobs" section
- ✅ Job appears in Jobs tab with "pending" badge
- ✅ Cleaners can tap to see details
- ✅ Cleaners can accept or decline
- ✅ Real-time listener shows it instantly (no reload needed)

**Queries:**
```typescript
// JobContext listener #3
query(
  collection(db, 'operational_jobs'),
  where('requiredRole', '==', 'cleaner'),
  where('status', 'in', ['pending', 'offered']),
  orderBy('createdAt', 'desc')
)
```

**UI Display:**
- Badge: "Available" (Yellow)
- Icon: 📋
- Action buttons: "Accept" | "Decline"

---

### 2. **ACCEPTED** (Cleaner Accepted)

**Triggered by:** Cleaner taps "Accept Job" button

**What Changes:**
```json
{
  "status": "accepted",              // ← Changed
  "assignedStaffId": "user_abc123",  // ← Added/Updated
  "assignedTo": "user_abc123",       // ← Added (for compatibility)
  "acceptedAt": Timestamp,           // ← Added
  "updatedAt": Timestamp             // ← Updated
}
```

**Code Flow:**
```typescript
// 1. JobAcceptanceModal triggers
handleAcceptJob() 
  → staffJobService.updateJobStatus(jobId, 'accepted', staffId)
  → Firebase updates operational_jobs document

// 2. Real-time listener fires
JobContext listeners detect change
  → Job moves from unassignedJobs to assignedOperationalJobs
  → UI updates automatically

// 3. Job disappears for other cleaners
// because assignedStaffId is no longer null
```

**Mobile App Behavior:**
- ✅ Job **moves to "My Jobs"** section
- ✅ Job **disappears for other cleaners** (they no longer see it in Available)
- ✅ Badge changes to "Accepted" (Green)
- ✅ New action button: "Start Job"
- ✅ Notification sent to admin/manager: "Job accepted by [cleaner name]"

**Queries:**
```typescript
// JobContext listener #2 (now picks it up)
query(
  collection(db, 'operational_jobs'),
  where('assignedStaffId', '==', firebaseUid),
  orderBy('createdAt', 'desc')
)
```

**UI Display:**
- Badge: "Accepted" (Green)
- Icon: ✅
- Action button: "Start Job"
- Shows: acceptedAt timestamp

---

### 3. **IN_PROGRESS** (Job Started)

**Triggered by:** Cleaner taps "Start Job" button

**What Changes:**
```json
{
  "status": "in_progress",     // ← Changed
  "startedAt": Timestamp,      // ← Added
  "updatedAt": Timestamp       // ← Updated
}
```

**Code Flow:**
```typescript
// Cleaner taps "Start Job"
updateJobStatus({
  jobId: job.id,
  status: 'in_progress',
  updatedBy: currentProfile.id
})
  → JobContext.updateJobStatus()
  → Finds job in operational_jobs collection
  → Updates status + adds startedAt timestamp
  → Real-time listener fires
  → UI updates (shows completion wizard)
```

**Mobile App Behavior:**
- ✅ **Job Completion Wizard appears**
- ✅ Checklist items load (property-specific tasks)
- ✅ Photo upload enabled
- ✅ GPS tracking starts (location updates every 5 min)
- ✅ Timer starts (tracks work duration)
- ✅ Badge changes to "In Progress" (Orange)
- ✅ Map marker shows **green flashing** indicator

**Features Active:**
- 📸 **Photo Upload:** Before/After photos
- ✓ **Checklist:** Task completion tracking
- 📍 **GPS Tracking:** Location updates
- ⏱️ **Timer:** Work duration tracking
- 💬 **Notes:** Add completion notes

**Queries:**
```typescript
// Same query as accepted (listener #2)
// JobContext filters by status for display
const inProgressJobs = jobs.filter(job => job.status === 'in_progress');
```

**UI Display:**
- Badge: "In Progress" (Orange)
- Icon: 🔄
- Shows: Timer (e.g., "1h 23m")
- Action button: "Complete Job"

---

### 4. **COMPLETED** (Job Finished)

**Triggered by:** Cleaner taps "Complete Job" in wizard

**What Changes:**
```json
{
  "status": "completed",           // ← Changed
  "completedAt": Timestamp,        // ← Added
  "completionPhotos": [...],       // ← Added
  "completionNotes": "...",        // ← Added
  "checklist": [...],              // ← Updated (all checked)
  "workDuration": 4500,            // ← Added (seconds)
  "finalLocation": {...},          // ← Added (GPS)
  "updatedAt": Timestamp           // ← Updated
}
```

**Code Flow:**
```typescript
// JobCompletionWizard final step
handleCompleteJob()
  → Validate all required fields
  → Upload photos to Firebase Storage
  → Update job document with completion data
  → Move to completed_jobs collection (optional)
  → Send notification to admin/manager
  → JobContext listener fires
  → Job moves to "Completed" section
```

**Mobile App Behavior:**
- ✅ **Success message:** "Job completed successfully!"
- ✅ Job moves to **"Completed Jobs"** tab
- ✅ Badge changes to "Completed" (Green checkmark)
- ✅ **Read-only mode:** Cleaner can view but not edit
- ✅ Photos uploaded to Firebase Storage
- ✅ Admin/manager receives notification
- ✅ Job **may disappear from mobile app** after some time (archived)

**Admin/Manager Gets:**
- 📊 Completion report
- 📸 Before/After photos
- ✓ Completed checklist
- ⏱️ Work duration
- 📍 GPS location history
- 💬 Completion notes

**Queries:**
```typescript
// Optional: Completed jobs query
query(
  collection(db, 'operational_jobs'),
  where('assignedStaffId', '==', firebaseUid),
  where('status', '==', 'completed'),
  orderBy('completedAt', 'desc')
)
```

**UI Display:**
- Badge: "Completed" (Green checkmark)
- Icon: ✓
- Shows: completedAt timestamp
- Action: "View Details" (read-only)

---

## 🔔 Real-Time Updates

### How It Works

**Firebase Realtime Listeners:**
```typescript
// JobContext sets up 3 listeners
useEffect(() => {
  // Listener 1: Assigned mobile jobs
  // Listener 2: Assigned operational jobs
  // Listener 3: Unassigned pending jobs
  
  // All listeners use onSnapshot for real-time updates
  onSnapshot(query, (snapshot) => {
    // Updates fire automatically when data changes
    snapshot.forEach(doc => {
      // Process updated documents
    });
  });
}, [currentProfile?.id]);
```

**Update Flow:**
```
Webapp creates job → Firebase operational_jobs → onSnapshot fires
                                                        ↓
                                               JobContext updates
                                                        ↓
                                              jobs state changes
                                                        ↓
                                             UI re-renders
                                                        ↓
                                      Job appears in Available Jobs
```

**No Reload Needed:**
- ✅ New jobs appear within 1-2 seconds
- ✅ Status changes update instantly
- ✅ Accepted jobs disappear for others immediately
- ✅ All cleaners stay synchronized

---

## 🗄️ Collection Management

### BOTH Collections Supported

**Mobile app now queries:**
1. **`jobs` collection** (mobile app native jobs)
2. **`operational_jobs` collection** (webapp created jobs)

### Functions Updated

**jobService.ts:**
- ✅ `acceptJob()` - Checks both collections
- ✅ `getStaffJobs()` - Queries both collections in parallel

**staffJobService.ts:**
- ✅ `updateJobStatus()` - Updates in correct collection

**JobContext.tsx:**
- ✅ 3 real-time listeners cover both collections
- ✅ `updateJobStatus()` - Finds job in either collection
- ✅ `respondToJob()` - Handles both collections

### How Collection is Determined

```typescript
// Try jobs collection first
let jobRef = doc(db, 'jobs', jobId);
let jobDoc = await getDoc(jobRef);

// If not found, try operational_jobs
if (!jobDoc.exists()) {
  jobRef = doc(db, 'operational_jobs', jobId);
  jobDoc = await getDoc(jobRef);
}

if (!jobDoc.exists()) {
  throw new Error('Job not found in any collection');
}

// Update the found document
await updateDoc(jobRef, updateData);
```

---

## 💻 Code Implementation

### Accept Job

```typescript
// components/jobs/JobAcceptanceModal.tsx
const handleAcceptJob = async () => {
  // Call staffJobService
  const response = await staffJobService.updateJobStatus(
    job.id,
    'accepted',
    currentProfile.id,
    {
      estimatedArrival: estimatedArrival,
      acceptanceNotes: notes
    }
  );
  
  if (response.success) {
    // ✅ Job status updated to 'accepted'
    // ✅ assignedStaffId set to current user
    // ✅ Real-time listener fires
    // ✅ Job moves to "My Jobs"
    Alert.alert('Success', 'Job accepted!');
  }
};
```

### Start Job

```typescript
// app/jobs/[id].tsx or EnhancedStaffJobsView.tsx
const handleStartJob = async () => {
  const success = await updateJobStatus({
    jobId: job.id,
    status: 'in_progress',
    updatedBy: currentProfile.id
  });
  
  if (success) {
    // ✅ Job status updated to 'in_progress'
    // ✅ startedAt timestamp added
    // ✅ Completion wizard appears
    // ✅ Timer starts
    navigation.navigate('JobCompletion', { jobId: job.id });
  }
};
```

### Complete Job

```typescript
// components/jobs/JobCompletionWizard.tsx
const handleCompleteJob = async () => {
  // Upload photos
  const photoUrls = await uploadPhotosToStorage(photos);
  
  // Update job status
  const success = await updateJobStatus({
    jobId: job.id,
    status: 'completed',
    updatedBy: currentProfile.id,
    notes: completionNotes,
    additionalData: {
      completionPhotos: photoUrls,
      checklist: checklistItems,
      workDuration: workDurationSeconds,
      finalLocation: currentLocation
    }
  });
  
  if (success) {
    // ✅ Job status updated to 'completed'
    // ✅ Photos uploaded to Firebase Storage
    // ✅ Admin/manager notified
    // ✅ Job archived
    Alert.alert('Success', 'Job completed successfully!');
    navigation.goBack();
  }
};
```

---

## 📊 Job Visibility Matrix

| Status | Assigned To | All Cleaners See? | Assigned Cleaner Sees? | Section |
|--------|-------------|-------------------|------------------------|---------|
| pending | null | ✅ Yes | ❌ No | Available Jobs |
| offered | null | ✅ Yes | ❌ No | Available Jobs |
| accepted | staff_123 | ❌ No | ✅ Yes | My Jobs |
| assigned | staff_123 | ❌ No | ✅ Yes | My Jobs |
| in_progress | staff_123 | ❌ No | ✅ Yes | My Jobs (In Progress) |
| completed | staff_123 | ❌ No | ✅ Yes (read-only) | Completed Jobs |
| declined | null/staff_123 | ❌ No | ❌ No | Hidden |
| cancelled | - | ❌ No | ❌ No | Hidden |

---

## 🎯 Summary

### Job Lifecycle States

1. **PENDING** → All cleaners see it, anyone can accept
2. **ACCEPTED** → Assigned to cleaner, only they see it
3. **IN_PROGRESS** → Cleaner working on it, timer running
4. **COMPLETED** → Job finished, archived, read-only

### Key Features

✅ **Real-time updates** - No reload needed
✅ **Dual collection support** - Works with jobs + operational_jobs
✅ **Automatic assignment** - Accepting unassigned job assigns it
✅ **Status tracking** - Timestamps for every state change
✅ **GPS tracking** - Location updates during in_progress
✅ **Photo upload** - Before/after documentation
✅ **Checklist** - Task completion tracking
✅ **Notifications** - Admin/manager informed of changes

### Your Test Job

```
Job ID: cOlnK6OzyEc9fqL79oHt
Status: pending
Collection: operational_jobs

What will happen:
1. Log in as cleaner@siamoon.com
2. See job in "Available Jobs"
3. Tap "Accept" → status changes to 'accepted'
4. Job moves to "My Jobs"
5. Tap "Start Job" → status changes to 'in_progress'
6. Complete checklist, add photos
7. Tap "Complete" → status changes to 'completed'
8. Job archived in "Completed Jobs"
```

**All changes happen in real-time with automatic UI updates!** 🚀

