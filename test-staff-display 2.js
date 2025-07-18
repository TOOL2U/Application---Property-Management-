/**
 * Test Staff Profile Display
 * Tests what the mobile app sees when loading staff profiles
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function testStaffDisplay() {
  console.log('🧪 Testing Staff Profile Display for Mobile App\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Query active staff (what the mobile app does)
    console.log('📱 Fetching staff profiles (mobile app query)...');
    const staffQuery = query(
      collection(db, 'staff_accounts'),
      where('isActive', '==', true)
    );
    
    const staffSnapshot = await getDocs(staffQuery);
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff profiles found! Mobile app will show empty list.');
      return;
    }

    console.log(`✅ Found ${staffSnapshot.size} staff profiles:\n`);

    // Display each staff profile as mobile app would see them
    const staffProfiles = [];
    staffSnapshot.forEach((doc) => {
      const data = doc.data();
      const profile = {
        id: doc.id,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        hasUserId: !!data.userId,
        canLogin: !!data.userId && !!data.email
      };
      
      staffProfiles.push(profile);
      
      console.log(`👤 ${profile.name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Phone: ${profile.phone || 'N/A'}`);
      console.log(`   Has Firebase Auth: ${profile.hasUserId ? '✅' : '❌'}`);
      console.log(`   Can Login: ${profile.canLogin ? '✅' : '❌'}`);
      console.log('');
    });

    // Summary for mobile app display
    const loginCapableStaff = staffProfiles.filter(p => p.canLogin);
    
    console.log('📊 MOBILE APP DISPLAY SUMMARY:');
    console.log(`   Total Staff Profiles: ${staffProfiles.length}`);
    console.log(`   Can Login: ${loginCapableStaff.length}`);
    console.log(`   Ready for Selection: ${loginCapableStaff.length > 0 ? '✅' : '❌'}`);
    
    if (loginCapableStaff.length > 0) {
      console.log('\n🎯 Staff that can be selected for login:');
      loginCapableStaff.forEach(staff => {
        console.log(`   • ${staff.name} (${staff.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing staff display:', error);
  }
}

testStaffDisplay();
