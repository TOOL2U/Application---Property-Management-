/**
 * Firebase Configuration
 * Lazy initialization to avoid "Component auth has not been registered yet" error
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fix for React Native AsyncStorage persistence
declare const global: any;
if (typeof global !== 'undefined') {
  global.AsyncStorage = AsyncStorage;
}

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase configuration');
}

// Initialize Firebase App
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase app initialization failed:', error);
  throw error;
}

// Initialize Firestore with React Native optimized settings
let firestoreInstance: Firestore;
let initializationPromise: Promise<Firestore> | null = null;

// Create a promise-based initialization for better React Native handling
const initializeFirestoreAsync = async (): Promise<Firestore> => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    console.log('🔄 Initializing Firestore for React Native...');
    
    // For React Native, we need different persistence settings
    if (typeof window !== 'undefined') {
      // Web environment - use persistent cache
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('✅ Firestore initialized with web persistence');
    } else {
      // React Native environment - use memory cache with better settings
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache()
      });
      console.log('✅ Firestore initialized with React Native memory cache');
    }

    // Add a small delay to ensure initialization completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return firestoreInstance;
    
  } catch (error) {
    console.warn('⚠️ Firestore custom initialization failed, falling back to default:', error);
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  }
};

// Start initialization immediately but don't block
initializationPromise = initializeFirestoreAsync();

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

// Track auth initialization attempts to reduce log noise
let _authInitAttempts = 0;
let _authInitWarningShown = false;

// Initialize Firebase Auth with graceful error handling and AsyncStorage
const getFirebaseAuth = () => {
  if (_auth) return _auth;

  const firebaseApp = getFirebaseApp();

  try {
    // First try to get existing auth instance
    try {
      _auth = getAuth(firebaseApp);
      console.log('✅ Firebase Auth initialized with getAuth');
      return _auth;
    } catch (getAuthError) {
      // If getAuth fails, try initializeAuth with AsyncStorage persistence
      console.log('⚠️ getAuth failed, trying initializeAuth with AsyncStorage...');
      
      const { getReactNativePersistence } = require('firebase/auth');
      
      _auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
      return _auth;
    }
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      // If auth already exists, get it
      _auth = getAuth(firebaseApp);
      console.log('✅ Firebase Auth retrieved (already exists)');
      return _auth;
    }
    
    if (error.message?.includes('Component auth has not been registered yet')) {
      _authInitAttempts++;

      // Only show warning once to reduce log noise
      if (!_authInitWarningShown) {
        console.warn('⚠️ Firebase Auth component not registered yet - this is a known React Native issue');
        console.warn('⚠️ Auth will be initialized on first use');
        _authInitWarningShown = true;
      }

      // Return null to trigger retry mechanism
      return null;
    }
    console.error('❌ Firebase Auth initialization failed:', error);
    throw error;
  }
};

// Initialize Firestore (lazy) - ensure async initialization completes
const getFirebaseFirestore = async () => {
  if (_db) return _db;
  
  // Wait for the async initialization to complete
  try {
    _db = await initializationPromise;
    console.log('✅ Firestore instance ready for use');
    return _db;
  } catch (error) {
    console.error('❌ Failed to get Firestore instance:', error);
    throw error;
  }
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

            // Try to initialize auth with retries (reduced attempts and less logging)
            const tryInitAuth = (attempts = 0) => {
              if (isUnsubscribed) return; // Don't continue if already unsubscribed

              if (attempts >= 3) { // Reduced from 5 to 3 attempts
                if (attempts === 3) {
                  console.warn('⚠️ Firebase Auth initialization timed out after 3 attempts');
                  console.warn('⚠️ This is expected behavior in React Native - Auth will work when needed');
                }
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
                  // Only log retry attempts for first 2 attempts to reduce noise
                  if (attempts < 2) {
                    console.warn(`⚠️ Auth init attempt ${attempts + 1} failed, retrying...`);
                  }
                  tryInitAuth(attempts + 1);
                }
              }, 200 * Math.pow(1.5, attempts)); // Slower exponential backoff
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

// Synchronous db export that throws if not ready
export const db = new Proxy({} as any, {
  get(target, prop) {
    // Ensure _db is available synchronously
    if (!_db) {
      throw new Error(`Firestore not initialized. Call 'await getFirebaseFirestore()' first before using db.${String(prop)}`);
    }

    return (_db as any)[prop];
  }
});

// Async db getter for proper initialization
export const getDb = async () => {
  if (!_db) {
    _db = await getFirebaseFirestore();
  }
  return _db;
};

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
export { getFirebaseApp, getFirebaseFirestore };
export default new Proxy({} as any, {
  get(target, prop) {
    const appInstance = getFirebaseApp();
    return appInstance[prop as keyof any];
  }
});

console.log('🔥 Firebase lazy initialization setup complete');
