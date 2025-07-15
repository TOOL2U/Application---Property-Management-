// Quick login test
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function testLogin() {
  console.log('🔐 Testing login credentials...');
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const email = 'test@exam.com';
    const password = 'password123';
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    // Simulate the mobile app's authentication logic
    const staffAccountsRef = collection(db, 'staff accounts');
    const q = query(
      staffAccountsRef,
      where('email', '==', email.toLowerCase().trim()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No active account found');
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ User found!');
    console.log(`👤 Name: ${userData.firstName} ${userData.lastName}`);
    console.log(`🆔 ID: ${userDoc.id}`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🎭 Role: ${userData.role}`);
    
    // Check password
    if (userData.password === password) {
      console.log('🎉 PASSWORD MATCH! Login would be successful!');
      console.log('\n✅ CONCLUSION: You can successfully log in to the mobile app with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log(`❌ Password mismatch. Expected: ${password}, Found: ${userData.password}`);
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error);
  }
}

testLogin();
