/**
 * Create Alan Staff Account
 * Creates a staff account for alan@example.com with cleaner role
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
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

async function createAlanStaffAccount() {
  console.log('👤 Creating staff account for Alan...');
  console.log('=' .repeat(50));

  try {
    // Check if account already exists
    const staffAccountsRef = collection(db, 'staff_accounts');
    const existingQuery = query(staffAccountsRef, where('email', '==', 'alan@example.com'));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('⚠️  Account alan@example.com already exists');
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      console.log(`📋 Existing account details:`);
      console.log(`   Name: ${existingData.name}`);
      console.log(`   Email: ${existingData.email}`);
      console.log(`   Role: ${existingData.role}`);
      console.log(`   Department: ${existingData.department}`);
      console.log(`   ID: ${existingDoc.id}`);
      return;
    }

    // Create password hash
    const password = 'alan123'; // Simple password for testing
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create staff account data
    const staffAccountData = {
      name: 'Alan Johnson',
      email: 'alan@example.com',
      passwordHash: passwordHash,
      role: 'cleaner', // Staff role to see limited navigation
      department: 'Housekeeping',
      phone: '+1-555-0199',
      isActive: true,
      permissions: [
        'jobs:read',
        'jobs:accept',
        'jobs:complete',
        'photos:upload',
        'profile:read',
        'profile:update'
      ],
      employeeId: 'EMP-003',
      hireDate: new Date('2024-01-15'),
      emergencyContact: {
        name: 'Sarah Johnson',
        phone: '+1-555-0200',
        relationship: 'Spouse'
      },
      address: {
        street: '789 Oak Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      certifications: [
        'Professional Cleaning Certification',
        'Safety Training Completed'
      ],
      schedule: {
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '08:00',
        endTime: '16:00'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    };

    // Add to Firestore
    const docRef = await addDoc(staffAccountsRef, staffAccountData);
    
    console.log('✅ Staff account created successfully!');
    console.log(`📋 Account Details:`);
    console.log(`   Name: ${staffAccountData.name}`);
    console.log(`   Email: ${staffAccountData.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${staffAccountData.role}`);
    console.log(`   Department: ${staffAccountData.department}`);
    console.log(`   Document ID: ${docRef.id}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: alan@example.com`);
    console.log(`   Password: alan123`);
    
    console.log('\n🎭 Role-Based Features:');
    console.log('   • As a "cleaner" role, Alan will see:');
    console.log('     - Dashboard tab (simplified staff view)');
    console.log('     - Jobs tab (assigned jobs only)');
    console.log('     - Profile tab');
    console.log('   • Alan will NOT see admin tabs like:');
    console.log('     - Properties, Schedule, Maintenance, Payments, etc.');
    
    console.log('\n📱 Testing Instructions:');
    console.log('1. Logout from current account');
    console.log('2. Login with alan@example.com / alan123');
    console.log('3. Verify limited navigation (only 3 tabs)');
    console.log('4. Check dashboard shows staff-specific content');

  } catch (error) {
    console.error('❌ Error creating staff account:', error);
  }
}

// Run the script
createAlanStaffAccount().catch(console.error);
