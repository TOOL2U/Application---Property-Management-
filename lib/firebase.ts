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
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Fix for React Native AsyncStorage persistence
declare const global: any;
if (typeof global !== 'undefined') {
  global.AsyncStorage = ReactNativeAsyncStorage;
}

// Ensure AsyncStorage is available for Firebase Auth
const checkAsyncStorage = () => {
  try {
    if (typeof window === 'undefined' && ReactNativeAsyncStorage) {
      // React Native environment - ensure AsyncStorage is properly configured
      global.AsyncStorage = ReactNativeAsyncStorage;
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ AsyncStorage configuration failed:', error);
    return false;
  }
};

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
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  hasStorageBucket: !!firebaseConfig.storageBucket
});

// Validate required config - allow development mode
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  if (isDevelopment) {
    console.warn('⚠️ Missing Firebase configuration - running in development mode');
    // Use minimal config for development
    firebaseConfig.apiKey = firebaseConfig.apiKey || 'development-api-key';
    firebaseConfig.projectId = firebaseConfig.projectId || 'operty-b54dc';
    firebaseConfig.authDomain = firebaseConfig.authDomain || 'operty-b54dc.firebaseapp.com';
  } else {
    throw new Error('Missing required Firebase configuration');
  }
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
initializationPromise = initializeFirestoreAsync().then(db => {
  _db = db;
  return db;
});

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

// Initialize Firebase Auth with React Native AsyncStorage persistence
const getFirebaseAuth = () => {
  if (_auth) return _auth;

  const firebaseApp = getFirebaseApp();
  
  try {
    // Check if we're in React Native environment and use proper persistence
    if (typeof window === 'undefined') {
      // React Native environment - use initializeAuth with AsyncStorage persistence
      const { getReactNativePersistence } = require('firebase/auth');
      
      try {
        _auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
        console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
      } catch (authError: any) {
        if (authError.code === 'auth/already-initialized') {
          _auth = getAuth(firebaseApp);
          console.log('✅ Firebase Auth already initialized, using existing instance');
        } else {
          throw authError;
        }
      }
    } else {
      // Web environment - use standard getAuth
      _auth = getAuth(firebaseApp);
      console.log('✅ Firebase Auth initialized for web');
    }
    
    return _auth;
    
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 'auth/already-initialized') {
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
    if (!initializationPromise) {
      console.log('⚠️ Initialization promise not found, creating new one...');
      initializationPromise = initializeFirestoreAsync().then(db => {
        _db = db;
        return db;
      });
    }
    
    _db = await initializationPromise;
    console.log('✅ Firestore instance ready for use');
    return _db;
  } catch (error) {
    console.error('❌ Failed to get Firestore instance:', error);
    console.log('🔄 Falling back to simple getFirestore...');
    
    // Fallback to simple initialization
    try {
      _db = getFirestore(app);
      return _db;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw error;
    }
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
  
  try {
    console.log('🗄️ Initializing Firebase Storage...');
    const firebaseApp = getFirebaseApp();
    
    if (!firebaseConfig.storageBucket) {
      console.error('❌ Storage bucket not configured');
      throw new Error('Firebase Storage bucket not configured. Please check EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
    }
    
    _storage = getStorage(firebaseApp);
    console.log('✅ Firebase Storage initialized successfully with bucket:', firebaseConfig.storageBucket);
    return _storage;
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error);
    throw error;
  }
};

// Create a robust Firebase Auth proxy that handles timing issues with reduced logging
const createAuthProxy = (): Auth => {
  const authProxy = new Proxy({} as Auth, {
    get(target, prop) {
      const authInstance = getFirebaseAuth();

      // Handle critical methods that should never return undefined
      if (prop === 'onAuthStateChanged') {
        return (callback: (user: any) => void) => {
          // If auth is ready, use it immediately
          if (authInstance) {
            console.log('✅ Auth ready, setting up onAuthStateChanged listener');
            return authInstance.onAuthStateChanged(callback);
          }

          // If auth is not ready, set up a minimal retry mechanism
          console.log('🔄 Auth not ready, setting up deferred listener...');

          let unsubscribeFunction: (() => void) | null = null;
          let isUnsubscribed = false;

          // Reduced retry attempts with faster initial retry
          const tryInitAuth = (attempts = 0) => {
            if (isUnsubscribed || attempts >= 2) { // Reduced to 2 attempts max
              if (attempts >= 2) {
                console.warn('⚠️ Firebase Auth initialization timed out after 2 attempts');
                console.warn('⚠️ This is expected behavior in React Native - Auth will work when needed');
              }
              if (!isUnsubscribed) callback(null); // Call with null user
              return;
            }

            setTimeout(() => {
              if (isUnsubscribed) return;

              try {
                const firebaseApp = getFirebaseApp();
                _auth = getAuth(firebaseApp);
                
                // Set up the real listener without additional logging
                if (!isUnsubscribed) {
                  unsubscribeFunction = _auth.onAuthStateChanged(callback);
                }
              } catch (error) {
                // Silent retry on first attempt, only log on second
                if (attempts === 1) {
                  console.warn(`⚠️ Auth init attempt ${attempts + 1} failed, final attempt...`);
                }
                tryInitAuth(attempts + 1);
              }
            }, attempts === 0 ? 100 : 300); // Faster first retry, then slower
          };

          tryInitAuth();

          // Return unsubscribe function
          return () => {
            isUnsubscribed = true;
            if (unsubscribeFunction) {
              unsubscribeFunction();
            }
          };
        };
      }

      // Handle other critical methods with immediate fallbacks
      if (prop === 'signInWithEmailAndPassword' || prop === 'signOut' || prop === 'currentUser') {
        if (!authInstance) {
          // Try one immediate initialization attempt
          try {
            const firebaseApp = getFirebaseApp();
            _auth = getAuth(firebaseApp);
            return _auth[prop as keyof Auth];
          } catch (error) {
            // Return appropriate fallbacks without logging
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
        return undefined;
      }

      return authInstance[prop as keyof Auth];
    }
  });

  return authProxy;
};

// Export the robust auth proxy
export const auth = createAuthProxy();

// Synchronous db export with auto-initialization
export const db = new Proxy({} as any, {
  get(target, prop) {
    // Try to initialize if not ready
    if (!_db) {
      console.log('🔄 Auto-initializing Firestore for synchronous access...');
      try {
        // Try to get the app and initialize Firestore synchronously
        const firebaseApp = getFirebaseApp();
        _db = getFirestore(firebaseApp);
        console.log('✅ Firestore auto-initialized successfully');
      } catch (error) {
        console.error('❌ Failed to auto-initialize Firestore:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Firestore initialization failed: ${errorMessage}`);
      }
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

// Convenient function to initialize all Firebase services
export const initializeFirebase = async () => {
  try {
    console.log('🔄 Initializing Firebase services...');
    
    const app = getFirebaseApp();
    const auth = getFirebaseAuth();
    const db = await getFirebaseFirestore();
    
    console.log('✅ All Firebase services initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};
export default new Proxy({} as any, {
  get(target, prop) {
    const appInstance = getFirebaseApp();
    return appInstance[prop as keyof any];
  }
});

// Firebase Authentication Service for Staff Integration
export class FirebaseAuthService {
  static async getStaffAccountByEmail(email: string): Promise<any | null> {
    try {
      const db = await getDb();
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const staffQuery = query(
        collection(db, 'staff_accounts'),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(staffQuery);
      
      if (!querySnapshot.empty) {
        const staffDoc = querySnapshot.docs[0];
        return { id: staffDoc.id, ...staffDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting staff account by email:', error);
      throw error;
    }
  }

  static async getCurrentStaffAccount(): Promise<any | null> {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser?.email) return null;
      
      return await this.getStaffAccountByEmail(currentUser.email);
    } catch (error) {
      console.error('Error getting current staff account:', error);
      return null;
    }
  }

  static onAuthStateChanged(callback: (user: any) => void) {
    if (!auth) {
      console.error('Firebase Auth not initialized');
      return () => {};
    }
    
    return auth.onAuthStateChanged(callback);
  }
}

// Firebase Notification Service for Real-time Updates
export class FirebaseNotificationService {
  static listenToNotifications(userId: string, onUpdate: (notifications: any[]) => void) {
    try {
      const setupListener = async () => {
        const db = await getDb();
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        
        const notificationsQuery = query(
          collection(db, 'staff_notifications'),
          where('userId', '==', userId)
        );

        return onSnapshot(notificationsQuery, (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by timestamp descending (newest first)
          notifications.sort((a: any, b: any) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
          });
          
          onUpdate(notifications);
        }, (error) => {
          console.error('Error listening to notifications:', error);
        });
      };

      // Setup listener and return unsubscribe function
      let unsubscribe: (() => void) | null = null;
      setupListener().then(unsub => {
        unsubscribe = unsub;
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up notification listener:', error);
      return () => {};
    }
  }
}

console.log('🔥 Firebase lazy initialization setup complete');
