// Simple test script to check if the user exists in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration from .env.local
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

async function testUser() {
  console.log('🚀 Testing user authentication...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const targetUserId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';
    const targetEmail = 'test@exam.com';

    console.log(`🔍 Looking for user with ID: ${targetUserId}`);
    console.log(`📧 Expected email: ${targetEmail}`);

    // Test 1: Find user by ID
    console.log('\n--- Test 1: Find by Document ID ---');
    const userRef = doc(db, 'staff accounts', targetUserId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ User found by ID!');
      console.log('📄 User data:', JSON.stringify(userData, null, 2));
      
      // Check if email matches
      if (userData.email === targetEmail) {
        console.log('✅ Email matches!');
      } else {
        console.log(`❌ Email mismatch. Expected: ${targetEmail}, Found: ${userData.email}`);
      }
      
      // Check if user is active
      if (userData.isActive) {
        console.log('✅ User is active');
      } else {
        console.log('❌ User is not active');
      }
      
      // Check if password exists
      if (userData.password) {
        console.log('🔐 Password field exists');
        console.log(`🔐 Password hint: ${userData.password.substring(0, 3)}...`);
      } else {
        console.log('❌ No password field found');
      }

    } else {
      console.log('❌ User not found by ID');
    }

    // Test 2: Find user by email
    console.log('\n--- Test 2: Find by Email ---');
    const staffAccountsRef = collection(db, 'staff accounts');
    const emailQuery = query(staffAccountsRef, where('email', '==', targetEmail));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      console.log('✅ User found by email!');
      emailSnapshot.forEach((doc) => {
        console.log(`📄 Document ID: ${doc.id}`);
        console.log('📄 User data:', JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('❌ User not found by email');
    }

    // Test 3: List all staff accounts to see what's there
    console.log('\n--- Test 3: All Staff Accounts ---');
    const allStaffQuery = query(staffAccountsRef);
    const allStaffSnapshot = await getDocs(allStaffQuery);

    if (!allStaffSnapshot.empty) {
      console.log(`📋 Found ${allStaffSnapshot.size} staff accounts:`);
      allStaffSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}, Email: ${data.email}, Name: ${data.full_name || data.firstName + ' ' + data.lastName}, Active: ${data.isActive}`);
      });
    } else {
      console.log('❌ No staff accounts found');
    }

  } catch (error) {
    console.error('❌ Error testing user:', error);
  }
}

testUser();
