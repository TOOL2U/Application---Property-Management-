/**
 * Debug script to check jobs in Firestore and their assigned staff IDs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Initialize Firebase with your config
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

console.log('🔍 Debugging Jobs in Firestore...\n');

async function debugJobsCollection() {
  try {
    console.log('📋 Checking jobs collection...');
    const jobsSnapshot = await getDocs(collection(db, 'jobs'));
    
    if (jobsSnapshot.empty) {
      console.log('❌ No jobs found in jobs collection');
      return;
    }
    
    console.log(`✅ Found ${jobsSnapshot.size} jobs in jobs collection:\n`);
    
    jobsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Job ${index + 1} (ID: ${doc.id}):`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Status: ${data.status || 'No status'}`);
      console.log(`   Assigned Staff ID: ${data.assignedStaffId || 'No assignedStaffId'}`);
      console.log(`   Assigned To: ${data.assignedTo || 'No assignedTo'}`);
      console.log(`   Staff ID: ${data.staffId || 'No staffId'}`);
      console.log(`   Staff Email: ${data.staffEmail || 'No staffEmail'}`);
      console.log(`   User ID: ${data.userId || 'No userId'}`);
      console.log(`   Created At: ${data.createdAt || 'No createdAt'}`);
      console.log(`   All fields:`, Object.keys(data).join(', '));
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking jobs collection:', error);
  }
}

async function debugJobAssignmentsCollection() {
  try {
    console.log('\n📋 Checking job_assignments collection...');
    const assignmentsSnapshot = await getDocs(collection(db, 'job_assignments'));
    
    if (assignmentsSnapshot.empty) {
      console.log('❌ No jobs found in job_assignments collection');
      return;
    }
    
    console.log(`✅ Found ${assignmentsSnapshot.size} jobs in job_assignments collection:\n`);
    
    assignmentsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Assignment ${index + 1} (ID: ${doc.id}):`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Status: ${data.status || 'No status'}`);
      console.log(`   Assigned Staff ID: ${data.assignedStaffId || 'No assignedStaffId'}`);
      console.log(`   Staff ID: ${data.staffId || 'No staffId'}`);
      console.log(`   Staff Email: ${data.staffEmail || 'No staffEmail'}`);
      console.log(`   User ID: ${data.userId || 'No userId'}`);
      console.log(`   All fields:`, Object.keys(data).join(', '));
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking job_assignments collection:', error);
  }
}

// Run the debug functions
Promise.all([
  debugJobsCollection(),
  debugJobAssignmentsCollection()
]).then(() => {
  console.log('\n🎯 Analysis:');
  console.log('1. Check if jobs have assignedStaffId field matching: gTtR5gSKOtUEweLwchSnVreylMy1');
  console.log('2. Check if jobs have different field names for staff assignment');
  console.log('3. Verify the Firebase UID mapping is working correctly');
}).catch(console.error);
