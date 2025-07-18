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

async function createTestJobForGlow() {
  try {
    console.log('🔧 Creating test job to demonstrate glow effect...');

    // Current staff user Firebase UID (based on logs)
    const staffFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
    const staffId = 'IDJrsXWiL2dCHVpveH97';

    // Create a test job assignment
    const jobData = {
      id: `test_job_glow_${Date.now()}`,
      title: 'Villa Deep Cleaning - Luxury Suite',
      description: 'Complete deep cleaning of premium villa including bathrooms, kitchen, and all living areas.',
      status: 'assigned', // This will trigger the glow effect
      priority: 'high',
      jobType: 'cleaning',
      estimatedDuration: 180, // 3 hours
      scheduledFor: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
      assignedTo: staffFirebaseUid,
      staffId: staffId,
      location: {
        address: '123 Paradise Beach, Luxury Villa Resort',
        coordinates: {
          latitude: 7.8804,
          longitude: 98.3923
        }
      },
      propertyId: 'villa_paradise_001',
      propertyName: 'Paradise Beach Villa',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      requirements: [
        'Deep clean all bathrooms',
        'Kitchen appliance cleaning',
        'Pool area maintenance',
        'Balcony cleaning'
      ],
      specialInstructions: 'VIP guest arriving tomorrow - ensure perfect condition'
    };

    // Add to job_assignments collection
    await db.collection('job_assignments').doc(jobData.id).set(jobData);
    console.log('✅ Test job created in job_assignments collection');

    // Also add to jobs collection for compatibility
    await db.collection('jobs').doc(jobData.id).set(jobData);
    console.log('✅ Test job created in jobs collection');

    // Create notification for this job
    const notificationData = {
      id: `notification_${jobData.id}`,
      userId: staffFirebaseUid,
      staffId: staffId,
      type: 'job_assigned',
      title: 'New Job Assignment',
      message: `You have been assigned: ${jobData.title}`,
      jobId: jobData.id,
      jobTitle: jobData.title,
      propertyName: jobData.propertyName,
      propertyAddress: jobData.location.address,
      priority: jobData.priority,
      status: 'unread',
      actionRequired: true,
      createdAt: admin.firestore.Timestamp.now(),
      readAt: null,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      scheduledDate: jobData.scheduledFor,
      scheduledStartTime: jobData.scheduledFor,
      estimatedDuration: jobData.estimatedDuration,
      jobType: jobData.jobType,
      specialInstructions: jobData.specialInstructions,
      staffName: 'Staff Member',
      staffEmail: 'staff@siamoon.com'
    };

    await db.collection('staff_notifications').doc(notificationData.id).set(notificationData);
    console.log('✅ Test notification created');

    console.log('\n🎉 SUCCESS! Test job created for staff user:');
    console.log(`   Staff ID: ${staffId}`);
    console.log(`   Firebase UID: ${staffFirebaseUid}`);
    console.log(`   Job Title: ${jobData.title}`);
    console.log(`   Status: ${jobData.status}`);
    console.log('\n💡 The JOBS button should now glow brightly on the home screen!');
    console.log('   Refresh the app to see the enhanced glow effect.');

  } catch (error) {
    console.error('❌ Error creating test job:', error);
  }
}

// Run the function
createTestJobForGlow().then(() => {
  console.log('\n🔚 Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
