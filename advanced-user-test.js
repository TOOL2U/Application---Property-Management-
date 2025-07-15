// Advanced user test that simulates the app environment
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

async function advancedUserTest() {
  console.log('🚀 Advanced User Authentication Test');
  console.log('=====================================');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const targetUserId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';
    const targetEmail = 'test@exam.com';

    console.log(`\n🔍 Target User:`);
    console.log(`   ID: ${targetUserId}`);
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Name: Shaun Ducker`);

    // Test 1: Check if collection exists and permissions
    console.log('\n--- Test 1: Collection Access ---');
    try {
      const staffRef = collection(db, 'staff accounts');
      console.log('✅ Can access "staff accounts" collection');
      
      // Try to list documents (this will show permission issues)
      const snapshot = await getDocs(staffRef);
      console.log(`✅ Successfully queried collection - found ${snapshot.size} documents`);
      
      if (snapshot.size > 0) {
        console.log('\n📋 All Staff Accounts:');
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. ID: ${doc.id}`);
          console.log(`   Email: ${data.email || 'N/A'}`);
          console.log(`   Name: ${data.full_name || data.firstName + ' ' + data.lastName || 'N/A'}`);
          console.log(`   Active: ${data.isActive}`);
          console.log(`   Role: ${data.role || 'N/A'}`);
          console.log(`   Password Set: ${data.password ? 'Yes' : 'No'}`);
          
          // Check if this is our target user
          if (doc.id === targetUserId || data.email === targetEmail) {
            console.log(`   ⭐ THIS IS THE TARGET USER!`);
            if (data.password) {
              console.log(`   🔐 Password: ${data.password}`);
            }
          }
          console.log('');
        });
      }
      
    } catch (error) {
      console.error('❌ Cannot access collection:', error.message);
      
      if (error.code === 'permission-denied') {
        console.log('\n💡 This is normal - Firebase security rules prevent anonymous access.');
        console.log('   To test properly, you need to:');
        console.log('   1. Run this from within the mobile app (where user is authenticated)');
        console.log('   2. Or temporarily adjust Firebase security rules for testing');
        console.log('   3. Or use Firebase Admin SDK with service account');
      }
      return;
    }

    // Test 2: Direct document access
    console.log('\n--- Test 2: Direct Document Access ---');
    try {
      const userRef = doc(db, 'staff accounts', targetUserId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Found target user by ID!');
        console.log('📄 User Data:', JSON.stringify(userData, null, 2));
        
        // Password check
        if (userData.password) {
          console.log(`\n🔐 Password found: "${userData.password}"`);
          console.log('🎉 You can now log in to the mobile app with:');
          console.log(`   Email: ${userData.email}`);
          console.log(`   Password: ${userData.password}`);
        } else {
          console.log('\n❌ No password field found. You may need to:');
          console.log('   1. Set a password in the Firebase console');
          console.log('   2. Or create the password field manually');
        }
      } else {
        console.log('❌ User document not found');
      }
    } catch (error) {
      console.error('❌ Error accessing user document:', error.message);
    }

    // Test 3: Query by email
    console.log('\n--- Test 3: Query by Email ---');
    try {
      const staffRef = collection(db, 'staff accounts');
      const emailQuery = query(staffRef, where('email', '==', targetEmail));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        console.log('✅ Found user by email!');
        emailSnapshot.forEach((doc) => {
          console.log(`📄 Document ID: ${doc.id}`);
          console.log('📄 Data:', JSON.stringify(doc.data(), null, 2));
        });
      } else {
        console.log('❌ No user found with that email');
      }
    } catch (error) {
      console.error('❌ Error querying by email:', error.message);
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

// Test mobile app authentication simulation
async function simulateAuthFlow() {
  console.log('\n\n🎭 Simulating Mobile App Auth Flow');
  console.log('====================================');
  
  // This simulates what the mobile app does
  const authFlow = {
    email: 'test@exam.com',
    passwords: ['password123', 'admin123', 'test123', 'password', '123456', 'admin', 'test', 'qwerty', 'shaun123'],
  };
  
  console.log(`Testing authentication for: ${authFlow.email}`);
  console.log(`Trying ${authFlow.passwords.length} common passwords...`);
  
  for (let i = 0; i < authFlow.passwords.length; i++) {
    const password = authFlow.passwords[i];
    console.log(`\n🔑 Trying password ${i + 1}/${authFlow.passwords.length}: "${password}"`);
    
    // This would normally call authService.authenticateUser(email, password)
    // But since we can't access Firestore directly, we'll just simulate
    console.log('   (This would query Firestore and compare password)');
  }
  
  console.log('\n💡 To actually test login:');
  console.log('   1. Open the mobile app');
  console.log('   2. Go to the dashboard');
  console.log('   3. Tap "Test User Login"');
  console.log('   4. Use the "Test Specific User" button');
}

console.log('Starting comprehensive user test...\n');
advancedUserTest().then(() => {
  simulateAuthFlow();
}).catch(console.error);
