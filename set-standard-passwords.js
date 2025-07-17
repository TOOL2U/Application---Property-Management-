/**
 * Set Standard Password for All Staff
 * Sets a known password for all staff accounts for testing
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, 'firebase-admin-key.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Standard password for all staff during testing
const STANDARD_PASSWORD = 'StaffTest123!';

async function updateStaffPasswords() {
  console.log('🔄 Setting standard password for all staff accounts...\n');

  try {
    // Get all staff with userId
    const staffSnapshot = await db.collection('staff_accounts')
      .where('isActive', '==', true)
      .get();

    if (staffSnapshot.empty) {
      console.log('❌ No active staff found');
      return;
    }

    console.log(`📋 Found ${staffSnapshot.size} active staff accounts\n`);

    let updateCount = 0;
    let errorCount = 0;

    for (const doc of staffSnapshot.docs) {
      const staffData = doc.data();
      
      if (!staffData.userId) {
        console.log(`⚠️  Skipping ${staffData.name} - no userId`);
        continue;
      }

      try {
        console.log(`🔄 Updating password for ${staffData.name} (${staffData.email})`);
        
        // Update password in Firebase Auth
        await auth.updateUser(staffData.userId, {
          password: STANDARD_PASSWORD
        });
        
        console.log(`✅ Password updated for ${staffData.name}`);
        updateCount++;
        
      } catch (error) {
        console.log(`❌ Failed to update ${staffData.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`   Updated: ${updateCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Standard Password: ${STANDARD_PASSWORD}`);
    
    if (updateCount > 0) {
      console.log(`\n🎉 All staff can now login with:`);
      console.log(`   Password: ${STANDARD_PASSWORD}`);
      console.log(`   Example: myo@gmail.com / ${STANDARD_PASSWORD}`);
    }

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  }
}

updateStaffPasswords();
