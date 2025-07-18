/**
 * Firebase Job Query Debug Script
 * Run this to test Firebase authentication and job queries
 */

import { auth, db } from './lib/firebase'; // Adjust import path as needed
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc 
} from 'firebase/firestore';

// Test data that exists in Firebase
const KNOWN_TEST_DATA = {
  jobs: [
    { id: 'jcFYzJLUAT16vlrAatJP', userId: 'user001', staffId: 'staff001' },
    { id: 'kDfGhJkL123456789', userId: 'user002', staffId: 'staff002' }
  ],
  users: ['user001', 'user002'],
  staff: ['staff001', 'staff002']
};

export class FirebaseJobDebugger {
  
  /**
   * Run complete Firebase debug suite
   */
  static async runCompleteDebug() {
    console.log('🚀 Firebase Job Query Debug Suite Starting...\n');
    
    // Test 1: Authentication State
    await this.testAuthentication();
    
    // Test 2: Basic Firebase Connection
    await this.testFirebaseConnection();
    
    // Test 3: Job Collection Access
    await this.testJobCollectionAccess();
    
    // Test 4: Specific User Queries
    await this.testUserSpecificQueries();
    
    // Test 5: Real-time Listener
    await this.testRealTimeListener();
    
    // Test 6: Known Test Data
    await this.testKnownData();
    
    console.log('🏁 Firebase Debug Suite Complete!\n');
  }

  /**
   * Test 1: Check authentication state
   */
  static async testAuthentication() {
    console.log('🔐 Test 1: Authentication State');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const user = auth.currentUser;
    
    if (user) {
      console.log('✅ User is authenticated');
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.displayName || 'Not set'}`);
      
      // This UID should match the userId field in jobs
      console.log(`   🎯 Use this UID for job queries: ${user.uid}`);
    } else {
      console.log('❌ User is NOT authenticated');
      console.log('   Please sign in before running job queries');
    }
    console.log('');
  }

  /**
   * Test 2: Basic Firebase connection
   */
  static async testFirebaseConnection() {
    console.log('🔥 Test 2: Firebase Connection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Try to access a document to test connection
      const testRef = doc(db, 'test', 'connection');
      await getDoc(testRef); // This will throw if connection fails
      
      console.log('✅ Firebase connection successful');
    } catch (error) {
      console.log('❌ Firebase connection failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('   Check your firebase config and internet connection');
    }
    console.log('');
  }

  /**
   * Test 3: Job collection access
   */
  static async testJobCollectionAccess() {
    console.log('📋 Test 3: Job Collection Access');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // Get all jobs to test basic collection access
      const allJobsQuery = query(collection(db, 'jobs'));
      const allJobsSnapshot = await getDocs(allJobsQuery);
      
      console.log(`✅ Jobs collection accessible`);
      console.log(`   Total jobs in collection: ${allJobsSnapshot.size}`);
      
      if (allJobsSnapshot.size > 0) {
        console.log('   📊 Sample job data structure:');
        
        // Show first 3 jobs structure
        let count = 0;
        allJobsSnapshot.forEach((docSnapshot) => {
          if (count < 3) {
            const data = docSnapshot.data();
            console.log(`   Job ${count + 1}:`, {
              id: docSnapshot.id,
              userId: data.userId,
              assignedStaffId: data.assignedStaffId,
              title: data.title,
              status: data.status,
              hasCreatedAt: !!data.createdAt
            });
            count++;
          }
        });
      } else {
        console.log('   ⚠️ No jobs found in collection');
        console.log('   This might be a permissions issue or empty collection');
      }
      
    } catch (error) {
      console.log('❌ Cannot access jobs collection:', error instanceof Error ? error.message : 'Unknown error');
      console.log('   This could be a security rules issue');
    }
    console.log('');
  }

  /**
   * Test 4: User-specific queries
   */
  static async testUserSpecificQueries() {
    console.log('👤 Test 4: User-Specific Queries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ Cannot test user queries - user not authenticated');
      console.log('');
      return;
    }
    
    const currentUserId = user.uid;
    
    // Test different query variations
    const queryTests = [
      {
        name: 'Current User Jobs (userId field)',
        query: query(collection(db, 'jobs'), where('userId', '==', currentUserId))
      },
      {
        name: 'Current User as Staff (assignedStaffId field)', 
        query: query(collection(db, 'jobs'), where('assignedStaffId', '==', currentUserId))
      },
      {
        name: 'Test User (user001)',
        query: query(collection(db, 'jobs'), where('userId', '==', 'user001'))
      },
      {
        name: 'Test Staff (staff001)',
        query: query(collection(db, 'jobs'), where('assignedStaffId', '==', 'staff001'))
      }
    ];
    
    for (const test of queryTests) {
      try {
        const snapshot = await getDocs(test.query);
        console.log(`✅ ${test.name}: ${snapshot.size} jobs found`);
        
        if (snapshot.size > 0 && snapshot.size <= 3) {
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`   - ${data.title} (${doc.id})`);
          });
        }
        
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    console.log('');
  }

  /**
   * Test 5: Real-time listener
   */
  static async testRealTimeListener() {
    console.log('🔄 Test 5: Real-time Listener');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ Cannot test listener - user not authenticated');
      console.log('');
      return;
    }
    
    return new Promise((resolve) => {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      console.log(`Setting up listener for userId: ${user.uid}`);
      
      const unsubscribe = onSnapshot(
        jobsQuery,
        (snapshot) => {
          console.log(`✅ Real-time listener triggered: ${snapshot.size} jobs`);
          
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            console.log(`   ${change.type}: ${data.title} (${change.doc.id})`);
          });
          
          // Clean up after first response
          setTimeout(() => {
            unsubscribe();
            console.log('   🧹 Listener cleaned up');
            console.log('');
            resolve(true);
          }, 1000);
        },
        (error) => {
          console.log(`❌ Real-time listener error: ${error.message}`);
          unsubscribe();
          console.log('');
          resolve(false);
        }
      );
    });
  }

  /**
   * Test 6: Known test data
   */
  static async testKnownData() {
    console.log('🧪 Test 6: Known Test Data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const testJob of KNOWN_TEST_DATA.jobs) {
      try {
        // Test by document ID
        const docRef = doc(db, 'jobs', testJob.id);
        const docSnapshot = await getDoc(docRef);
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log(`✅ Test job ${testJob.id} exists`);
          console.log(`   Title: ${data.title}`);
          console.log(`   UserId: ${data.userId} (expected: ${testJob.userId})`);
          console.log(`   StaffId: ${data.assignedStaffId} (expected: ${testJob.staffId})`);
          
          if (data.userId !== testJob.userId) {
            console.log(`   ⚠️ UserId mismatch!`);
          }
        } else {
          console.log(`❌ Test job ${testJob.id} not found`);
        }
      } catch (error) {
        console.log(`❌ Error accessing test job ${testJob.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    console.log('');
  }

  /**
   * Get debug summary for sharing
   */
  static async getDebugSummary() {
    const user = auth.currentUser;
    const summary = {
      timestamp: new Date().toISOString(),
      authentication: {
        isAuthenticated: !!user,
        userId: user?.uid || null,
        userEmail: user?.email || null
      },
      jobQueries: {
        userJobs: 0,
        totalJobs: 0
      },
      errors: [] as string[]
    };

    // Test job queries
    if (user) {
      try {
        const userJobsQuery = query(
          collection(db, 'jobs'), 
          where('userId', '==', user.uid)
        );
        const userJobsSnapshot = await getDocs(userJobsQuery);
        summary.jobQueries.userJobs = userJobsSnapshot.size;
      } catch (error) {
        summary.errors.push(`User jobs query: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      try {
        const allJobsQuery = query(collection(db, 'jobs'));
        const allJobsSnapshot = await getDocs(allJobsQuery);
        summary.jobQueries.totalJobs = allJobsSnapshot.size;
      } catch (error) {
        summary.errors.push(`All jobs query: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return summary;
  }
}

// Export for use in React Native components
export default FirebaseJobDebugger;

// For testing in development console
if (typeof window !== 'undefined') {
  (window as any).FirebaseJobDebugger = FirebaseJobDebugger;
}

// Usage in your React Native component:
/*
import FirebaseJobDebugger from './firebase-job-debugger';

// In your component
const runDebug = async () => {
  await FirebaseJobDebugger.runCompleteDebug();
  
  // Get summary for sharing
  const summary = await FirebaseJobDebugger.getDebugSummary();
  console.log('Debug Summary:', summary);
};

// Add a debug button in your UI
<TouchableOpacity onPress={runDebug}>
  <Text>Run Firebase Debug</Text>
</TouchableOpacity>
*/
