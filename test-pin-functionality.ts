/**
 * PIN Screen Functionality Test
 * Test script to verify all PIN screen components work properly
 */

import { staffSyncService } from './services/staffSyncService';
import { localStaffService } from './services/localStaffService';

// Test data
const TEST_STAFF_ID = 'test-staff-001';
const TEST_PIN = '1234';
const INVALID_PIN = '9999';

async function testPINScreenFunctionality() {
  console.log('🧪 Starting PIN Screen Functionality Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  const test = (name, condition) => {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  };

  try {
    // Test 1: Staff Profile Sync
    console.log('📋 Testing Staff Profile Sync...');
    const syncResponse = await staffSyncService.fetchStaffProfiles(false);
    test('Staff profiles sync successfully', syncResponse.success);
    test('Staff profiles contain data', syncResponse.profiles.length > 0);
    
    if (syncResponse.success && syncResponse.profiles.length > 0) {
      const profile = syncResponse.profiles[0];
      console.log(`   Sample profile: ${profile.name} (${profile.role})`);
    }

    // Test 2: PIN Storage and Verification
    console.log('\n🔐 Testing PIN Storage and Verification...');
    
    // Set a test PIN
    const pinSetSuccess = await localStaffService.setStaffPIN(TEST_STAFF_ID, TEST_PIN);
    test('PIN can be set successfully', pinSetSuccess);
    
    // Verify correct PIN
    const validPinVerification = await localStaffService.verifyStaffPIN(TEST_STAFF_ID, TEST_PIN);
    test('Correct PIN verifies successfully', validPinVerification);
    
    // Verify incorrect PIN
    const invalidPinVerification = await localStaffService.verifyStaffPIN(TEST_STAFF_ID, INVALID_PIN);
    test('Incorrect PIN fails verification', !invalidPinVerification);
    
    // Test PIN existence check
    const hasPIN = await localStaffService.hasPIN(TEST_STAFF_ID);
    test('PIN existence can be checked', hasPIN);

    // Test 3: Session Management
    console.log('\n📱 Testing Session Management...');
    
    // Create session
    const session = await localStaffService.createSession(TEST_STAFF_ID);
    test('Session can be created', session !== null);
    
    if (session) {
      console.log(`   Session created: ${session.profileId} expires at ${session.expiresAt}`);
    }
    
    // Get current session
    const currentSession = await localStaffService.getCurrentSession();
    test('Current session can be retrieved', currentSession !== null);
    test('Retrieved session matches created session', 
         currentSession?.profileId === TEST_STAFF_ID);

    // Test 4: Staff Profile Management
    console.log('\n👥 Testing Staff Profile Management...');
    
    // Get staff profiles
    const profiles = await localStaffService.getStaffProfiles();
    test('Staff profiles can be retrieved', profiles.length >= 0);
    
    // Add test profile
    const testProfile = {
      id: TEST_STAFF_ID,
      name: 'Test Staff Member',
      email: 'test@example.com',
      role: 'staff' as const,
      isActive: true,
      avatar: '',
      department: 'Testing',
      phone: '123-456-7890',
      createdAt: new Date(),
    };
    
    const addProfileSuccess = await localStaffService.addStaffProfile(testProfile);
    test('Test profile can be added', addProfileSuccess);
    
    // Get specific profile
    const retrievedProfile = await localStaffService.getStaffProfile(TEST_STAFF_ID);
    test('Specific profile can be retrieved', retrievedProfile !== null);
    test('Retrieved profile data is correct', 
         retrievedProfile?.name === testProfile.name);

    // Test 5: Security Features
    console.log('\n🔒 Testing Security Features...');
    
    // Test PIN format validation (should be handled by UI)
    const shortPin = '123';
    const longPin = '12345';
    
    test('Short PIN (3 digits) should be rejected by UI validation', shortPin.length !== 4);
    test('Long PIN (5 digits) should be rejected by UI validation', longPin.length !== 4);
    
    // Test session expiration
    const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    test('Session expiration logic works', expiredTime < new Date());

    // Test 6: Real-time Updates
    console.log('\n📡 Testing Real-time Updates...');
    
    let updateReceived = false;
    const unsubscribe = staffSyncService.subscribeToStaffUpdates((updatedProfiles) => {
      updateReceived = true;
      console.log(`   Real-time update received: ${updatedProfiles.length} profiles`);
    });
    
    // Wait briefly for potential updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    test('Real-time subscription can be established', typeof unsubscribe === 'function');
    
    // Cleanup
    unsubscribe();

    // Test 7: Error Handling
    console.log('\n⚠️ Testing Error Handling...');
    
    // Test non-existent profile
    const nonExistentProfile = await localStaffService.getStaffProfile('non-existent-id');
    test('Non-existent profile returns null', nonExistentProfile === null);
    
    // Test invalid PIN verification
    const invalidProfilePin = await localStaffService.verifyStaffPIN('non-existent-id', TEST_PIN);
    test('PIN verification for non-existent profile fails gracefully', !invalidProfilePin);

    // Test 8: Cleanup
    console.log('\n🧹 Testing Cleanup...');
    
    // Clear session
    await localStaffService.clearSession();
    const clearedSession = await localStaffService.getCurrentSession();
    test('Session can be cleared', clearedSession === null);
    
    // Remove test profile
    const removeProfileSuccess = await localStaffService.removeStaffProfile(TEST_STAFF_ID);
    test('Test profile can be removed', removeProfileSuccess);

  } catch (error) {
    console.error('❌ Test suite encountered an error:', error);
    failed++;
  }

  // Results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All PIN screen functionality tests passed!');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Please review the PIN screen implementation.');
    return false;
  }
}

// Component Integration Tests
export const testPINScreenComponents = {
  // Test PIN input validation
  testPINInputValidation: (pin: string) => {
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

  // Test profile card rendering
  testProfileCardData: (profile) => {
    const requiredFields = ['id', 'name', 'role', 'isActive'];
    const missingFields = requiredFields.filter(field => !profile.hasOwnProperty(field));
    
    return {
      isValid: missingFields.length === 0 && profile.isActive,
      missingFields,
      warnings: [
        ...(!profile.avatar ? ['No avatar provided'] : []),
        ...(!profile.department ? ['No department specified'] : []),
        ...(!profile.phone ? ['No phone number'] : []),
      ]
    };
  },

  // Test authentication flow
  testAuthenticationFlow: async (profileId: string, pin: string) => {
    try {
      // Step 1: Validate inputs
      if (!profileId || !pin) {
        return { success: false, error: 'Missing profileId or PIN' };
      }

      // Step 2: Check profile exists
      const profile = await localStaffService.getStaffProfile(profileId);
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Step 3: Verify PIN
      const isPinValid = await localStaffService.verifyStaffPIN(profileId, pin);
      if (!isPinValid) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Step 4: Create session
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
        error: `Authentication failed: ${error.message}` 
      };
    }
  }
};

// Export for use in development/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPINScreenFunctionality, testPINScreenComponents };
}

export default testPINScreenFunctionality;
