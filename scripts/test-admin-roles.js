/**
 * Test Admin Roles Script
 * Creates test accounts with different roles to test admin functionality
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp 
} = require('firebase/firestore');
const bcrypt = require('bcrypt');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOqKJGJGJGJGJGJGJGJGJGJGJGJGJGJGJG",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test accounts with different roles
const testAccounts = [
  {
    name: 'Admin User',
    email: 'admin@siamoon.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
    phone: '+1 (555) 100-0001',
    address: '123 Admin Street, Miami, FL 33101',
    isActive: true,
    permissions: [
      'view_all_bookings',
      'assign_staff',
      'manage_jobs',
      'view_properties',
      'manage_payments',
      'view_reports',
      'manage_users'
    ]
  },
  {
    name: 'Manager User',
    email: 'manager@siamoon.com',
    password: 'manager123',
    role: 'manager',
    department: 'Operations',
    phone: '+1 (555) 200-0002',
    address: '456 Manager Ave, Miami, FL 33102',
    isActive: true,
    permissions: [
      'view_all_bookings',
      'assign_staff',
      'manage_jobs',
      'view_properties',
      'view_reports'
    ]
  },
  {
    name: 'Staff Member',
    email: 'staff@siamoon.com',
    password: 'staff123',
    role: 'staff',
    department: 'General',
    phone: '+1 (555) 300-0003',
    address: '789 Staff Blvd, Miami, FL 33103',
    isActive: true,
    permissions: []
  },
  {
    name: 'Maintenance Tech',
    email: 'maintenance@siamoon.com',
    password: 'maintenance123',
    role: 'maintenance',
    department: 'Maintenance',
    phone: '+1 (555) 400-0004',
    address: '321 Maintenance Dr, Miami, FL 33104',
    isActive: true,
    permissions: []
  },
  {
    name: 'Cleaner',
    email: 'cleaner@siamoon.com',
    password: 'cleaner123',
    role: 'cleaner',
    department: 'Housekeeping',
    phone: '+1 (555) 500-0005',
    address: '654 Cleaner Ln, Miami, FL 33105',
    isActive: true,
    permissions: []
  }
];

async function createOrUpdateAccount(accountData) {
  try {
    console.log(`👤 Processing account: ${accountData.name} (${accountData.email})`);

    // Check if account already exists
    const staffAccountsRef = collection(db, 'staff_accounts');
    const existingQuery = query(staffAccountsRef, where('email', '==', accountData.email));
    const existingSnapshot = await getDocs(existingQuery);

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(accountData.password, saltRounds);

    const accountDoc = {
      name: accountData.name,
      email: accountData.email,
      passwordHash,
      role: accountData.role,
      department: accountData.department,
      phone: accountData.phone,
      address: accountData.address,
      isActive: accountData.isActive,
      permissions: accountData.permissions,
      lastLogin: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      fcmTokens: [],
      notificationPreferences: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        reminderMinutes: 15
      }
    };

    if (!existingSnapshot.empty) {
      // Update existing account
      const existingDoc = existingSnapshot.docs[0];
      await updateDoc(doc(db, 'staff_accounts', existingDoc.id), {
        ...accountDoc,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Updated existing account: ${accountData.email}`);
    } else {
      // Create new account
      const docRef = await addDoc(staffAccountsRef, accountDoc);
      console.log(`✅ Created new account: ${accountData.email} (ID: ${docRef.id})`);
    }

    console.log(`   📋 Role: ${accountData.role}`);
    console.log(`   🏢 Department: ${accountData.department}`);
    console.log(`   🔐 Password: ${accountData.password}`);
    console.log(`   📱 Phone: ${accountData.phone}`);
    console.log(`   🎯 Permissions: ${accountData.permissions.length} permissions`);
    console.log('');

  } catch (error) {
    console.error(`❌ Error processing account ${accountData.email}:`, error);
  }
}

async function createAllTestAccounts() {
  try {
    console.log('🚀 Creating test accounts for role-based testing...\n');

    for (const account of testAccounts) {
      await createOrUpdateAccount(account);
    }

    console.log('🎉 All test accounts created/updated successfully!\n');
    console.log('📱 Test the mobile app with these accounts:');
    console.log('');
    
    console.log('👨‍💼 ADMIN ACCOUNT (Full Access):');
    console.log('   Email: admin@siamoon.com');
    console.log('   Password: admin123');
    console.log('   Expected: 13 tabs with all admin features');
    console.log('');
    
    console.log('👩‍💼 MANAGER ACCOUNT (Limited Admin):');
    console.log('   Email: manager@siamoon.com');
    console.log('   Password: manager123');
    console.log('   Expected: 13 tabs with most admin features (no payments/user management)');
    console.log('');
    
    console.log('👷‍♂️ STAFF ACCOUNTS (Simplified Interface):');
    console.log('   Email: staff@siamoon.com | Password: staff123');
    console.log('   Email: maintenance@siamoon.com | Password: maintenance123');
    console.log('   Email: cleaner@siamoon.com | Password: cleaner123');
    console.log('   Expected: 3 tabs (Dashboard, Active Jobs, Profile)');
    console.log('');
    
    console.log('🧪 TESTING INSTRUCTIONS:');
    console.log('1. Login with admin account → Should see all 13 tabs');
    console.log('2. Navigate to "Bookings" tab → Should show all bookings');
    console.log('3. Navigate to "Assign Staff" tab → Should show staff assignment interface');
    console.log('4. Navigate to "Manage Jobs" tab → Should show job management interface');
    console.log('5. Logout and login with staff account → Should see only 3 tabs');
    console.log('6. Try to access admin features → Should show "Access Restricted" message');
    console.log('');
    
    console.log('🔍 ROLE DETECTION TESTING:');
    console.log('- Admin/Manager users: Full property management interface');
    console.log('- Staff users: Simplified job-focused interface');
    console.log('- Role-based conditional UI throughout the app');
    console.log('- Access control on all admin-only features');

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  }
}

async function showRolePermissions() {
  console.log('🎭 ROLE PERMISSIONS MATRIX:\n');
  
  const permissions = [
    'View All Bookings',
    'Assign Staff',
    'Manage Jobs',
    'View Properties',
    'Manage Payments',
    'View Reports',
    'Manage Users',
    'Access Admin Features'
  ];
  
  const roles = ['admin', 'manager', 'staff', 'maintenance', 'cleaner'];
  
  // Header
  console.log('Role'.padEnd(12) + permissions.map(p => p.substring(0, 8)).join(' | '));
  console.log('-'.repeat(12 + permissions.length * 10));
  
  // Role permissions
  const rolePermissions = {
    admin: [true, true, true, true, true, true, true, true],
    manager: [true, true, true, true, false, true, false, true],
    staff: [false, false, false, false, false, false, false, false],
    maintenance: [false, false, false, false, false, false, false, false],
    cleaner: [false, false, false, false, false, false, false, false]
  };
  
  roles.forEach(role => {
    const perms = rolePermissions[role];
    const permStr = perms.map(p => (p ? '   ✅   ' : '   ❌   ')).join(' | ');
    console.log(role.padEnd(12) + permStr);
  });
  
  console.log('\n📱 MOBILE APP NAVIGATION:');
  console.log('Staff Users (3 tabs): Dashboard | Active Jobs | Profile');
  console.log('Admin Users (13 tabs): Dashboard | Jobs | Bookings | Assign Staff | Manage Jobs | Properties | Tenants | Schedule | Maintenance | Payments | Map | History | Profile');
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'create') {
  createAllTestAccounts();
} else if (command === 'permissions') {
  showRolePermissions();
} else {
  console.log('📋 Usage:');
  console.log('  node scripts/test-admin-roles.js create      - Create/update all test accounts');
  console.log('  node scripts/test-admin-roles.js permissions - Show role permissions matrix');
  console.log('');
  console.log('🎯 This script helps test the role-based admin functionality in the mobile app.');
}
