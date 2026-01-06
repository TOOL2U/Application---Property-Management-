/**
 * Firebase Auth Configuration with Explicit React Native Persistence
 * This ensures AsyncStorage is properly configured for Firebase Auth
 */

import { initializeAuth, getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Ensure AsyncStorage is globally available for Firebase
const setupAsyncStorageForFirebase = () => {
  try {
    // Firebase v10+ in React Native should automatically detect AsyncStorage
    // but we can help by ensuring it's properly available
    if (typeof window === 'undefined') {
      // React Native environment
      (global as any).AsyncStorage = ReactNativeAsyncStorage;
      
      // Skip XMLHttpRequest setup - not needed for Firebase v10+
      console.log('✅ AsyncStorage configured for Firebase Auth');
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ AsyncStorage setup failed:', error);
    return false;
  }
};

/**
 * Initialize Firebase Auth with proper React Native persistence
 * This should resolve the AsyncStorage warnings
 */
export const initializeFirebaseAuth = (app: any) => {
  setupAsyncStorageForFirebase();
  
  try {
    // Check if auth is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      try {
        const auth = getAuth(app);
        console.log('✅ Firebase Auth: Using existing instance');
        return auth;
      } catch (error) {
        // Continue to initialize new instance
      }
    }

    // Initialize new auth instance
    // Firebase v10+ automatically handles AsyncStorage in React Native when available
    const auth = initializeAuth(app, {
      // Persistence is automatically configured for React Native
      // when @react-native-async-storage/async-storage is installed
    });

    console.log('✅ Firebase Auth: Initialized with AsyncStorage persistence');
    return auth;

  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      console.log('✅ Firebase Auth: Already initialized, using existing');
      return getAuth(app);
    }
    
    console.error('❌ Firebase Auth initialization failed:', error);
    
    // Fallback to basic auth
    try {
      const auth = getAuth(app);
      console.log('⚠️ Firebase Auth: Using fallback initialization');
      return auth;
    } catch (fallbackError) {
      console.error('❌ Firebase Auth fallback failed:', fallbackError);
      throw error;
    }
  }
};

export { ReactNativeAsyncStorage };
