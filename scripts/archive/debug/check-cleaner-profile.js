#!/usr/bin/env node
/**
 * Diagnostic Script: Check Cleaner Profile in Firebase
 * Run: node check-cleaner-profile.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config (from your project)
const firebaseConfig = {
  apiKey: "AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "1045698691062",
  appId: "1:1045698691062:web:20ea3e91ae49ff8c75baa2",
  measurementId: "G-KC2BMTXMSR"
};

async function checkCleanerProfile() {
  console.log('🔍 Checking cleaner profile in Firebase...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Query for cleaner email
    const staffRef = collection(db, 'staff_accounts');
    const q = query(staffRef, where('email', '==', 'cleaner@siamoon.com'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ NO PROFILE FOUND for cleaner@siamoon.com\n');
      console.log('🔧 SOLUTION: Create the profile in Firebase Console or run the fix script.\n');
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('✅ PROFILE FOUND!\n');
      console.log('Document ID:', doc.id);
      console.log('\nFull Document Data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📋 KEY FIELDS CHECK:\n');

      // Check critical fields
      console.log(`✓ name: ${data.name || '❌ MISSING'}`);
      console.log(`✓ email: ${data.email || '❌ MISSING'}`);
      console.log(`✓ role: ${data.role || '❌ MISSING'}`);
      console.log(`✓ isActive: ${data.isActive !== undefined ? data.isActive : '❌ MISSING'}`);
      console.log(`✓ status: ${data.status || '(not set)'}`);
      console.log(`✓ pin: ${data.pin || '(not set)'}`);
      console.log(`✓ userId: ${data.userId || '❌ MISSING'}`);

      // Diagnose issues
      console.log('\n🔍 DIAGNOSIS:\n');

      const isActive = data.status === 'active' || data.isActive === true;
      const hasName = !!data.name;
      const hasEmail = !!data.email;

      if (!isActive) {
        console.log('❌ PROBLEM: Profile is not active!');
        console.log('   isActive =', data.isActive);
        console.log('   status =', data.status);
        console.log('\n🔧 FIX: Set isActive: true in Firebase Console\n');
      } else {
        console.log('✅ Profile is active');
      }

      if (!hasName) {
        console.log('❌ PROBLEM: name field is missing!');
        console.log('\n🔧 FIX: Add name: "Cleaner" in Firebase Console\n');
      } else {
        console.log('✅ name field exists');
      }

      if (!hasEmail) {
        console.log('❌ PROBLEM: email field is missing!');
        console.log('\n🔧 FIX: Add email: "cleaner@siamoon.com" in Firebase Console\n');
      } else {
        console.log('✅ email field exists');
      }

      // Final verdict
      console.log('\n🎯 FINAL VERDICT:\n');
      if (isActive && hasName && hasEmail) {
        console.log('✅ Profile should work! If not showing in app, try:');
        console.log('   1. Clear app cache');
        console.log('   2. Restart app');
        console.log('   3. Check console logs for errors\n');
      } else {
        console.log('❌ Profile will NOT show in app until fixed!\n');
        console.log('Required fixes:');
        if (!isActive) console.log('   - Set isActive: true');
        if (!hasName) console.log('   - Add name field');
        if (!hasEmail) console.log('   - Add email field');
        console.log('');
      }
    });

  } catch (error) {
    console.error('❌ Error checking profile:', error.message);
    console.error('\nFull error:', error);
  }
}

checkCleanerProfile();
