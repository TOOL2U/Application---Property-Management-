// Quick test to verify production Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Production Firebase configuration
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

async function testProductionConnection() {
  console.log('🚀 Testing Production Firebase Connection');
  console.log('========================================');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`📡 Connecting to production Firebase...`);
    console.log(`🎯 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
    
    // Test connection by querying staff accounts
    const staffRef = collection(db, 'staff accounts');
    const snapshot = await getDocs(staffRef);
    
    console.log('✅ Successfully connected to production Firebase!');
    console.log(`📋 Staff accounts collection: ${snapshot.size} documents found`);
    
    if (snapshot.size > 0) {
      console.log('\n👥 Users in production database:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   Name: ${data.full_name || data.firstName + ' ' + data.lastName || 'N/A'}`);
        console.log(`   Role: ${data.role || 'N/A'}`);
        console.log(`   Active: ${data.isActive}`);
        console.log('');
      });
    }
    
    console.log('🎉 Production Firebase is ready for mobile app testing!');
    
  } catch (error) {
    console.error('❌ Production Firebase connection failed:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - this might be due to security rules.');
      console.log('   Make sure Firebase security rules allow read access for testing.');
    }
  }
}

testProductionConnection();
