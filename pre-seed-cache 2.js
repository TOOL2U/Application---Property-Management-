/**
 * Pre-seed Mobile App Cache
 * Creates initial cache data so mobile app has staff profiles immediately
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Sample staff data that matches our Firestore structure
const sampleStaffProfiles = [
  {
    id: 'myo_001',
    name: 'Myo',
    email: 'myo@gmail.com',
    phone: '+66123456789',
    role: 'housekeeper',
    isActive: true,
    hasUserId: true
  },
  {
    id: 'admin_001', 
    name: 'Admin User',
    email: 'admin@siamoon.com',
    phone: '+66987654321',
    role: 'admin',
    isActive: true,
    hasUserId: true
  },
  {
    id: 'manager_001',
    name: 'Manager User', 
    email: 'manager@siamoon.com',
    phone: '+66555666777',
    role: 'manager',
    isActive: true,
    hasUserId: true
  },
  {
    id: 'alan_001',
    name: 'Alan Ducker',
    email: 'alan@example.com', 
    phone: '+66444555666',
    role: 'maintenance',
    isActive: true,
    hasUserId: true
  },
  {
    id: 'cleaner_001',
    name: 'Cleaner',
    email: 'cleaner@siamoon.com',
    phone: '+66333444555', 
    role: 'cleaner',
    isActive: true,
    hasUserId: true
  }
];

async function preSeedCache() {
  console.log('🌱 Pre-seeding mobile app cache with staff profiles...');
  
  try {
    // Create cache data structure
    const cacheData = {
      profiles: sampleStaffProfiles,
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    
    // Store in AsyncStorage (same key as staffSyncService uses)
    await AsyncStorage.setItem(
      'staff_profiles_cache',
      JSON.stringify(cacheData)
    );
    
    console.log(`✅ Pre-seeded cache with ${sampleStaffProfiles.length} staff profiles`);
    console.log('📱 Mobile app will now show profiles immediately on first load');
    
    // Display seeded profiles
    console.log('\n👥 Seeded Profiles:');
    sampleStaffProfiles.forEach(profile => {
      console.log(`   • ${profile.name} (${profile.role}) - ${profile.email}`);
    });
    
    console.log('\n🔐 All profiles can login with password: StaffTest123!');
    
  } catch (error) {
    console.error('❌ Failed to pre-seed cache:', error);
  }
}

// Export for use in React Native environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { preSeedCache, sampleStaffProfiles };
}

// Run if called directly
if (require.main === module) {
  preSeedCache();
}
