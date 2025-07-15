/**
 * Authentication System Test Script
 * 
 * This script tests the new staff_accounts authentication system
 * to ensure everything is working correctly.
 * 
 * Usage: node scripts/test-auth-system.js
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  connectFirestoreEmulator
} = require('firebase/firestore');
const bcrypt = require('bcryptjs');

// Firebase configuration - using your actual project
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

// Use production Firestore (where your user exists)
console.log('🔥 Using production Firestore database');

// Uncomment below to use emulator instead:
// try {
//   connectFirestoreEmulator(db, '127.0.0.1', 8080);
//   console.log('🔧 Connected to Firestore emulator');
// } catch (error) {
//   console.log('ℹ️ Using production Firestore');
// }

// Create our own auth service for testing
const authService = {
  async authenticateUser(email, password) {
    try {
      console.log('🔐 Testing authentication for:', email);

      // Query Firestore for active staff account
      const staffAccountsRef = collection(db, 'staff_accounts');
      const q = query(
        staffAccountsRef,
        where('email', '==', email.toLowerCase().trim()),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ No active account found for:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify password using bcrypt
      const passwordHash = userData.passwordHash;
      if (!passwordHash) {
        console.error('❌ No password hash found for user:', email);
        return {
          success: false,
          error: 'Account configuration error. Please contact support.'
        };
      }

      const passwordMatch = await bcrypt.compare(password, passwordHash);
      if (!passwordMatch) {
        console.log('❌ Invalid password for user:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Create authenticated user object
      const authenticatedUser = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

      console.log('✅ Authentication successful for:', email);
      console.log('👤 User role:', authenticatedUser.role);

      return {
        success: true,
        user: authenticatedUser
      };

    } catch (error) {
      console.error('❌ Authentication error:', error);

      let errorMessage = 'Authentication failed';

      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'Access denied. Contact your administrator.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  async getUserByEmail(email) {
    try {
      const staffAccountsRef = collection(db, 'staff_accounts');
      const q = query(
        staffAccountsRef,
        where('email', '==', email.toLowerCase().trim())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

    } catch (error) {
      console.error('❌ Get user by email error:', error);
      return null;
    }
  },

  async checkConnection() {
    try {
      const testRef = collection(db, 'staff_accounts');
      const testQuery = query(testRef, where('isActive', '==', true));
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      return false;
    }
  }
};

// Test credentials - using the actual user you mentioned
const testCredentials = [
  {
    email: 'admin@siamoon.com',
    password: 'admin123',
    expectedRole: 'admin',
    description: 'Existing admin user (from your Firestore)'
  },
  {
    email: 'admin@siamoon.com',
    password: 'password123',
    expectedRole: 'admin',
    description: 'Existing admin user with alternative password'
  },
  {
    email: 'shaun@siamoon.com',
    password: 'admin123',
    expectedRole: 'admin',
    description: 'Test admin user'
  },
  {
    email: 'test@exam.com',
    password: 'password123',
    expectedRole: 'staff',
    description: 'Test user'
  },
  {
    email: 'nonexistent@example.com',
    password: 'wrongpassword',
    expectedRole: null,
    description: 'Non-existent user (should fail)'
  },
  {
    email: 'admin@siamoon.com',
    password: 'wrongpassword',
    expectedRole: null,
    description: 'Valid email, wrong password (should fail)'
  }
];

// Test authentication
async function testAuthentication(credentials) {
  console.log(`\n🧪 Testing: ${credentials.description}`);
  console.log(`   Email: ${credentials.email}`);
  console.log(`   Password: ${credentials.password}`);
  
  try {
    const result = await authService.authenticateUser(credentials.email, credentials.password);
    
    if (result.success) {
      console.log(`   ✅ Authentication successful`);
      console.log(`   👤 User: ${result.user.name}`);
      console.log(`   🎭 Role: ${result.user.role}`);
      console.log(`   📧 Email: ${result.user.email}`);
      console.log(`   📱 Phone: ${result.user.phone || 'Not provided'}`);
      console.log(`   🏠 Address: ${result.user.address || 'Not provided'}`);
      console.log(`   🏢 Department: ${result.user.department || 'Not provided'}`);
      console.log(`   ✅ Active: ${result.user.isActive}`);
      
      if (credentials.expectedRole && result.user.role !== credentials.expectedRole) {
        console.log(`   ⚠️ Role mismatch: expected ${credentials.expectedRole}, got ${result.user.role}`);
        return false;
      }
      
      return true;
    } else {
      console.log(`   ❌ Authentication failed: ${result.error}`);
      
      if (credentials.expectedRole === null) {
        console.log(`   ✅ Expected failure - test passed`);
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Test error: ${error.message}`);
    return false;
  }
}

// Test connection
async function testConnection() {
  console.log('🔗 Testing Firebase connection...');
  
  try {
    const isConnected = await authService.checkConnection();
    if (isConnected) {
      console.log('✅ Firebase connection successful');
      return true;
    } else {
      console.log('❌ Firebase connection failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Connection test error: ${error.message}`);
    return false;
  }
}

// Test user lookup
async function testUserLookup() {
  console.log('\n👤 Testing user lookup by email...');
  
  const testEmail = 'admin@siamoon.com';
  
  try {
    const user = await authService.getUserByEmail(testEmail);
    
    if (user) {
      console.log(`✅ User found: ${user.name} (${user.role})`);
      return true;
    } else {
      console.log(`❌ User not found: ${testEmail}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ User lookup error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Authentication System Tests\n');
  console.log('=' .repeat(50));
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test connection
  totalTests++;
  if (await testConnection()) {
    passedTests++;
  }
  
  // Test user lookup
  totalTests++;
  if (await testUserLookup()) {
    passedTests++;
  }
  
  // Test authentication with various credentials
  for (const credentials of testCredentials) {
    totalTests++;
    if (await testAuthentication(credentials)) {
      passedTests++;
    }
  }
  
  // Results
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test Results');
  console.log(`📊 Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed! Authentication system is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the configuration and try again.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('2. Test the authentication in your application');
  console.log('3. Create additional users as needed');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
});
