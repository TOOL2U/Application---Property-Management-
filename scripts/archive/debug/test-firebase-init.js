#!/usr/bin/env node

/**
 * Test Firebase Initialization
 * Tests the auto-initialization of Firestore db proxy
 */

// Import the Firebase config exactly like the React Native app does
const path = require('path');

// Mock React Native environment
global.__DEV__ = true;
global.window = undefined;

// Mock AsyncStorage for React Native
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

// Set up environment like React Native
global.AsyncStorage = mockAsyncStorage;

// Import Firebase exactly like the app does
const { db, getDb } = require('./lib/firebase.ts');

async function testFirebaseInitialization() {
  console.log('🧪 Testing Firebase Initialization...\n');

  try {
    // Test 1: Auto-initialization of db proxy
    console.log('1️⃣ Testing db proxy auto-initialization...');
    
    try {
      const collection = db.collection;
      console.log('✅ db proxy auto-initialized successfully');
    } catch (error) {
      console.log('❌ db proxy auto-initialization failed:', error.message);
    }

    // Test 2: Async getDb function
    console.log('\n2️⃣ Testing async getDb function...');
    
    try {
      const dbInstance = await getDb();
      console.log('✅ getDb() returned successfully:', !!dbInstance);
    } catch (error) {
      console.log('❌ getDb() failed:', error.message);
    }

    // Test 3: Direct db usage (what the services do)
    console.log('\n3️⃣ Testing direct db usage like services...');
    
    try {
      // This simulates what staffJobService.updateJobStatus does
      const { doc } = require('firebase/firestore');
      const jobRef = doc(db, 'jobs', 'test-job-id');
      console.log('✅ Direct db usage works:', !!jobRef);
    } catch (error) {
      console.log('❌ Direct db usage failed:', error.message);
    }

    console.log('\n🎯 Firebase initialization test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFirebaseInitialization();
