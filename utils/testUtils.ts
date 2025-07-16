import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { authService } from '@/services/authService';

interface TestResults {
  userFoundById: boolean;
  userFoundByEmail: boolean;
  userData: any;
  allUsers: any[];
  errors: string[];
}

export async function testUserAuthentication(targetUserId: string, targetEmail: string): Promise<TestResults> {
  const results: TestResults = {
    userFoundById: false,
    userFoundByEmail: false,
    userData: null,
    allUsers: [],
    errors: [],
  };

  try {
    console.log(`🔍 Testing user authentication for ID: ${targetUserId}, Email: ${targetEmail}`);

    // Test 1: Find user by ID
    try {
      const userRef = doc(db, 'staff accounts', targetUserId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        results.userFoundById = true;
        results.userData = { id: userDoc.id, ...userDoc.data() };
        console.log('✅ User found by ID!', results.userData);
      } else {
        console.log('❌ User not found by ID');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Error finding user by ID: ${errorMessage}`);
      console.error('❌ Error finding user by ID:', error);
    }

    // Test 2: Find user by email
    try {
      const staffAccountsRef = collection(db, 'staff accounts');
      const emailQuery = query(staffAccountsRef, where('email', '==', targetEmail));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        results.userFoundByEmail = true;
        const foundUser = emailSnapshot.docs[0];
        if (!results.userData) {
          results.userData = { id: foundUser.id, ...foundUser.data() };
        }
        console.log('✅ User found by email!', results.userData);
      } else {
        console.log('❌ User not found by email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Error finding user by email: ${errorMessage}`);
      console.error('❌ Error finding user by email:', error);
    }

    // Test 3: List all users (for debugging)
    try {
      const staffAccountsRef = collection(db, 'staff accounts');
      const allStaffSnapshot = await getDocs(staffAccountsRef);

      if (!allStaffSnapshot.empty) {
        results.allUsers = allStaffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📋 Found ${results.allUsers.length} total staff accounts`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Error listing all users: ${errorMessage}`);
      console.error('❌ Error listing all users:', error);
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(`General error: ${errorMessage}`);
    console.error('❌ General error in user test:', error);
    return results;
  }
}

export async function testLogin(email: string, password: string) {
  try {
    console.log(`🔐 Testing login for email: ${email}`);
    const result = await authService.authenticateUser(email, password);
    
    if (result.success) {
      console.log('✅ Login successful!', result.user);
      return {
        success: true,
        user: result.user,
        // Fix: Use 'name' property instead of firstName/lastName
        message: `Successfully logged in as ${result.user?.name || result.user?.email}`
      };
    } else {
      console.log('❌ Login failed:', result.error);
      return {
        success: false,
        error: result.error,
        message: `Login failed: ${result.error}`
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Login test error:', error);
    return {
      success: false,
      error: errorMessage,
      message: `Login test error: ${errorMessage}`
    };
  }
}
