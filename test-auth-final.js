/**
 * Final Authentication Test
 * Test the complete authentication flow with the updated user
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs
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

async function testAuthentication() {
  console.log('🔐 Final Authentication Test');
  console.log('=' .repeat(40));
  
  const email = 'admin@siamoon.com';
  const password = 'admin123';
  
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  
  try {
    // Step 1: Query for user
    console.log('\n🔍 Step 1: Looking up user...');
    const staffAccountsRef = collection(db, 'staff_accounts');
    const q = query(
      staffAccountsRef,
      where('email', '==', email.toLowerCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No active account found');
      return;
    }
    
    console.log('✅ User found');
    
    // Step 2: Get user data
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`👤 Name: ${userData.name}`);
    console.log(`🎭 Role: ${userData.role}`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔐 Has passwordHash: ${userData.passwordHash ? 'Yes' : 'No'}`);
    
    // Step 3: Verify password
    console.log('\n🔍 Step 2: Verifying password...');
    
    if (!userData.passwordHash) {
      console.log('❌ No password hash found');
      return;
    }
    
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    
    if (passwordMatch) {
      console.log('✅ Password verification successful');
      
      // Step 4: Create authenticated user object
      console.log('\n🔍 Step 3: Creating user session...');
      const authenticatedUser = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        phone: userData.phone,
        address: userData.address,
        isActive: userData.isActive
      };
      
      console.log('✅ Authentication successful!');
      console.log('\n🎉 User authenticated:');
      console.log(`   ID: ${authenticatedUser.id}`);
      console.log(`   Name: ${authenticatedUser.name}`);
      console.log(`   Email: ${authenticatedUser.email}`);
      console.log(`   Role: ${authenticatedUser.role}`);
      console.log(`   Department: ${authenticatedUser.department || 'Not specified'}`);
      console.log(`   Phone: ${authenticatedUser.phone || 'Not specified'}`);
      console.log(`   Active: ${authenticatedUser.isActive}`);
      
      console.log('\n🚀 Ready for application login!');
      
    } else {
      console.log('❌ Password verification failed');
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.error('🔍 Error code:', error.code);
  }
}

// Run the test
testAuthentication();
