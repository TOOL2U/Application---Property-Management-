/**
 * Create Shared Firebase Auth User
 * This script creates the shared user for staff authentication
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const SHARED_CREDENTIALS = {
  email: 'staff@siamoon.com',
  password: 'staff123'
};

async function createSharedUser() {
  try {
    console.log('🔐 Creating shared Firebase Auth user...');
    
    // First, try to get the user to see if it exists
    try {
      const existingUser = await admin.auth().getUserByEmail(SHARED_CREDENTIALS.email);
      console.log('✅ Shared user already exists:', existingUser.uid);
      return existingUser;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('👤 User not found, creating new user...');
        
        // Create the user
        const userRecord = await admin.auth().createUser({
          email: SHARED_CREDENTIALS.email,
          password: SHARED_CREDENTIALS.password,
          displayName: 'Staff Portal User',
          emailVerified: true
        });
        
        console.log('✅ Successfully created shared user:', userRecord.uid);
        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error creating shared user:', error);
    throw error;
  }
}

// Run the function
createSharedUser()
  .then(() => {
    console.log('🎉 Shared user setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to create shared user:', error);
    process.exit(1);
  });
