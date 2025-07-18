/**
 * Test Notification Integration
 * Verifies that the Firebase staff_notifications collection has data for our user
 */

const admin = require('firebase-admin');

// Firebase admin setup (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function testNotificationIntegration() {
  try {
    console.log('🧪 Testing Notification Integration...\n');

    // 1. Check staff_notifications collection
    console.log('1. Checking staff_notifications collection...');
    const notificationsSnapshot = await db.collection('staff_notifications').get();
    console.log(`   📊 Found ${notificationsSnapshot.size} notifications in staff_notifications collection`);

    if (notificationsSnapshot.size > 0) {
      console.log('\n   Sample notifications:');
      notificationsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. [${doc.id}] ${data.title || 'No title'}`);
        console.log(`      • User ID: ${data.userId}`);
        console.log(`      • Type: ${data.type || 'unknown'}`);
        console.log(`      • Read: ${data.read || false}`);
        console.log(`      • Timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
      });
    }

    // 2. Check Firebase UID mapping
    console.log('\n\n2. Checking Firebase UID mapping...');
    const staffId = 'ST001'; // Our test staff ID
    const firebaseUid = 'staff@siamoon.com'; // Our known Firebase UID
    
    console.log(`   🔗 Staff ID: ${staffId}`);
    console.log(`   🔗 Firebase UID: ${firebaseUid}`);

    // 3. Count notifications for our Firebase UID
    console.log('\n\n3. Checking notifications for our Firebase UID...');
    const userNotificationsSnapshot = await db.collection('staff_notifications')
      .where('userId', '==', firebaseUid)
      .get();
    
    console.log(`   📊 Found ${userNotificationsSnapshot.size} notifications for Firebase UID: ${firebaseUid}`);

    if (userNotificationsSnapshot.size > 0) {
      console.log('\n   Notifications for staff@siamoon.com:');
      userNotificationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. [${doc.id}] ${data.title || 'No title'}`);
        console.log(`      • Message: ${data.message || data.body || 'No message'}`);
        console.log(`      • Type: ${data.type || 'unknown'}`);
        console.log(`      • Read: ${data.read || false}`);
      });
    }

    console.log('\n\n✅ Integration test completed!');
    console.log('\n📱 To test the mobile app:');
    console.log('   1. Open the mobile app');
    console.log('   2. Login as staff@siamoon.com');
    console.log('   3. Check the notifications tab');
    console.log('   4. Verify the notification badge shows the correct count');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testNotificationIntegration();
