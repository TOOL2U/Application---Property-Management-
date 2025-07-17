#!/usr/bin/env node
/**
 * Create Firebase User Script
 * Creates the shared Firebase user for staff authentication
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
});

async function createUser() {
  try {
    console.log('🔐 Creating Firebase user account...');
    
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail('staff@siamoon.com');
      console.log('✅ User already exists:', existingUser.uid);
      return;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      console.log('👤 User does not exist, creating...');
    }

    // Create the user
    const userRecord = await admin.auth().createUser({
      email: 'staff@siamoon.com',
      password: 'staff123',
      emailVerified: true,
      disabled: false
    });

    console.log('✅ Successfully created user:', userRecord.uid);
    
    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: 'staff@siamoon.com',
      name: 'Staff User',
      role: 'staff',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });

    console.log('✅ User profile created in Firestore');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    process.exit(0);
  }
}

createUser();
