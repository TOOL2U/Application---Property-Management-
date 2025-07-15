// Script to create the Shaun Ducker user in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs } = require('firebase/firestore');

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

async function createShaunDuckerUser() {
  console.log('🚀 Creating Shaun Ducker user in Firebase...');
  console.log('===============================================');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const userId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';
    const userData = {
      email: 'test@exam.com',
      full_name: 'Shaun Ducker',
      firstName: 'Shaun',
      lastName: 'Ducker',
      role: 'staff',
      isActive: true,
      password: 'password123', // You can change this
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      mustChangePassword: true,
      lastLoginAt: null,
      updatedAt: new Date().toISOString()
    };

    console.log(`📝 Creating user with ID: ${userId}`);
    console.log(`📧 Email: ${userData.email}`);
    console.log(`👤 Name: ${userData.full_name}`);
    console.log(`🔐 Password: ${userData.password}`);

    // Create the user document
    const userRef = doc(db, 'staff accounts', userId);
    await setDoc(userRef, userData);

    console.log('✅ User created successfully!');
    
    // Verify the user was created
    console.log('\n🔍 Verifying user creation...');
    const staffRef = collection(db, 'staff accounts');
    const snapshot = await getDocs(staffRef);
    
    console.log(`📋 Total staff accounts: ${snapshot.size}`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\n👤 User: ${doc.id}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Name: ${data.full_name || data.firstName + ' ' + data.lastName}`);
      console.log(`   Active: ${data.isActive}`);
      console.log(`   Password: ${data.password}`);
    });

    console.log('\n🎉 User creation complete!');
    console.log('\n📱 You can now test login in the mobile app with:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied - this is normal with Firebase security rules.');
      console.log('   To create the user, you can:');
      console.log('   1. Go to Firebase Console: https://console.firebase.google.com');
      console.log('   2. Select your project: operty-b54dc');
      console.log('   3. Go to Firestore Database');
      console.log('   4. Create a collection called "staff accounts"');
      console.log('   5. Add a document with the following details:');
      console.log('   Document ID: VPPtbGl8WhMicZURHOgQ9BUzJd02');
      console.log('   Fields:');
      console.log('     - email (string): test@exam.com');
      console.log('     - full_name (string): Shaun Ducker');
      console.log('     - firstName (string): Shaun');
      console.log('     - lastName (string): Ducker');
      console.log('     - role (string): staff');
      console.log('     - isActive (boolean): true');
      console.log('     - password (string): password123');
      console.log('     - createdAt (timestamp): current time');
      console.log('     - createdBy (string): admin');
      console.log('     - mustChangePassword (boolean): true');
    }
  }
}

createShaunDuckerUser();
