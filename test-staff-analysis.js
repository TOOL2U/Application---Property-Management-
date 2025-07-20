// Detailed staff accounts analysis
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

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

const testFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';

async function analyzeStaffAccounts() {
  console.log('🔍 STAFF ACCOUNTS ANALYSIS');
  console.log('Target Firebase UID:', testFirebaseUid);
  console.log('');

  try {
    const staffSnapshot = await getDocs(collection(db, 'staff_accounts'));
    
    console.log(`📊 Found ${staffSnapshot.size} staff accounts:`);
    console.log('');

    let matchFound = false;
    
    staffSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const isMatch = data.userId === testFirebaseUid;
      
      if (isMatch) matchFound = true;
      
      console.log(`📄 Staff Account ${index + 1} (${doc.id}):`);
      console.log(`   Name: ${data.name || 'NO NAME'}`);
      console.log(`   Email: ${data.email || 'NO EMAIL'}`);
      console.log(`   Role: ${data.role || 'NO ROLE'}`);
      console.log(`   Active: ${data.isActive || data.status === 'active'}`);
      console.log(`   User ID: ${data.userId || 'NO USER ID'}`);
      console.log(`   🎯 MATCH: ${isMatch ? '✅ YES' : '❌ NO'}`);
      console.log(`   All fields: [${Object.keys(data).join(', ')}]`);
      console.log('');
    });

    console.log('🎯 SUMMARY:');
    console.log(`Target Firebase UID found: ${matchFound ? '✅ YES' : '❌ NO'}`);

    if (matchFound) {
      console.log('✅ The Firebase UID is linked to a staff account!');
    } else {
      console.log('❌ No staff account found with the Firebase UID.');
      console.log('💡 This explains why the mobile app can\'t find jobs.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeStaffAccounts().catch(console.error);
