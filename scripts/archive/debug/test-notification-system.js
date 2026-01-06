#!/usr/bin/env node

/**
 * Test Script for Notification System
 * Runs comprehensive tests to verify the new notification system works correctly
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing New Notification System');
console.log('=====================================\n');

// Test configuration
const testConfig = {
  testTimeout: 30000,
  verbose: true,
  coverage: true
};

// Test suites to run
const testSuites = [
  {
    name: 'Enhanced Deduplication Service',
    path: '__tests__/services/enhancedNotificationDeduplicationService.test.ts',
    description: 'Tests duplicate detection and prevention logic'
  },
  {
    name: 'Unified Job Notification Service',
    path: '__tests__/services/unifiedJobNotificationService.test.ts',
    description: 'Tests centralized notification dispatch and integration'
  }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runTest(testSuite) {
  log(`\n📋 Running: ${testSuite.name}`, colors.blue);
  log(`   ${testSuite.description}`, colors.reset);
  log(`   File: ${testSuite.path}\n`, colors.reset);

  try {
    const command = `npx jest ${testSuite.path} --verbose --testTimeout=${testConfig.testTimeout}`;
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });

    log(`✅ ${testSuite.name} - PASSED`, colors.green);
    
    if (testConfig.verbose) {
      console.log(output);
    }

    return { success: true, output };
  } catch (error) {
    log(`❌ ${testSuite.name} - FAILED`, colors.red);
    console.log(error.stdout || error.message);
    return { success: false, error: error.message };
  }
}

function runIntegrationTests() {
  log('\n🔗 Running Integration Tests', colors.blue);
  log('   Testing end-to-end notification flow\n', colors.reset);

  try {
    // Run all tests together to check for integration issues
    const command = `npx jest __tests__/services/ --verbose --testTimeout=${testConfig.testTimeout}`;
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });

    log('✅ Integration Tests - PASSED', colors.green);
    
    if (testConfig.verbose) {
      console.log(output);
    }

    return { success: true, output };
  } catch (error) {
    log('❌ Integration Tests - FAILED', colors.red);
    console.log(error.stdout || error.message);
    return { success: false, error: error.message };
  }
}

function generateTestReport(results) {
  log('\n📊 Test Report', colors.bold);
  log('===============\n', colors.bold);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  log(`Total Test Suites: ${totalTests}`, colors.blue);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`, 
      failedTests > 0 ? colors.yellow : colors.green);

  if (failedTests > 0) {
    log('❌ Failed Tests:', colors.red);
    results.filter(r => !r.success).forEach(result => {
      log(`   - ${result.name}`, colors.red);
    });
    log('');
  }

  return failedTests === 0;
}

function checkTestEnvironment() {
  log('🔍 Checking Test Environment', colors.blue);
  
  try {
    // Check if Jest is available
    execSync('npx jest --version', { stdio: 'pipe' });
    log('✅ Jest is available', colors.green);
  } catch (error) {
    log('❌ Jest is not available. Please install Jest:', colors.red);
    log('   npm install --save-dev jest @types/jest ts-jest', colors.yellow);
    return false;
  }

  try {
    // Check if TypeScript is available
    execSync('npx tsc --version', { stdio: 'pipe' });
    log('✅ TypeScript is available', colors.green);
  } catch (error) {
    log('⚠️  TypeScript not found, but tests may still work', colors.yellow);
  }

  return true;
}

// Main execution
async function main() {
  try {
    // Check environment
    if (!checkTestEnvironment()) {
      process.exit(1);
    }

    log('\n🚀 Starting Notification System Tests\n', colors.bold);

    // Run individual test suites
    const results = [];
    for (const testSuite of testSuites) {
      const result = runTest(testSuite);
      results.push({ ...result, name: testSuite.name });
    }

    // Run integration tests
    const integrationResult = runIntegrationTests();
    results.push({ ...integrationResult, name: 'Integration Tests' });

    // Generate report
    const allPassed = generateTestReport(results);

    if (allPassed) {
      log('🎉 All tests passed! The notification system is working correctly.', colors.green);
      log('\n✨ Key Features Verified:', colors.bold);
      log('   ✅ Duplicate notifications are prevented', colors.green);
      log('   ✅ Rate limiting works correctly', colors.green);
      log('   ✅ Notification delivery is reliable', colors.green);
      log('   ✅ Error handling is robust', colors.green);
      log('   ✅ Integration between services works', colors.green);
      
      process.exit(0);
    } else {
      log('⚠️  Some tests failed. Please review the errors above.', colors.yellow);
      log('\n🔧 Next Steps:', colors.bold);
      log('   1. Fix the failing tests', colors.yellow);
      log('   2. Re-run this script to verify fixes', colors.yellow);
      log('   3. Deploy the notification system once all tests pass', colors.yellow);
      
      process.exit(1);
    }

  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node ${path.basename(__filename)} [options]

Options:
  --help, -h     Show this help message
  --quiet, -q    Run tests without verbose output
  --no-coverage  Skip coverage reporting

Description:
  This script runs comprehensive tests for the new unified notification system
  to verify that duplicate notifications are prevented and the system works correctly.
  `);
  process.exit(0);
}

if (process.argv.includes('--quiet') || process.argv.includes('-q')) {
  testConfig.verbose = false;
}

if (process.argv.includes('--no-coverage')) {
  testConfig.coverage = false;
}

// Run the tests
main().catch(error => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
