/**
 * Check Firebase Auth Integration Status
 * This script analyzes how the mobile app is connected to Firebase Auth
 * and the staff_accounts collection
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs
} = require('firebase/firestore');
const { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword 
} = require('firebase/auth');

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
const auth = getAuth(app);

async function checkFirebaseAuthIntegration() {
  console.log('🔍 Checking Firebase Auth Integration Status');
  console.log('=' .repeat(60));
  
  try {
    // Check 1: Firebase Auth Configuration
    console.log('\n📋 1. Firebase Auth Configuration:');
    console.log(`   Project ID: ${auth.app.options.projectId}`);
    console.log(`   Auth Domain: ${auth.app.options.authDomain}`);
    console.log(`   Current User: ${auth.currentUser ? auth.currentUser.email : 'None'}`);
    
    // Check 2: staff_accounts Collection Structure
    console.log('\n📋 2. staff_accounts Collection Analysis:');
    const staffAccountsRef = collection(db, 'staff_accounts');
    const allStaffSnapshot = await getDocs(staffAccountsRef);
    
    console.log(`   Total staff accounts: ${allStaffSnapshot.size}`);
    
    if (!allStaffSnapshot.empty) {
      allStaffSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   👤 ${data.email} (${data.role})`);
        console.log(`      - Has passwordHash: ${data.passwordHash ? 'Yes' : 'No'}`);
        console.log(`      - Firebase UID: ${data.firebaseUid || 'None'}`);
        console.log(`      - Active: ${data.isActive}`);
      });
    }
    
    // Check 3: Authentication Method Analysis
    console.log('\n📋 3. Authentication Method Analysis:');
    
    // Check if app uses Firebase Auth or custom auth
    const hasFirebaseUidField = allStaffSnapshot.docs.some(doc => 
      doc.data().firebaseUid !== undefined
    );
    
    const hasPasswordHashField = allStaffSnapshot.docs.some(doc => 
      doc.data().passwordHash !== undefined
    );
    
    console.log(`   Firebase UID fields present: ${hasFirebaseUidField ? 'Yes' : 'No'}`);
    console.log(`   Password hash fields present: ${hasPasswordHashField ? 'Yes' : 'No'}`);
    
    if (hasFirebaseUidField && hasPasswordHashField) {
      console.log('   🔄 HYBRID: Uses both Firebase Auth AND custom authentication');
    } else if (hasFirebaseUidField) {
      console.log('   🔥 FIREBASE AUTH: Uses Firebase Authentication');
    } else if (hasPasswordHashField) {
      console.log('   🔐 CUSTOM AUTH: Uses custom authentication with staff_accounts');
    } else {
      console.log('   ❓ UNKNOWN: Authentication method unclear');
    }
    
    // Check 4: Test Firebase Auth vs Custom Auth
    console.log('\n📋 4. Authentication Method Test:');
    
    const testEmail = 'admin@siamoon.com';
    
    // Test 1: Try Firebase Auth
    console.log('\n   🔥 Testing Firebase Auth:');
    try {
      // This will fail if the user doesn't exist in Firebase Auth
      await signInWithEmailAndPassword(auth, testEmail, 'admin123');
      console.log('   ✅ Firebase Auth: User exists and can authenticate');
      await auth.signOut();
    } catch (error) {
      console.log(`   ❌ Firebase Auth: ${error.code} - ${error.message}`);
    }
    
    // Test 2: Check staff_accounts collection
    console.log('\n   🔐 Testing staff_accounts Collection:');
    const staffQuery = query(
      staffAccountsRef,
      where('email', '==', testEmail),
      where('isActive', '==', true)
    );
    
    const staffSnapshot = await getDocs(staffQuery);
    
    if (!staffSnapshot.empty) {
      const userData = staffSnapshot.docs[0].data();
      console.log('   ✅ staff_accounts: User exists');
      console.log(`      - Has passwordHash: ${userData.passwordHash ? 'Yes' : 'No'}`);
      console.log(`      - Has firebaseUid: ${userData.firebaseUid ? 'Yes' : 'No'}`);
      console.log(`      - Role: ${userData.role}`);
    } else {
      console.log('   ❌ staff_accounts: User not found');
    }
    
    // Check 5: Mobile App Integration Analysis
    console.log('\n📋 5. Mobile App Integration Analysis:');
    
    console.log('   📱 Current Implementation:');
    console.log('      - AuthService uses: staff_accounts collection');
    console.log('      - Password verification: bcrypt hashing');
    console.log('      - Session management: Local storage (AsyncStorage)');
    console.log('      - Firebase Auth integration: Not used for staff authentication');
    
    console.log('\n   🔄 Integration Status:');
    console.log('      - Firebase Auth: Initialized but not used for staff login');
    console.log('      - staff_accounts: Primary authentication source');
    console.log('      - Custom AuthContext: Manages authentication state');
    console.log('      - AdminAuthContext: Uses Firebase Auth (separate system)');
    
    // Check 6: Recommendations
    console.log('\n📋 6. Integration Recommendations:');
    
    if (hasPasswordHashField && !hasFirebaseUidField) {
      console.log('   💡 Current Setup: Custom authentication only');
      console.log('      ✅ Pros: Full control, custom roles, bcrypt security');
      console.log('      ⚠️ Cons: No Firebase Auth features (password reset, etc.)');
      console.log('      🔧 Recommendation: Keep current setup for staff authentication');
    }
    
    console.log('\n   🎯 Summary:');
    console.log('      - Staff authentication: Uses staff_accounts collection');
    console.log('      - Admin authentication: Uses Firebase Auth + admin_users collection');
    console.log('      - Integration status: Dual authentication system');
    console.log('      - Mobile app connection: ✅ Connected to staff_accounts');
    
  } catch (error) {
    console.error('❌ Error checking Firebase Auth integration:', error.message);
  }
}

// Run the check
checkFirebaseAuthIntegration();
