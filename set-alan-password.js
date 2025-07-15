/**
 * Set Alan's Password
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where,
  updateDoc,
  doc
} = require('firebase/firestore');
const bcrypt = require('bcryptjs');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAlanPassword() {
  console.log('🔐 Setting password for Alan...');
  console.log('=' .repeat(50));

  try {
    // Find Alan's account
    const staffAccountsRef = collection(db, 'staff_accounts');
    const alanQuery = query(staffAccountsRef, where('email', '==', 'alan@example.com'));
    const alanSnapshot = await getDocs(alanQuery);
    
    if (alanSnapshot.empty) {
      console.log('❌ Alan\'s account not found');
      return;
    }

    const alanDoc = alanSnapshot.docs[0];
    const alanDocRef = doc(db, 'staff_accounts', alanDoc.id);
    
    // Set password
    const password = 'alan123';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update the document
    await updateDoc(alanDocRef, {
      passwordHash: passwordHash,
      loginAttempts: 0,
      lockedUntil: null
    });
    
    console.log('✅ Password set successfully!');
    console.log(`📧 Email: alan@example.com`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🎭 Role: maintenance (staff user)`);
    
    console.log('\n🧪 TESTING ROLE-BASED NAVIGATION:');
    console.log('1. Logout from your current account');
    console.log('2. Login with alan@example.com / alan123');
    console.log('3. You should see ONLY 3 tabs:');
    console.log('   ✅ Dashboard');
    console.log('   ✅ Jobs');
    console.log('   ✅ Profile');
    console.log('4. All other tabs should be hidden');
    
    console.log('\n🔄 To test admin view:');
    console.log('1. Logout from Alan\'s account');
    console.log('2. Login with admin@siamoon.com / admin123');
    console.log('3. You should see ALL tabs');

  } catch (error) {
    console.error('❌ Error setting password:', error);
  }
}

setAlanPassword().catch(console.error);
