#!/usr/bin/env node

/**
 * Test Push Notification Configuration
 * Verifies that push notifications are properly configured for web and mobile
 */

const fs = require('fs');
const path = require('path');

console.log('🔔 Testing Push Notification Configuration...\n');

// Test 1: Check app.json configuration
function testAppJsonConfig() {
  console.log('📋 Test 1: Checking app.json configuration...');
  
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const results = [];
    
    // Check notification configuration
    if (appJson.expo?.notification) {
      const notification = appJson.expo.notification;
      
      if (notification.serviceWorkerPath) {
        results.push(`✅ Service worker path configured: ${notification.serviceWorkerPath}`);
      } else {
        results.push('❌ Service worker path not configured');
      }
      
      if (notification.vapidPublicKey) {
        results.push('✅ VAPID public key configured');
      } else {
        results.push('❌ VAPID public key not configured');
      }
      
      if (notification.icon) {
        results.push(`✅ Notification icon configured: ${notification.icon}`);
      } else {
        results.push('❌ Notification icon not configured');
      }
    } else {
      results.push('❌ Notification configuration missing');
    }
    
    // Check web configuration
    if (appJson.expo?.web?.config?.firebase?.notification) {
      const firebaseNotification = appJson.expo.web.config.firebase.notification;
      if (firebaseNotification.serviceWorkerPath) {
        results.push(`✅ Firebase service worker path configured: ${firebaseNotification.serviceWorkerPath}`);
      }
    }
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length > 0;
    
  } catch (error) {
    console.log(`   ❌ Error reading app.json: ${error.message}`);
    return false;
  }
}

// Test 2: Check service worker files exist
function testServiceWorkerFiles() {
  console.log('\n📁 Test 2: Checking service worker files...');
  
  const files = [
    'public/firebase-messaging-sw.js',
    'public/sw.js'
  ];
  
  const results = [];
  
  files.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      results.push(`✅ ${filePath} exists (${stats.size} bytes)`);
    } else {
      results.push(`❌ ${filePath} missing`);
    }
  });
  
  results.forEach(result => console.log(`   ${result}`));
  return results.filter(r => r.startsWith('✅')).length === files.length;
}

// Test 3: Check Firebase service worker content
function testFirebaseServiceWorkerContent() {
  console.log('\n🔥 Test 3: Checking Firebase service worker content...');
  
  try {
    const swPath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');
    const content = fs.readFileSync(swPath, 'utf8');
    
    const checks = [
      { pattern: /importScripts.*firebase-app-compat/, name: 'Firebase app import' },
      { pattern: /importScripts.*firebase-messaging-compat/, name: 'Firebase messaging import' },
      { pattern: /firebase\.initializeApp/, name: 'Firebase initialization' },
      { pattern: /messaging\.onBackgroundMessage/, name: 'Background message handler' },
      { pattern: /addEventListener.*push/, name: 'Push event listener' },
      { pattern: /addEventListener.*notificationclick/, name: 'Notification click handler' },
      { pattern: /projectId.*operty-b54dc/, name: 'Correct project ID' }
    ];
    
    const results = checks.map(check => {
      const found = check.pattern.test(content);
      return `${found ? '✅' : '❌'} ${check.name}`;
    });
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length === checks.length;
    
  } catch (error) {
    console.log(`   ❌ Error reading Firebase service worker: ${error.message}`);
    return false;
  }
}

// Test 4: Check PushNotificationService implementation
function testPushNotificationService() {
  console.log('\n📱 Test 4: Checking PushNotificationService implementation...');
  
  try {
    const servicePath = path.join(process.cwd(), 'services/pushNotificationService.ts');
    const content = fs.readFileSync(servicePath, 'utf8');
    
    const checks = [
      { pattern: /class PushNotificationService/, name: 'Service class exists' },
      { pattern: /async initialize/, name: 'Initialize method exists' },
      { pattern: /initializeWebPushNotifications/, name: 'Web initialization method' },
      { pattern: /Platform\.OS === 'web'/, name: 'Web platform detection' },
      { pattern: /getExpoPushTokenAsync/, name: 'Expo push token method' },
      { pattern: /setupWebNotificationListeners/, name: 'Web notification listeners' },
      { pattern: /handleWebNotificationAction/, name: 'Web notification action handler' },
      { pattern: /export.*PushNotificationService/, name: 'Service export' }
    ];
    
    const results = checks.map(check => {
      const found = check.pattern.test(content);
      return `${found ? '✅' : '❌'} ${check.name}`;
    });
    
    results.forEach(result => console.log(`   ${result}`));
    return results.filter(r => r.startsWith('✅')).length >= checks.length - 1; // Allow one failure
    
  } catch (error) {
    console.log(`   ❌ Error reading PushNotificationService: ${error.message}`);
    return false;
  }
}

// Test 5: Check environment variables
function testEnvironmentVariables() {
  console.log('\n🌍 Test 5: Checking environment variables...');
  
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  ];
  
  const results = requiredVars.map(varName => {
    const value = process.env[varName];
    if (value) {
      return `✅ ${varName} is set`;
    } else {
      return `❌ ${varName} is missing`;
    }
  });
  
  results.forEach(result => console.log(`   ${result}`));
  return results.filter(r => r.startsWith('✅')).length === requiredVars.length;
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'App.json Configuration', test: testAppJsonConfig },
    { name: 'Service Worker Files', test: testServiceWorkerFiles },
    { name: 'Firebase Service Worker Content', test: testFirebaseServiceWorkerContent },
    { name: 'PushNotificationService Implementation', test: testPushNotificationService },
    { name: 'Environment Variables', test: testEnvironmentVariables }
  ];
  
  const results = {};
  
  for (const { name, test } of tests) {
    results[name] = test();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = Object.entries(results).filter(([_, passed]) => passed);
  const failedTests = Object.entries(results).filter(([_, passed]) => !passed);
  
  passedTests.forEach(([name]) => console.log(`✅ ${name}`));
  failedTests.forEach(([name]) => console.log(`❌ ${name}`));
  
  console.log(`\n🎯 Overall: ${passedTests.length}/${tests.length} tests passed`);
  
  if (passedTests.length === tests.length) {
    console.log('🎉 All tests passed! Push notifications should work correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Test push notifications in the browser');
    console.log('2. Verify service worker registration in DevTools');
    console.log('3. Test job assignment notifications');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration.');
    
    if (failedTests.length > 0) {
      console.log('\n🔧 Recommended fixes:');
      failedTests.forEach(([name]) => {
        switch (name) {
          case 'App.json Configuration':
            console.log('- Check notification.serviceWorkerPath in app.json');
            break;
          case 'Service Worker Files':
            console.log('- Ensure service worker files exist in public/ directory');
            break;
          case 'Firebase Service Worker Content':
            console.log('- Verify Firebase configuration in service worker');
            break;
          case 'PushNotificationService Implementation':
            console.log('- Check PushNotificationService methods');
            break;
          case 'Environment Variables':
            console.log('- Set required Firebase environment variables');
            break;
        }
      });
    }
  }
}

// Run the tests
runAllTests().catch(console.error);
