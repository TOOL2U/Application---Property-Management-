/**
 * Initialize Firebase UID Mappings
 * 
 * This script manually initializes the Firebase UID mappings in AsyncStorage
 * so the mobile app can properly find jobs for staff members.
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

const FIREBASE_MAPPING_KEY = 'staff_firebase_mapping';

async function initializeFirebaseUidMappings() {
  try {
    console.log('🔧 Initializing Firebase UID mappings...');
    
    const mappings = [
      {
        staffId: 'IDJrsXWiL2dCHVpveH97',
        firebaseUid: 'gTtR5gSKOtUEweLwchSnVreylMy1',
        email: 'staff@siamoon.com',
        lastMapped: new Date().toISOString()
      },
      {
        staffId: 'staff@siamoon.com',
        firebaseUid: 'gTtR5gSKOtUEweLwchSnVreylMy1',
        email: 'staff@siamoon.com',
        lastMapped: new Date().toISOString()
      }
    ];
    
    // Save mappings to AsyncStorage
    await AsyncStorage.setItem(FIREBASE_MAPPING_KEY, JSON.stringify(mappings));
    
    console.log('✅ Firebase UID mappings saved:');
    mappings.forEach(mapping => {
      console.log(`  📍 ${mapping.staffId} → ${mapping.firebaseUid} (${mapping.email})`);
    });
    
    // Verify the mappings were saved
    const saved = await AsyncStorage.getItem(FIREBASE_MAPPING_KEY);
    const parsed = JSON.parse(saved);
    
    console.log('\n🔍 Verification - Saved mappings:');
    console.log(`📊 Total mappings: ${parsed.length}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase UID mappings:', error);
    return false;
  }
}

// Run the initialization
initializeFirebaseUidMappings()
  .then(success => {
    if (success) {
      console.log('\n🎉 Firebase UID mappings initialized successfully!');
      console.log('📱 The mobile app should now be able to find jobs for staff IDJrsXWiL2dCHVpveH97');
      console.log('🔄 Restart the mobile app to pick up the new mappings.');
    }
  })
  .catch(console.error);
