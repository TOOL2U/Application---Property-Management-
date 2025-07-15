/**
 * Firebase Admin SDK Configuration
 * Enhanced for job assignment integration between webapp and mobile app
 *
 * IMPORTANT: This should only be used in server-side code or secure environments
 * Never expose admin credentials in client-side code
 */

import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App;

export const initializeFirebaseAdmin = () => {
  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as admin.app.App;
    return adminApp;
  }

  try {
    // Method 1: Using individual environment variables (recommended for job assignment integration)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // Method 2: Using service account key directly (legacy support)
    else if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
      let serviceAccount;
      try {
        // Try base64 decode first
        serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY, 'base64').toString()
        );
      } catch (e) {
        // If not base64, try direct parse
        serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY);
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }
    // Method 3: Using service account file path (for development)
    else if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH);

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }
    // Method 4: Using default credentials (for Google Cloud environments)
    else {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }

    console.log('✅ Firebase Admin SDK initialized successfully for job assignment integration');
    return adminApp;

  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Get Firebase Admin services
export const getFirebaseAdmin = () => {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return adminApp;
};

// Firestore Admin
export const getFirestoreAdmin = () => {
  const app = getFirebaseAdmin();
  return app.firestore();
};

// Realtime Database Admin
export const getDatabaseAdmin = () => {
  const app = getFirebaseAdmin();
  return app.database();
};

// Auth Admin
export const getAuthAdmin = () => {
  const app = getFirebaseAdmin();
  return app.auth();
};

// Storage Admin
export const getStorageAdmin = () => {
  const app = getFirebaseAdmin();
  return app.storage();
};

// Messaging Admin (for push notifications)
export const getMessagingAdmin = () => {
  const app = getFirebaseAdmin();
  return app.messaging();
};

/**
 * Example Admin Operations
 */

// Create a custom token for a user
export const createCustomToken = async (uid: string, additionalClaims?: object) => {
  try {
    const auth = getAuthAdmin();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return { success: true, token: customToken };
  } catch (error) {
    console.error('Error creating custom token:', error);
    return { success: false, error: error.message };
  }
};

// Verify an ID token
export const verifyIdToken = async (idToken: string) => {
  try {
    const auth = getAuthAdmin();
    const decodedToken = await auth.verifyIdToken(idToken);
    return { success: true, decodedToken };
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return { success: false, error: error.message };
  }
};

// Set custom user claims (for role-based access)
export const setCustomUserClaims = async (uid: string, customClaims: object) => {
  try {
    const auth = getAuthAdmin();
    await auth.setCustomUserClaims(uid, customClaims);
    return { success: true };
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    return { success: false, error: error.message };
  }
};

// Bulk create users
export const bulkCreateUsers = async (users: admin.auth.CreateRequest[]) => {
  try {
    const auth = getAuthAdmin();
    const result = await auth.createUsers(users);
    return { success: true, result };
  } catch (error) {
    console.error('Error bulk creating users:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple devices
export const sendMulticastNotification = async (
  tokens: string[],
  notification: admin.messaging.Notification,
  data?: { [key: string]: string }
) => {
  try {
    const messaging = getMessagingAdmin();
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification,
      data,
    };
    
    const response = await messaging.sendMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
};

// Batch Firestore operations
export const batchFirestoreOperation = async (operations: any[]) => {
  try {
    const firestore = getFirestoreAdmin();
    const batch = firestore.batch();
    
    operations.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error in batch Firestore operation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Usage Examples:
 * 
 * // Initialize (call once at app startup)
 * initializeFirebaseAdmin();
 * 
 * // Use in your API routes or server functions
 * const firestore = getFirestoreAdmin();
 * const auth = getAuthAdmin();
 * 
 * // Create custom token for user
 * const tokenResult = await createCustomToken('user123', { role: 'admin' });
 * 
 * // Set user role
 * await setCustomUserClaims('user123', { role: 'admin', permissions: ['read', 'write'] });
 * 
 * // Send push notification
 * await sendMulticastNotification(
 *   ['device_token_1', 'device_token_2'],
 *   { title: 'New Job Assigned', body: 'You have a new cleaning job' },
 *   { jobId: 'job123', type: 'cleaning' }
 * );
 */

// Enhanced exports for job assignment integration
export const db = getFirestoreAdmin;
export const messaging = getMessagingAdmin;
export const auth = getAuthAdmin;

// Job Assignment Integration Functions
export const adminJobAssignmentService = {
  // Initialize admin services
  init: initializeFirebaseAdmin,

  // Database access
  getFirestore: getFirestoreAdmin,
  getDatabase: getDatabaseAdmin,

  // Messaging for notifications
  getMessaging: getMessagingAdmin,
  sendJobNotification: sendMulticastNotification,

  // Authentication
  getAuth: getAuthAdmin,
  verifyToken: verifyIdToken,

  // Batch operations for job assignments
  batchUpdate: batchFirestoreOperation,
};

export default {
  initializeFirebaseAdmin,
  getFirebaseAdmin,
  getFirestoreAdmin,
  getDatabaseAdmin,
  getAuthAdmin,
  getStorageAdmin,
  getMessagingAdmin,
  createCustomToken,
  verifyIdToken,
  setCustomUserClaims,
  bulkCreateUsers,
  sendMulticastNotification,
  batchFirestoreOperation,

  // Enhanced exports
  db: getFirestoreAdmin,
  messaging: getMessagingAdmin,
  auth: getAuthAdmin,
  adminJobAssignmentService,
};
