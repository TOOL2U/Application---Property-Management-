/**
 * Test Mobile App Loading
 * Simulate the exact mobile app loading process to identify issues
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
 * Simulate the exact staffSyncService.fetchStaffProfiles() method
 */
async function simulateStaffSyncService() {
  console.log('🔍 SIMULATING MOBILE APP staffSyncService.fetchStaffProfiles()');
  console.log('=' .repeat(80));
  
  try {
    console.log('👥 StaffSyncService: Fetching staff accounts from Firestore...');
    
    // Check if Firebase is ready
    if (!db) {
      console.error('❌ Firebase Firestore is not initialized');
      return { success: false, profiles: [], fromCache: false };
    }
    
    // Fetch from Firestore staff_accounts collection (exact mobile app logic)
    const staffRef = collection(db, 'staff_accounts');
    const querySnapshot = await getDocs(staffRef);
    const profiles = [];

    console.log(`📊 Raw documents fetched: ${querySnapshot.size}`);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      console.log(`\n📄 Processing document: ${doc.id}`);
      console.log(`   Raw data keys: ${Object.keys(data).join(', ')}`);
      
      // Filter for active accounts - handle both 'status: active' and 'isActive: true'
      const isActive = data.status === 'active' || data.isActive === true;
      console.log(`   Status: ${data.status}, isActive: ${data.isActive}, computed isActive: ${isActive}`);
      
      if (isActive) {
        const profile = mapStaffAccountToStaffProfile(doc.id, data);
        if (profile) {
          profiles.push(profile);
          console.log(`   ✅ ADDED to profiles: ${profile.name} (${profile.role})`);
        } else {
          console.log(`   ❌ FAILED to map profile`);
        }
      } else {
        console.log(`   ❌ EXCLUDED (not active)`);
      }
    });

    console.log(`\n✅ StaffSyncService: Fetched ${profiles.length} staff accounts from Firestore`);
    
    return {
      success: true,
      profiles,
      fromCache: false,
    };
    
  } catch (error) {
    console.error('❌ StaffSyncService error:', error);
    return { success: false, profiles: [], fromCache: false };
  }
}

/**
 * Simulate the exact mapStaffAccountToStaffProfile method
 */
function mapStaffAccountToStaffProfile(id, data) {
  try {
    console.log(`     🔄 Mapping profile for ${id}:`);
    
    const profile = {
      id: id,
      name: data.displayName || data.name || data.fullName || 'Unknown Staff',
      email: data.email || '',
      role: mapRole(data.role || data.accountType || data.userRole || 'staff'),
      isActive: data.status === 'active' || data.isActive === true,
      department: data.department || data.division || 'General',
      phone: data.phoneNumber || data.phone || '',
      avatar: data.photoURL || data.avatar || data.profileImage || data.photo,
      createdAt: data.createdAt?.toDate?.() || data.dateCreated?.toDate?.() || new Date(),
      lastLogin: data.lastLoginAt?.toDate?.() || data.lastLogin?.toDate?.(),
    };
    
    console.log(`     📋 Mapped: ${profile.name} (${profile.email}) - ${profile.role} - Active: ${profile.isActive}`);
    return profile;
  } catch (error) {
    console.error(`     ❌ Error mapping profile ${id}:`, error);
    return null;
  }
}

/**
 * Role mapping function (same as mobile app)
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
 * Simulate PINAuthContext loadStaffProfiles
 */
async function simulatePINAuthContext() {
  console.log('\n🔍 SIMULATING PINAuthContext.loadStaffProfiles()');
  console.log('=' .repeat(80));
  
  try {
    // Get staff profiles exclusively from staff_accounts collection in Firestore
    const syncResponse = await simulateStaffSyncService();

    console.log(`\n📋 PINAuth: Sync response:`, {
      success: syncResponse.success,
      profileCount: syncResponse.profiles.length,
      fromCache: syncResponse.fromCache
    });

    if (syncResponse.success && syncResponse.profiles.length > 0) {
      console.log(`✅ PINAuth: Would set ${syncResponse.profiles.length} staff profiles`);
      console.log('📱 Profiles that would appear in select-profile screen:');
      
      syncResponse.profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.name} (${profile.email}) - ${profile.role}`);
      });
      
      return syncResponse.profiles;
    } else {
      console.log('❌ PINAuth: No profiles would be set');
      if (syncResponse.success && syncResponse.profiles.length === 0) {
        console.log('⚠️ PINAuth: No active staff accounts found in staff_accounts collection');
        console.log('🔧 Error would be set: "No staff accounts available. Please contact your administrator."');
      } else {
        console.log('⚠️ PINAuth: Failed to sync staff accounts from Firestore');
        console.log('🔧 Error would be set: "Unable to load staff accounts. Please check your connection and try again."');
      }
      return [];
    }
  } catch (error) {
    console.error('❌ PINAuth: Exception in loadStaffProfiles:', error);
    console.log('🔧 Error would be set: "Unable to connect to staff account system. Please check your connection and try again."');
    return [];
  }
}

/**
 * Test cache clearing
 */
async function testCacheClearing() {
  console.log('\n🔍 TESTING CACHE CLEARING');
  console.log('=' .repeat(80));
  
  // Note: We can't actually clear the mobile app cache from here,
  // but we can test if cache might be interfering
  console.log('📱 Mobile app cache considerations:');
  console.log('   - AsyncStorage key: @synced_staff_profiles');
  console.log('   - Cache duration: 10 minutes');
  console.log('   - If cache exists and is fresh, Firestore won\'t be queried');
  console.log('');
  console.log('🔧 To clear cache in mobile app:');
  console.log('   1. Force refresh in profile selection screen');
  console.log('   2. Or wait 10 minutes for cache to expire');
  console.log('   3. Or clear app data/storage');
}

/**
 * Main test function
 */
async function testMobileAppLoading() {
  console.log('🧪 MOBILE APP LOADING DIAGNOSTIC');
  console.log('Testing why profiles are not visible in select-profile screen');
  console.log('=' .repeat(80));
  
  // Test 1: Simulate staffSyncService
  const profiles = await simulatePINAuthContext();
  
  // Test 2: Cache considerations
  await testCacheClearing();
  
  // Final diagnosis
  console.log('\n🎯 DIAGNOSIS:');
  console.log('=' .repeat(80));
  
  if (profiles.length === 13) {
    console.log('✅ Backend logic is working correctly');
    console.log('✅ All 13 profiles should be loaded');
    console.log('');
    console.log('🔍 Possible issues:');
    console.log('   1. 📱 Mobile app cache is stale');
    console.log('   2. 🔄 React state not updating properly');
    console.log('   3. 🎨 UI rendering issue');
    console.log('   4. ⚡ Firebase connection issue in mobile app');
    console.log('');
    console.log('🔧 Recommended fixes:');
    console.log('   1. Add console.log in PINAuthContext.loadStaffProfiles()');
    console.log('   2. Force refresh profiles in mobile app');
    console.log('   3. Check browser console for errors');
    console.log('   4. Clear mobile app cache/storage');
  } else {
    console.log('❌ Backend logic has issues');
    console.log(`❌ Only ${profiles.length}/13 profiles loaded`);
  }
}

// Run the test
testMobileAppLoading();
