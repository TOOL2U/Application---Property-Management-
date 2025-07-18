/**
 * Test to verify the complete mobile app job retrieval flow
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🧪 Testing Mobile App Job Retrieval Flow...\n');

async function testJobRetrievalFlow() {
  try {
    // Test different profile ID formats that might be used on mobile
    const testProfileIds = [
      'staff@siamoon.com',
      'IDJrsXWiL2dCHVpveH97',
      'gTtR5gSKOtUEweLwchSnVreylMy1'
    ];
    
    for (const profileId of testProfileIds) {
      console.log(`\n🔍 Testing with profile ID: ${profileId}`);
      
      // Step 1: Test Firebase UID mapping
      const { firebaseUidService } = await import('./services/firebaseUidService.js');
      const firebaseUid = await firebaseUidService.getFirebaseUid(profileId);
      console.log(`   📍 Firebase UID result: ${firebaseUid}`);
      
      if (firebaseUid) {
        // Step 2: Test job assignment service
        const { jobAssignmentService } = await import('./services/jobAssignmentService.js');
        const jobsResult = await jobAssignmentService.getStaffJobs(firebaseUid);
        console.log(`   💼 Jobs found: ${jobsResult.jobs?.length || 0}`);
        console.log(`   ✅ Query success: ${jobsResult.success}`);
        
        if (jobsResult.jobs && jobsResult.jobs.length > 0) {
          console.log(`   📋 Sample job: "${jobsResult.jobs[0].title}" (${jobsResult.jobs[0].status})`);
        }
      } else {
        console.log(`   ❌ No Firebase UID found for profile: ${profileId}`);
      }
    }
    
    console.log('\n🎯 Analysis:');
    console.log('The correct flow should be:');
    console.log('1. Mobile profile (staff@siamoon.com) → Firebase UID (gTtR5gSKOtUEweLwchSnVreylMy1)');
    console.log('2. Firebase UID → Query jobs collection where assignedStaffId equals Firebase UID');
    console.log('3. Should return 2 jobs from the jobs collection');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testJobRetrievalFlow();
