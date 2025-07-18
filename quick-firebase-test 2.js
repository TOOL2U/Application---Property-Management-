/**
 * Quick Firebase Test Script
 * Copy and paste this into your mobile app console for immediate testing
 */

// Quick Firebase connectivity test
const quickFirebaseTest = async () => {
  console.log('🔥 Quick Firebase Test Starting...\n');
  
  try {
    // Test 1: Check authentication
    const user = auth.currentUser;
    console.log('1. Authentication:', user ? '✅ Authenticated' : '❌ Not authenticated');
    if (user) {
      console.log(`   User ID: ${user.uid}`);
      console.log(`   Email: ${user.email}`);
    }
    
    // Test 2: Test basic Firestore access
    console.log('\n2. Testing Firestore access...');
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('./lib/firebase'); // Adjust path
    
    const allJobsQuery = query(collection(db, 'jobs'));
    const allJobsSnapshot = await getDocs(allJobsQuery);
    console.log(`✅ Firestore access successful`);
    console.log(`   Total jobs in collection: ${allJobsSnapshot.size}`);
    
    // Test 3: User-specific job query
    if (user) {
      console.log('\n3. Testing user-specific query...');
      const { where } = await import('firebase/firestore');
      
      const userJobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', user.uid)
      );
      
      const userJobsSnapshot = await getDocs(userJobsQuery);
      console.log(`✅ User query successful`);
      console.log(`   Jobs for current user: ${userJobsSnapshot.size}`);
      
      // Show sample job if found
      if (userJobsSnapshot.size > 0) {
        const firstJob = userJobsSnapshot.docs[0];
        const jobData = firstJob.data();
        console.log(`   Sample job:`, {
          id: firstJob.id,
          title: jobData.title,
          userId: jobData.userId,
          status: jobData.status
        });
      }
    }
    
    // Test 4: Test with known test data
    console.log('\n4. Testing with known test data...');
    const { where: whereClause } = await import('firebase/firestore');
    
    const testQuery = query(
      collection(db, 'jobs'),
      whereClause('userId', '==', 'user001')
    );
    
    const testSnapshot = await getDocs(testQuery);
    console.log(`✅ Test data query successful`);
    console.log(`   Test jobs found: ${testSnapshot.size}`);
    
    console.log('\n🎉 Quick test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. If no user jobs found, check if userId field matches your auth UID');
    console.log('2. If test jobs found but user jobs missing, your auth UID might not match any job userId');
    console.log('3. Run the full debug suite for detailed analysis');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    console.log('\nPossible issues:');
    console.log('• Firebase not properly initialized');
    console.log('• Security rules blocking access');
    console.log('• User not authenticated');
    console.log('• Network connectivity issues');
  }
};

// Alternative test for React Native console
const reactNativeQuickTest = `
// React Native Console Test
// Copy this into your React Native app console:

import { auth, db } from './lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const testFirebase = async () => {
  console.log('Testing Firebase...');
  
  // Check user
  const user = auth.currentUser;
  console.log('User:', user?.uid || 'Not authenticated');
  
  // Check jobs
  try {
    const jobsQuery = query(collection(db, 'jobs'));
    const snapshot = await getDocs(jobsQuery);
    console.log('Total jobs:', snapshot.size);
    
    if (user) {
      const userJobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', user.uid)
      );
      const userSnapshot = await getDocs(userJobsQuery);
      console.log('User jobs:', userSnapshot.size);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testFirebase();
`;

console.log('Quick Firebase Test Functions Ready!');
console.log('Run quickFirebaseTest() to test your Firebase connection');
console.log('\nFor React Native, use this code:');
console.log(reactNativeQuickTest);
