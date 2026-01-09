# Map Status Update Troubleshooting Guide 🔍

## Issue
When pressing "Start Job" button, the property marker on the map doesn't change color (should stay green and continue flashing).

## How It Should Work

### Job Status Flow:
1. **Pending** → Yellow marker (static)
2. **Accept Job** → Green marker (flashing) ✅ Working
3. **Start Job** → Green marker (flashing) ❌ Not updating

### Expected Status Values:
- `'accepted'` → Green marker (flashing)
- `'in_progress'` → Green marker (flashing)

## Debug Logs to Check

### 1. When You Press "Start Job"
Look for these logs in console:

```
🔄 MapScreen: Jobs updated, refreshing markers...
   📊 Pending jobs: X, Active jobs: X, Total jobs: X
```

**What to check:**
- Is this log appearing after pressing "Start Job"?
- Are Active jobs increasing by 1?
- Are Pending jobs decreasing by 1?

### 2. Job Status Detection
```
🏠 MapScreen: Property [Name] has 1 job(s): [{ id: 'xxx', status: 'in_progress', title: 'Clean...' }]
🟢 MapScreen: Job xxx has ACTIVE status: "in_progress"
✅ MapScreen: Property [Name] marked as ACTIVE (green) - will FLASH
```

**What to check:**
- Is the status actually `'in_progress'` or something else?
- Is the job being detected as ACTIVE?
- Is the property marked as ACTIVE (green)?

### 3. Unknown Status Warning
If you see this:
```
⚠️ MapScreen: Property [Name] has jobs but unknown status: ['some_status']
```

This means the status value doesn't match any expected values!

## Possible Issues

### Issue 1: Status Value Mismatch
**Problem:** Status might be `'started'` instead of `'in_progress'`

**Solution:** Check what `staffJobService.updateJobStatus()` is setting:
```typescript
// In hooks/useStaffJobs.ts line ~128
const result = await staffJobService.updateJobStatus(
  jobId,
  'in_progress', // ← This should be the value
  currentProfile.id,
  { startedBy: currentProfile.id }
);
```

### Issue 2: Real-time Listener Not Updating
**Problem:** JobContext isn't catching the status change

**Check logs for:**
```
🔄 JobContext: Webapp assigned operational jobs updated - X jobs
```

If this doesn't appear after starting job, the real-time listener isn't working.

### Issue 3: useStaffJobs Filtering
**Problem:** `in_progress` jobs not being added to `activeJobs` array

**Check in hooks/useStaffJobs.ts (~73):**
```typescript
const activeJobs = jobs.filter(job => 
  job.status === 'accepted' || 
  job.status === 'in_progress'
);
```

Should include both statuses!

### Issue 4: Map Not Re-rendering
**Problem:** useEffect dependency not triggering

**Check:** The useEffect should trigger when `activeJobs` changes:
```typescript
useEffect(() => {
  if (propertyMarkers.length > 0) {
    updateJobStatusOnMarkers();
  }
}, [jobs, pendingJobs, activeJobs]);
```

## Testing Steps

1. **Open Developer Console** (Metro bundler or React Native debugger)

2. **Go to Map tab** - Initial state

3. **Accept a job** - Should see:
   ```
   🔄 MapScreen: Jobs updated...
   ✅ MapScreen: Property marked as ACTIVE (green) - will FLASH
   ```

4. **Press "Start Job"** - Should see:
   ```
   🔄 MapScreen: Jobs updated...
   📊 Pending jobs: X, Active jobs: X (should stay same or increase)
   🏠 MapScreen: Property has 1 job(s): [{ status: 'in_progress' }]
   🟢 MapScreen: Job has ACTIVE status: "in_progress"
   ✅ MapScreen: Property marked as ACTIVE (green) - will FLASH
   ```

5. **Share console output** - Copy all logs starting with `🔄 MapScreen:`, `🏠 MapScreen:`, `🟢 MapScreen:`, `✅ MapScreen:`

## Expected vs Actual

### Expected Behavior:
- Job status changes from `'accepted'` → `'in_progress'`
- Job stays in `activeJobs` array (both are "active")
- Property marker stays **GREEN** and continues **FLASHING**

### What You're Seeing:
- Job status changes (presumably)
- Marker color doesn't update
- Need to check console logs to see where the breakdown is

## Next Steps

**Please reload the app and:**
1. Go to Map tab
2. Accept a job (note the property)
3. Press "Start Job" on that same job
4. Copy ALL console logs that start with:
   - `🔄 MapScreen:`
   - `📊` (job counts)
   - `🏠 MapScreen:`
   - `🟢 MapScreen:` or `🟡 MapScreen:`
   - `✅ MapScreen:` or `⏳ MapScreen:`
   - `⚠️ MapScreen:`

Share those logs and I'll identify exactly where the issue is!

## Status Color Reference

| Status | Color | Animation | Array |
|--------|-------|-----------|-------|
| `pending` | Yellow | Static | pendingJobs |
| `assigned` | Yellow | Static | pendingJobs |
| `accepted` | **Green** | **Flashing** | activeJobs |
| `in_progress` | **Green** | **Flashing** | activeJobs |
| `completed` | Grey | Static | completedJobs |
