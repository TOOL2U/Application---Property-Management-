#!/usr/bin/env node

/**
 * MANUAL-STAFF-FIX.JS - Manual Staff Integration Fix
 * 
 * This version works without Firebase Admin SDK
 * Provides step-by-step instructions for manual Firebase Console setup
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Staff accounts that need Firebase Auth integration
const STAFF_ACCOUNTS = [
  { name: 'Cleaner', email: 'cleaner@siamoon.com', id: 'dEnHUdPyZU0Uutwt6Aj5' },
  { name: 'Admin User', email: 'admin@siamoon.com', id: 'VPPtbGl8WhMicZURHOgQ9BUzJd02' },
  { name: 'Manager User', email: 'manager@siamoon.com', id: 'XQ3Q8lSWrcVmOHNF17QU' },
  { name: 'Maintenance Tech', email: 'maintenance@siamoon.com', id: 'qbx3md2OEyHPSdNtWx5Z' },
  { name: 'Staff Member', email: 'staff@siamoon.com', id: 'IDJrsXWiL2dCHVpveH97' },
  { name: 'Alan Ducker', email: 'alan@example.com', id: 'LdhyCexhnSpJbK4vTAdo' },
  { name: 'Shaun Ducker', email: 'test@example.com', id: 'k3RKPFIsPdk1WBAteJLM' },
  { name: 'Myo', email: 'myo@gmail.com', id: '2AbKGSGoAmBfErOxd1GI' },
  { name: 'Aung', email: 'aung@gmail.com', id: 'ihyGFBsVsYyiH2rGGUOQ' },
  { name: 'Pai', email: 'pai@gmail.com', id: 'yVOALkHKGfOILHGFXSkn' },
  { name: 'Thai', email: 'shaun@siamoon.com', id: '7pltkVb1MptH6aHcOO1O' }
];

async function showMainMenu() {
  console.log('\n🔧 MANUAL STAFF INTEGRATION FIX\n' + '='.repeat(50));
  console.log('This script provides step-by-step instructions for manual setup');
  console.log('when Firebase Admin SDK is not available.\n');
  
  console.log('1. Show step-by-step instructions for single staff (cleaner)');
  console.log('2. Show instructions for all staff accounts');
  console.log('3. Show Firebase Console quick links');
  console.log('4. Generate test job data');
  console.log('5. Verify current staff status (requires Firebase client)');
  console.log('6. Exit');
  console.log('='.repeat(50));

  const choice = await askQuestion('Select option (1-6): ');

  switch (choice) {
    case '1':
      await showSingleStaffInstructions();
      break;
    case '2':
      await showAllStaffInstructions();
      break;
    case '3':
      await showFirebaseLinks();
      break;
    case '4':
      await generateTestJobData();
      break;
    case '5':
      await verifyStaffStatus();
      break;
    case '6':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid option. Please select 1-6.');
  }

  setTimeout(() => showMainMenu(), 2000);
}

async function showSingleStaffInstructions() {
  const cleaner = STAFF_ACCOUNTS.find(s => s.email === 'cleaner@siamoon.com');
  
  console.log('\n🎯 SINGLE STAFF SETUP: CLEANER\n' + '='.repeat(40));
  console.log('We\'ll start with the cleaner account as a test case.\n');
  
  console.log('📋 STEP 1: CREATE FIREBASE AUTH ACCOUNT');
  console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
  console.log('2. Click "Add user" button');
  console.log(`3. Enter email: ${cleaner.email}`);
  console.log('4. Enter a password (save this for testing)');
  console.log('5. Click "Add user"');
  console.log('6. Copy the User UID from the user list (it starts with letters/numbers)');
  
  await askQuestion('\nPress Enter when you have completed Step 1 and copied the UID...');
  
  const userUID = await askQuestion('Paste the User UID here: ');
  
  if (!userUID || userUID.length < 10) {
    console.log('❌ Invalid UID. Please try again with a proper Firebase Auth UID.');
    return;
  }

  console.log('\n📋 STEP 2: UPDATE STAFF DOCUMENT');
  console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/firestore/data');
  console.log('2. Navigate to staff_accounts collection');
  console.log(`3. Find and click on document: ${cleaner.id}`);
  console.log('4. Click "Add field" button');
  console.log('5. Field name: userId');
  console.log('6. Field type: string');
  console.log(`7. Field value: ${userUID}`);
  console.log('8. Click "Update"');
  
  await askQuestion('\nPress Enter when you have updated the staff document...');
  
  console.log('\n📋 STEP 3: CREATE TEST JOB');
  console.log('1. Stay in Firestore Console');
  console.log('2. Navigate to jobs collection (or create it if it doesn\'t exist)');
  console.log('3. Click "Add document"');
  console.log('4. Use auto-generated document ID');
  console.log('5. Add these fields:');
  console.log('   - title (string): "Test Job for Cleaner"');
  console.log('   - description (string): "Mobile app test job"');
  console.log(`   - userId (string): ${userUID}`);
  console.log(`   - assignedStaffId (string): ${cleaner.id}`);
  console.log('   - status (string): "pending"');
  console.log('   - priority (string): "medium"');
  console.log('   - type (string): "cleaning"');
  console.log('   - createdAt (timestamp): [use current timestamp]');
  console.log('   - isTestJob (boolean): true');
  console.log('6. Click "Save"');
  
  await askQuestion('\nPress Enter when you have created the test job...');
  
  console.log('\n🧪 STEP 4: TEST MOBILE APP');
  console.log(`1. Login to mobile app with: ${cleaner.email}`);
  console.log('2. Use the password you set in Step 1');
  console.log('3. Check if the test job appears in the job list');
  console.log('4. If the job appears, the integration is working! ✅');
  console.log('5. If no job appears, check the userId matches in both documents');
  
  console.log('\n✅ SINGLE STAFF SETUP COMPLETE!');
  console.log('If this worked, you can repeat for other staff members.');
}

async function showAllStaffInstructions() {
  console.log('\n📝 ALL STAFF ACCOUNTS SETUP\n' + '='.repeat(40));
  console.log('Here are all staff accounts that need Firebase Auth integration:\n');
  
  STAFF_ACCOUNTS.forEach((staff, index) => {
    console.log(`${index + 1}. ${staff.name}`);
    console.log(`   Email: ${staff.email}`);
    console.log(`   Document ID: ${staff.id}`);
    console.log('   Status: ❌ Needs Firebase Auth + userId field');
    console.log('');
  });

  console.log('📋 BATCH PROCESS INSTRUCTIONS:');
  console.log('1. For each staff member above:');
  console.log('   a. Create Firebase Auth account (Authentication Console)');
  console.log('   b. Copy the User UID');
  console.log('   c. Update staff document with userId field (Firestore Console)');
  console.log('   d. Create test job with matching userId');
  console.log('');
  console.log('2. Use the single staff instructions as a template');
  console.log('3. Start with cleaner@siamoon.com first');
  console.log('4. Once confirmed working, process the rest');
  
  const showDetail = await askQuestion('\nShow detailed steps for a specific staff member? (y/n): ');
  if (showDetail.toLowerCase() === 'y') {
    console.log('\nStaff members:');
    STAFF_ACCOUNTS.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.email})`);
    });
    
    const staffIndex = await askQuestion('Select staff number: ');
    const selectedStaff = STAFF_ACCOUNTS[parseInt(staffIndex) - 1];
    
    if (selectedStaff) {
      await showDetailedStaffInstructions(selectedStaff);
    }
  }
}

async function showDetailedStaffInstructions(staff) {
  console.log(`\n🎯 DETAILED SETUP: ${staff.name}\n` + '='.repeat(40));
  
  console.log('📋 FIREBASE AUTH ACCOUNT:');
  console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
  console.log('2. Click "Add user"');
  console.log(`3. Email: ${staff.email}`);
  console.log('4. Password: [create a secure password]');
  console.log('5. Save the UID after creation');
  
  console.log('\n📋 FIRESTORE UPDATE:');
  console.log('1. Go to: https://console.firebase.google.com/project/operty-b54dc/firestore/data');
  console.log('2. Collection: staff_accounts');
  console.log(`3. Document: ${staff.id}`);
  console.log('4. Add field: userId (string) = [Firebase Auth UID]');
  
  console.log('\n📋 TEST JOB:');
  console.log('Collection: jobs');
  console.log('Document: [auto-generated ID]');
  console.log('Fields:');
  console.log(`  - title: "Test Job for ${staff.name}"`);
  console.log('  - description: "Mobile app integration test"');
  console.log('  - userId: [Firebase Auth UID]');
  console.log(`  - assignedStaffId: ${staff.id}`);
  console.log('  - status: "pending"');
  console.log('  - priority: "medium"');
  console.log('  - createdAt: [current timestamp]');
  console.log('  - isTestJob: true');
}

async function showFirebaseLinks() {
  console.log('\n🔗 FIREBASE CONSOLE QUICK LINKS\n' + '='.repeat(40));
  
  console.log('📱 AUTHENTICATION CONSOLE:');
  console.log('https://console.firebase.google.com/project/operty-b54dc/authentication/users');
  console.log('↳ Create Firebase Auth accounts for staff');
  
  console.log('\n🗄️  FIRESTORE CONSOLE:');
  console.log('https://console.firebase.google.com/project/operty-b54dc/firestore/data');
  console.log('↳ Update staff_accounts documents with userId fields');
  console.log('↳ Create test jobs with proper userId fields');
  
  console.log('\n⚙️  PROJECT SETTINGS:');
  console.log('https://console.firebase.google.com/project/operty-b54dc/settings/general');
  console.log('↳ Download service account keys if needed');
  
  console.log('\n📊 PROJECT OVERVIEW:');
  console.log('https://console.firebase.google.com/project/operty-b54dc/overview');
  console.log('↳ General project information');
  
  console.log('\n🎯 QUICK WORKFLOW:');
  console.log('1. Authentication Console → Add users for staff emails');
  console.log('2. Firestore Console → staff_accounts → Add userId fields');
  console.log('3. Firestore Console → jobs → Create test jobs');
  console.log('4. Mobile app → Test login and job display');
}

async function generateTestJobData() {
  console.log('\n📋 TEST JOB DATA GENERATOR\n' + '='.repeat(40));
  
  const staffEmail = await askQuestion('Enter staff email (or press Enter for cleaner@siamoon.com): ');
  const email = staffEmail || 'cleaner@siamoon.com';
  
  const staff = STAFF_ACCOUNTS.find(s => s.email === email);
  if (!staff) {
    console.log('❌ Staff not found. Available emails:');
    STAFF_ACCOUNTS.forEach(s => console.log(`  - ${s.email}`));
    return;
  }

  const userUID = await askQuestion('Enter the Firebase Auth UID for this staff: ');
  
  if (!userUID) {
    console.log('❌ User UID is required');
    return;
  }

  console.log('\n📋 FIRESTORE JOB DOCUMENT DATA:');
  console.log('Copy and paste these fields into Firestore Console:\n');
  
  const jobData = {
    title: `Test Job for ${staff.name}`,
    description: `Mobile app integration test job for ${staff.name}. If you can see this job in the mobile app, the integration is working correctly.`,
    userId: userUID,
    assignedStaffId: staff.id,
    status: 'pending',
    priority: 'medium',
    type: 'cleaning',
    location: {
      address: 'Test Property, Bangkok, Thailand',
      coordinates: {
        latitude: 13.7563,
        longitude: 100.5018
      }
    },
    estimatedDuration: 120,
    createdAt: '[Use Firestore timestamp]',
    isTestJob: true
  };

  console.log(JSON.stringify(jobData, null, 2));
  
  console.log('\n📋 FIRESTORE SETUP INSTRUCTIONS:');
  console.log('1. Go to Firestore Console → jobs collection');
  console.log('2. Click "Add document"');
  console.log('3. Use auto-generated document ID');
  console.log('4. Add each field above with the specified values');
  console.log('5. For createdAt, use "timestamp" type with current date/time');
  console.log('6. For location, use "map" type and add the sub-fields');
}

async function verifyStaffStatus() {
  console.log('\n🔍 STAFF STATUS VERIFICATION\n' + '='.repeat(40));
  console.log('This requires manual verification in Firebase Console.\n');
  
  console.log('📋 VERIFICATION CHECKLIST:');
  console.log('For each staff member, check:');
  console.log('');
  
  STAFF_ACCOUNTS.forEach((staff, index) => {
    console.log(`${index + 1}. ${staff.name} (${staff.email})`);
    console.log(`   📧 Firebase Auth: Check if user exists in Authentication console`);
    console.log(`   📄 Staff Document: Check if userId field exists in document ${staff.id}`);
    console.log(`   🔗 Match: Verify userId in staff document matches Auth UID`);
    console.log('');
  });

  console.log('🔗 Quick Links:');
  console.log('• Authentication: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
  console.log('• Firestore: https://console.firebase.google.com/project/operty-b54dc/firestore/data/~2Fstaff_accounts');
}

async function main() {
  console.log('🚀 Starting Manual Staff Fix Guide...');
  console.log('This tool provides step-by-step instructions for manual Firebase Console setup.\n');
  
  await showMainMenu();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Guide closed by user');
  rl.close();
  process.exit(0);
});

// Run the guide
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Guide failed:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { showMainMenu, STAFF_ACCOUNTS };
