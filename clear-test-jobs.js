const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function clearTestJobs() {
  try {
    console.log('🧹 Clearing test jobs...');

    // Clear test jobs from job_assignments
    const jobAssignmentsQuery = await db.collection('job_assignments')
      .where('id', '>=', 'test_job_')
      .where('id', '<', 'test_job_z')
      .get();

    for (const doc of jobAssignmentsQuery.docs) {
      await doc.ref.delete();
      console.log(`✅ Deleted job assignment: ${doc.id}`);
    }

    // Clear test jobs from jobs collection
    const jobsQuery = await db.collection('jobs')
      .where('id', '>=', 'test_job_')
      .where('id', '<', 'test_job_z')
      .get();

    for (const doc of jobsQuery.docs) {
      await doc.ref.delete();
      console.log(`✅ Deleted job: ${doc.id}`);
    }

    // Clear test notifications
    const notificationsQuery = await db.collection('staff_notifications')
      .where('id', '>=', 'notification_test_job_')
      .where('id', '<', 'notification_test_job_z')
      .get();

    for (const doc of notificationsQuery.docs) {
      await doc.ref.delete();
      console.log(`✅ Deleted notification: ${doc.id}`);
    }

    console.log('\n🎉 All test jobs and notifications cleared!');
    console.log('   The JOBS button should return to normal glow state.');

  } catch (error) {
    console.error('❌ Error clearing test jobs:', error);
  }
}

// Run the function
clearTestJobs().then(() => {
  console.log('\n🔚 Cleanup completed.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
