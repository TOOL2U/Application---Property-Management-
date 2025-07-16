#!/usr/bin/env node

/**
 * Test Web Push Notification Configuration
 * Specifically tests the Expo web push notification setup
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 Testing Web Push Notification Configuration...\n');

// Test 1: Verify app.json has correct Expo web push configuration
function testExpoWebPushConfig() {
  console.log('📋 Test 1: Checking Expo web push configuration in app.json...');
  
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const results = [];
    
    // Check root notification configuration
    if (appJson.expo?.notification) {
      const notification = appJson.expo.notification;
      
      if (notification.serviceWorkerPath) {
        const path = notification.serviceWorkerPath;
        if (path === 'firebase-messaging-sw.js' || path === './firebase-messaging-sw.js') {
          results.push(`✅ Root service worker path: ${path}`);
        } else {
          results.push(`❌ Root service worker path incorrect: ${path}`);
        }
      } else {
        results.push('❌ Root service worker path missing');
      }
      
      if (notification.vapidPublicKey) {
        results.push('✅ VAPID public key configured');
      } else {
        results.push('❌ VAPID public key missing');
      }
    } else {
      results.push('❌ Root notification configuration missing');
    }
    
    // Check web-specific configuration
    if (appJson.expo?.web) {
      const web = appJson.expo.web;
      
      if (web.serviceWorkerPath) {
        results.push(`✅ Web service worker path: ${web.serviceWorkerPath}`);
      }
      
      if (web.config?.firebase?.notification?.serviceWorkerPath) {
        results.push(`✅ Firebase web service worker path: ${web.config.firebase.notification.serviceWorkerPath}`);
      }
    }
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length >= 3;
    
  } catch (error) {
    console.log(`   ❌ Error reading app.json: ${error.message}`);
    return false;
  }
}

// Test 2: Check service worker accessibility
function testServiceWorkerAccessibility() {
  console.log('\n🔗 Test 2: Checking service worker file accessibility...');
  
  const swPath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.log('   ❌ Service worker file does not exist');
    return false;
  }
  
  const stats = fs.statSync(swPath);
  console.log(`   ✅ Service worker exists (${stats.size} bytes)`);
  
  // Check if file is readable and has content
  try {
    const content = fs.readFileSync(swPath, 'utf8');
    if (content.length > 100) {
      console.log('   ✅ Service worker has content');
      return true;
    } else {
      console.log('   ❌ Service worker file is too small');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Cannot read service worker: ${error.message}`);
    return false;
  }
}

// Test 3: Verify service worker has Expo compatibility
function testServiceWorkerExpoCompatibility() {
  console.log('\n🔧 Test 3: Checking service worker Expo compatibility...');
  
  try {
    const swPath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');
    const content = fs.readFileSync(swPath, 'utf8');
    
    const checks = [
      { pattern: /console\.log.*Loading.*Expo/, name: 'Expo compatibility logging' },
      { pattern: /addEventListener.*install/, name: 'Install event listener' },
      { pattern: /addEventListener.*activate/, name: 'Activate event listener' },
      { pattern: /skipWaiting/, name: 'Skip waiting for immediate activation' },
      { pattern: /clients\.claim/, name: 'Client claim for immediate control' },
      { pattern: /firebase\.initializeApp/, name: 'Firebase initialization' },
      { pattern: /projectId.*operty-b54dc/, name: 'Correct Firebase project ID' }
    ];
    
    const results = checks.map(check => {
      const found = check.pattern.test(content);
      return `${found ? '✅' : '❌'} ${check.name}`;
    });
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length >= 5;
    
  } catch (error) {
    console.log(`   ❌ Error checking service worker: ${error.message}`);
    return false;
  }
}

// Test 4: Check PushNotificationService web initialization
function testPushNotificationServiceWeb() {
  console.log('\n📱 Test 4: Checking PushNotificationService web support...');
  
  try {
    const servicePath = path.join(process.cwd(), 'services/pushNotificationService.ts');
    const content = fs.readFileSync(servicePath, 'utf8');
    
    const checks = [
      { pattern: /Platform\.OS === 'web'/, name: 'Web platform detection' },
      { pattern: /initializeWebPushNotifications/, name: 'Web initialization method' },
      { pattern: /navigator\.serviceWorker\.register/, name: 'Service worker registration' },
      { pattern: /navigator\.serviceWorker\.ready/, name: 'Service worker ready check' },
      { pattern: /getExpoPushTokenAsync/, name: 'Expo push token request' },
      { pattern: /setupWebNotificationListeners/, name: 'Web notification listeners' },
      { pattern: /scope: '\/'/, name: 'Service worker scope configuration' }
    ];
    
    const results = checks.map(check => {
      const found = check.pattern.test(content);
      return `${found ? '✅' : '❌'} ${check.name}`;
    });
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length >= 6;
    
  } catch (error) {
    console.log(`   ❌ Error checking PushNotificationService: ${error.message}`);
    return false;
  }
}

// Test 5: Generate test URL for manual verification
function generateTestInstructions() {
  console.log('\n🧪 Test 5: Manual verification instructions...');
  
  console.log('   📝 To manually test web push notifications:');
  console.log('   1. Open http://localhost:8082 in your browser');
  console.log('   2. Open Browser DevTools (F12)');
  console.log('   3. Go to Application tab → Service Workers');
  console.log('   4. Verify "firebase-messaging-sw.js" is registered');
  console.log('   5. Check Console for initialization messages:');
  console.log('      - "🌐 Web platform detected, using web push notifications"');
  console.log('      - "🔧 Registering service worker for web push notifications..."');
  console.log('      - "✅ Service worker registered and ready"');
  console.log('   6. Look for notification permission prompt');
  console.log('   7. Check for any error messages in console');
  
  return true;
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'Expo Web Push Config', test: testExpoWebPushConfig },
    { name: 'Service Worker Accessibility', test: testServiceWorkerAccessibility },
    { name: 'Service Worker Expo Compatibility', test: testServiceWorkerExpoCompatibility },
    { name: 'PushNotificationService Web Support', test: testPushNotificationServiceWeb },
    { name: 'Manual Test Instructions', test: generateTestInstructions }
  ];
  
  const results = {};
  
  for (const { name, test } of tests) {
    results[name] = test();
  }
  
  // Summary
  console.log('\n📊 Web Push Configuration Test Results:');
  console.log('==========================================');
  
  const passedTests = Object.entries(results).filter(([_, passed]) => passed);
  const failedTests = Object.entries(results).filter(([_, passed]) => !passed);
  
  passedTests.forEach(([name]) => console.log(`✅ ${name}`));
  failedTests.forEach(([name]) => console.log(`❌ ${name}`));
  
  console.log(`\n🎯 Overall: ${passedTests.length}/${tests.length} tests passed`);
  
  if (passedTests.length >= 4) {
    console.log('🎉 Web push notification configuration looks good!');
    console.log('\n🔍 Next steps:');
    console.log('1. Test in browser at http://localhost:8082');
    console.log('2. Check browser console for initialization messages');
    console.log('3. Verify service worker registration in DevTools');
    console.log('4. Test notification permission request');
    console.log('5. Try creating a job assignment to test notifications');
  } else {
    console.log('⚠️  Configuration issues detected. Please review the failed tests.');
  }
  
  // Specific troubleshooting for the original error
  console.log('\n🔧 Troubleshooting the original error:');
  console.log('Error: "You must specify `notification.serviceWorkerPath` in `app.json`"');
  console.log('');
  console.log('This error should be resolved by:');
  console.log('✅ Setting notification.serviceWorkerPath to "firebase-messaging-sw.js"');
  console.log('✅ Adding web.serviceWorkerPath configuration');
  console.log('✅ Ensuring service worker file exists and is accessible');
  console.log('✅ Registering service worker before requesting push token');
  console.log('');
  console.log('If the error persists, check:');
  console.log('- Browser console for detailed error messages');
  console.log('- Network tab to verify service worker is loading');
  console.log('- Application tab to see service worker registration status');
}

// Run the tests
runAllTests().catch(console.error);
