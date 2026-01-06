# Real-Time Sync Between Mobile App & Webapp

## Current Architecture Overview

### Mobile App (React Native)
- Updates Firestore directly when staff performs actions
- Uses real-time listeners (`onSnapshot`) to detect changes
- Status changes: assigned → accepted → in_progress → completed

### Webapp (Your Booking System)
- Reads from Firestore collections
- Needs real-time listeners to see mobile updates instantly

## Data Flow

```
Mobile App Action          Firestore Update              Webapp Display
─────────────────────────────────────────────────────────────────────────
Staff accepts job    →     jobs/{jobId}.status = "accepted"    → Update UI
                          jobs/{jobId}.acceptedAt = timestamp
                          
Staff starts job     →     jobs/{jobId}.status = "in_progress" → Update UI
                          jobs/{jobId}.startedAt = timestamp
                          
Staff completes job  →     1. Update jobs/{jobId}              → Update UI
                          2. Move to completed_jobs/{jobId}
                          3. Delete from jobs/{jobId}
```

## What the Mobile App Currently Does ✅

### 1. **Accept Job** (updateJobStatus → 'accepted')
**File**: `services/staffJobService.ts` Line 269-308

**Updates**:
```javascript
{
  status: 'accepted',
  acceptedAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### 2. **Start Job** (updateJobStatus → 'in_progress')
**Updates**:
```javascript
{
  status: 'in_progress',
  startedAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### 3. **Complete Job** (completeJob)
**File**: `services/jobService.ts` Line 471-606

**Actions**:
1. Updates job document with completion data
2. **Moves entire job to `completed_jobs` collection**
3. **Deletes from `jobs` collection**
4. Uses batch write for atomic operation

**Completion Data**:
```javascript
{
  status: 'completed',
  completedAt: serverTimestamp(),
  completedBy: staffId,
  actualDuration: number,
  completionNotes: string,
  actualCost: number,
  photos: string[],
  requirements: { /* updated checklist */ },
  movedToCompletedAt: serverTimestamp()
}
```

## What the Webapp Needs to Do 🔧

### Option 1: Real-Time Listeners (Recommended)
Use Firestore's `onSnapshot` to listen for changes in real-time.

#### A. Listen to Active Jobs

```javascript
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // Your Firebase config

// For a specific property's jobs
function subscribeToPropertyJobs(propertyId, callback) {
  const jobsRef = collection(db, 'jobs');
  const q = query(jobsRef, where('propertyId', '==', propertyId));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const jobs = [];
    snapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Real-time update: ${jobs.length} active jobs`);
    callback(jobs); // Update your UI
  });
  
  return unsubscribe; // Call this to stop listening
}

// For all jobs (admin view)
function subscribeToAllJobs(callback) {
  const jobsRef = collection(db, 'jobs');
  
  const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
    const jobs = [];
    snapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Real-time update: ${jobs.length} active jobs`);
    callback(jobs);
  });
  
  return unsubscribe;
}

// Usage in your component
useEffect(() => {
  const unsubscribe = subscribeToPropertyJobs(propertyId, (updatedJobs) => {
    setJobs(updatedJobs); // Update state
  });
  
  return () => unsubscribe(); // Cleanup on unmount
}, [propertyId]);
```

#### B. Listen to Completed Jobs

```javascript
function subscribeToCompletedJobs(propertyId, callback) {
  const completedJobsRef = collection(db, 'completed_jobs');
  const q = query(
    completedJobsRef, 
    where('propertyId', '==', propertyId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const completedJobs = [];
    snapshot.forEach((doc) => {
      completedJobs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Real-time update: ${completedJobs.length} completed jobs`);
    callback(completedJobs);
  });
  
  return unsubscribe;
}
```

#### C. Listen for Job Status Changes (Detect Transitions)

```javascript
function subscribeToJobStatusChanges(jobId, callback) {
  const jobRef = doc(db, 'jobs', jobId);
  
  const unsubscribe = onSnapshot(jobRef, (doc) => {
    if (doc.exists()) {
      const jobData = { id: doc.id, ...doc.data() };
      callback(jobData);
      
      // Show notification based on status
      if (jobData.status === 'accepted') {
        showNotification(`Job accepted by ${jobData.assignedTo}`);
      } else if (jobData.status === 'in_progress') {
        showNotification(`Job started by ${jobData.assignedTo}`);
      }
    } else {
      // Job was deleted (moved to completed_jobs)
      callback(null);
      showNotification('Job completed and archived');
    }
  });
  
  return unsubscribe;
}
```

### Option 2: Polling (Not Recommended)
If you can't use real-time listeners, poll Firestore every 30-60 seconds.

```javascript
async function pollForUpdates(propertyId) {
  const jobsRef = collection(db, 'jobs');
  const q = query(jobsRef, where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  
  const jobs = [];
  snapshot.forEach((doc) => {
    jobs.push({ id: doc.id, ...doc.data() });
  });
  
  return jobs;
}

// In your component
useEffect(() => {
  const intervalId = setInterval(async () => {
    const updatedJobs = await pollForUpdates(propertyId);
    setJobs(updatedJobs);
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(intervalId);
}, [propertyId]);
```

## Field Names Reference

### Job Document Fields (jobs collection)

**Status Fields**:
- `status`: "assigned" | "accepted" | "in_progress" | "completed"
- `acceptedAt`: Timestamp (when staff accepted)
- `startedAt`: Timestamp (when staff started work)
- `completedAt`: Timestamp (when staff completed)

**Staff Assignment Fields**:
- `assignedTo`: Staff profile ID (new field name - PREFERRED)
- `assignedStaffId`: Staff profile ID (legacy field name - fallback)
- `assignedStaffName`: Staff name for display
- `completedBy`: Staff ID who completed the job

**Required Display Fields**:
```javascript
{
  id: string,
  title: string,
  propertyName: string,
  propertyAddress: string,
  scheduledDate: Timestamp,
  status: JobStatus,
  assignedTo: string, // or assignedStaffId
}
```

### Completed Job Document (completed_jobs collection)

**Additional Fields**:
- `originalJobId`: The original job ID
- `movedToCompletedAt`: When moved from jobs collection
- `actualDuration`: Actual time taken (minutes)
- `completionNotes`: Staff notes
- `actualCost`: Final cost
- `photos`: Array of photo URLs
- `requirements`: Updated checklist with completion status

## Implementation Steps for Webapp

### Step 1: Add Real-Time Listener Service

Create `services/realtimeJobService.js`:

```javascript
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

class RealtimeJobService {
  listeners = new Map();

  // Subscribe to all jobs for a property
  subscribeToPropertyJobs(propertyId, onUpdate, onError) {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('propertyId', '==', propertyId));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const jobs = [];
        snapshot.docChanges().forEach((change) => {
          const job = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'added') {
            console.log('New job:', job.id);
          }
          if (change.type === 'modified') {
            console.log('Job updated:', job.id, job.status);
          }
          if (change.type === 'removed') {
            console.log('Job removed:', job.id);
          }
          
          jobs.push(job);
        });
        
        onUpdate(jobs);
      },
      (error) => {
        console.error('Realtime listener error:', error);
        onError?.(error);
      }
    );
    
    this.listeners.set(`property_${propertyId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to specific job
  subscribeToJob(jobId, onUpdate, onError) {
    const jobRef = doc(db, 'jobs', jobId);
    
    const unsubscribe = onSnapshot(jobRef,
      (doc) => {
        if (doc.exists()) {
          const job = { id: doc.id, ...doc.data() };
          onUpdate(job);
        } else {
          onUpdate(null); // Job deleted (completed)
        }
      },
      (error) => {
        console.error('Job listener error:', error);
        onError?.(error);
      }
    );
    
    this.listeners.set(`job_${jobId}`, unsubscribe);
    return unsubscribe;
  }

  // Clean up all listeners
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Unsubscribe from specific listener
  unsubscribe(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }
}

export const realtimeJobService = new RealtimeJobService();
```

### Step 2: Use in Your Components

**Example: Job List Page**

```javascript
import { useEffect, useState } from 'react';
import { realtimeJobService } from './services/realtimeJobService';

function JobListPage({ propertyId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up real-time listener for property:', propertyId);
    
    const unsubscribe = realtimeJobService.subscribeToPropertyJobs(
      propertyId,
      (updatedJobs) => {
        setJobs(updatedJobs);
        setLoading(false);
        
        // Show toast notification for status changes
        updatedJobs.forEach(job => {
          if (job.status === 'accepted') {
            showToast(`${job.assignedStaffName} accepted ${job.title}`);
          } else if (job.status === 'in_progress') {
            showToast(`${job.assignedStaffName} started ${job.title}`);
          }
        });
      },
      (error) => {
        console.error('Failed to load jobs:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up real-time listener');
      unsubscribe();
    };
  }, [propertyId]);

  return (
    <div>
      {loading && <Spinner />}
      {jobs.map(job => (
        <JobCard 
          key={job.id} 
          job={job}
          showStatusBadge={true}
        />
      ))}
    </div>
  );
}
```

**Example: Single Job Status Page**

```javascript
function JobStatusPage({ jobId }) {
  const [job, setJob] = useState(null);

  useEffect(() => {
    const unsubscribe = realtimeJobService.subscribeToJob(
      jobId,
      (updatedJob) => {
        if (updatedJob === null) {
          // Job completed and moved to completed_jobs
          // Redirect to completed jobs page
          router.push(`/completed-jobs/${jobId}`);
        } else {
          setJob(updatedJob);
        }
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  if (!job) return <div>Loading...</div>;

  return (
    <div>
      <h1>{job.title}</h1>
      <StatusBadge status={job.status} />
      
      {job.status === 'accepted' && (
        <div>✅ Accepted by {job.assignedStaffName} at {job.acceptedAt}</div>
      )}
      
      {job.status === 'in_progress' && (
        <div>🚀 Started at {job.startedAt}</div>
      )}
    </div>
  );
}
```

### Step 3: Add Status Badge Component

```javascript
function JobStatusBadge({ status }) {
  const statusConfig = {
    assigned: { label: 'Assigned', color: 'blue', icon: '📋' },
    accepted: { label: 'Accepted', color: 'green', icon: '✅' },
    in_progress: { label: 'In Progress', color: 'orange', icon: '🚀' },
    completed: { label: 'Completed', color: 'gray', icon: '✔️' }
  };

  const config = statusConfig[status] || statusConfig.assigned;

  return (
    <span className={`badge badge-${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
}
```

## Testing the Real-Time Sync

### Test Scenario 1: Accept Job
1. **Webapp**: Create and assign job to staff member
2. **Mobile**: Staff logs in, sees job with status "assigned"
3. **Mobile**: Staff taps "Accept Job"
4. **Webapp**: Should immediately see status change to "accepted" with green badge
5. **Webapp**: Should show `acceptedAt` timestamp

### Test Scenario 2: Start Job
1. **Mobile**: Staff taps "Start Job"
2. **Webapp**: Should immediately see status change to "in_progress" with orange badge
3. **Webapp**: Should show `startedAt` timestamp

### Test Scenario 3: Complete Job
1. **Mobile**: Staff completes checklist, adds photos, adds notes
2. **Mobile**: Taps "Complete Job"
3. **Webapp Active Jobs**: Job disappears from list
4. **Webapp Completed Jobs**: Job appears in completed list with all completion data
5. **Check `completed_jobs` collection**: Job document should exist with full data

## Firestore Security Rules

Make sure your `firestore.rules` allows the webapp to read jobs:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Jobs collection - active jobs
    match /jobs/{jobId} {
      // Allow staff to read their assigned jobs
      allow read: if request.auth != null;
      
      // Allow admin/webapp to read all jobs
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin';
      
      // Allow updates by assigned staff or admin
      allow update: if request.auth != null;
    }
    
    // Completed jobs collection
    match /completed_jobs/{jobId} {
      // Allow read by admin/webapp
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin';
      
      // Allow write by system (mobile app)
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Issue: Webapp not receiving real-time updates
**Solutions**:
1. Check Firebase Authentication - webapp must be signed in
2. Check Firestore rules - ensure read permissions
3. Check browser console for listener errors
4. Verify collection names: `jobs` and `completed_jobs`

### Issue: Jobs disappear after completion
**Expected Behavior**: When staff completes a job:
- Job is removed from `jobs` collection
- Job is added to `completed_jobs` collection
- Your listener on `jobs` will see a "removed" event
- Set up separate listener on `completed_jobs` to see completed work

### Issue: Field names don't match
**Solution**: The mobile app uses both field names:
- Writes to: `assignedTo` (preferred)
- Reads from: `assignedTo` OR `assignedStaffId` (fallback)
- Update your job creation to use `assignedTo` field

## Performance Considerations

### Limit Listeners
Don't create multiple listeners for the same data:
```javascript
// ❌ Bad - creates multiple listeners
useEffect(() => {
  subscribeToJobs(propertyId, setJobs);
}, [propertyId, someOtherState]); // Re-subscribes on any state change

// ✅ Good - only subscribes when propertyId changes
useEffect(() => {
  const unsubscribe = subscribeToJobs(propertyId, setJobs);
  return () => unsubscribe();
}, [propertyId]);
```

### Use Indexes
For better query performance, create Firestore indexes:
- `jobs` collection: `propertyId + scheduledDate`
- `jobs` collection: `assignedTo + scheduledDate`
- `completed_jobs` collection: `completedAt + propertyId`

### Pagination for Completed Jobs
```javascript
const q = query(
  collection(db, 'completed_jobs'),
  where('propertyId', '==', propertyId),
  orderBy('completedAt', 'desc'),
  limit(50) // Only load 50 most recent
);
```

## Summary

✅ **Mobile app is ready** - It updates Firestore correctly with all status changes

🔧 **Webapp needs**:
1. Add real-time listeners using `onSnapshot`
2. Listen to both `jobs` and `completed_jobs` collections
3. Update UI when status changes
4. Handle job transitions (assigned → accepted → in_progress → completed)

The data is already flowing from mobile to Firestore - you just need to listen for it!

---

**Next Steps**:
1. Implement `realtimeJobService` in your webapp
2. Add listeners to job list pages
3. Test with mobile app actions
4. Add toast notifications for status changes
5. Style status badges for visual feedback

Need help implementing any specific part? Let me know!
