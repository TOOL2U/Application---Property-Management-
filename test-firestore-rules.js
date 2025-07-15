/**
 * Test Firestore Rules
 * Simple test to verify Firestore rules are working correctly
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} = require('firebase/firestore');

// Firebase configuration for your project
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

async function testFirestoreRules() {
  console.log('🧪 Testing Firestore Rules');
  console.log('=' .repeat(40));
  
  try {
    // Test 1: Try to read from staff_accounts collection
    console.log('\n📋 Test 1: Reading staff_accounts collection...');
    const staffAccountsRef = collection(db, 'staff_accounts');
    const querySnapshot = await getDocs(staffAccountsRef);
    
    console.log(`✅ Successfully read staff_accounts collection`);
    console.log(`📊 Found ${querySnapshot.size} documents`);
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`👤 User: ${data.email} (${data.role || 'no role'})`);
      });
    }
    
    // Test 2: Try to query by email
    console.log('\n📋 Test 2: Querying by email...');
    const emailQuery = query(
      staffAccountsRef,
      where('email', '==', 'admin@siamoon.com')
    );
    
    const emailQuerySnapshot = await getDocs(emailQuery);
    console.log(`✅ Successfully queried by email`);
    console.log(`📊 Found ${emailQuerySnapshot.size} matching documents`);
    
    if (!emailQuerySnapshot.empty) {
      const userDoc = emailQuerySnapshot.docs[0];
      const userData = userDoc.data();
      console.log(`👤 Found user: ${userData.name || userData.email}`);
      console.log(`🎭 Role: ${userData.role}`);
      console.log(`🔐 Has passwordHash: ${userData.passwordHash ? 'Yes' : 'No'}`);
      console.log(`✅ Active: ${userData.isActive}`);
    }
    
    // Test 3: Try to read connection_test collection
    console.log('\n📋 Test 3: Testing connection_test collection...');
    const connectionTestRef = collection(db, 'connection_test');
    const connectionSnapshot = await getDocs(connectionTestRef);
    console.log(`✅ Successfully read connection_test collection`);
    console.log(`📊 Found ${connectionSnapshot.size} documents`);
    
    console.log('\n🎉 All Firestore rules tests passed!');
    console.log('✅ Rules are working correctly');
    
  } catch (error) {
    console.error('\n❌ Firestore rules test failed:', error.message);
    console.error('🔍 Error code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - possible causes:');
      console.log('   1. Firestore rules not deployed correctly');
      console.log('   2. Rules syntax error');
      console.log('   3. Rules not propagated yet (wait a few minutes)');
      console.log('\n🔧 Try running: firebase deploy --only firestore:rules');
    }
  }
}

// Run the test
testFirestoreRules();
