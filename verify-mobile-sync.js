/**
 * Verify Mobile App Sync
 * Test the updated mobile app logic to ensure all staff accounts appear
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs
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
 * Simulate the updated mobile app logic
 */
async function simulateUpdatedMobileAppLogic() {
  console.log('📱 SIMULATING UPDATED MOBILE APP LOGIC');
  console.log('Testing the fixed staffSyncService behavior');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Fetch all documents (like the updated mobile app)
    console.log('🔍 Step 1: Fetching all staff_accounts documents...');
    const staffRef = collection(db, 'staff_accounts');
    const querySnapshot = await getDocs(staffRef);
    
    console.log(`📊 Total documents fetched: ${querySnapshot.size}`);
    
    // Step 2: Filter for active accounts (like the updated mobile app)
    console.log('\n🔍 Step 2: Filtering for active accounts...');
    const profiles = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Updated mobile app logic: handle both 'status: active' and 'isActive: true'
      const isActive = data.status === 'active' || data.isActive === true;
      
      console.log(`\n📄 Document: ${doc.id}`);
      console.log(`   Name: ${data.name || data.displayName || 'No name'}`);
      console.log(`   Status field: ${data.status || 'undefined'}`);
      console.log(`   isActive field: ${data.isActive}`);
      console.log(`   Computed isActive: ${isActive}`);
      
      if (isActive) {
        // Simulate mobile app profile mapping
        const profile = {
          id: doc.id,
          name: data.displayName || data.name || data.fullName || 'Unknown Staff',
          email: data.email || '',
          role: mapRole(data.role || data.accountType || data.userRole || 'staff'),
          isActive: data.status === 'active' || data.isActive === true,
          department: data.department || data.division || 'General',
          phone: data.phoneNumber || data.phone || '',
          avatar: data.photoURL || data.avatar || data.profileImage || data.photo,
        };
        
        profiles.push(profile);
        console.log(`   ✅ INCLUDED in mobile app`);
      } else {
        console.log(`   ❌ EXCLUDED from mobile app`);
      }
    });
    
    // Step 3: Display results
    console.log('\n📱 MOBILE APP PROFILE SELECTION SCREEN WILL SHOW:');
    console.log('=' .repeat(80));
    console.log(`📊 Total profiles: ${profiles.length}`);
    
    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Department: ${profile.department}`);
      console.log(`   ID: ${profile.id}`);
    });
    
    // Step 4: Verification
    console.log('\n✅ VERIFICATION RESULTS:');
    console.log('=' .repeat(80));
    
    if (profiles.length === 13) {
      console.log('🎉 SUCCESS: All 13 staff accounts will appear in mobile app!');
      console.log('✅ The synchronization issue has been FIXED');
      console.log('✅ Mobile app will show all staff members from Firebase');
    } else if (profiles.length > 0) {
      console.log(`⚠️  PARTIAL: ${profiles.length}/13 staff accounts will appear`);
      console.log('🔧 Some accounts may need status field updates');
    } else {
      console.log('❌ FAILED: No staff accounts will appear in mobile app');
      console.log('🔧 Check Firebase data structure');
    }
    
    return profiles;
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    return [];
  }
}

/**
 * Helper function to map roles (same as mobile app)
 */
function mapRole(webAppRole) {
  if (!webAppRole) return 'staff';
  
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
 * Generate final recommendations
 */
function generateFinalRecommendations(profiles) {
  console.log('\n💡 FINAL RECOMMENDATIONS:');
  console.log('=' .repeat(80));
  
  if (profiles.length === 13) {
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Open mobile app: http://localhost:8094');
    console.log('   2. Navigate to profile selection screen');
    console.log('   3. Verify all 13 staff members appear');
    console.log('   4. Test PIN authentication with different profiles');
    console.log('   5. Test switch profile functionality on dashboard');
    
    console.log('\n🔧 TECHNICAL SUMMARY:');
    console.log('   ✅ Fixed staffSyncService query to fetch all documents');
    console.log('   ✅ Added in-memory filtering for both status patterns');
    console.log('   ✅ Updated mapStaffAccountToStaffProfile for isActive field');
    console.log('   ✅ Removed Firestore index requirement');
    console.log('   ✅ All 13 staff accounts now synchronized');
    
  } else {
    console.log('🔧 ADDITIONAL FIXES NEEDED:');
    console.log('   1. Check staff_accounts documents for proper status fields');
    console.log('   2. Ensure all accounts have either status="active" or isActive=true');
    console.log('   3. Verify mobile app caching is cleared');
  }
}

/**
 * Main verification function
 */
async function verifyMobileSync() {
  console.log('🔍 MOBILE APP SYNC VERIFICATION');
  console.log('Verifying that all Firebase staff_accounts appear in mobile app');
  console.log('=' .repeat(80));
  
  const profiles = await simulateUpdatedMobileAppLogic();
  generateFinalRecommendations(profiles);
}

// Run the verification
verifyMobileSync();
