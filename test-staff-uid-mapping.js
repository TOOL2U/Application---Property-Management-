/**
 * Test Firebase UID Service Mapping
 * 
 * This script tests the Firebase UID service to ensure it can properly
 * map the staff ID IDJrsXWiL2dCHVpveH97 to the correct Firebase UID
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe",
  measurementId: "G-R1PELW8B8Q"
};

async function testStaffMapping() {
  try {
    console.log('🧪 Testing Firebase UID mapping for staff ID: IDJrsXWiL2dCHVpveH97');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const staffId = 'IDJrsXWiL2dCHVpveH97';
    
    // Test 1: Get staff account by document ID
    console.log('\n1️⃣ Testing staff lookup by document ID...');
    const staffDocRef = doc(db, 'staff_accounts', staffId);
    const staffDocSnap = await getDoc(staffDocRef);
    
    if (staffDocSnap.exists()) {
      const staffData = staffDocSnap.data();
      console.log('✅ Staff account found:', {
        id: staffDocSnap.id,
        email: staffData.email,
        name: staffData.name,
        firebaseUid: staffData.firebaseUid,
        role: staffData.role,
        isActive: staffData.isActive
      });
      
      // Determine the Firebase UID to use
      let firebaseUid = staffData.firebaseUid || staffDocSnap.id;
      
      // Special case for test staff account
      if (staffData.email === 'staff@siamoon.com') {
        firebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
        console.log('🧪 Using special test staff Firebase UID:', firebaseUid);
      }
      
      console.log('🎯 Final Firebase UID to use:', firebaseUid);
      
      // Test 2: Verify this Firebase UID has jobs
      console.log('\n2️⃣ Testing job lookup with Firebase UID...');
      
      // Check jobs collection
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('assignedStaffId', '==', firebaseUid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      console.log(`📊 Found ${jobsSnapshot.size} jobs in 'jobs' collection for Firebase UID: ${firebaseUid}`);
      
      // Check job_assignments collection
      const jobAssignmentsQuery = query(
        collection(db, 'job_assignments'),
        where('staffId', '==', firebaseUid)
      );
      const jobAssignmentsSnapshot = await getDocs(jobAssignmentsQuery);
      console.log(`📊 Found ${jobAssignmentsSnapshot.size} job assignments in 'job_assignments' collection for Firebase UID: ${firebaseUid}`);
      
      // Check notifications
      const notificationsQuery = query(
        collection(db, 'staff_notifications'),
        where('userId', '==', firebaseUid)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      console.log(`📊 Found ${notificationsSnapshot.size} notifications in 'staff_notifications' collection for Firebase UID: ${firebaseUid}`);
      
      console.log('\n✅ SOLUTION: Staff ID IDJrsXWiL2dCHVpveH97 should map to Firebase UID:', firebaseUid);
      
      if (jobsSnapshot.size > 0 || jobAssignmentsSnapshot.size > 0) {
        console.log('🎉 SUCCESS: This Firebase UID has jobs! The mobile app should display them.');
      } else {
        console.log('⚠️ No jobs found for this Firebase UID. Jobs may need to be assigned in the webapp.');
      }
      
    } else {
      console.log('❌ Staff account not found with ID:', staffId);
      
      // Test 3: Search all staff accounts to find the one with the right email
      console.log('\n3️⃣ Searching all staff accounts for staff@siamoon.com...');
      const allStaffQuery = query(
        collection(db, 'staff_accounts'),
        where('email', '==', 'staff@siamoon.com')
      );
      const allStaffSnapshot = await getDocs(allStaffQuery);
      
      if (!allStaffSnapshot.empty) {
        allStaffSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('📋 Found staff account with email staff@siamoon.com:', {
            id: doc.id,
            email: data.email,
            name: data.name,
            firebaseUid: data.firebaseUid
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStaffMapping();
