// Test the updated staffJobService
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Import our service (simplified for testing)
const { collection, getDocs, query, where, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// The staff account ID from our analysis
const testStaffId = 'IDJrsXWiL2dCHVpveH97';
const expectedFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';

async function testStaffJobService() {
  console.log('🧪 Testing StaffJobService Logic');
  console.log('Staff ID:', testStaffId);
  console.log('Expected Firebase UID:', expectedFirebaseUid);
  console.log('');

  try {
    // Step 1: Get the Firebase UID for this staff member from staff_accounts collection
    console.log('1️⃣ Looking up Firebase UID for staff account...');
    const staffAccountsRef = collection(db, 'staff_accounts');
    const staffQuery = query(staffAccountsRef, where('__name__', '==', testStaffId));
    const staffSnapshot = await getDocs(staffQuery);
    
    let firebaseUid = null;
    if (!staffSnapshot.empty) {
      const staffData = staffSnapshot.docs[0].data();
      firebaseUid = staffData.userId;
      console.log('✅ Found Firebase UID:', firebaseUid);
      console.log('✅ Staff Name:', staffData.name);
      console.log('✅ Staff Email:', staffData.email);
    } else {
      console.error('❌ No staff account found for ID:', testStaffId);
      return;
    }

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found for staff account:', testStaffId);
      return;
    }

    if (firebaseUid !== expectedFirebaseUid) {
      console.error('❌ Firebase UID mismatch!');
      console.error('   Expected:', expectedFirebaseUid);
      console.error('   Found:', firebaseUid);
      return;
    }

    console.log('');

    // Step 2: Query jobs using the Firebase UID (without ordering for now)
    console.log('2️⃣ Querying jobs for Firebase UID...');
    const jobsRef = collection(db, 'jobs');
    const jobsQuery = query(
      jobsRef,
      where('assignedStaffId', '==', firebaseUid)
    );

    const jobsSnapshot = await getDocs(jobsQuery);
    console.log(`✅ Found ${jobsSnapshot.size} jobs`);
    console.log('');

    // Step 3: Display job details
    if (jobsSnapshot.size > 0) {
      console.log('📋 Job Details:');
      jobsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📄 Job ${index + 1} (${doc.id}):`);
        console.log(`   Title: ${data.title || 'NO TITLE'}`);
        console.log(`   Status: ${data.status || 'NO STATUS'}`);
        console.log(`   Assigned To: ${data.assignedStaffId || 'NO ASSIGNMENT'}`);
        console.log(`   Job Type: ${data.jobType || 'NO TYPE'}`);
        console.log(`   Description: ${data.description || 'NO DESCRIPTION'}`);
        console.log('');
      });

      console.log('🎯 SUMMARY:');
      console.log(`✅ Staff ID mapping works correctly`);
      console.log(`✅ Firebase UID lookup successful`);
      console.log(`✅ Found ${jobsSnapshot.size} jobs for this staff member`);
      
      // Count by status
      const statusCounts = {};
      jobsSnapshot.docs.forEach(doc => {
        const status = doc.data().status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log(`📊 Jobs by status:`, statusCounts);
      
    } else {
      console.log('❌ No jobs found for this Firebase UID');
      console.log('💡 This might indicate an issue with job assignment or data sync');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testStaffJobService().catch(console.error);
