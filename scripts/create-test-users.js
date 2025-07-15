/**
 * Create Test Users Script
 * 
 * This script creates test users in the staff_accounts collection
 * with proper password hashing for development and testing.
 * 
 * Usage: node scripts/create-test-users.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  connectFirestoreEmulator
} = require('firebase/firestore');
const bcrypt = require('bcryptjs');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if running
try {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('🔧 Connected to Firestore emulator');
} catch (error) {
  console.log('ℹ️ Using production Firestore (emulator not available)');
}

const COLLECTION_NAME = 'staff_accounts';

// Test users to create
const testUsers = [
  {
    email: 'shaun@siamoon.com',
    password: 'admin123',
    name: 'Shaun Ducker',
    role: 'admin',
    department: 'Management',
    phone: '0933880630',
    address: '50/2 moo 6, Koh Phangan, Surat Thani 84280'
  },
  {
    email: 'manager@siamoon.com',
    password: 'manager123',
    name: 'Property Manager',
    role: 'manager',
    department: 'Operations',
    phone: '0933880631',
    address: 'Koh Phangan, Surat Thani'
  },
  {
    email: 'cleaner@siamoon.com',
    password: 'cleaner123',
    name: 'House Cleaner',
    role: 'cleaner',
    department: 'Housekeeping',
    phone: '0933880632',
    address: 'Koh Phangan, Surat Thani'
  },
  {
    email: 'maintenance@siamoon.com',
    password: 'maintenance123',
    name: 'Maintenance Staff',
    role: 'maintenance',
    department: 'Maintenance',
    phone: '0933880633',
    address: 'Koh Phangan, Surat Thani'
  },
  {
    email: 'test@exam.com',
    password: 'password123',
    name: 'Test User',
    role: 'staff',
    department: 'Testing',
    phone: '0933880634',
    address: 'Test Address'
  }
];

// Hash password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Check if user exists
async function userExists(email) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('email', '==', email.toLowerCase())
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Create a single user
async function createUser(userData) {
  try {
    // Check if user already exists
    if (await userExists(userData.email)) {
      console.log(`⚠️ User ${userData.email} already exists, skipping`);
      return false;
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user document
    const userDoc = {
      email: userData.email.toLowerCase(),
      passwordHash: passwordHash,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      phone: userData.phone,
      address: userData.address,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    // Generate a new document reference
    const docRef = doc(collection(db, COLLECTION_NAME));
    await setDoc(docRef, userDoc);

    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Document ID: ${docRef.id}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to create user ${userData.email}:`, error);
    return false;
  }
}

// Main function
async function createTestUsers() {
  try {
    console.log('🔄 Creating test users in staff_accounts collection...\n');

    let successCount = 0;
    let skipCount = 0;

    for (const userData of testUsers) {
      const created = await createUser(userData);
      if (created) {
        successCount++;
      } else {
        skipCount++;
      }
      console.log(''); // Empty line for readability
    }

    console.log('✅ Test user creation completed');
    console.log(`📊 Results: ${successCount} created, ${skipCount} skipped`);
    console.log('\n🔐 Test Credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Failed to create test users:', error);
  }
}

// Run the script
createTestUsers();
