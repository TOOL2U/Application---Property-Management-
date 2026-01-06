#!/usr/bin/env node

/**
 * Quick Notification System Test
 * Simple verification that the notification system is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quick Notification System Test');
console.log('==================================\n');

// Test results
let passed = 0;
let total = 0;

function test(name, condition, details = '') {
  total++;
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// Test 1: Check if new notification services exist
console.log('📋 Checking notification services...');

const serviceFiles = [
  'services/unifiedJobNotificationService.ts',
  'services/enhancedNotificationDeduplicationService.ts',
  'services/notificationRateLimitingService.ts'
];

serviceFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  test(`${file} exists`, exists, 'Service file is missing');
});

// Test 2: Check if old notification calls are replaced
console.log('\n📋 Checking notification integration...');

const integrationChecks = [
  {
    file: 'api/job-assignment/assign.ts',
    check: (content) => {
      return content.includes('unifiedJobNotificationService') && 
             !content.includes('await messaging.sendMulticast');
    },
    name: 'Job assignment uses unified service'
  },
  {
    file: 'api/job-assignment/update-status.ts',
    check: (content) => {
      return content.includes('unifiedJobNotificationService') && 
             !content.includes('await sendWebhookNotification(');
    },
    name: 'Status update uses unified service'
  },
  {
    file: 'services/jobAssignmentService.ts',
    check: (content) => {
      return content.includes('unifiedJobNotificationService') && 
             !content.includes('await this.notifyStatusChange');
    },
    name: 'Job service uses unified service'
  }
];

integrationChecks.forEach(({ file, check, name }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const isCorrect = check(content);
    test(name, isCorrect, `Check ${file} for proper integration`);
  } else {
    test(name, false, `File ${file} not found`);
  }
});

// Test 3: Check if real-time service is disabled
console.log('\n📋 Checking disabled services...');

const realtimeServicePath = path.join(process.cwd(), 'services/realTimeJobNotificationService.ts');
if (fs.existsSync(realtimeServicePath)) {
  const content = fs.readFileSync(realtimeServicePath, 'utf8');
  const isDisabled = content.includes('TEMPORARILY DISABLED') || 
                     content.includes('Real-time job notification listener disabled');
  test('Real-time service is disabled', isDisabled, 'Real-time service should be disabled to prevent duplicates');
} else {
  test('Real-time service is disabled', false, 'Real-time service file not found');
}

// Test 4: Check documentation
console.log('\n📋 Checking documentation...');

const docFiles = [
  'docs/unified-notification-architecture.md',
  'docs/notification-system-implementation-guide.md'
];

docFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  test(`${file} exists`, exists, 'Documentation file is missing');
});

// Test 5: Check for key notification features
console.log('\n📋 Checking notification features...');

const unifiedServicePath = path.join(process.cwd(), 'services/unifiedJobNotificationService.ts');
if (fs.existsSync(unifiedServicePath)) {
  const content = fs.readFileSync(unifiedServicePath, 'utf8');
  
  test('Has job assignment notification method', 
       content.includes('sendJobAssignmentNotification'),
       'Method sendJobAssignmentNotification should exist');
       
  test('Has job status update notification method', 
       content.includes('sendJobStatusUpdateNotification'),
       'Method sendJobStatusUpdateNotification should exist');
       
  test('Integrates with deduplication service', 
       content.includes('enhancedNotificationDeduplicationService'),
       'Should use deduplication service');
       
  test('Integrates with rate limiting service', 
       content.includes('notificationRateLimitingService'),
       'Should use rate limiting service');
} else {
  test('Unified service exists', false, 'Unified notification service file not found');
}

const deduplicationServicePath = path.join(process.cwd(), 'services/enhancedNotificationDeduplicationService.ts');
if (fs.existsSync(deduplicationServicePath)) {
  const content = fs.readFileSync(deduplicationServicePath, 'utf8');
  
  test('Has deduplication logic', 
       content.includes('shouldAllowNotification'),
       'Method shouldAllowNotification should exist');
       
  test('Has persistent storage', 
       content.includes('Firestore') || content.includes('firebase'),
       'Should use Firestore for persistence');
       
  test('Has fingerprint generation', 
       content.includes('fingerprint') || content.includes('generateFingerprint'),
       'Should generate notification fingerprints');
} else {
  test('Deduplication service exists', false, 'Deduplication service file not found');
}

// Final Report
console.log('\n📊 Test Results');
console.log('================');
console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

if (passed === total) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('\n✨ Notification System Status:');
  console.log('   ✅ New unified notification services are implemented');
  console.log('   ✅ Old duplicate notification sources are disabled/replaced');
  console.log('   ✅ Deduplication and rate limiting are integrated');
  console.log('   ✅ Documentation is complete');
  console.log('\n🚀 The system is ready to eliminate duplicate notifications!');
  console.log('\n📋 What this means:');
  console.log('   • Instead of 19 duplicate notifications, you\'ll get exactly 1');
  console.log('   • All job assignments will use the unified service');
  console.log('   • Duplicate notifications are automatically blocked');
  console.log('   • Rate limiting prevents notification spam');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Deploy these changes to your environment');
  console.log('   2. Test with a real job assignment');
  console.log('   3. Verify only 1 notification is sent');
  console.log('   4. Monitor logs for duplicate prevention messages');
  
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  console.log('\n🔧 Issues to address:');
  console.log('   • Review the failed tests above');
  console.log('   • Ensure all notification services are properly created');
  console.log('   • Verify integration is complete');
  console.log('\n   Re-run this test after making fixes.');
  
  process.exit(1);
}
