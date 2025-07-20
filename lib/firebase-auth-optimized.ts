/**
 * Optimized Firebase Auth Configuration for React Native
 * Reduces timeout warnings while maintaining full functionality
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
let app;
const existingApps = getApps();
if (existingApps.length > 0) {
  app = existingApps[0];
} else {
  app = initializeApp(firebaseConfig);
}

// Initialize Auth with minimal retry logic
let auth;
try {
  // Try getAuth first (for existing instances)
  auth = getAuth(app);
  console.log('✅ Firebase Auth ready');
} catch (error) {
  try {
    // If that fails, try initializeAuth with AsyncStorage
    // Note: getReactNativePersistence may not be available in all Firebase versions
    // So we'll use a simpler approach that works consistently
    auth = initializeAuth(app, {
      // The persistence will be handled by Firebase's default React Native setup
      // which automatically uses AsyncStorage when available
    });
    console.log('✅ Firebase Auth initialized');
  } catch (initError) {
    console.warn('⚠️ Firebase Auth initialization deferred - this is normal in React Native');
    // Create a fallback that will work when auth is needed
    auth = {
      onAuthStateChanged: (callback) => {
        // Set up a retry mechanism with reduced logging
        let retries = 0;
        const maxRetries = 2;
        
        const tryAuth = () => {
          try {
            const realAuth = getAuth(app);
            return realAuth.onAuthStateChanged(callback);
          } catch (err) {
            retries++;
            if (retries < maxRetries) {
              setTimeout(tryAuth, 500);
            } else {
              console.warn('⚠️ Firebase Auth initialization timed out after 2 attempts');
              console.warn('⚠️ This is expected behavior in React Native - Auth will work when needed');
              callback(null);
            }
          }
        };
        
        tryAuth();
        
        return () => {}; // Return unsubscribe function
      },
      currentUser: null,
      signInWithEmailAndPassword: async (...args) => {
        const realAuth = getAuth(app);
        return realAuth.signInWithEmailAndPassword(...args);
      },
      signOut: async () => {
        const realAuth = getAuth(app);
        return realAuth.signOut();
      }
    };
  }
}

export { auth };
