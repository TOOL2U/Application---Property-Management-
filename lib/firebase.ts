import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced Firebase configuration with validation
const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);

  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase config fields:', missingFields);
    console.error('❌ Please check your .env.local file');

    // Use fallback config for development
    return {
      apiKey: "demo-api-key",
      authDomain: "demo-project.firebaseapp.com",
      databaseURL: "https://demo-project.firebaseio.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef",
      measurementId: "G-ABCDEF",
    };
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

console.log('🔥 Firebase Config Validation:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  environment: Platform.OS,
  isProduction: firebaseConfig.projectId !== 'demo-project',
});

// Enhanced Firebase app initialization with comprehensive error handling
let app: any;
const initializeFirebaseApp = () => {
  try {
    console.log('🔧 Initializing Firebase app...');

    // Check if Firebase app is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Firebase app already initialized:', app.name);
      return app;
    }

    // Initialize new Firebase app
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    console.log('📱 App name:', app.name);
    console.log('🏗️ Project ID:', app.options.projectId);

    return app;
  } catch (error) {
    console.error('❌ Firebase app initialization error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      config: {
        projectId: firebaseConfig.projectId,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId,
      }
    });

    // Try to recover by getting existing app
    try {
      console.log('🔄 Attempting to recover existing Firebase app...');
      app = getApp();
      console.log('✅ Recovered existing Firebase app');
      return app;
    } catch (recoveryError) {
      console.error('❌ Failed to recover Firebase app:', recoveryError);
      throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Initialize the Firebase app
app = initializeFirebaseApp();

// Enhanced Firebase Auth initialization with platform-specific handling
let auth: Auth;
const initializeFirebaseAuth = () => {
  try {
    console.log('🔧 Initializing Firebase Auth...');
    console.log('📱 Platform:', Platform.OS);

    // Ensure app is properly initialized
    if (!app) {
      throw new Error('Firebase app not initialized - cannot initialize Auth');
    }

    // Platform-specific Auth initialization
    if (Platform.OS === 'web') {
      // Web platform - use standard getAuth
      console.log('🌐 Initializing Auth for web platform...');
      auth = getAuth(app);
      console.log('✅ Firebase Auth initialized for web');
    } else {
      // React Native platforms (iOS/Android)
      console.log('📱 Initializing Auth for React Native platform...');

      try {
        // Try to use React Native persistence with AsyncStorage
        const { getReactNativePersistence } = require('firebase/auth/react-native');

        // Check if auth is already initialized to avoid duplicate initialization
        try {
          auth = getAuth(app);
          console.log('✅ Firebase Auth already initialized, using existing instance');
        } catch {
          // Initialize with React Native persistence
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('✅ Firebase Auth initialized with React Native AsyncStorage persistence');
        }
      } catch (persistenceError) {
        console.warn('⚠️ React Native persistence failed, using standard Auth:', persistenceError);

        // Fallback to standard getAuth
        try {
          auth = getAuth(app);
          console.log('✅ Firebase Auth initialized with standard persistence');
        } catch (standardError) {
          console.error('❌ Standard Auth initialization failed:', standardError);
          throw standardError;
        }
      }
    }

    // Verify auth instance
    if (!auth) {
      throw new Error('Firebase Auth instance is null after initialization');
    }

    // Log auth configuration
    console.log('✅ Firebase Auth initialized successfully');
    console.log('🔑 Auth app name:', auth.app.name);
    console.log('🔑 Auth config:', {
      apiKey: auth.config.apiKey ? '***' + auth.config.apiKey.slice(-4) : 'missing',
      authDomain: auth.config.authDomain,
    });

    return auth;
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error);
    console.error('❌ Detailed error info:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : 'No stack trace',
      platform: Platform.OS,
      appExists: !!app,
      appName: app?.name,
      projectId: app?.options?.projectId,
    });

    // Final fallback attempt
    try {
      console.log('🔄 Final fallback: attempting basic getAuth...');
      auth = getAuth(app);
      console.log('✅ Firebase Auth fallback successful');
      return auth;
    } catch (fallbackError) {
      console.error('❌ All Firebase Auth initialization attempts failed:', fallbackError);
      throw new Error(`Firebase Auth initialization failed on ${Platform.OS}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Initialize Firebase Auth
auth = initializeFirebaseAuth();

// Enhanced Firebase services initialization
let db: any;
let rtdb: any;
let storage: any;

const initializeFirebaseServices = () => {
  try {
    console.log('🔧 Initializing Firebase services...');

    // Initialize Firestore
    try {
      db = getFirestore(app);
      console.log('✅ Firestore initialized successfully');
    } catch (firestoreError) {
      console.error('❌ Firestore initialization failed:', firestoreError);
      throw firestoreError;
    }

    // Initialize Realtime Database
    try {
      rtdb = getDatabase(app);
      console.log('✅ Realtime Database initialized successfully');
      console.log('🔗 Database URL:', rtdb.app.options.databaseURL);
    } catch (rtdbError) {
      console.error('❌ Realtime Database initialization failed:', rtdbError);
      console.warn('⚠️ Continuing without Realtime Database...');
      rtdb = null;
    }

    // Initialize Storage
    try {
      storage = getStorage(app);
      console.log('✅ Firebase Storage initialized successfully');
    } catch (storageError) {
      console.error('❌ Storage initialization failed:', storageError);
      console.warn('⚠️ Continuing without Storage...');
      storage = null;
    }

    console.log('✅ Firebase services initialization completed');
  } catch (error) {
    console.error('❌ Firebase services initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase services
initializeFirebaseServices();

// Enhanced emulator connection for development
const connectToEmulators = () => {
  if (!__DEV__ || process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
    console.log('🔧 Emulators disabled or not in development mode');
    return;
  }

  const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  console.log('🔧 Connecting to Firebase emulators at:', emulatorHost);

  try {
    // Import emulator connection functions dynamically
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectStorageEmulator } = require('firebase/storage');

    // Connect to Auth emulator
    try {
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      console.log('✅ Connected to Auth emulator at', `${emulatorHost}:9099`);
    } catch (authEmulatorError) {
      console.warn('⚠️ Failed to connect to Auth emulator:', authEmulatorError);
    }

    // Connect to Firestore emulator
    try {
      connectFirestoreEmulator(db, emulatorHost, 8080);
      console.log('✅ Connected to Firestore emulator at', `${emulatorHost}:8080`);
    } catch (firestoreEmulatorError) {
      console.warn('⚠️ Failed to connect to Firestore emulator:', firestoreEmulatorError);
    }

    // Connect to Storage emulator (if storage is available)
    if (storage) {
      try {
        connectStorageEmulator(storage, emulatorHost, 9199);
        console.log('✅ Connected to Storage emulator at', `${emulatorHost}:9199`);
      } catch (storageEmulatorError) {
        console.warn('⚠️ Failed to connect to Storage emulator:', storageEmulatorError);
      }
    }

    console.log('✅ Firebase emulator connections completed');
    console.log('🌐 Emulator UI should be available at:', `http://${emulatorHost}:4000`);
  } catch (error) {
    console.error('❌ Firebase emulator connection failed:', error);
  }
};

// Connect to emulators if enabled
connectToEmulators();

// Comprehensive Firebase connection and health check
const performFirebaseHealthCheck = async () => {
  console.log('🔍 Starting Firebase health check...');

  const healthStatus = {
    app: false,
    auth: false,
    firestore: false,
    realtimeDb: false,
    storage: false,
  };

  try {
    // Test Firebase App
    if (app && app.name) {
      healthStatus.app = true;
      console.log('✅ Firebase App: Healthy');
    } else {
      console.error('❌ Firebase App: Not initialized');
    }

    // Test Firebase Auth
    if (auth && auth.app) {
      healthStatus.auth = true;
      console.log('✅ Firebase Auth: Healthy');

      // Test auth state listener
      try {
        const unsubscribe = auth.onAuthStateChanged(() => {});
        unsubscribe();
        console.log('✅ Firebase Auth: State listener working');
      } catch (authListenerError) {
        console.warn('⚠️ Firebase Auth: State listener failed:', authListenerError);
      }
    } else {
      console.error('❌ Firebase Auth: Not initialized');
    }

    // Test Firestore
    if (db) {
      try {
        // Simple connection test - this doesn't require network
        const testCollection = db._delegate || db;
        if (testCollection) {
          healthStatus.firestore = true;
          console.log('✅ Firestore: Healthy');
        }
      } catch (firestoreError) {
        console.error('❌ Firestore: Connection test failed:', firestoreError);
      }
    } else {
      console.error('❌ Firestore: Not initialized');
    }

    // Test Realtime Database
    if (rtdb) {
      try {
        const dbRef = rtdb._delegate || rtdb;
        if (dbRef) {
          healthStatus.realtimeDb = true;
          console.log('✅ Realtime Database: Healthy');
        }
      } catch (rtdbError) {
        console.error('❌ Realtime Database: Connection test failed:', rtdbError);
      }
    } else {
      console.warn('⚠️ Realtime Database: Not initialized (optional)');
    }

    // Test Storage
    if (storage) {
      try {
        const storageRef = storage._delegate || storage;
        if (storageRef) {
          healthStatus.storage = true;
          console.log('✅ Firebase Storage: Healthy');
        }
      } catch (storageError) {
        console.error('❌ Firebase Storage: Connection test failed:', storageError);
      }
    } else {
      console.warn('⚠️ Firebase Storage: Not initialized (optional)');
    }

    // Overall health summary
    const healthyServices = Object.values(healthStatus).filter(Boolean).length;
    const totalServices = Object.keys(healthStatus).length;

    console.log('📊 Firebase Health Check Summary:');
    console.log(`   Healthy Services: ${healthyServices}/${totalServices}`);
    console.log('   Status:', healthStatus);

    if (healthStatus.app && healthStatus.auth && healthStatus.firestore) {
      console.log('✅ Firebase: Core services are healthy and ready');
      return true;
    } else {
      console.error('❌ Firebase: Critical services are not healthy');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase health check failed:', error);
    return false;
  }
};

// Run health check
performFirebaseHealthCheck().catch(error => {
  console.error('❌ Firebase health check error:', error);
});

// Enhanced exports with null checks
export {
  auth,
  db,
  rtdb,
  storage,
  performFirebaseHealthCheck
};

export default app;

// Log final initialization status
console.log('🔥 Firebase initialization completed');
console.log('📱 Available services:', {
  app: !!app,
  auth: !!auth,
  firestore: !!db,
  realtimeDatabase: !!rtdb,
  storage: !!storage,
});
