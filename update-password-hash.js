/**
 * Update Password Hash
 * Update the existing user's password hash with a fresh one
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

async function updatePasswordHash() {
  console.log('🔄 Updating password hash for existing user...');
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
    console.log('🔐 Current hash:', userData.passwordHash ? userData.passwordHash.substring(0, 20) + '...' : 'None');
    
    // Update with fresh password hash for "admin123"
    const newPasswordHash = '$2b$12$4BKcJLJUOjeTFcLxoUnNU./UW0DKldkRZjK6NWMOUpd3bDpVdSSKS';
    
    console.log('\n🔄 Updating password hash...');
    console.log('🔑 Password: admin123');
    console.log('🔐 New hash: ' + newPasswordHash.substring(0, 20) + '...');
    
    // Update the document
    await updateDoc(doc(db, 'staff_accounts', userDoc.id), {
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    });
    
    console.log('\n✅ Password hash updated successfully!');
    console.log('🎉 User can now log in with:');
    console.log('   📧 Email: admin@siamoon.com');
    console.log('   🔑 Password: admin123');
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const updatedSnapshot = await getDocs(q);
    const updatedUserData = updatedSnapshot.docs[0].data();
    
    if (updatedUserData.passwordHash === newPasswordHash) {
      console.log('✅ Verification successful - password hash updated correctly');
    } else {
      console.log('❌ Verification failed - password hash not updated');
    }
    
  } catch (error) {
    console.error('❌ Error updating password hash:', error.message);
    console.error('🔍 Error code:', error.code);
  }
}

// Run the script
updatePasswordHash();
