/**
 * Test Staff Accounts Collection
 * Verify that the mobile app can read from staff_accounts collection
 * and test the integration between web app and mobile app
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} = require('firebase/firestore');

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

/**
 * Test 1: Check existing staff_accounts
 */
async function checkExistingStaffAccounts() {
  console.log('🔍 TEST 1: Checking existing staff_accounts collection...');
  console.log('=' .repeat(60));
  
  try {
    const staffRef = collection(db, 'staff_accounts');
    const snapshot = await getDocs(staffRef);
    
    console.log(`📊 Total staff accounts found: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  No staff accounts found in collection');
      return [];
    }
    
    const accounts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      accounts.push({
        id: doc.id,
        ...data
      });
      
      console.log(`\n👤 Staff Account: ${doc.id}`);
      console.log(`   Name: ${data.name || data.displayName || 'N/A'}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Role: ${data.role || data.accountType || 'N/A'}`);
      console.log(`   Status: ${data.status || (data.isActive ? 'active' : 'inactive')}`);
      console.log(`   Department: ${data.department || 'N/A'}`);
    });
    
    return accounts;
  } catch (error) {
    console.error('❌ Error checking staff accounts:', error);
    return [];
  }
}

/**
 * Test 2: Query active staff accounts (mobile app simulation)
 */
async function testMobileAppQuery() {
  console.log('\n🔍 TEST 2: Simulating mobile app query for active staff...');
  console.log('=' .repeat(60));
  
  try {
    const staffRef = collection(db, 'staff_accounts');
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      staffRef,
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    
    console.log(`📱 Mobile app would see: ${querySnapshot.size} active staff accounts`);
    
    const mobileProfiles = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Simulate mobile app profile mapping
      const profile = {
        id: doc.id,
        name: data.displayName || data.name || data.fullName || 'Unknown Staff',
        email: data.email || '',
        role: mapRole(data.role || data.accountType || data.userRole || 'staff'),
        isActive: data.status === 'active',
        department: data.department || data.division || 'General',
        phone: data.phoneNumber || data.phone || '',
        avatar: data.photoURL || data.avatar || data.profileImage || data.photo,
        createdAt: data.createdAt?.toDate?.() || data.dateCreated?.toDate?.() || new Date(),
        lastLogin: data.lastLoginAt?.toDate?.() || data.lastLogin?.toDate?.(),
      };
      
      mobileProfiles.push(profile);
      
      console.log(`\n📱 Mobile Profile: ${profile.id}`);
      console.log(`   Name: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Active: ${profile.isActive}`);
      console.log(`   Department: ${profile.department}`);
    });
    
    return mobileProfiles;
  } catch (error) {
    console.error('❌ Error simulating mobile app query:', error);
    return [];
  }
}

/**
 * Test 3: Create a test staff account
 */
async function createTestStaffAccount() {
  console.log('\n🔍 TEST 3: Creating test staff account...');
  console.log('=' .repeat(60));
  
  try {
    const testAccountId = `test_staff_${Date.now()}`;
    const testAccount = {
      name: 'Test Mobile User',
      displayName: 'Test Mobile User',
      email: 'test.mobile@example.com',
      role: 'staff',
      accountType: 'staff',
      status: 'active',
      department: 'Testing',
      phoneNumber: '+1-555-0123',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Mobile app specific fields
      photoURL: null,
      lastLoginAt: null,
    };
    
    const docRef = doc(db, 'staff_accounts', testAccountId);
    await setDoc(docRef, testAccount);
    
    console.log(`✅ Created test staff account: ${testAccountId}`);
    console.log(`   This account should now appear in the mobile app profile selection`);
    
    return testAccountId;
  } catch (error) {
    console.error('❌ Error creating test staff account:', error);
    return null;
  }
}

/**
 * Helper function to map roles (same as mobile app)
 */
function mapRole(webAppRole) {
  const roleMapping = {
    'administrator': 'admin',
    'admin': 'admin',
    'system_admin': 'admin',
    'manager': 'manager',
    'supervisor': 'manager',
    'team_lead': 'manager',
    'lead': 'manager',
    'cleaner': 'cleaner',
    'cleaning': 'cleaner',
    'housekeeper': 'cleaner',
    'housekeeping': 'cleaner',
    'maintenance': 'maintenance',
    'technician': 'maintenance',
    'repair': 'maintenance',
    'engineer': 'maintenance',
    'maintenance_tech': 'maintenance',
    'staff': 'staff',
    'employee': 'staff',
    'worker': 'staff',
    'user': 'staff',
    'member': 'staff',
  };

  const normalizedRole = webAppRole.toLowerCase().trim();
  return roleMapping[normalizedRole] || 'staff';
}

/**
 * Main test function
 */
async function runStaffAccountsTest() {
  console.log('🧪 STAFF ACCOUNTS COLLECTION TEST');
  console.log('Testing mobile app integration with staff_accounts collection');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Check existing accounts
    const existingAccounts = await checkExistingStaffAccounts();
    
    // Test 2: Simulate mobile app query
    const mobileProfiles = await testMobileAppQuery();
    
    // Test 3: Create test account
    const testAccountId = await createTestStaffAccount();
    
    // Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📊 Total staff accounts in collection: ${existingAccounts.length}`);
    console.log(`📱 Active accounts visible to mobile app: ${mobileProfiles.length}`);
    console.log(`✅ Test account created: ${testAccountId ? 'Yes' : 'No'}`);
    
    if (mobileProfiles.length > 0) {
      console.log('\n✅ SUCCESS: Mobile app should be able to load staff profiles!');
      console.log('🎯 Next steps:');
      console.log('   1. Open the mobile app');
      console.log('   2. Check the profile selection screen');
      console.log('   3. Verify that staff accounts appear correctly');
      console.log('   4. Test PIN authentication with the accounts');
    } else {
      console.log('\n⚠️  WARNING: No active staff accounts found!');
      console.log('🎯 To fix this:');
      console.log('   1. Create staff accounts in your web app');
      console.log('   2. Ensure they have status: "active"');
      console.log('   3. Refresh the mobile app');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
runStaffAccountsTest();
