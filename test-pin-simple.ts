/**
 * Simple PIN Screen Functionality Test
 * Tests the core PIN authentication flow
 */

import { staffSyncService } from './services/staffSyncService';
import { localStaffService } from './services/localStaffService';

async function testPINScreenFunctionality() {
  console.log('🧪 Testing PIN Screen Functionality...\n');
  
  try {
    // Test 1: Get staff profiles from sync service
    console.log('📋 1. Testing Staff Profile Sync...');
    const syncResponse = await staffSyncService.fetchStaffProfiles(false);
    console.log(`   ✅ Sync result: ${syncResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   📊 Profiles found: ${syncResponse.profiles.length}`);
    
    if (syncResponse.profiles.length > 0) {
      const profile = syncResponse.profiles[0];
      console.log(`   👤 Sample profile: ${profile.name} (${profile.role})`);
      
      // Test 2: PIN operations
      console.log('\n🔐 2. Testing PIN Operations...');
      const testPin = '1234';
      
      // Set PIN
      const pinSetSuccess = await localStaffService.setStaffPIN(profile.id, testPin);
      console.log(`   ✅ Set PIN: ${pinSetSuccess ? 'SUCCESS' : 'FAILED'}`);
      
      // Verify PIN
      const validPinCheck = await localStaffService.verifyStaffPIN(profile.id, testPin);
      console.log(`   ✅ Verify correct PIN: ${validPinCheck ? 'SUCCESS' : 'FAILED'}`);
      
      // Test wrong PIN
      const invalidPinCheck = await localStaffService.verifyStaffPIN(profile.id, '9999');
      console.log(`   ✅ Verify wrong PIN: ${!invalidPinCheck ? 'SUCCESS (correctly rejected)' : 'FAILED'}`);
      
      // Check PIN existence
      const hasPinCheck = await localStaffService.hasPIN(profile.id);
      console.log(`   ✅ Has PIN check: ${hasPinCheck ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Session management
      console.log('\n📱 3. Testing Session Management...');
      
      // Create session
      const session = await localStaffService.createSession(profile.id);
      console.log(`   ✅ Create session: ${session ? 'SUCCESS' : 'FAILED'}`);
      if (session) {
        console.log(`   📅 Session expires: ${session.expiresAt.toLocaleString()}`);
      }
      
      // Get current session
      const currentSession = await localStaffService.getCurrentSession();
      console.log(`   ✅ Get current session: ${currentSession ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Complete authentication flow
      console.log('\n🔄 4. Testing Complete Authentication Flow...');
      
      const authResult = await testAuthFlow(profile.id, testPin);
      console.log(`   ✅ Authentication flow: ${authResult.success ? 'SUCCESS' : 'FAILED'}`);
      if (!authResult.success) {
        console.log(`   ❌ Error: ${authResult.error}`);
      }
      
      // Test 5: Cleanup
      console.log('\n🧹 5. Cleanup...');
      
      // Clear session
      await localStaffService.clearSession();
      const clearedSession = await localStaffService.getCurrentSession();
      console.log(`   ✅ Clear session: ${!clearedSession ? 'SUCCESS' : 'FAILED'}`);
      
      // Remove test PIN
      const pinRemoved = await localStaffService.removePIN(profile.id);
      console.log(`   ✅ Remove PIN: ${pinRemoved ? 'SUCCESS' : 'FAILED'}`);
      
    } else {
      console.log('   ⚠️ No staff profiles found - cannot test PIN functionality');
      console.log('   💡 Make sure staff profiles are synced from Firestore');
    }
    
    console.log('\n🎉 PIN screen functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test the complete authentication flow
async function testAuthFlow(profileId: string, pin: string) {
  try {
    // Step 1: Check profile exists
    const profile = await localStaffService.getStaffProfile(profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Step 2: Verify PIN
    const isPinValid = await localStaffService.verifyStaffPIN(profileId, pin);
    if (!isPinValid) {
      return { success: false, error: 'Invalid PIN' };
    }

    // Step 3: Create session
    const session = await localStaffService.createSession(profileId);
    if (!session) {
      return { success: false, error: 'Failed to create session' };
    }

    return { 
      success: true, 
      profile,
      session,
      message: 'Authentication successful' 
    };

  } catch (error) {
    return { 
      success: false, 
      error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Component validation tests
export const validatePINScreenComponents = {
  // Validate PIN input
  validatePIN: (pin: string) => {
    const isValidLength = pin.length === 4;
    const isNumeric = /^\d{4}$/.test(pin);
    const isNotSequential = !['1234', '0123', '2345', '3456', '4567', '5678', '6789', '7890'].includes(pin);
    const isNotRepeating = !['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(pin);
    
    return {
      isValid: isValidLength && isNumeric,
      isSecure: isValidLength && isNumeric && isNotSequential && isNotRepeating,
      errors: [
        ...(isValidLength ? [] : ['PIN must be exactly 4 digits']),
        ...(isNumeric ? [] : ['PIN must contain only numbers']),
        ...(isNotSequential ? [] : ['PIN should not be sequential']),
        ...(isNotRepeating ? [] : ['PIN should not be repeating digits']),
      ]
    };
  },

  // Validate profile data
  validateProfile: (profile: any) => {
    const requiredFields = ['id', 'name', 'role', 'isActive'];
    const missingFields = requiredFields.filter(field => !profile || !profile.hasOwnProperty(field));
    
    return {
      isValid: missingFields.length === 0 && profile?.isActive,
      missingFields,
      warnings: [
        ...(!profile?.avatar ? ['No avatar provided'] : []),
        ...(!profile?.department ? ['No department specified'] : []),
        ...(!profile?.phone ? ['No phone number'] : []),
      ]
    };
  }
};

// Run the test
testPINScreenFunctionality();
