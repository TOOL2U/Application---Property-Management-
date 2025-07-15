/**
 * Staff Accounts Migration Script
 * 
 * This script migrates user accounts from the old 'staff accounts' collection
 * to the new 'staff_accounts' collection with proper password hashing.
 * 
 * Usage:
 * 1. Run this script with Node.js: node scripts/migrate-staff-accounts.js
 * 2. Follow the prompts to confirm migration
 * 
 * Note: This script requires Firebase Admin SDK access
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Initialize Firebase Admin with service account
// You need to have a service account key file for this to work
try {
  // Try to load from environment variable first
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Otherwise load from file
    serviceAccount = require('../serviceAccountKey.json');
  }

  initializeApp({
    credential: cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.log('\nTo fix this issue:');
  console.log('1. Generate a service account key from the Firebase console');
  console.log('2. Save it as "serviceAccountKey.json" in the project root');
  console.log('3. Or set the FIREBASE_SERVICE_ACCOUNT environment variable');
  process.exit(1);
}

const db = getFirestore();
const OLD_COLLECTION = 'staff accounts';
const NEW_COLLECTION = 'staff_accounts';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hash password using bcrypt
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Migrate a single user
async function migrateUser(oldUser, oldUserId) {
  try {
    // Check if user already exists in new collection
    const existingUser = await db.collection(NEW_COLLECTION)
      .where('email', '==', oldUser.email)
      .get();
    
    if (!existingUser.empty) {
      console.log(`⚠️ User ${oldUser.email} already exists in ${NEW_COLLECTION}, skipping`);
      return false;
    }

    // Hash the password
    const passwordHash = await hashPassword(oldUser.password || 'changeme123');

    // Create new user document
    const newUserData = {
      email: oldUser.email,
      passwordHash: passwordHash,
      name: `${oldUser.firstName || ''} ${oldUser.lastName || ''}`.trim(),
      role: oldUser.role || 'staff',
      department: oldUser.department || '',
      phone: oldUser.phone || '',
      address: oldUser.address || '',
      isActive: oldUser.isActive === false ? false : true,
      createdAt: oldUser.createdAt || new Date(),
      updatedAt: new Date(),
      lastLogin: oldUser.lastLogin || null
    };

    // Use the same document ID
    await db.collection(NEW_COLLECTION).doc(oldUserId).set(newUserData);
    
    console.log(`✅ Migrated user: ${oldUser.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to migrate user ${oldUser.email}:`, error);
    return false;
  }
}

// Main migration function
async function migrateUsers() {
  try {
    console.log(`\n🔄 Starting migration from '${OLD_COLLECTION}' to '${NEW_COLLECTION}'...\n`);
    
    // Get all users from old collection
    const oldUsers = await db.collection(OLD_COLLECTION).get();
    
    if (oldUsers.empty) {
      console.log(`❌ No users found in '${OLD_COLLECTION}' collection`);
      return;
    }
    
    console.log(`📊 Found ${oldUsers.size} users to migrate\n`);
    
    // Ask for confirmation
    rl.question('⚠️ This will migrate all users to the new collection. Continue? (y/n): ', async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Migration cancelled');
        rl.close();
        return;
      }
      
      console.log('\n🔄 Starting migration...\n');
      
      let successCount = 0;
      let failCount = 0;
      
      // Process each user
      for (const doc of oldUsers.docs) {
        const oldUser = doc.data();
        const success = await migrateUser(oldUser, doc.id);
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      console.log('\n✅ Migration completed');
      console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed`);
      
      rl.close();
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    rl.close();
  }
}

// Start migration
migrateUsers();
