/**
 * Add Password Hash to Existing User
 * This script adds a bcrypt password hash to your existing admin user
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc
} = require('firebase/firestore');

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

async function addPasswordHashToUser() {
  console.log('🔐 Adding password hash to existing user...');
  console.log('=' .repeat(50));
  
  try {
    // Find the user by email
    const staffAccountsRef = collection(db, 'staff_accounts');
    const q = query(
      staffAccountsRef,
      where('email', '==', 'admin@siamoon.com')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ User not found: admin@siamoon.com');
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('👤 Found user:', userData.name || userData.email);
    console.log('🎭 Role:', userData.role);
    console.log('📧 Email:', userData.email);
    
    // Check if passwordHash already exists
    if (userData.passwordHash) {
      console.log('⚠️ User already has a password hash');
      console.log('🔐 Current hash:', userData.passwordHash.substring(0, 20) + '...');
      return;
    }
    
    // Add password hash for "admin123" (freshly generated)
    const passwordHash = '$2b$12$4BKcJLJUOjeTFcLxoUnNU./UW0DKldkRZjK6NWMOUpd3bDpVdSSKS';
    
    console.log('\n🔄 Adding password hash...');
    console.log('🔑 Password: admin123');
    console.log('🔐 Hash: ' + passwordHash.substring(0, 20) + '...');
    
    // Update the document
    await updateDoc(doc(db, 'staff_accounts', userDoc.id), {
      passwordHash: passwordHash,
      updatedAt: new Date()
    });
    
    console.log('\n✅ Password hash added successfully!');
    console.log('🎉 User can now log in with:');
    console.log('   📧 Email: admin@siamoon.com');
    console.log('   🔑 Password: admin123');
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const updatedSnapshot = await getDocs(q);
    const updatedUserData = updatedSnapshot.docs[0].data();
    
    if (updatedUserData.passwordHash) {
      console.log('✅ Verification successful - password hash is present');
    } else {
      console.log('❌ Verification failed - password hash not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding password hash:', error.message);
    console.error('🔍 Error code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - check Firestore rules allow updates');
    }
  }
}

// Run the script
addPasswordHashToUser();
