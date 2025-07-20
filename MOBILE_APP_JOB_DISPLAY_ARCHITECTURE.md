# Mobile App Job Display Architecture - Reference Documentation

## Overview
This document explains how the mobile app displays jobs for staff members using PIN authentication and Firebase integration.

## Authentication Flow

### PIN Authentication System
- **Collection**: `staff_accounts` 
- **Document ID**: Staff document ID (e.g., `IDJrsXWiL2dCHVpveH97`)
- **Key Field**: `userId` contains the Firebase UID (e.g., `gTtR5gSKOtUEweLwchSnVreylMy1`)
- **Profile**: PIN auth provides `currentProfile.id` as the staff document ID (NOT Firebase UID)

### Staff ID Mapping
```
Staff Document ID: IDJrsXWiL2dCHVpveH97
     ↓ (maps to via userId field)
Firebase UID: gTtR5gSKOtUEweLwchSnVreylMy1
```

## Job Storage Structure

### Jobs Collection
- **Collection**: `jobs`
- **Key Field**: `assignedStaffId` contains the Firebase UID (NOT staff document ID)
- **Status Field**: `status` with values: `assigned`, `accepted`, `in_progress`, `completed`

### Example Job Document
```json
{
  "id": "F2vn5RXII35G4H4TcwB9",
  "title": "Villa Cleaning - Ante cliffe",
  "status": "in_progress",
  "assignedStaffId": "gTtR5gSKOtUEweLwchSnVreylMy1",
  "scheduledDate": "2025-01-20T14:00:00Z",
  // ... other fields
}
```

## Mobile App Architecture

### Component Hierarchy
```
app/(tabs)/jobs.tsx
  └── EnhancedStaffJobsView.tsx (for staff users)
      └── useStaffJobs() hook
          └── staffJobService.ts
```

### Data Flow
1. **PIN Auth** → `currentProfile.id` (staff document ID)
2. **staffJobService** → Lookup Firebase UID from staff_accounts
3. **Firebase Query** → `where('assignedStaffId', '==', firebaseUid)`
4. **Date Parsing** → Safe conversion of Firestore timestamps
5. **Job Filtering** → Status-based filtering for UI
6. **Real-time Updates** → Live sync with Firebase

## StaffJobService Implementation

### Main Query Method
```typescript
async getStaffJobs(staffId: string) {
  // 1. Get Firebase UID from staff document
  const staffQuery = query(
    collection(db, 'staff_accounts'), 
    where('__name__', '==', staffId)
  );
  const firebaseUid = staffData.userId;
  
  // 2. Query jobs using Firebase UID
  const jobsQuery = query(
    collection(db, 'jobs'),
    where('assignedStaffId', '==', firebaseUid)
  );
}
```

### Real-time Listener
```typescript
subscribeToStaffJobs(staffId: string, callback: Function) {
  // CRITICAL: Must use same Firebase UID lookup as main method
  // Query: where('assignedStaffId', '==', firebaseUid)
  // NOT: where('assignedTo', '==', staffId)
}
```

### Date Parsing Helper
```typescript
private safeToDate(value: any): Date | undefined {
  // Handles multiple date formats:
  // - Firestore Timestamps with .toDate()
  // - JavaScript Date objects
  // - String/number timestamps
  // - Raw timestamp objects with seconds/nanoseconds
}
```

## Job Status Filtering

### useStaffJobs Hook Filters
```typescript
const pendingJobs = jobs.filter(job => job.status === 'assigned');
const activeJobs = jobs.filter(job => ['accepted', 'in_progress'].includes(job.status));
const completedJobs = jobs.filter(job => job.status === 'completed');
```

### UI Filter Mapping
- **"Pending" Filter** → Shows jobs with status `'assigned'`
- **"Active" Filter** → Shows jobs with status `'accepted'` or `'in_progress'`
- **"Completed" Filter** → Shows jobs with status `'completed'`
- **"All" Filter** → Shows all jobs combined

## Common Issues & Solutions

### Issue 1: Date Parsing Errors
**Error**: `data.scheduledDate?.toDate is not a function`
**Cause**: Non-Firestore timestamp date fields
**Solution**: Use `safeToDate()` helper for robust date parsing

### Issue 2: Real-time Listener Not Working
**Error**: Real-time updates showing 0 jobs
**Cause**: Query field mismatch between main method and listener
**Solution**: Ensure both use `assignedStaffId` field with Firebase UID

### Issue 3: Wrong Staff ID Type
**Error**: No jobs found despite correct data
**Cause**: Using staff document ID instead of Firebase UID in queries
**Solution**: Always map staff document ID → Firebase UID first

## Test Data Example

### Staff Account
```
Document ID: IDJrsXWiL2dCHVpveH97
Email: staff@siamoon.com
Firebase UID: gTtR5gSKOtUEweLwchSnVreylMy1
```

### Expected Job Distribution
- **4 jobs** with status `'assigned'` (Pending filter)
- **2 jobs** with status `'in_progress'` (Active filter)
- **6 jobs total** (All filter)

## Key Files Modified

1. **`/services/staffJobService.ts`**
   - Added `safeToDate()` helper for robust date parsing
   - Fixed real-time listener to use correct Firebase UID query
   - Ensured consistent field mapping between methods

2. **`/components/jobs/EnhancedStaffJobsView.tsx`**
   - Uses `useStaffJobs` hook with proper filtering
   - Displays jobs based on status filters

3. **`/hooks/useStaffJobs.ts`**
   - Provides filtered job arrays (pending, active, completed)
   - Handles real-time updates and caching

## Authentication Context

### PIN Auth Integration
- Mobile app uses PIN-based authentication
- `currentProfile.id` provides staff document ID
- Must be mapped to Firebase UID for job queries
- Real-time sync maintains consistency

This architecture ensures reliable job display with proper authentication, real-time updates, and robust error handling.
