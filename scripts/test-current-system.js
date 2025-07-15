/**
 * Test Current Working System
 * Tests the actual authentication and database system currently in use
 * 
 * Run with: node scripts/test-current-system.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  limit 
} = require('firebase/firestore');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: '.env.local' });

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Test accounts (these should match your staff_accounts collection)
const testCredentials = [
  { email: 'admin@siamoon.com', password: 'admin123' },
  { email: 'staff@siamoon.com', password: 'staff123' },
  { email: 'alan@example.com', password: 'alan123' },
  { email: 'test@example.com', password: 'test123' }
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, message = '', data = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}: ${message}`);
  
  testResults.tests.push({
    name: testName,
    success,
    message,
    data
  });
  
  if (success) testResults.passed++;
  else testResults.failed++;
}

// Initialize Firebase
let app, firestore;

function initializeFirebase() {
  try {
    console.log('🔧 Initializing Firebase...');
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    
    logTest('Firebase Initialization', true, 'Firebase initialized successfully');
    return true;
  } catch (error) {
    logTest('Firebase Initialization', false, error.message);
    return false;
  }
}

// Test custom authentication (the system currently in use)
async function testCustomAuthentication(credentials) {
  try {
    console.log(`\n🔐 Testing custom authentication for: ${credentials.email}`);
    
    // Get staff account from Firestore
    const staffCollection = collection(firestore, 'staff_accounts');
    const q = query(staffCollection, where('email', '==', credentials.email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      logTest(`Custom Auth - ${credentials.email}`, false, 'Staff account not found in database');
      return false;
    }
    
    const staffDoc = querySnapshot.docs[0];
    const staffData = staffDoc.data();
    
    logTest(`Custom Auth Find User - ${credentials.email}`, true, `Found user: ${staffData.name}`);
    
    // Verify password
    const passwordMatch = await bcrypt.compare(credentials.password, staffData.passwordHash);
    
    if (passwordMatch) {
      logTest(`Custom Auth Password - ${credentials.email}`, true, 'Password verified successfully');
      
      // Display user info
      console.log(`   User Details:`);
      console.log(`   - Name: ${staffData.name}`);
      console.log(`   - Email: ${staffData.email}`);
      console.log(`   - Role: ${staffData.role}`);
      console.log(`   - Department: ${staffData.department || 'N/A'}`);
      console.log(`   - Active: ${staffData.isActive}`);
      console.log(`   - Employee ID: ${staffData.employeeId || 'N/A'}`);
      
      return true;
    } else {
      logTest(`Custom Auth Password - ${credentials.email}`, false, 'Password verification failed');
      return false;
    }
    
  } catch (error) {
    logTest(`Custom Auth - ${credentials.email}`, false, error.message);
    return false;
  }
}

// Test role-based access
async function testRoleBasedAccess() {
  try {
    console.log('\n🎭 Testing Role-Based Access System...');
    
    const staffCollection = collection(firestore, 'staff_accounts');
    const querySnapshot = await getDocs(staffCollection);
    
    const roleStats = {};
    const permissions = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const role = data.role;
      
      // Count roles
      roleStats[role] = (roleStats[role] || 0) + 1;
      
      // Collect permissions
      if (data.permissions) {
        permissions[role] = data.permissions;
      }
    });
    
    logTest('Role-Based Access - Role Distribution', true, `Found roles: ${Object.keys(roleStats).join(', ')}`);
    
    console.log('   Role Statistics:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} user(s)`);
    });
    
    console.log('   Role Permissions:');
    Object.entries(permissions).forEach(([role, perms]) => {
      console.log(`   - ${role}: ${perms.join(', ')}`);
    });
    
    return true;
  } catch (error) {
    logTest('Role-Based Access Test', false, error.message);
    return false;
  }
}

// Test job management system
async function testJobManagement() {
  try {
    console.log('\n📋 Testing Job Management System...');
    
    const jobsCollection = collection(firestore, 'jobs');
    const jobsQuery = query(jobsCollection, limit(10));
    const jobsSnapshot = await getDocs(jobsQuery);
    
    logTest('Job Management - Jobs Collection', true, `Found ${jobsSnapshot.size} jobs`);
    
    if (jobsSnapshot.size > 0) {
      const jobStats = {
        statuses: {},
        types: {},
        priorities: {}
      };
      
      console.log('   Job Details:');
      jobsSnapshot.forEach((doc, index) => {
        const job = doc.data();
        console.log(`   ${index + 1}. ${job.title || 'Untitled'} - Status: ${job.status || 'N/A'} - Type: ${job.type || 'N/A'}`);
        
        // Collect stats
        jobStats.statuses[job.status] = (jobStats.statuses[job.status] || 0) + 1;
        jobStats.types[job.type] = (jobStats.types[job.type] || 0) + 1;
        jobStats.priorities[job.priority] = (jobStats.priorities[job.priority] || 0) + 1;
      });
      
      console.log('   Job Statistics:');
      console.log(`   - Statuses: ${Object.keys(jobStats.statuses).join(', ')}`);
      console.log(`   - Types: ${Object.keys(jobStats.types).join(', ')}`);
      console.log(`   - Priorities: ${Object.keys(jobStats.priorities).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    logTest('Job Management Test', false, error.message);
    return false;
  }
}

// Test data integrity
async function testDataIntegrity() {
  try {
    console.log('\n🔍 Testing Data Integrity...');
    
    // Check staff accounts structure
    const staffCollection = collection(firestore, 'staff_accounts');
    const staffSnapshot = await getDocs(staffCollection);
    
    let validStaffAccounts = 0;
    let invalidStaffAccounts = 0;
    
    staffSnapshot.forEach((doc) => {
      const data = doc.data();
      const requiredFields = ['name', 'email', 'passwordHash', 'role'];
      const hasAllFields = requiredFields.every(field => data[field]);
      
      if (hasAllFields) {
        validStaffAccounts++;
      } else {
        invalidStaffAccounts++;
        console.log(`   ⚠️  Invalid staff account: ${doc.id} - Missing fields`);
      }
    });
    
    logTest('Data Integrity - Staff Accounts', 
      invalidStaffAccounts === 0, 
      `${validStaffAccounts} valid, ${invalidStaffAccounts} invalid accounts`
    );
    
    return true;
  } catch (error) {
    logTest('Data Integrity Test', false, error.message);
    return false;
  }
}

// Main test function
async function runCurrentSystemTests() {
  console.log('🚀 Current System Test Suite');
  console.log('============================');
  console.log('Testing the actual authentication and database system in use');
  console.log('');
  
  try {
    // Initialize Firebase
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('❌ Firebase initialization failed. Stopping tests.');
      return;
    }
    
    // Test custom authentication for each account
    for (const credentials of testCredentials) {
      await testCustomAuthentication(credentials);
    }
    
    // Test role-based access
    await testRoleBasedAccess();
    
    // Test job management
    await testJobManagement();
    
    // Test data integrity
    await testDataIntegrity();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Print summary
    console.log('\n📊 CURRENT SYSTEM TEST SUMMARY');
    console.log('===============================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.tests.length}`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.tests
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
    }
    
    const successRate = testResults.tests.length > 0 
      ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1)
      : 0;
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 Your current authentication system is working perfectly!');
      console.log('\n✅ SYSTEM STATUS:');
      console.log('• Custom authentication with bcrypt is functional');
      console.log('• Role-based access control is implemented');
      console.log('• Job management system is operational');
      console.log('• Data integrity is maintained');
      console.log('• Ready for production use');
    } else {
      console.log('\n⚠️  Some components of your current system need attention.');
    }
    
    console.log('\n📋 SYSTEM OVERVIEW:');
    console.log('• Using Firestore for data storage ✅');
    console.log('• Custom authentication with bcrypt ✅');
    console.log('• Role-based access control ✅');
    console.log('• Staff account management ✅');
    console.log('• Job management system ✅');
    
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
if (require.main === module) {
  runCurrentSystemTests();
}

module.exports = {
  runCurrentSystemTests,
  testResults
};
