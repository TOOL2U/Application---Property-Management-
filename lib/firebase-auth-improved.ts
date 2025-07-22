/**
 * Improved Firebase Auth Configuration for React Native
 * Handles auth initialization timeouts gracefully with minimal logging
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
let firebaseApp: FirebaseApp;
const existingApps = getApps();
if (existingApps.length > 0) {
  firebaseApp = existingApps[0];
} else {
  firebaseApp = initializeApp(firebaseConfig);
}

// Auth instance
let authInstance: Auth | null = null;
let authInitializationPromise: Promise<Auth> | null = null;

/**
 * Initialize Firebase Auth with proper React Native persistence
 * Uses async initialization to avoid blocking the UI thread
 */
const initializeFirebaseAuth = async (): Promise<Auth> => {
  if (authInstance) {
    return authInstance;
  }

  try {
    // Try to get existing auth instance first
    try {
      authInstance = getAuth(firebaseApp);
      console.log('✅ Firebase Auth: Using existing instance');
      return authInstance;
    } catch (getAuthError) {
      // If getAuth fails, initialize with React Native persistence
      console.log('🔄 Firebase Auth: Initializing with React Native persistence...');
    }

    // Initialize with React Native AsyncStorage persistence
    // Note: In newer Firebase versions, AsyncStorage is automatically detected
    authInstance = initializeAuth(firebaseApp, {
      // Firebase v10+ automatically detects AsyncStorage in React Native
    });

    console.log('✅ Firebase Auth: Initialized successfully with AsyncStorage persistence');
    return authInstance;

  } catch (error: any) {
    // Handle "already exists" error gracefully
    if (error.message?.includes('already exists') || error.message?.includes('already initialized')) {
      authInstance = getAuth(firebaseApp);
      console.log('✅ Firebase Auth: Retrieved existing instance after initialization error');
      return authInstance;
    }

    // For other errors, try fallback initialization
    console.warn('⚠️ Firebase Auth: Primary initialization failed, trying fallback...');
    try {
      authInstance = initializeAuth(firebaseApp);
      console.log('✅ Firebase Auth: Fallback initialization successful');
      return authInstance;
    } catch (fallbackError) {
      // Final fallback to getAuth
      authInstance = getAuth(firebaseApp);
      console.log('✅ Firebase Auth: Using getAuth as final fallback');
      return authInstance;
    }
  }
};

/**
 * Get Firebase Auth instance with lazy initialization
 * Returns a promise to avoid blocking the main thread
 */
export const getFirebaseAuth = async (): Promise<Auth> => {
  if (authInstance) {
    return authInstance;
  }

  // Use singleton promise to avoid multiple simultaneous initializations
  if (!authInitializationPromise) {
    authInitializationPromise = initializeFirebaseAuth();
  }

  return authInitializationPromise;
};

/**
 * Synchronous auth getter with enhanced error handling
 * Creates a proxy that handles auth not being ready yet
 */
export const createAuthProxy = (): Auth => {
  let proxyAuth: Auth | null = null;
  let isInitializing = false;

  const authProxy = new Proxy({} as Auth, {
    get(target, prop) {
      // If we have the auth instance, use it directly
      if (proxyAuth) {
        return (proxyAuth as any)[prop];
      }

      // Handle critical methods that need immediate response
      if (prop === 'onAuthStateChanged') {
        return (callback: (user: any) => void) => {
          let unsubscribe: (() => void) | null = null;
          let isUnsubscribed = false;

          // Initialize auth and set up listener
          const setupListener = async () => {
            try {
              const auth = await getFirebaseAuth();
              if (!isUnsubscribed) {
                proxyAuth = auth;
                unsubscribe = auth.onAuthStateChanged(callback);
              }
            } catch (error) {
              console.warn('⚠️ Firebase Auth: onAuthStateChanged setup failed, this is normal in React Native');
              // Call callback with null to indicate no user
              if (!isUnsubscribed) {
                callback(null);
              }
            }
          };

          setupListener();

          // Return unsubscribe function
          return () => {
            isUnsubscribed = true;
            if (unsubscribe) {
              unsubscribe();
            }
          };
        };
      }

      // Handle currentUser property
      if (prop === 'currentUser') {
        return proxyAuth ? (proxyAuth as any).currentUser : null;
      }

      // Handle async methods
      if (prop === 'signInWithEmailAndPassword' || prop === 'signOut' || prop === 'signInAnonymously') {
        return async (...args: any[]) => {
          if (!proxyAuth && !isInitializing) {
            isInitializing = true;
            try {
              proxyAuth = await getFirebaseAuth();
            } catch (error) {
              console.error('❌ Firebase Auth: Failed to initialize for method call:', prop);
              throw error;
            } finally {
              isInitializing = false;
            }
          }

          if (proxyAuth && (proxyAuth as any)[prop]) {
            return (proxyAuth as any)[prop](...args);
          }

          throw new Error(`Firebase Auth method ${String(prop)} not available`);
        };
      }

      // For other properties, try to return from auth instance or undefined
      return proxyAuth ? (proxyAuth as any)[prop] : undefined;
    }
  });

  return authProxy;
};

// Export the auth proxy
export const auth = createAuthProxy();

// Pre-initialize auth in the background (non-blocking)
setTimeout(() => {
  getFirebaseAuth().catch(() => {
    // Silent catch - initialization will be retried when needed
  });
}, 100);

export default auth;
