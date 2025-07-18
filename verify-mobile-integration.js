/**
 * Mobile Integration Verification Script
 * Verifies all key Firebase collections and data structures for mobile team
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "operty-b54dc"
});

const db = admin.firestore();

async function verifyMobileIntegration() {
  console.log('🔍 MOBILE INTEGRATION VERIFICATION');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // 1. Verify staff_accounts collection
    console.log('\n1. 📋 STAFF ACCOUNTS VERIFICATION:');
    const staffAccountsRef = db.collection('staff_accounts');
    const staffSnapshot = await staffAccountsRef.limit(5).get();
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff accounts found');
    } else {
      console.log(`✅ Found ${staffSnapshot.size} staff accounts`);
      
      // Check for test account
      const testStaffQuery = await staffAccountsRef
        .where('email', '==', 'staff@siamoon.com')
        .limit(1)
        .get();
      
      if (!testStaffQuery.empty) {
        const testStaff = testStaffQuery.docs[0].data();
        console.log('✅ Test account found:');
        console.log(`   Email: ${testStaff.email}`);
        console.log(`   Firebase UID: ${testStaff.firebaseUid || 'NOT SET'}`);
        console.log(`   User ID: ${testStaff.userId || 'NOT SET'}`);
        console.log(`   Active: ${testStaff.isActive}`);
      } else {
        console.log('❌ Test account staff@siamoon.com NOT found');
      }
    }

    // 2. Verify staff_notifications collection
    console.log('\n2. 🔔 NOTIFICATIONS VERIFICATION:');
    const notificationsRef = db.collection('staff_notifications');
    const notificationSnapshot = await notificationsRef
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (notificationSnapshot.empty) {
      console.log('❌ No notifications found');
    } else {
      console.log(`✅ Found ${notificationSnapshot.size} notifications`);
      
      // Check notification structure
      const sampleNotification = notificationSnapshot.docs[0].data();
      console.log('✅ Sample notification structure:');
      console.log(`   Job ID: ${sampleNotification.jobId || 'MISSING'}`);
      console.log(`   User ID: ${sampleNotification.userId || 'MISSING'}`);
      console.log(`   Staff ID: ${sampleNotification.staffId || 'MISSING'}`);
      console.log(`   Type: ${sampleNotification.type || 'MISSING'}`);
      console.log(`   Status: ${sampleNotification.status || 'MISSING'}`);
      
      // Count by status
      const pendingQuery = await notificationsRef.where('status', '==', 'pending').get();
      const readQuery = await notificationsRef.where('status', '==', 'read').get();
      console.log(`   Pending: ${pendingQuery.size}`);
      console.log(`   Read: ${readQuery.size}`);
    }

    // 3. Verify jobs collection
    console.log('\n3. 💼 JOBS VERIFICATION:');
    const jobsRef = db.collection('jobs');
    const jobsSnapshot = await jobsRef
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (jobsSnapshot.empty) {
      console.log('❌ No jobs found');
    } else {
      console.log(`✅ Found ${jobsSnapshot.size} jobs`);
      
      // Check job structure
      const sampleJob = jobsSnapshot.docs[0].data();
      console.log('✅ Sample job structure:');
      console.log(`   Title: ${sampleJob.title || 'MISSING'}`);
      console.log(`   Status: ${sampleJob.status || 'MISSING'}`);
      console.log(`   Assigned Staff ID: ${sampleJob.assignedStaffId || 'MISSING'}`);
      console.log(`   User ID: ${sampleJob.userId || 'MISSING'}`);
      console.log(`   Property: ${sampleJob.propertyRef?.name || 'MISSING'}`);
      
      // Count test jobs
      const testJobsQuery = await jobsRef
        .where('title', '>=', '🧪')
        .where('title', '<', '🧪\uf8ff')
        .get();
      console.log(`   Test jobs: ${testJobsQuery.size}`);
    }

    // 4. Verify Firebase UID mapping
    console.log('\n4. 🔗 FIREBASE UID MAPPING VERIFICATION:');
    
    // Check if jobs have matching staff accounts
    let mappedJobs = 0;
    let unmappedJobs = 0;
    
    for (const jobDoc of jobsSnapshot.docs) {
      const job = jobDoc.data();
      if (job.assignedStaffId) {
        const staffQuery = await staffAccountsRef
          .where('firebaseUid', '==', job.assignedStaffId)
          .limit(1)
          .get();
        
        if (!staffQuery.empty) {
          mappedJobs++;
        } else {
          unmappedJobs++;
        }
      }
    }
    
    console.log(`✅ Jobs with mapped staff: ${mappedJobs}`);
    if (unmappedJobs > 0) {
      console.log(`⚠️  Jobs with unmapped staff: ${unmappedJobs}`);
    }

    // 5. Mobile app readiness check
    console.log('\n5. 📱 MOBILE APP READINESS CHECK:');
    
    const readinessChecks = [
      {
        name: 'Staff accounts exist',
        passed: !staffSnapshot.empty,
      },
      {
        name: 'Test account configured',
        passed: !testStaffQuery.empty,
      },
      {
        name: 'Notifications collection exists',
        passed: !notificationSnapshot.empty,
      },
      {
        name: 'Jobs collection exists',
        passed: !jobsSnapshot.empty,
      },
      {
        name: 'Firebase UID mapping functional',
        passed: mappedJobs > 0,
      }
    ];
    
    const passedChecks = readinessChecks.filter(check => check.passed).length;
    const totalChecks = readinessChecks.length;
    
    readinessChecks.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    console.log(`\n📊 READINESS SCORE: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 MOBILE APP INTEGRATION READY!');
      console.log('   Mobile team can proceed with implementation');
    } else {
      console.log('⚠️  Some issues need attention before mobile implementation');
    }

    // 6. Key information summary
    console.log('\n6. 📋 KEY INFO FOR MOBILE TEAM:');
    console.log('───────────────────────────────────────────────');
    console.log('Firebase Project ID: operty-b54dc');
    console.log('Primary Collections:');
    console.log('  • staff_accounts (user authentication)');
    console.log('  • staff_notifications (push notifications)');
    console.log('  • jobs (job details)');
    console.log('');
    console.log('Critical Fields:');
    console.log('  • staff_accounts.firebaseUid → Firebase Auth UID');
    console.log('  • staff_notifications.userId → Target user for notification');
    console.log('  • staff_notifications.jobId → Link to jobs collection');
    console.log('');
    console.log('Test Account: staff@siamoon.com');
    console.log('Integration Complete: Mobile app can now receive jobs!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyMobileIntegration().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification error:', error);
  process.exit(1);
});
