/**
 * Test Notification Readiness for staff@siamoon.com
 * This script verifies all components are ready for the notification test
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

async function checkNotificationReadiness() {
  try {
    console.log('🔍 Checking notification readiness for staff@siamoon.com...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check staff account
    const staffRef = doc(db, 'staff_accounts', 'staff@siamoon.com');
    const staffDoc = await getDoc(staffRef);

    if (!staffDoc.exists()) {
      console.log('❌ Staff account not found for staff@siamoon.com');
      return false;
    }

    const staffData = staffDoc.data();
    console.log('✅ Staff account found:', staffData.name || 'Unknown Name');
    console.log('   Role:', staffData.role || 'Unknown Role');
    console.log('   PIN configured:', staffData.pin ? '✅ Yes' : '❌ No');

    // Check FCM tokens
    const fcmTokens = staffData.fcmTokens || [];
    console.log('   FCM Tokens:', fcmTokens.length > 0 ? `✅ ${fcmTokens.length} token(s)` : '⚠️  None registered');
    
    if (fcmTokens.length > 0) {
      console.log('   Latest token:', fcmTokens[fcmTokens.length - 1].substring(0, 50) + '...');
    }

    // Check notification preferences
    const notifPrefs = staffData.notificationPreferences || {};
    console.log('   Push notifications enabled:', notifPrefs.pushEnabled ? '✅ Yes' : '❌ No');
    console.log('   Last token update:', staffData.lastTokenUpdate?.toDate?.() || 'Never');

    console.log('\n🎯 NOTIFICATION TEST READINESS:');
    
    const hasPin = !!staffData.pin;
    const hasTokens = fcmTokens.length > 0;
    const pushEnabled = notifPrefs.pushEnabled !== false; // Default to true if not set
    
    if (hasPin && hasTokens && pushEnabled) {
      console.log('🟢 READY - All systems go for notification test!');
      console.log('   ✅ Staff account exists');
      console.log('   ✅ PIN configured for mobile login');
      console.log('   ✅ FCM tokens registered');
      console.log('   ✅ Push notifications enabled');
      console.log('\n💡 Next steps:');
      console.log('   1. Make sure mobile app is logged in as staff@siamoon.com');
      console.log('   2. Navigate to Jobs tab to see the notification banner');
      console.log('   3. Send the test job from webapp');
      console.log('   4. Expect: System push + In-app pulsing banner');
    } else {
      console.log('🟡 PARTIAL READINESS - Some issues found:');
      if (!hasPin) console.log('   ❌ No PIN configured');
      if (!hasTokens) console.log('   ❌ No FCM tokens registered (mobile app may not be logged in)');
      if (!pushEnabled) console.log('   ❌ Push notifications disabled');
      
      console.log('\n💡 To fix:');
      if (!hasTokens) {
        console.log('   1. Open mobile app and log in as staff@siamoon.com');
        console.log('   2. Grant notification permissions if prompted');
        console.log('   3. Stay on Jobs tab for a few seconds to register token');
      }
    }

  } catch (error) {
    console.error('❌ Error checking notification readiness:', error);
    return false;
  }
}

// Run the check
checkNotificationReadiness();
