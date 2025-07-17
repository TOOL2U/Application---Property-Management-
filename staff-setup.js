/**
 * Staff Setup Script - Links staff accounts to Firebase Auth
 * This script helps you create userId links between staff_accounts and Firebase Auth
 */

const admin = require('firebase-admin');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using the existing configuration
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
    // Method 3: Try application default credentials
    else {
      console.log('🧪 Initializing with application default credentials...');
      
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
    console.log('\n💡 Please ensure you have Firebase Admin credentials set up:');
    console.log('1. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY in .env.local');
    console.log('2. Or set FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH to point to service account file');
    console.log('3. Or use Google Application Default Credentials');
    throw error;
  }
}

// Start the script
console.log('🚀 Staff Setup Script Starting...');
console.log('This script helps link staff accounts to Firebase Auth for mobile app usage.\n');

// Initialize Firebase Admin
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin. Exiting...');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main menu
async function showMenu() {

showMenu().catch(error => {
  console.error('❌ Script error:', error);
  rl.close();
});
  console.log('\n🛠️  STAFF SETUP UTILITY');
  console.log('======================================');
  console.log('1. List all staff accounts and their userId status');
  console.log('2. Update a staff account with userId');
  console.log('3. Create Firebase Auth account for staff');
  console.log('4. Create test jobs for staff with userIds');
  console.log('5. Check which staff accounts need userIds');
  console.log('6. Bulk setup: Create auth accounts for all staff');
  console.log('7. Test mobile app authentication flow');
  console.log('8. Exit');
  console.log('======================================');
  
  const choice = await askQuestion('Choose an option (1-8): ');
  
  switch (choice) {
    case '1':
      await listStaffAccounts();
      break;
    case '2':
      await updateStaffWithUserId();
      break;
    case '3':
      await createFirebaseAuthAccount();
      break;
    case '4':
      await createTestJobs();
      break;
    case '5':
      await checkStaffNeedingUserIds();
      break;
    case '6':
      await bulkSetupAuthAccounts();
      break;
    case '7':
      await testMobileAuthFlow();
      break;
    case '8':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid option. Please choose 1-8.');
  }
  
  await showMenu();
}

// Option 1: List all staff accounts
async function listStaffAccounts() {
  console.log('\n👥 STAFF ACCOUNTS STATUS');
  console.log('==========================================');
  
  try {
    const staffSnapshot = await db.collection('staff_accounts').get();
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff accounts found!');
      return;
    }
    
    let index = 1;
    for (const doc of staffSnapshot.docs) {
      const data = doc.data();
      
      console.log(`\n${index}. 👤 ${data.displayName || data.name || 'Unknown'}`);
      console.log(`   📧 Email: ${data.email}`);
      console.log(`   🎭 Role: ${data.role}`);
      console.log(`   🆔 Document ID: ${doc.id}`);
      console.log(`   🔐 Has userId: ${data.userId ? '✅ YES (' + data.userId + ')' : '❌ NO'}`);
      console.log(`   ✅ Active: ${data.status === 'active' || data.isActive ? 'Yes' : 'No'}`);
      
      // Check if Firebase Auth account exists
      if (data.userId) {
        try {
          const userRecord = await auth.getUser(data.userId);
          console.log(`   🔥 Firebase Auth: ✅ EXISTS (${userRecord.email})`);
        } catch (error) {
          console.log(`   🔥 Firebase Auth: ❌ NOT FOUND`);
        }
      }
      
      index++;
    }
    
  } catch (error) {
    console.error('❌ Error listing staff accounts:', error.message);
  }
}

// Option 2: Update staff account with userId
async function updateStaffWithUserId() {
  console.log('\n🔗 UPDATE STAFF ACCOUNT WITH USERID');
  console.log('=====================================');
  
  // First show available staff
  await listStaffAccounts();
  
  const staffId = await askQuestion('\nEnter the Document ID of the staff to update: ');
  
  try {
    const staffDoc = await db.collection('staff_accounts').doc(staffId).get();
    
    if (!staffDoc.exists) {
      console.log('❌ Staff account not found!');
      return;
    }
    
    const staffData = staffDoc.data();
    console.log(`\n👤 Selected: ${staffData.displayName || staffData.name}`);
    console.log(`📧 Email: ${staffData.email}`);
    
    if (staffData.userId) {
      console.log(`⚠️ This staff already has a userId: ${staffData.userId}`);
      const overwrite = await askQuestion('Do you want to overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        return;
      }
    }
    
    console.log('\nChoose how to set the userId:');
    console.log('1. Use existing Firebase Auth UID');
    console.log('2. Create new Firebase Auth account');
    
    const method = await askQuestion('Choose method (1 or 2): ');
    
    let userId;
    
    if (method === '1') {
      userId = await askQuestion('Enter the Firebase Auth UID: ');
      
      // Verify the UID exists
      try {
        const userRecord = await auth.getUser(userId);
        console.log(`✅ Found Firebase Auth user: ${userRecord.email}`);
      } catch (error) {
        console.log('❌ Firebase Auth user not found with that UID');
        return;
      }
      
    } else if (method === '2') {
      // Create new Firebase Auth account
      const password = await askQuestion('Enter password for new auth account: ');
      
      try {
        const userRecord = await auth.createUser({
          email: staffData.email,
          password: password,
          displayName: staffData.displayName || staffData.name,
          disabled: false
        });
        
        userId = userRecord.uid;
        console.log(`✅ Created Firebase Auth account with UID: ${userId}`);
        
      } catch (error) {
        console.log(`❌ Failed to create Firebase Auth account: ${error.message}`);
        return;
      }
    } else {
      console.log('❌ Invalid method choice');
      return;
    }
    
    // Update staff account with userId
    await db.collection('staff_accounts').doc(staffId).update({
      userId: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully updated staff account with userId: ${userId}`);
    console.log('🎉 This staff can now use the mobile app!');
    
  } catch (error) {
    console.error('❌ Error updating staff account:', error.message);
  }
}

// Option 3: Create Firebase Auth account
async function createFirebaseAuthAccount() {
  console.log('\n🔥 CREATE FIREBASE AUTH ACCOUNT');
  console.log('=================================');
  
  const email = await askQuestion('Enter email address: ');
  const password = await askQuestion('Enter password: ');
  const displayName = await askQuestion('Enter display name: ');
  
  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      disabled: false
    });
    
    console.log(`✅ Created Firebase Auth account:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName}`);
    console.log('\n💡 You can now use this UID to update a staff account (Option 2)');
    
  } catch (error) {
    console.error('❌ Failed to create Firebase Auth account:', error.message);
  }
}

// Option 4: Create test jobs
async function createTestJobs() {
  console.log('\n📋 CREATE TEST JOBS FOR STAFF');
  console.log('===============================');
  
  // Get staff with userIds
  const staffSnapshot = await db.collection('staff_accounts').get();
  const staffWithUserIds = [];
  
  for (const doc of staffSnapshot.docs) {
    const data = doc.data();
    if (data.userId && (data.status === 'active' || data.isActive)) {
      staffWithUserIds.push({
        id: doc.id,
        ...data
      });
    }
  }
  
  if (staffWithUserIds.length === 0) {
    console.log('❌ No staff accounts with userIds found!');
    console.log('💡 Please use Option 2 to add userIds to staff accounts first');
    return;
  }
  
  console.log('\n👥 Staff with userIds:');
  staffWithUserIds.forEach((staff, index) => {
    console.log(`${index + 1}. ${staff.displayName || staff.name} (${staff.email}) - userId: ${staff.userId}`);
  });
  
  const staffIndex = await askQuestion('\nSelect staff number: ') - 1;
  
  if (staffIndex < 0 || staffIndex >= staffWithUserIds.length) {
    console.log('❌ Invalid staff selection');
    return;
  }
  
  const selectedStaff = staffWithUserIds[staffIndex];
  const numJobs = await askQuestion('How many test jobs to create? (1-5): ');
  
  const jobCount = parseInt(numJobs);
  if (isNaN(jobCount) || jobCount < 1 || jobCount > 5) {
    console.log('❌ Invalid number of jobs');
    return;
  }
  
  const jobTemplates = [
    {
      title: 'Emergency Plumbing Repair',
      description: 'Fix leaking pipe in unit 204',
      priority: 'urgent',
      type: 'maintenance'
    },
    {
      title: 'Room Cleaning Service',
      description: 'Deep clean suite 305 after checkout',
      priority: 'high',
      type: 'cleaning'
    },
    {
      title: 'HVAC Maintenance Check',
      description: 'Monthly HVAC system inspection',
      priority: 'medium',
      type: 'maintenance'
    },
    {
      title: 'Guest Welcome Setup',
      description: 'Prepare room 102 for VIP guest arrival',
      priority: 'high',
      type: 'concierge'
    },
    {
      title: 'Facility Inspection',
      description: 'Weekly safety and maintenance check',
      priority: 'low',
      type: 'inspection'
    }
  ];
  
  try {
    for (let i = 0; i < jobCount; i++) {
      const template = jobTemplates[i % jobTemplates.length];
      
      const jobData = {
        title: `${template.title} ${i + 1}`,
        description: template.description,
        userId: selectedStaff.userId, // Critical: Link to Firebase Auth UID
        assignedStaffId: selectedStaff.id, // Link to staff document ID
        status: 'pending',
        priority: template.priority,
        type: template.type,
        location: {
          address: '123 Property Management St, Suite ' + (200 + i),
          unit: `Unit ${200 + i}`
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: admin.firestore.FieldValue.serverTimestamp(),
        estimatedDuration: 60 + (i * 15), // minutes
        tags: [template.type, 'test'],
        notes: `Test job created for ${selectedStaff.displayName || selectedStaff.name}`
      };
      
      const jobRef = await db.collection('jobs').add(jobData);
      console.log(`✅ Created job ${i + 1}: ${template.title} (${jobRef.id})`);
    }
    
    console.log(`\n🎉 Successfully created ${jobCount} test jobs for ${selectedStaff.displayName || selectedStaff.name}`);
    console.log(`📱 These jobs should now appear in the mobile app when logged in as ${selectedStaff.email}`);
    
  } catch (error) {
    console.error('❌ Error creating test jobs:', error.message);
  }
}

// Option 5: Check which staff need userIds
async function checkStaffNeedingUserIds() {
  console.log('\n🔍 STAFF ACCOUNTS NEEDING USERIDS');
  console.log('===================================');
  
  try {
    const staffSnapshot = await db.collection('staff_accounts').get();
    const needingUserIds = [];
    const haveUserIds = [];
    
    for (const doc of staffSnapshot.docs) {
      const data = doc.data();
      const isActive = data.status === 'active' || data.isActive;
      
      if (isActive) {
        if (!data.userId) {
          needingUserIds.push({ id: doc.id, ...data });
        } else {
          haveUserIds.push({ id: doc.id, ...data });
        }
      }
    }
    
    console.log(`\n✅ Staff with userIds (${haveUserIds.length}):`);
    haveUserIds.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.displayName || staff.name} (${staff.email}) - ${staff.userId}`);
    });
    
    console.log(`\n❌ Staff needing userIds (${needingUserIds.length}):`);
    needingUserIds.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.displayName || staff.name} (${staff.email}) - ID: ${staff.id}`);
    });
    
    if (needingUserIds.length > 0) {
      console.log(`\n💡 Use Option 2 to add userIds to the ${needingUserIds.length} staff account(s) above`);
    } else {
      console.log('\n🎉 All active staff accounts have userIds!');
    }
    
  } catch (error) {
    console.error('❌ Error checking staff accounts:', error.message);
  }
}

// Option 6: Bulk setup auth accounts
async function bulkSetupAuthAccounts() {
  console.log('\n⚡ BULK SETUP FIREBASE AUTH ACCOUNTS');
  console.log('======================================');
  
  await checkStaffNeedingUserIds();
  
  const confirm = await askQuestion('\nDo you want to create Firebase Auth accounts for all staff without userIds? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    return;
  }
  
  const defaultPassword = await askQuestion('Enter default password for all accounts: ');
  
  try {
    const staffSnapshot = await db.collection('staff_accounts').get();
    let created = 0;
    
    for (const doc of staffSnapshot.docs) {
      const data = doc.data();
      const isActive = data.status === 'active' || data.isActive;
      
      if (isActive && !data.userId) {
        try {
          console.log(`Creating auth account for ${data.displayName || data.name}...`);
          
          const userRecord = await auth.createUser({
            email: data.email,
            password: defaultPassword,
            displayName: data.displayName || data.name,
            disabled: false
          });
          
          await db.collection('staff_accounts').doc(doc.id).update({
            userId: userRecord.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Created: ${data.email} (${userRecord.uid})`);
          created++;
          
        } catch (error) {
          console.log(`❌ Failed for ${data.email}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${created} Firebase Auth accounts!`);
    console.log('📱 All staff can now use the mobile app');
    
  } catch (error) {
    console.error('❌ Error in bulk setup:', error.message);
  }
}

// Option 7: Test mobile auth flow
async function testMobileAuthFlow() {
  console.log('\n📱 TEST MOBILE APP AUTHENTICATION FLOW');
  console.log('========================================');
  
  console.log('This will help you test the mobile app authentication:');
  console.log('\n1. Staff Login Test');
  console.log('2. Job Query Test');
  console.log('3. Full Integration Test');
  
  const testType = await askQuestion('Choose test type (1-3): ');
  
  switch (testType) {
    case '1':
      await testStaffLogin();
      break;
    case '2':
      await testJobQuery();
      break;
    case '3':
      await testFullIntegration();
      break;
    default:
      console.log('❌ Invalid test option');
  }
}

async function testStaffLogin() {
  console.log('\n👤 STAFF LOGIN TEST');
  console.log('====================');
  
  const email = await askQuestion('Enter staff email to test: ');
  
  try {
    // Check if staff account exists
    const staffSnapshot = await db.collection('staff_accounts').where('email', '==', email).get();
    
    if (staffSnapshot.empty) {
      console.log('❌ Staff account not found');
      return;
    }
    
    const staffDoc = staffSnapshot.docs[0];
    const staffData = staffDoc.data();
    
    console.log(`\n✅ Found staff account:`);
    console.log(`   Name: ${staffData.displayName || staffData.name}`);
    console.log(`   Role: ${staffData.role}`);
    console.log(`   UserId: ${staffData.userId || 'NOT SET'}`);
    
    if (!staffData.userId) {
      console.log('❌ This staff account needs a userId - use Option 2 to fix this');
      return;
    }
    
    // Check Firebase Auth account
    try {
      const userRecord = await auth.getUser(staffData.userId);
      console.log(`✅ Firebase Auth account exists: ${userRecord.email}`);
      console.log('✅ Mobile app should be able to authenticate this user');
    } catch (error) {
      console.log('❌ Firebase Auth account not found - create one with Option 3');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testJobQuery() {
  console.log('\n📋 JOB QUERY TEST');
  console.log('==================');
  
  const userId = await askQuestion('Enter userId to test job queries: ');
  
  try {
    const jobsSnapshot = await db.collection('jobs').where('userId', '==', userId).get();
    
    console.log(`\n✅ Found ${jobsSnapshot.size} jobs for userId: ${userId}`);
    
    jobsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. ${data.title}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Priority: ${data.priority}`);
      console.log(`   Assigned Staff: ${data.assignedStaffId}`);
    });
    
    if (jobsSnapshot.size === 0) {
      console.log('💡 No jobs found - use Option 4 to create test jobs');
    }
    
  } catch (error) {
    console.error('❌ Query test failed:', error.message);
  }
}

async function testFullIntegration() {
  console.log('\n🔄 FULL INTEGRATION TEST');
  console.log('=========================');
  
  console.log('📱 Mobile App Integration Checklist:');
  console.log('\n1. ✅ Staff accounts exist in Firestore');
  console.log('2. ✅ Staff accounts have userIds linking to Firebase Auth');
  console.log('3. ✅ Jobs exist with matching userId fields');
  console.log('4. 📱 Mobile app should query: where("userId", "==", currentUser.uid)');
  console.log('5. 📱 Mobile app should authenticate users with Firebase Auth');
  
  console.log('\n🧪 Testing Integration:');
  
  try {
    // Check staff with userIds
    const staffSnapshot = await db.collection('staff_accounts').get();
    let staffWithUserIds = 0;
    let totalActiveStaff = 0;
    
    for (const doc of staffSnapshot.docs) {
      const data = doc.data();
      if (data.status === 'active' || data.isActive) {
        totalActiveStaff++;
        if (data.userId) {
          staffWithUserIds++;
        }
      }
    }
    
    console.log(`✅ Active staff accounts: ${totalActiveStaff}`);
    console.log(`✅ Staff with userIds: ${staffWithUserIds}`);
    
    // Check jobs
    const jobsSnapshot = await db.collection('jobs').get();
    let jobsWithUserIds = 0;
    
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        jobsWithUserIds++;
      }
    });
    
    console.log(`✅ Total jobs: ${jobsSnapshot.size}`);
    console.log(`✅ Jobs with userIds: ${jobsWithUserIds}`);
    
    // Summary
    console.log('\n📊 INTEGRATION STATUS:');
    
    if (staffWithUserIds === totalActiveStaff && jobsWithUserIds > 0) {
      console.log('🎉 ✅ READY FOR MOBILE APP TESTING!');
      console.log('\n📱 Mobile App Testing Steps:');
      console.log('1. Open mobile app on device/simulator');
      console.log('2. Login with any staff email and their password');
      console.log('3. Jobs should appear for that user');
      console.log('4. If no jobs appear, check mobile app console for query errors');
    } else {
      console.log('⚠️ 🚧 SETUP INCOMPLETE:');
      if (staffWithUserIds < totalActiveStaff) {
        console.log(`❌ ${totalActiveStaff - staffWithUserIds} staff accounts need userIds`);
      }
      if (jobsWithUserIds === 0) {
        console.log('❌ No jobs with userIds - create test jobs (Option 4)');
      }
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Start the script
console.log('🚀 Staff Setup Script Starting...');
console.log('This script helps link staff accounts to Firebase Auth for mobile app usage.\n');

showMenu().catch(error => {
  console.error('❌ Script error:', error);
  rl.close();
});
