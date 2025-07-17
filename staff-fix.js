#!/usr/bin/env node

/**
 * STAFF-FIX.JS - Mobile Integration Fix Script
 * 
 * CRITICAL ISSUE: Staff accounts missing userId fields for mobile app integration
 * SOLUTION: Create Firebase Auth accounts and link to staff documents
 * 
 * Usage: node staff-fix.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
try {
  // Try to use existing admin app or initialize new one
  if (!admin.apps.length) {
    const serviceAccount = require('./firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com"
    });
  }
} catch (error) {
  console.log('⚠️  Firebase Admin not configured. Using environment variables...');
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (envError) {
    console.error('❌ Firebase Admin setup failed:', envError.message);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Save as firebase-admin-key.json in project root');
    console.log('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Generate a secure password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// List all staff accounts and their status
async function listStaffAccounts() {
  console.log('\n📋 STAFF ACCOUNTS STATUS\n' + '='.repeat(50));
  
  try {
    const staffSnapshot = await db.collection('staff_accounts').get();
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff accounts found');
      return [];
    }

    const staffList = [];
    staffSnapshot.forEach(doc => {
      const data = doc.data();
      const hasUserId = !!data.userId;
      const status = hasUserId ? '✅ LINKED' : '❌ MISSING userId';
      
      staffList.push({
        id: doc.id,
        email: data.email || 'No email',
        displayName: data.displayName || data.name || 'Unknown',
        role: data.role || 'No role',
        userId: data.userId || null,
        hasUserId
      });
      
      console.log(`${status} | ${data.displayName || data.name || 'Unknown'} (${data.email || 'No email'})`);
    });

    const linkedCount = staffList.filter(s => s.hasUserId).length;
    const missingCount = staffList.filter(s => !s.hasUserId).length;
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Linked to Firebase Auth: ${linkedCount}`);
    console.log(`❌ Missing userId field: ${missingCount}`);
    console.log(`📝 Total staff accounts: ${staffList.length}`);
    
    return staffList;
  } catch (error) {
    console.error('❌ Error listing staff:', error.message);
    return [];
  }
}

// Create Firebase Auth account for staff member
async function createAuthAccount(email, displayName, customPassword = null) {
  try {
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`ℹ️  Firebase Auth account already exists for ${email}`);
      return existingUser.uid;
    } catch (notFoundError) {
      // User doesn't exist, create new one
    }

    const password = customPassword || generatePassword();
    
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });

    console.log(`✅ Created Firebase Auth account for ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 UID: ${userRecord.uid}`);
    
    return userRecord.uid;
  } catch (error) {
    console.error(`❌ Error creating auth account for ${email}:`, error.message);
    return null;
  }
}

// Update staff document with userId
async function updateStaffWithUserId(staffId, userId) {
  try {
    await db.collection('staff_accounts').doc(staffId).update({
      userId: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Updated staff document ${staffId} with userId: ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating staff document:`, error.message);
    return false;
  }
}

// Process a single staff account
async function processSingleStaff(staffData, customPassword = null) {
  console.log(`\n🔄 Processing: ${staffData.displayName} (${staffData.email})`);
  
  if (staffData.hasUserId) {
    console.log(`ℹ️  Already has userId: ${staffData.userId}`);
    return true;
  }

  if (!staffData.email || !staffData.email.includes('@')) {
    console.log(`❌ Invalid email address: ${staffData.email}`);
    return false;
  }

  // Create Firebase Auth account
  const userId = await createAuthAccount(staffData.email, staffData.displayName, customPassword);
  if (!userId) {
    return false;
  }

  // Update staff document
  const success = await updateStaffWithUserId(staffData.id, userId);
  if (success) {
    console.log(`✅ Successfully linked ${staffData.displayName} to Firebase Auth`);
    return true;
  }
  
  return false;
}

// Create test job for staff member
async function createTestJob(staffData) {
  if (!staffData.userId) {
    console.log(`❌ Cannot create job: ${staffData.displayName} has no userId`);
    return false;
  }

  try {
    const testJob = {
      title: `Test Job for ${staffData.displayName}`,
      description: `This is a test job to verify mobile app integration for ${staffData.displayName}. If you can see this job in the mobile app, the integration is working correctly.`,
      userId: staffData.userId, // CRITICAL: This links to Firebase Auth UID
      assignedStaffId: staffData.id, // This links to staff document
      status: 'pending',
      priority: 'medium',
      type: 'cleaning', // Default type
      location: {
        address: 'Test Property, Bangkok, Thailand',
        coordinates: {
          latitude: 13.7563,
          longitude: 100.5018
        }
      },
      estimatedDuration: 120, // 2 hours
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'staff-fix-script',
      isTestJob: true // Mark as test job for easy identification
    };

    const jobRef = await db.collection('jobs').add(testJob);
    console.log(`✅ Created test job ${jobRef.id} for ${staffData.displayName}`);
    console.log(`📱 Staff should see this job in mobile app after login`);
    
    return jobRef.id;
  } catch (error) {
    console.error(`❌ Error creating test job:`, error.message);
    return false;
  }
}

// Quick start with cleaner account
async function quickStartCleaner() {
  console.log('\n🚀 QUICK START: Cleaner Account Setup\n' + '='.repeat(50));
  
  try {
    // Find cleaner account
    const staffSnapshot = await db.collection('staff_accounts')
      .where('email', '==', 'cleaner@siamoon.com')
      .get();
    
    if (staffSnapshot.empty) {
      console.log('❌ Cleaner account (cleaner@siamoon.com) not found');
      return false;
    }

    const cleanerDoc = staffSnapshot.docs[0];
    const cleanerData = {
      id: cleanerDoc.id,
      ...cleanerDoc.data(),
      hasUserId: !!cleanerDoc.data().userId
    };

    console.log(`Found: ${cleanerData.displayName || cleanerData.name} (${cleanerData.email})`);
    
    if (cleanerData.hasUserId) {
      console.log(`✅ Already linked with userId: ${cleanerData.userId}`);
    } else {
      // Ask for password
      const useCustomPassword = await askQuestion('Set custom password? (y/n): ');
      let password = null;
      
      if (useCustomPassword.toLowerCase() === 'y') {
        password = await askQuestion('Enter password for cleaner@siamoon.com: ');
      }

      console.log('\n🔄 Setting up cleaner account...');
      const success = await processSingleStaff(cleanerData, password);
      
      if (!success) {
        console.log('❌ Failed to setup cleaner account');
        return false;
      }

      // Refresh data
      const updatedDoc = await db.collection('staff_accounts').doc(cleanerData.id).get();
      cleanerData.userId = updatedDoc.data().userId;
    }

    // Ask to create test job
    const createJob = await askQuestion('\nCreate test job for cleaner? (y/n): ');
    if (createJob.toLowerCase() === 'y') {
      await createTestJob(cleanerData);
    }

    console.log('\n✅ QUICK START COMPLETE!');
    console.log('\n📱 MOBILE APP TESTING:');
    console.log(`Email: cleaner@siamoon.com`);
    console.log(`Check Firebase Console for password or use the one set above`);
    console.log('\n🧪 TEST STEPS:');
    console.log('1. Login to mobile app with cleaner credentials');
    console.log('2. Verify test job appears in job list');
    console.log('3. Confirm real-time updates work');
    
    return true;
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    return false;
  }
}

// Process all staff accounts
async function processAllStaff() {
  console.log('\n🔄 PROCESSING ALL STAFF ACCOUNTS\n' + '='.repeat(50));
  
  const staffList = await listStaffAccounts();
  const missingUserIds = staffList.filter(s => !s.hasUserId);
  
  if (missingUserIds.length === 0) {
    console.log('✅ All staff accounts already have userIds!');
    return true;
  }

  console.log(`\n🎯 Found ${missingUserIds.length} staff accounts that need userIds`);
  const confirm = await askQuestion(`\nProceed to create Firebase Auth accounts for all ${missingUserIds.length} staff? (y/n): `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Operation cancelled.');
    return false;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const staff of missingUserIds) {
    console.log(`\n--- Processing ${staff.displayName} ---`);
    const success = await processSingleStaff(staff);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 BATCH PROCESSING COMPLETE');
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📝 Total processed: ${successCount + failureCount}`);

  if (successCount > 0) {
    const createJobs = await askQuestion('\nCreate test jobs for successfully processed staff? (y/n): ');
    if (createJobs.toLowerCase() === 'y') {
      console.log('\n🔄 Creating test jobs...');
      
      // Get updated staff data
      const updatedStaffList = await listStaffAccounts();
      const staffWithUserIds = updatedStaffList.filter(s => s.hasUserId);
      
      for (const staff of staffWithUserIds) {
        await createTestJob(staff);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  return successCount > 0;
}

// Main menu
async function showMenu() {
  console.log('\n🔧 STAFF-FIX.JS - Mobile Integration Fix\n' + '='.repeat(50));
  console.log('1. List all staff accounts (show missing userIds)');
  console.log('2. Update a single staff account with userId');
  console.log('3. Process ALL staff accounts (batch update)');
  console.log('4. Create test jobs for staff members');
  console.log('5. Quick start with cleaner@siamoon.com');
  console.log('6. Exit');
  console.log('='.repeat(50));

  const choice = await askQuestion('Select option (1-6): ');

  switch (choice) {
    case '1':
      await listStaffAccounts();
      break;
      
    case '2':
      const staffList = await listStaffAccounts();
      const missingUserIds = staffList.filter(s => !s.hasUserId);
      
      if (missingUserIds.length === 0) {
        console.log('✅ All staff accounts already have userIds!');
        break;
      }

      console.log('\nStaff accounts that need userIds:');
      missingUserIds.forEach((staff, index) => {
        console.log(`${index + 1}. ${staff.displayName} (${staff.email})`);
      });

      const staffIndex = await askQuestion('\nSelect staff number: ');
      const selectedStaff = missingUserIds[parseInt(staffIndex) - 1];
      
      if (selectedStaff) {
        const password = await askQuestion('Enter password (or press enter for auto-generated): ');
        await processSingleStaff(selectedStaff, password || null);
      } else {
        console.log('❌ Invalid selection');
      }
      break;
      
    case '3':
      await processAllStaff();
      break;
      
    case '4':
      const allStaff = await listStaffAccounts();
      const staffWithUserIds = allStaff.filter(s => s.hasUserId);
      
      if (staffWithUserIds.length === 0) {
        console.log('❌ No staff accounts have userIds yet. Run option 3 first.');
        break;
      }

      console.log(`\nCreating test jobs for ${staffWithUserIds.length} staff members...`);
      for (const staff of staffWithUserIds) {
        await createTestJob(staff);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      break;
      
    case '5':
      await quickStartCleaner();
      break;
      
    case '6':
      console.log('👋 Goodbye!');
      rl.close();
      return;
      
    default:
      console.log('❌ Invalid option. Please select 1-6.');
  }

  // Show menu again unless exiting
  setTimeout(() => showMenu(), 2000);
}

// Start the application
async function main() {
  console.log('🚀 Starting Staff-Fix Script...');
  
  try {
    // Test Firebase connection
    await db.collection('staff_accounts').limit(1).get();
    console.log('✅ Firebase connection successful');
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    process.exit(1);
  }

  await showMenu();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Script terminated by user');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = {
  listStaffAccounts,
  processSingleStaff,
  createTestJob,
  quickStartCleaner,
  processAllStaff
};
