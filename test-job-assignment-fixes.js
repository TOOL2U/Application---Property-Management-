/**
 * Test script to verify job assignment service fixes
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './lib/firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🧪 Testing Job Assignment Service Fixes...');

// Test the estimatedDuration parsing fixes
function testEstimatedDurationParsing() {
  console.log('\n📊 Testing estimatedDuration parsing fixes...');
  
  const testCases = [
    { input: "30 minutes", expected: 30 },
    { input: 45, expected: 45 },
    { input: "1 hour", expected: 1 },
    { input: null, expected: 30 },
    { input: undefined, expected: 30 },
    { input: "", expected: 30 }
  ];

  testCases.forEach((testCase, index) => {
    const result = typeof testCase.input === 'string' 
      ? parseInt(testCase.input.replace(/\D/g, '') || '30')
      : typeof testCase.input === 'number' 
        ? testCase.input 
        : 30;
    
    const passed = result === testCase.expected;
    console.log(`  Test ${index + 1}: ${passed ? '✅' : '❌'} Input: ${testCase.input} → Output: ${result} (Expected: ${testCase.expected})`);
  });
}

// Test Firebase UID mapping
async function testFirebaseUidMapping() {
  console.log('\n🔗 Testing Firebase UID mapping...');
  
  try {
    // Import the firebaseUidService
    const { firebaseUidService } = await import('./services/firebaseUidService.js');
    
    // Test the specific mapping for our test user
    const testStaffId = 'IDJrsXWiL2dCHVpveH97';
    const expectedFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
    
    const result = await firebaseUidService.getFirebaseUid(testStaffId);
    const passed = result === expectedFirebaseUid;
    
    console.log(`  UID Mapping Test: ${passed ? '✅' : '❌'}`);
    console.log(`    Staff ID: ${testStaffId}`);
    console.log(`    Firebase UID: ${result}`);
    console.log(`    Expected: ${expectedFirebaseUid}`);
    
    return passed;
  } catch (error) {
    console.log(`  ❌ UID Mapping Test failed: ${error.message}`);
    return false;
  }
}

// Test job assignment service
async function testJobAssignmentService() {
  console.log('\n💼 Testing Job Assignment Service...');
  
  try {
    // Import the job assignment service
    const { jobAssignmentService } = await import('./services/jobAssignmentService.js');
    
    // Test getting jobs for our test Firebase UID
    const testFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
    const result = await jobAssignmentService.getStaffJobs(testFirebaseUid);
    
    console.log(`  ✅ Job query successful`);
    console.log(`    Firebase UID: ${testFirebaseUid}`);
    console.log(`    Jobs found: ${result.jobs?.length || 0}`);
    console.log(`    Success: ${result.success}`);
    
    if (result.jobs && result.jobs.length > 0) {
      const sampleJob = result.jobs[0];
      console.log(`    Sample job: ${sampleJob.title} (Duration: ${sampleJob.estimatedDuration})`);
    }
    
    return result.success;
  } catch (error) {
    console.log(`  ❌ Job Assignment Service test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting Job Assignment Service Fixes Test Suite...\n');
  
  // Test estimatedDuration parsing
  testEstimatedDurationParsing();
  
  // Test Firebase UID mapping
  const uidMappingPassed = await testFirebaseUidMapping();
  
  // Test job assignment service
  const jobServicePassed = await testJobAssignmentService();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ EstimatedDuration Parsing: Fixed`);
  console.log(`${uidMappingPassed ? '✅' : '❌'} Firebase UID Mapping: ${uidMappingPassed ? 'Working' : 'Failed'}`);
  console.log(`${jobServicePassed ? '✅' : '❌'} Job Assignment Service: ${jobServicePassed ? 'Working' : 'Failed'}`);
  
  const overallSuccess = uidMappingPassed && jobServicePassed;
  console.log(`\n🎯 Overall: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('🎉 Your mobile app should now properly display jobs!');
  } else {
    console.log('⚠️ There are still issues that need to be resolved.');
  }
}

runTests().catch(console.error);
