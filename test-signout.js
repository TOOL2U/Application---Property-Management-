#!/usr/bin/env node

/**
 * Test script to verify sign out functionality
 * Tests the authentication flow and session management
 */

const path = require('path');
const fs = require('fs');

// Mock React Native environment for testing
global.process = process;
global.require = require;

// Add the current directory to the module search path
process.chdir('/Users/shaunducker/Desktop/Property Management Application');

console.log('🧪 Testing Sign Out Functionality...\n');

// Test 1: Check if auth service exports signOut method
console.log('1. Testing auth service signOut method...');
try {
  // Check if the auth service file exists and has the signOut method
  const authServicePath = './services/authService.ts';
  if (fs.existsSync(authServicePath)) {
    const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
    if (authServiceContent.includes('async signOut()')) {
      console.log('✅ Auth service has signOut method');
    } else {
      console.log('❌ Auth service missing signOut method');
    }
  } else {
    console.log('❌ Auth service file not found');
  }
} catch (error) {
  console.log('❌ Error checking auth service:', error.message);
}

// Test 2: Check if AuthContext exports signOut
console.log('\n2. Testing AuthContext signOut method...');
try {
  const authContextPath = './contexts/AuthContext.tsx';
  if (fs.existsSync(authContextPath)) {
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    if (authContextContent.includes('const signOut = async')) {
      console.log('✅ AuthContext has signOut method');
    } else {
      console.log('❌ AuthContext missing signOut method');
    }
  } else {
    console.log('❌ AuthContext file not found');
  }
} catch (error) {
  console.log('❌ Error checking AuthContext:', error.message);
}

// Test 3: Check if profile screen uses signOut correctly
console.log('\n3. Testing profile screen signOut usage...');
try {
  const profilePath = './app/(tabs)/profile.tsx';
  if (fs.existsSync(profilePath)) {
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    if (profileContent.includes('await signOut()')) {
      console.log('✅ Profile screen calls signOut method');
    } else {
      console.log('❌ Profile screen missing signOut call');
    }
    
    if (profileContent.includes('router.push')) {
      console.log('✅ Profile screen has router navigation');
    } else {
      console.log('❌ Profile screen missing router navigation');
    }
  } else {
    console.log('❌ Profile screen file not found');
  }
} catch (error) {
  console.log('❌ Error checking profile screen:', error.message);
}

// Test 4: Check if storage utils exist for clearing session
console.log('\n4. Testing storage utilities...');
try {
  const storagePath = './utils/storage.ts';
  if (fs.existsSync(storagePath)) {
    const storageContent = fs.readFileSync(storagePath, 'utf8');
    if (storageContent.includes('static async remove')) {
      console.log('✅ Storage utilities have remove method');
    } else {
      console.log('❌ Storage utilities missing remove method');
    }
  } else {
    console.log('❌ Storage utilities file not found');
  }
} catch (error) {
  console.log('❌ Error checking storage utilities:', error.message);
}

// Test 5: Check tab layout auth guard
console.log('\n5. Testing tab layout auth guard...');
try {
  const tabLayoutPath = './app/(tabs)/_layout.tsx';
  if (fs.existsSync(tabLayoutPath)) {
    const tabLayoutContent = fs.readFileSync(tabLayoutPath, 'utf8');
    if (tabLayoutContent.includes('if (!isAuthenticated)')) {
      console.log('✅ Tab layout has auth guard');
    } else {
      console.log('❌ Tab layout missing auth guard');
    }
  } else {
    console.log('❌ Tab layout file not found');
  }
} catch (error) {
  console.log('❌ Error checking tab layout:', error.message);
}

console.log('\n🎯 Sign Out Test Summary:');
console.log('- Auth service should clear session properly');
console.log('- AuthContext should clear all auth state');
console.log('- Profile screen should navigate to login after sign out');
console.log('- Tab layout should redirect unauthenticated users');
console.log('- Storage should be cleared on sign out');

console.log('\n✅ Test completed! Check the web app at http://localhost:8084');
console.log('📋 To test manually:');
console.log('1. Open the web app');
console.log('2. Log in with test@exam.com / password');
console.log('3. Go to Profile tab');
console.log('4. Click Sign Out button');
console.log('5. Verify you are redirected to login screen');
