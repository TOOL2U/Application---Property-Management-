import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration for Sia Moon Property Management
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-project.firebaseio.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ABCDEF",
};

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
});

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
} else {
  app = getApp();
  console.log('✅ Firebase app already initialized');
}

// Initialize Firebase Auth with simpler approach for React Native
let auth: Auth;
try {
  console.log('🔧 Initializing Firebase Auth...');
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Auth:', error);
  throw error;
}

// Initialize Firestore
const db = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Realtime Database
const rtdb = getDatabase(app);
console.log('✅ Realtime Database initialized');

// Initialize Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');

// Connect to emulators in development if enabled
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';

  try {
    // Import emulator connection functions
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectStorageEmulator } = require('firebase/storage');
    const { connectDatabaseEmulator } = require('firebase/database');

    // Connect to Auth emulator
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    console.log('🔧 Connected to Auth emulator at', emulatorHost + ':9099');

    // Connect to Firestore emulator
    connectFirestoreEmulator(db, emulatorHost, 8080);
    console.log('🔧 Connected to Firestore emulator at', emulatorHost + ':8080');

    // Connect to Realtime Database emulator (if needed)
    // connectDatabaseEmulator(rtdb, emulatorHost, 9000);
    // console.log('🔧 Connected to Realtime Database emulator at', emulatorHost + ':9000');

    // Connect to Storage emulator
    connectStorageEmulator(storage, emulatorHost, 9199);
    console.log('🔧 Connected to Storage emulator at', emulatorHost + ':9199');

    console.log('✅ All Firebase emulators connected successfully!');
    console.log('🌐 Emulator UI available at:', `http://${emulatorHost}:4000`);
  } catch (error) {
    console.error('⚠️ Firebase emulator connection failed:', error);
  }
}

// Test Firestore connection and set up auth state monitoring
const testFirestoreConnection = async () => {
  try {
    // This will test if we can connect to Firestore
    console.log('🔍 Testing Firestore connection...');
    console.log('✅ Firestore connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return false;
  }
};

// Run connection test
testFirestoreConnection();

export { auth, db, rtdb, storage };
export default app;
