# Status Color Debug Logging - ADDED 🔍

## Issue
User reported that when accepting a job, the property card color didn't change from yellow to green in the dashboard.

## Investigation

### How It Should Work
1. User accepts job from job details screen
2. `staffJobService.updateJobStatus()` updates the job status to 'accepted' in Firestore (in either `jobs` or `operational_jobs` collection)
3. JobContext real-time listener detects the change
4. useStaffJobs hook categorizes accepted jobs into `activeJobs` array
5. Dashboard combines `pendingJobs` (yellow) and `activeJobs` (includes accepted = green) into `upcomingJobs`
6. Dashboard renders property cards with status-based colors

### Status Color Mapping
| Status | Array | Color | Code |
|--------|-------|-------|------|
| `pending` | pendingJobs | Yellow | `#C6FF00` |
| `assigned` | pendingJobs | Yellow | `#C6FF00` |
| `accepted` | activeJobs | **Green** | `#00FF88` |
| `in_progress` | activeJobs | Blue | `#60A5FA` |

### What Was Added

**Debug Console Logging:**

1. **Upcoming Jobs Status Logging**
   ```typescript
   if (upcoming.length > 0) {
     console.log('📋 Dashboard: Upcoming jobs statuses:', 
       upcoming.map(j => ({ id: j.id, status: j.status, title: j.title }))
     );
   }
   ```

2. **Status Color Function Logging**
   ```typescript
   const getJobStatusColor = (status: string) => {
     console.log(`🎨 Dashboard: Getting color for status "${status}" for job ${job.id}`);
     // ... switch statement ...
     console.log(`⚠️ Dashboard: Unknown status "${status}", defaulting to yellow`);
   }
   ```

3. **Final Color Assignment Logging**
   ```typescript
   console.log(`✅ Dashboard: Job ${job.id} (${job.title}) - Status: "${job.status}" - Color: ${statusColor}`);
   ```

## How to Debug

### Steps to Test:
1. Open the app and go to dashboard
2. Open developer console / React Native debugger
3. Look for log messages starting with `📋 Dashboard:`, `🎨 Dashboard:`, `✅ Dashboard:`
4. Accept a job from job details screen
5. Watch console logs to see:
   - If job status actually changed in the data
   - What status value is being passed to color function
   - What color is being assigned
   - If job moved from pendingJobs to activeJobs

### Expected Logs After Accepting:
```
📋 Dashboard: Upcoming jobs statuses: [
  { id: 'job123', status: 'accepted', title: 'Clean Villa A' }
]
🎨 Dashboard: Getting color for status "accepted" for job job123
✅ Dashboard: Job job123 (Clean Villa A) - Status: "accepted" - Color: #00FF88
```

## Possible Issues to Check

1. **Status field name mismatch**
   - Is it `status` or `jobStatus` in operational_jobs?
   - Check Firebase console

2. **Real-time listener not updating**
   - Check JobContext logs: `🔄 JobContext: Webapp assigned operational jobs updated`
   - Verify job is being updated in correct collection

3. **useStaffJobs filtering**
   - Check if 'accepted' is included in activeJobs filter
   - Current code: `job.status === 'accepted' || job.status === 'in_progress'`

4. **String comparison issues**
   - Extra spaces in status value?
   - Different casing (e.g., 'Accepted' vs 'accepted')?

## Next Steps

1. Run app and accept a job
2. Check console logs to identify where the status change is failing
3. Based on logs, fix the actual issue (could be field name, filtering, or real-time update)
4. Remove debug logs once issue is resolved

## Files Modified
- `app/(tabs)/index.tsx` - Added debug logging

## Status
🔍 IN PROGRESS - Debug logging added, awaiting test results
