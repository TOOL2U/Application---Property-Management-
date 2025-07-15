/**
 * Create New Staff User for Testing Role-Based Navigation
 * Creates a fresh staff account with "staff" role
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

async function createNewStaffUser() {
  console.log('👤 Creating NEW staff user for role-based navigation testing...');
  console.log('=' .repeat(60));

  try {
    const newEmail = 'staff@siamoon.com';
    
    // Check if account already exists
    const staffAccountsRef = collection(db, 'staff_accounts');
    const existingQuery = query(staffAccountsRef, where('email', '==', newEmail));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('⚠️  Account already exists, updating password...');
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      
      // Update password for existing account
      const password = 'staff123';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const { updateDoc, doc } = require('firebase/firestore');
      const docRef = doc(db, 'staff_accounts', existingDoc.id);
      await updateDoc(docRef, {
        passwordHash: passwordHash,
        role: 'staff', // Ensure it's staff role
        loginAttempts: 0,
        lockedUntil: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Existing account updated!');
      console.log(`📧 Email: ${newEmail}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`🎭 Role: staff`);
      return;
    }

    // Create password hash
    const password = 'staff123';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create NEW staff account data
    const staffAccountData = {
      name: 'Sarah Staff',
      email: newEmail,
      passwordHash: passwordHash,
      role: 'staff', // STAFF ROLE - should see limited navigation
      department: 'General Staff',
      phone: '+1-555-0299',
      isActive: true,
      permissions: [
        'jobs:read',
        'jobs:accept',
        'jobs:complete',
        'photos:upload',
        'profile:read',
        'profile:update'
      ],
      employeeId: 'EMP-STAFF-001',
      hireDate: new Date('2024-02-01'),
      emergencyContact: {
        name: 'John Staff',
        phone: '+1-555-0300',
        relationship: 'Spouse'
      },
      address: {
        street: '456 Staff Avenue',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94106'
      },
      certifications: [
        'General Staff Training',
        'Customer Service Certification'
      ],
      schedule: {
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '09:00',
        endTime: '17:00'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    };

    // Add to Firestore
    const docRef = await addDoc(staffAccountsRef, staffAccountData);
    
    console.log('✅ NEW staff account created successfully!');
    console.log(`📋 Account Details:`);
    console.log(`   Name: ${staffAccountData.name}`);
    console.log(`   Email: ${staffAccountData.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${staffAccountData.role}`);
    console.log(`   Department: ${staffAccountData.department}`);
    console.log(`   Document ID: ${docRef.id}`);
    
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log(`   📧 Email: staff@siamoon.com`);
    console.log(`   🔑 Password: staff123`);
    console.log(`   🎭 Role: staff`);
    
    console.log('\n🎭 EXPECTED ROLE-BASED NAVIGATION:');
    console.log('   ✅ SHOULD SEE (Limited Staff Navigation):');
    console.log('     - Dashboard tab');
    console.log('     - Jobs tab');
    console.log('     - Profile tab');
    console.log('');
    console.log('   ❌ SHOULD NOT SEE (Admin Features):');
    console.log('     - Properties tab');
    console.log('     - Tenants tab');
    console.log('     - Schedule tab');
    console.log('     - Maintenance tab');
    console.log('     - Payments tab');
    console.log('     - Map tab');
    console.log('     - History tab');
    
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Logout from current account');
    console.log('2. Login with: staff@siamoon.com / staff123');
    console.log('3. Count the tabs - should be EXACTLY 3 tabs');
    console.log('4. If you see more than 3 tabs, there\'s still an issue');
    
    console.log('\n🔄 COMPARISON TEST:');
    console.log('• Login as staff@siamoon.com → Should see 3 tabs');
    console.log('• Login as admin@siamoon.com → Should see ALL tabs');
    console.log('• This will prove role-based navigation is working');

  } catch (error) {
    console.error('❌ Error creating staff account:', error);
  }
}

// Run the script
createNewStaffUser().catch(console.error);
