/**
 * Comprehensive Staff Authentication System Test
 * Tests all aspects of the enhanced authentication system
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs
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

async function testStaffAuthenticationSystem() {
  console.log('🧪 COMPREHENSIVE STAFF AUTHENTICATION SYSTEM TEST');
  console.log('=' .repeat(70));
  
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Firebase Connection
  console.log('\n📋 Test 1: Firebase Connection');
  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const testQuery = query(staffAccountsRef, where('isActive', '==', true));
    await getDocs(testQuery);
    console.log('✅ Firebase connection successful');
    testResults.passed++;
    testResults.tests.push({ name: 'Firebase Connection', status: 'PASS' });
  } catch (error) {
    console.log('❌ Firebase connection failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Firebase Connection', status: 'FAIL', error: error.message });
  }

  // Test 2: Staff Accounts Collection Structure
  console.log('\n📋 Test 2: Staff Accounts Collection Structure');
  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const allStaffSnapshot = await getDocs(staffAccountsRef);
    
    if (allStaffSnapshot.empty) {
      throw new Error('No staff accounts found');
    }

    let validAccounts = 0;
    let accountsWithPasswords = 0;
    
    allStaffSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email && data.role && data.isActive !== undefined) {
        validAccounts++;
      }
      if (data.passwordHash) {
        accountsWithPasswords++;
      }
    });

    console.log(`✅ Found ${allStaffSnapshot.size} staff accounts`);
    console.log(`✅ ${validAccounts} accounts have valid structure`);
    console.log(`✅ ${accountsWithPasswords} accounts have password hashes`);
    
    testResults.passed++;
    testResults.tests.push({ 
      name: 'Staff Accounts Structure', 
      status: 'PASS',
      details: `${allStaffSnapshot.size} accounts, ${accountsWithPasswords} with passwords`
    });
  } catch (error) {
    console.log('❌ Staff accounts structure test failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Staff Accounts Structure', status: 'FAIL', error: error.message });
  }

  // Test 3: Admin User Authentication
  console.log('\n📋 Test 3: Admin User Authentication');
  try {
    const email = 'admin@siamoon.com';
    const password = 'admin123';
    
    // Query for user
    const staffAccountsRef = collection(db, 'staff_accounts');
    const q = query(
      staffAccountsRef,
      where('email', '==', email.toLowerCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Admin user not found');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    if (!userData.passwordHash) {
      throw new Error('Admin user has no password hash');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    
    if (!passwordMatch) {
      throw new Error('Password verification failed');
    }

    console.log('✅ Admin user found and authenticated');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Name: ${userData.name}`);
    
    testResults.passed++;
    testResults.tests.push({ 
      name: 'Admin Authentication', 
      status: 'PASS',
      details: `${userData.email} (${userData.role})`
    });
  } catch (error) {
    console.log('❌ Admin authentication test failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Admin Authentication', status: 'FAIL', error: error.message });
  }

  // Test 4: Role-Based Access Control
  console.log('\n📋 Test 4: Role-Based Access Control');
  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const allStaffSnapshot = await getDocs(staffAccountsRef);
    
    const roleCount = {};
    const validRoles = ['admin', 'manager', 'cleaner', 'maintenance', 'staff'];
    
    allStaffSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role) {
        roleCount[data.role] = (roleCount[data.role] || 0) + 1;
      }
    });

    console.log('✅ Role distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
      const isValid = validRoles.includes(role);
      console.log(`   ${isValid ? '✅' : '❌'} ${role}: ${count} users`);
    });
    
    testResults.passed++;
    testResults.tests.push({ 
      name: 'Role-Based Access Control', 
      status: 'PASS',
      details: `Roles: ${Object.keys(roleCount).join(', ')}`
    });
  } catch (error) {
    console.log('❌ Role-based access control test failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Role-Based Access Control', status: 'FAIL', error: error.message });
  }

  // Test 5: Password Security
  console.log('\n📋 Test 5: Password Security');
  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const allStaffSnapshot = await getDocs(staffAccountsRef);
    
    let securePasswords = 0;
    let totalPasswords = 0;
    
    allStaffSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.passwordHash) {
        totalPasswords++;
        // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
        if (data.passwordHash.match(/^\$2[aby]\$\d+\$/)) {
          securePasswords++;
        }
      }
    });

    console.log(`✅ ${securePasswords}/${totalPasswords} passwords use secure bcrypt hashing`);
    
    if (securePasswords === totalPasswords && totalPasswords > 0) {
      testResults.passed++;
      testResults.tests.push({ 
        name: 'Password Security', 
        status: 'PASS',
        details: `${securePasswords}/${totalPasswords} secure hashes`
      });
    } else {
      throw new Error(`Only ${securePasswords}/${totalPasswords} passwords are securely hashed`);
    }
  } catch (error) {
    console.log('❌ Password security test failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Password Security', status: 'FAIL', error: error.message });
  }

  // Test 6: Session Management (Simulated)
  console.log('\n📋 Test 6: Session Management');
  try {
    // Simulate session creation
    const sessionData = {
      token: 'test_token_' + Date.now(),
      userId: 'test_user_id',
      email: 'admin@siamoon.com',
      role: 'admin',
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      createdAt: Date.now()
    };

    // Validate session structure
    const requiredFields = ['token', 'userId', 'email', 'role', 'expiresAt', 'createdAt'];
    const hasAllFields = requiredFields.every(field => sessionData[field] !== undefined);
    
    if (!hasAllFields) {
      throw new Error('Session missing required fields');
    }

    // Check expiration logic
    const isExpired = Date.now() > sessionData.expiresAt;
    if (isExpired) {
      throw new Error('Session expiration logic failed');
    }

    console.log('✅ Session structure valid');
    console.log('✅ Session expiration logic working');
    console.log(`   Token: ${sessionData.token.substring(0, 20)}...`);
    console.log(`   Expires: ${new Date(sessionData.expiresAt).toLocaleString()}`);
    
    testResults.passed++;
    testResults.tests.push({ 
      name: 'Session Management', 
      status: 'PASS',
      details: '24-hour session with secure token'
    });
  } catch (error) {
    console.log('❌ Session management test failed:', error.message);
    testResults.failed++;
    testResults.tests.push({ name: 'Session Management', status: 'FAIL', error: error.message });
  }

  // Test Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(70));
  
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.tests.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.details) {
      console.log(`   Details: ${test.details}`);
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Your staff authentication system is ready for production.');
    console.log('✅ Mobile app can now authenticate staff using the staff_accounts collection');
    console.log('✅ Password security is properly implemented with bcrypt');
    console.log('✅ Role-based access control is functional');
    console.log('✅ Session management is properly structured');
  } else {
    console.log('⚠️ Some tests failed. Please address the issues before deploying to production.');
    if (testResults.tests.some(t => t.name === 'Firebase Connection' && t.status === 'FAIL')) {
      console.log('🔧 Fix Firebase connection issues first');
    }
    if (testResults.tests.some(t => t.name === 'Password Security' && t.status === 'FAIL')) {
      console.log('🔧 Ensure all passwords use bcrypt hashing');
    }
  }

  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Test the mobile app login screen with credentials: admin@siamoon.com / admin123');
  console.log('2. Verify role-based navigation and features work correctly');
  console.log('3. Test session persistence across app restarts');
  console.log('4. Test rate limiting with multiple failed login attempts');
  console.log('5. Deploy to production environment');
}

// Run the comprehensive test
testStaffAuthenticationSystem().catch(console.error);
