/**
 * Firebase Admin SDK Example Script
 * This script demonstrates how to use Firebase Admin SDK for server-side operations
 * 
 * Run with: node scripts/firebase-admin-example.js
 */

const admin = require("firebase-admin");
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return admin.apps[0];
    }

    // Method 1: Using service account key from environment variable
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Initializing with service account key from environment...');
      
      // If the key is base64 encoded, decode it first
      let serviceAccountKey;
      try {
        serviceAccountKey = JSON.parse(
          Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY, 'base64').toString()
        );
      } catch (e) {
        // If not base64, try to parse directly
        serviceAccountKey = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY);
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }
    // Method 2: Using service account file path
    else if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH) {
      console.log('📁 Initializing with service account file...');
      
      const serviceAccount = require(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL || "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "operty-b54dc"
      });
    }
    // Method 3: Using the key you provided directly (for testing)
    else {
      console.log('🧪 Initializing with direct configuration...');
      
      // This is a placeholder - you would need the actual service account JSON
      // For now, we'll use application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
        projectId: "operty-b54dc"
      });
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin.app();

  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
}

// Example: List all users
async function listAllUsers() {
  try {
    console.log('\n📋 Listing all users...');
    
    const listUsersResult = await admin.auth().listUsers(10); // Get first 10 users
    
    console.log(`Found ${listUsersResult.users.length} users:`);
    listUsersResult.users.forEach((userRecord) => {
      console.log(`- ${userRecord.email || userRecord.uid} (${userRecord.uid})`);
    });
    
    return listUsersResult;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

// Example: Get staff accounts from Firestore
async function getStaffAccounts() {
  try {
    console.log('\n👥 Getting staff accounts from Firestore...');
    
    const firestore = admin.firestore();
    const staffSnapshot = await firestore.collection('staff_accounts').get();
    
    console.log(`Found ${staffSnapshot.size} staff accounts:`);
    staffSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}) - Role: ${data.role}`);
    });
    
    return staffSnapshot;
  } catch (error) {
    console.error('❌ Error getting staff accounts:', error.message);
  }
}

// Example: Set custom claims for a user (role-based access)
async function setUserRole(email, role) {
  try {
    console.log(`\n🔐 Setting role '${role}' for user: ${email}`);
    
    // First, get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: role,
      permissions: getRolePermissions(role)
    });
    
    console.log(`✅ Role '${role}' set successfully for ${email}`);
    return userRecord;
  } catch (error) {
    console.error(`❌ Error setting role for ${email}:`, error.message);
  }
}

// Helper function to get permissions based on role
function getRolePermissions(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_properties'],
    manager: ['read', 'write', 'manage_staff', 'manage_jobs'],
    staff: ['read', 'update_jobs', 'upload_photos'],
    cleaner: ['read', 'update_jobs', 'upload_photos'],
    maintenance: ['read', 'update_jobs', 'upload_photos']
  };
  
  return permissions[role] || ['read'];
}

// Example: Send push notification
async function sendNotificationToUser(userToken, title, body, data = {}) {
  try {
    console.log(`\n📱 Sending notification to user...`);
    
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      token: userToken
    };
    
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
  }
}

// Example: Bulk update staff accounts
async function bulkUpdateStaffAccounts() {
  try {
    console.log('\n🔄 Performing bulk update on staff accounts...');
    
    const firestore = admin.firestore();
    const batch = firestore.batch();
    
    // Get all staff accounts
    const staffSnapshot = await firestore.collection('staff_accounts').get();
    
    // Update each staff account with a new field
    staffSnapshot.forEach((doc) => {
      const staffRef = firestore.collection('staff_accounts').doc(doc.id);
      batch.update(staffRef, {
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        adminUpdated: true
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`✅ Bulk updated ${staffSnapshot.size} staff accounts`);
  } catch (error) {
    console.error('❌ Error in bulk update:', error.message);
  }
}

// Main function to run examples
async function main() {
  try {
    console.log('🚀 Firebase Admin SDK Example Script');
    console.log('=====================================');
    
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    
    // Run examples
    await listAllUsers();
    await getStaffAccounts();
    
    // Example: Set role for a specific user
    // await setUserRole('staff@siamoon.com', 'staff');
    
    // Example: Send notification (you would need a valid FCM token)
    // await sendNotificationToUser('FCM_TOKEN_HERE', 'Test Notification', 'This is a test message');
    
    // Example: Bulk update
    // await bulkUpdateStaffAccounts();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    // Clean up
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  initializeFirebaseAdmin,
  listAllUsers,
  getStaffAccounts,
  setUserRole,
  sendNotificationToUser,
  bulkUpdateStaffAccounts
};
