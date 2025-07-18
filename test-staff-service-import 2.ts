/**
 * Test Staff Sync Service Import
 * Quick test to verify the service can be imported and used
 */

import { staffSyncService, getStaffSyncService } from './services/staffSyncService';

async function testStaffSyncServiceImport() {
  console.log('🧪 Testing StaffSyncService Import and Basic Functionality\n');

  try {
    // Test 1: Check if service is imported
    console.log('1️⃣ Testing basic import...');
    console.log('   staffSyncService exists:', !!staffSyncService);
    console.log('   fetchStaffProfiles method exists:', !!(staffSyncService && typeof staffSyncService.fetchStaffProfiles === 'function'));

    // Test 2: Check fallback getter
    console.log('\n2️⃣ Testing fallback getter...');
    const serviceFromGetter = getStaffSyncService();
    console.log('   getStaffSyncService() works:', !!serviceFromGetter);
    console.log('   Getter has fetchStaffProfiles:', !!(serviceFromGetter && typeof serviceFromGetter.fetchStaffProfiles === 'function'));

    // Test 3: Try to call the method (will fail gracefully if Firebase not ready)
    console.log('\n3️⃣ Testing method call...');
    
    if (staffSyncService && staffSyncService.fetchStaffProfiles) {
      console.log('   Attempting to call fetchStaffProfiles...');
      
      try {
        const result = await staffSyncService.fetchStaffProfiles();
        console.log('   ✅ Method call successful!');
        console.log('   Result:', {
          success: result.success,
          profileCount: result.profiles.length,
          fromCache: result.fromCache,
          hasError: !!result.error
        });

        if (result.profiles.length > 0) {
          console.log('   📋 Sample profile:', {
            id: result.profiles[0].id,
            name: result.profiles[0].name,
            role: result.profiles[0].role,
            hasUserId: !!result.profiles[0].userId
          });
        }

      } catch (methodError) {
        const errorMsg = methodError instanceof Error ? methodError.message : 'Unknown error';
        console.log('   ⚠️ Method call failed (expected if Firebase not ready):', errorMsg);
      }
    } else {
      console.log('   ❌ staffSyncService or fetchStaffProfiles not available');
    }

    console.log('\n🎯 IMPORT TEST SUMMARY:');
    console.log(`   Service Import: ${!!staffSyncService ? '✅' : '❌'}`);
    console.log(`   Method Available: ${!!(staffSyncService && staffSyncService.fetchStaffProfiles) ? '✅' : '❌'}`);
    console.log(`   Fallback Getter: ${!!getStaffSyncService() ? '✅' : '❌'}`);
    
    if (staffSyncService && typeof staffSyncService.fetchStaffProfiles === 'function') {
      console.log('\n✅ Staff Sync Service is properly imported and ready to use!');
      console.log('The mobile app should be able to load staff profiles now.');
    } else {
      console.log('\n❌ Staff Sync Service import failed - mobile app will show the undefined error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStaffSyncServiceImport();
