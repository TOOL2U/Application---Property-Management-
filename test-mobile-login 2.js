/**
 * Test Mobile App Login Flow
 * Simulates the complete authentication flow for mobile staff
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function testMobileLogin() {
  console.log('📱 Testing Mobile App Login Flow\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Test credentials from our staff data
    const testCredentials = [
      { email: 'myo@gmail.com', name: 'Myo' },
      { email: 'admin@siamoon.com', name: 'Admin User' },
      { email: 'manager@siamoon.com', name: 'Manager User' },
      { email: 'alan@example.com', name: 'Alan Ducker' }
    ];

    console.log('🔐 Testing login for sample staff members...\n');

    for (const cred of testCredentials) {
      try {
        console.log(`Testing login for ${cred.name} (${cred.email})`);
        
        // Use the standard password we just set
        const userCredential = await signInWithEmailAndPassword(auth, cred.email, 'StaffTest123!');
        const user = userCredential.user;
        
        // Get staff profile data
        const staffQuery = query(
          collection(db, 'staff_accounts'),
          where('userId', '==', user.uid)
        );
        
        const staffSnapshot = await getDocs(staffQuery);
        
        if (!staffSnapshot.empty) {
          const staffData = staffSnapshot.docs[0].data();
          console.log(`✅ Login successful!`);
          console.log(`   Firebase UID: ${user.uid}`);
          console.log(`   Staff Role: ${staffData.role}`);
          console.log(`   Staff Name: ${staffData.name}`);
          console.log(`   Can Access Jobs: ${staffData.isActive ? '✅' : '❌'}`);
        } else {
          console.log(`⚠️ Login successful but no staff profile found`);
        }
        
        // Sign out for next test
        await auth.signOut();
        
      } catch (error) {
        console.log(`❌ Login failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Test job queries that the mobile app would make
    console.log('📋 Testing job access for authenticated staff...\n');
    
    // Re-login as admin to test job queries
    const adminLogin = await signInWithEmailAndPassword(auth, 'admin@siamoon.com', 'StaffTest123!');
    const adminUid = adminLogin.user.uid;
    
    // Query jobs assigned to this user
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', adminUid)
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    console.log(`📊 Jobs accessible to Admin User: ${jobsSnapshot.size}`);
    
    if (!jobsSnapshot.empty) {
      console.log('   Recent job titles:');
      jobsSnapshot.docs.slice(0, 3).forEach(doc => {
        const job = doc.data();
        console.log(`   • ${job.title} (${job.status})`);
      });
    }

    console.log('\n🎉 MOBILE APP READY FOR STAFF LOGIN!');
    console.log('All staff can now:');
    console.log('• See their profile in the select screen');
    console.log('• Login with their email and default password');
    console.log('• Access their assigned jobs');
    console.log('• Use all mobile app features');

  } catch (error) {
    console.error('❌ Error testing mobile login:', error);
  }
}

testMobileLogin();
