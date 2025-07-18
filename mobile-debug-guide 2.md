# Mobile App Debug Guide - Firebase Authentication & Job Queries

## 🎯 Overview
This guide helps the mobile development team debug and verify Firebase authentication integration and job query functionality.

## 🔍 Step 1: Verify Firebase Authentication Integration

### Check Authentication State
```typescript
// In your main App component or AuthContext
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      console.log('✅ User authenticated:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      // This UID should match the userId field in jobs
    } else {
      console.log('❌ No authenticated user');
    }
  });

  return () => unsubscribe();
}, []);
```

### Verify UID Storage
```typescript
// Ensure you're storing the correct UID
const currentUserId = auth.currentUser?.uid;
console.log('Current User ID for job queries:', currentUserId);

// This should match the userId field in your job documents
```

## 🔍 Step 2: Debug Job Query Parameters

### Current JobContext.tsx Implementation Check
```typescript
// In JobContext.tsx - Add this debugging code
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';

const JobContext = () => {
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('🚫 No authenticated user found');
      return;
    }

    const userId = currentUser.uid;
    console.log('🔍 Setting up jobs listener for userId:', userId);

    // CRITICAL: This query must match your Firebase data structure
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log('📊 Jobs query parameters:', {
      collection: 'jobs',
      userId: userId,
      fieldName: 'userId', // Verify this matches your Firebase field
      orderBy: 'createdAt'
    });

    // Test the query first with getDocs
    getDocs(jobsQuery)
      .then((snapshot) => {
        console.log(`📋 Initial query returned ${snapshot.size} jobs`);
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Job data:', {
            id: doc.id,
            userId: data.userId,
            assignedStaffId: data.assignedStaffId,
            title: data.title,
            status: data.status
          });
        });
      })
      .catch((error) => {
        console.error('❌ Error testing jobs query:', error);
      });

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        console.log(`🔄 Real-time update: ${snapshot.size} jobs from Firebase`);
        
        const jobs = [];
        snapshot.forEach((doc) => {
          const jobData = { id: doc.id, ...doc.data() };
          jobs.push(jobData);
          
          // Log each job for debugging
          console.log('📝 Job:', {
            id: jobData.id,
            title: jobData.title,
            userId: jobData.userId,
            assignedStaffId: jobData.assignedStaffId,
            status: jobData.status,
            createdAt: jobData.createdAt?.toDate?.()
          });
        });
        
        setJobs(jobs);
      },
      (error) => {
        console.error('❌ Error in jobs real-time listener:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);
};
```

## 🔍 Step 3: Test with Known Working Account

### Test Data Available
```typescript
// Test with these known job records:
const TEST_JOBS = [
  {
    jobId: 'jcFYzJLUAT16vlrAatJP',
    userId: 'user001',
    staffId: 'staff001',
    title: 'Emergency Plumbing Repair'
  },
  {
    jobId: 'kDfGhJkL123456789',
    userId: 'user002', 
    staffId: 'staff002',
    title: 'HVAC Maintenance Check'
  }
];

// Create a test user account with userId: 'user001' to test
// Or modify your query to test with existing data
```

### Manual Query Test
```typescript
// Add this temporary test function to your JobContext
const testJobQuery = async () => {
  try {
    // Test 1: Query with known test userId
    const testQuery1 = query(
      collection(db, 'jobs'),
      where('userId', '==', 'user001')
    );
    
    const testResult1 = await getDocs(testQuery1);
    console.log('🧪 Test query (userId=user001):', testResult1.size, 'jobs');
    
    // Test 2: Query with current user
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      const testQuery2 = query(
        collection(db, 'jobs'),
        where('userId', '==', currentUserId)
      );
      
      const testResult2 = await getDocs(testQuery2);
      console.log('🧪 Test query (current user):', testResult2.size, 'jobs');
    }
    
    // Test 3: Get all jobs (no filter) to see data structure
    const allJobsQuery = query(collection(db, 'jobs'));
    const allJobs = await getDocs(allJobsQuery);
    console.log('🧪 All jobs in collection:', allJobs.size);
    
    // Log first few jobs to see structure
    let count = 0;
    allJobs.forEach((doc) => {
      if (count < 3) {
        console.log('Sample job structure:', doc.data());
        count++;
      }
    });
    
  } catch (error) {
    console.error('❌ Test query failed:', error);
  }
};

// Call this function from a button or useEffect to test
```

## 🔍 Step 4: Implement Comprehensive Debug Logging

### Add Debug Component
```typescript
// Create components/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query } from 'firebase/firestore';

export const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({});

  const collectDebugInfo = async () => {
    const info = {
      timestamp: new Date().toISOString(),
      authentication: {
        isAuthenticated: !!auth.currentUser,
        userId: auth.currentUser?.uid || 'Not authenticated',
        userEmail: auth.currentUser?.email || 'N/A'
      },
      firebase: {
        connected: true, // You can add actual connection check
      },
      jobs: {
        totalJobs: 0,
        userJobs: 0,
        queryErrors: []
      }
    };

    try {
      // Get total job count
      const allJobsQuery = query(collection(db, 'jobs'));
      const allJobs = await getDocs(allJobsQuery);
      info.jobs.totalJobs = allJobs.size;

      // Get user-specific jobs
      if (auth.currentUser?.uid) {
        const userJobsQuery = query(
          collection(db, 'jobs'),
          where('userId', '==', auth.currentUser.uid)
        );
        const userJobs = await getDocs(userJobsQuery);
        info.jobs.userJobs = userJobs.size;
      }
    } catch (error) {
      info.jobs.queryErrors.push(error.message);
    }

    setDebugInfo(info);
    console.log('🐛 Debug Info:', info);
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
      <TouchableOpacity 
        onPress={collectDebugInfo}
        style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Collect Debug Info
        </Text>
      </TouchableOpacity>
      
      {Object.keys(debugInfo).length > 0 && (
        <ScrollView style={{ marginTop: 10, maxHeight: 300 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};
```

## 🔍 Step 5: Review Firebase Security Rules

### Check Current Rules
```javascript
// In Firebase Console -> Firestore Database -> Rules
// Current rules should allow authenticated users to read their jobs

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Allow read if user is authenticated and job belongs to them
      allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid ||
                   resource.data.assignedStaffId == request.auth.uid);
      
      // Allow write for authenticated users
      allow write: if request.auth != null;
    }
  }
}
```

### Temporary Debug Rules (USE CAREFULLY)
```javascript
// TEMPORARY - Only for debugging, REMOVE after testing
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔍 Step 6: Complete JobContext Implementation Checklist

### ✅ Verification Checklist
- [ ] Firebase Auth user UID is being captured correctly
- [ ] Job queries use the correct field name (`userId` vs `assignedStaffId`)
- [ ] Real-time listener is set up with proper error handling
- [ ] Firebase security rules allow reading user's jobs
- [ ] Debug logging shows query parameters and results
- [ ] Test with known working data (user001/staff001)

### 🚨 Common Issues to Check
1. **Field Name Mismatch**: Using `assignedStaffId` instead of `userId`
2. **Authentication Timing**: Querying before user is authenticated
3. **Security Rules**: Rules blocking access to jobs collection
4. **Index Missing**: Firestore composite index for userId + createdAt
5. **Case Sensitivity**: userId field case doesn't match

## 🔍 Step 7: Testing Script

### Run This Test in Your App
```typescript
// Add this to a test screen or component
const runJobDebugging = async () => {
  console.log('🚀 Starting job debugging...');
  
  // 1. Check authentication
  const user = auth.currentUser;
  console.log('1. Authentication check:', {
    authenticated: !!user,
    uid: user?.uid,
    email: user?.email
  });
  
  if (!user) {
    console.log('❌ Cannot proceed - user not authenticated');
    return;
  }
  
  // 2. Test different query variations
  const testQueries = [
    { field: 'userId', value: user.uid, description: 'Current user jobs' },
    { field: 'assignedStaffId', value: user.uid, description: 'Assigned staff jobs' },
    { field: 'userId', value: 'user001', description: 'Test user jobs' },
  ];
  
  for (const testQuery of testQueries) {
    try {
      const q = query(
        collection(db, 'jobs'),
        where(testQuery.field, '==', testQuery.value)
      );
      
      const snapshot = await getDocs(q);
      console.log(`✅ ${testQuery.description}:`, snapshot.size, 'jobs found');
      
    } catch (error) {
      console.log(`❌ ${testQuery.description} failed:`, error.message);
    }
  }
  
  console.log('🏁 Job debugging complete');
};
```

## 📞 Next Steps

1. **Implement the debug logging** in your JobContext
2. **Run the test queries** to verify data access
3. **Check Firebase Console** for any security rule violations
4. **Test with the known working account** (user001)
5. **Share debug output** with the team for further analysis

If you're still having issues after implementing these checks, please share:
- The debug output from the logging
- Your current JobContext implementation
- Any error messages from Firebase Console
- Your Firebase security rules

This will help us identify the exact issue with job loading in the mobile app.
