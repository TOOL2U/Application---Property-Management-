/**
 * Firebase Configuration
 * Lazy initialization to avoid "Component auth has not been registered yet" error
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missing.length > 0) {
    console.error('❌ Missing Firebase config:', missing);
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }

  console.log('✅ Firebase config validated for project:', firebaseConfig.projectId);
};

// Validate configuration on import
validateConfig();

// Lazy initialization variables
let _app: any = null;
let _auth: Auth | null = null;
let _db: any = null;
let _rtdb: any = null;
let _storage: any = null;

// Initialize Firebase App (lazy)
const getFirebaseApp = () => {
  if (_app) return _app;

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      _app = existingApps[0];
      console.log('✅ Firebase app already initialized');
    } else {
      _app = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized successfully');
    }
    return _app;
  } catch (error) {
    console.error('❌ Firebase app initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase Auth with graceful error handling
const getFirebaseAuth = () => {
  if (_auth) return _auth;

  const firebaseApp = getFirebaseApp();

  try {
    _auth = getAuth(firebaseApp);
    console.log('✅ Firebase Auth initialized successfully');
    return _auth;
  } catch (error: any) {
    if (error.message?.includes('Component auth has not been registered yet')) {
      console.warn('⚠️ Firebase Auth component not registered yet - this is a known React Native issue');
      console.warn('⚠️ Auth will be initialized on first use');
      // Return a mock auth object that will be replaced when auth is actually needed
      return null;
    }
    console.error('❌ Firebase Auth initialization failed:', error);
    throw error;
  }
};

// Initialize Firestore (lazy)
const getFirebaseFirestore = () => {
  if (_db) return _db;
  const firebaseApp = getFirebaseApp();
  _db = getFirestore(firebaseApp);
  return _db;
};

// Initialize Realtime Database (lazy)
const getRealtimeDatabase = () => {
  if (_rtdb) return _rtdb;
  const firebaseApp = getFirebaseApp();
  _rtdb = getDatabase(firebaseApp);
  return _rtdb;
};

// Initialize Storage (lazy)
const getFirebaseStorage = () => {
  if (_storage) return _storage;
  const firebaseApp = getFirebaseApp();
  _storage = getStorage(firebaseApp);
  return _storage;
};

// Create a robust Firebase Auth proxy that handles timing issues
const createAuthProxy = (): Auth => {
  const authProxy = new Proxy({} as Auth, {
    get(target, prop) {
      const authInstance = getFirebaseAuth();

      // Handle critical methods that should never return undefined
      if (prop === 'onAuthStateChanged') {
        return (callback: (user: any) => void) => {
          console.log('🔍 onAuthStateChanged called, authInstance:', !!authInstance);

          // If auth is not ready, set up a retry mechanism
          if (!authInstance) {
            console.warn('⚠️ Auth not ready for onAuthStateChanged, setting up retry...');

            let unsubscribeFunction: (() => void) | null = null;
            let isUnsubscribed = false;

            // Try to initialize auth with retries
            const tryInitAuth = (attempts = 0) => {
              if (isUnsubscribed) return; // Don't continue if already unsubscribed

              if (attempts >= 5) {
                console.error('❌ Failed to initialize Auth after 5 attempts');
                if (!isUnsubscribed) callback(null); // Call with null user to indicate no auth
                return;
              }

              setTimeout(() => {
                if (isUnsubscribed) return; // Don't continue if already unsubscribed

                try {
                  const firebaseApp = getFirebaseApp();
                  _auth = getAuth(firebaseApp);
                  console.log('✅ Firebase Auth initialized for onAuthStateChanged');

                  // Now set up the real listener
                  if (!isUnsubscribed) {
                    unsubscribeFunction = _auth.onAuthStateChanged(callback);
                  }
                } catch (error) {
                  console.warn(`⚠️ Auth init attempt ${attempts + 1} failed, retrying...`);
                  tryInitAuth(attempts + 1);
                }
              }, 100 * Math.pow(2, attempts)); // Exponential backoff
            };

            tryInitAuth();

            // Return unsubscribe function that will work when auth is ready
            return () => {
              isUnsubscribed = true;
              if (unsubscribeFunction) {
                unsubscribeFunction();
              }
            };
          }

          // Auth is ready, use it normally
          console.log('✅ Auth ready, setting up onAuthStateChanged listener');
          return authInstance.onAuthStateChanged(callback);
        };
      }

      // Handle other critical methods
      if (prop === 'signInWithEmailAndPassword' || prop === 'signOut' || prop === 'currentUser') {
        if (!authInstance) {
          // Try to initialize auth on demand for critical methods
          try {
            const firebaseApp = getFirebaseApp();
            _auth = getAuth(firebaseApp);
            console.log('✅ Firebase Auth initialized on demand for', prop);
            return _auth[prop as keyof Auth];
          } catch (error) {
            console.error('❌ Failed to initialize Auth for critical method:', prop, error);

            // Return appropriate fallbacks for critical methods
            if (prop === 'currentUser') return null;
            if (prop === 'signOut') return async () => {};
            if (prop === 'signInWithEmailAndPassword') {
              return async () => {
                throw new Error('Firebase Auth not available');
              };
            }
          }
        }
      }

      // For all other properties, try to get from auth instance
      if (!authInstance) {
        console.warn('⚠️ Firebase Auth still not ready, returning undefined for', prop);
        return undefined;
      }

      return authInstance[prop as keyof Auth];
    }
  });

  return authProxy;
};

// Export the robust auth proxy
export const auth = createAuthProxy();

export const db = new Proxy({} as any, {
  get(target, prop) {
    const dbInstance = getFirebaseFirestore();
    return dbInstance[prop as keyof any];
  }
});

export const rtdb = new Proxy({} as any, {
  get(target, prop) {
    const rtdbInstance = getRealtimeDatabase();
    return rtdbInstance[prop as keyof any];
  }
});

export const storage = new Proxy({} as any, {
  get(target, prop) {
    const storageInstance = getFirebaseStorage();
    return storageInstance[prop as keyof any];
  }
});

// Simple health check function
export const performFirebaseHealthCheck = async () => {
  console.log('🔍 Firebase health check...');

  try {
    const firebaseApp = getFirebaseApp();
    const authInstance = getFirebaseAuth();
    const dbInstance = getFirebaseFirestore();
    const rtdbInstance = getRealtimeDatabase();
    const storageInstance = getFirebaseStorage();

    const status = {
      app: !!firebaseApp,
      auth: !!authInstance,
      firestore: !!dbInstance,
      database: !!rtdbInstance,
      storage: !!storageInstance
    };

    console.log('📊 Firebase status:', status);
    return status.app && status.auth && status.firestore;
  } catch (error) {
    console.error('❌ Firebase health check failed:', error);
    return false;
  }
};

// Export the app getter
export default new Proxy({} as any, {
  get(target, prop) {
    const appInstance = getFirebaseApp();
    return appInstance[prop as keyof any];
  }
});

console.log('🔥 Firebase lazy initialization setup complete');
