/**
 * Debug Firebase notification data structure
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already done)
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
      });
    }
  } catch (error) {
    console.error('Firebase admin setup error:', error.message);
  }
}

const db = admin.firestore();

async function debugNotificationData() {
  try {
    console.log('🔍 Debugging notification data structure...\n');

    // 1. Check all notifications in staff_notifications collection
    console.log('1️⃣ Checking all notifications in staff_notifications collection...');
    const allNotificationsSnapshot = await db.collection('staff_notifications').limit(5).get();
    console.log(`   Found ${allNotificationsSnapshot.size} total notifications\n`);

    if (allNotificationsSnapshot.size > 0) {
      console.log('   Sample notification data structures:');
      allNotificationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. [${doc.id}]`);
        console.log(`      • userId: ${data.userId || 'MISSING'}`);
        console.log(`      • title: ${data.title || 'No title'}`);
        console.log(`      • type: ${data.type || 'unknown'}`);
        console.log(`      • timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
        console.log(`      • All fields:`, Object.keys(data));
        console.log('');
      });
    }

    // 2. Check for our specific Firebase UID
    const targetFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
    console.log(`2️⃣ Searching for notifications with userId = "${targetFirebaseUid}"...`);
    
    const specificQuery = await db.collection('staff_notifications')
      .where('userId', '==', targetFirebaseUid)
      .get();
    
    console.log(`   Found ${specificQuery.size} notifications for this Firebase UID\n`);

    // 3. Check for variations of user identification
    console.log('3️⃣ Checking for other user identification patterns...');
    
    // Check for staff ID instead of Firebase UID
    const staffIdQuery = await db.collection('staff_notifications')
      .where('userId', '==', 'IDJrsXWiL2dCHVpveH97')
      .get();
    console.log(`   Notifications with userId = "IDJrsXWiL2dCHVpveH97": ${staffIdQuery.size}`);

    // Check for email-based identification
    const emailQuery = await db.collection('staff_notifications')
      .where('userId', '==', 'staff@siamoon.com')
      .get();
    console.log(`   Notifications with userId = "staff@siamoon.com": ${emailQuery.size}`);

    // Check all unique userId values
    console.log('\n4️⃣ Finding all unique userId values in the collection...');
    const allDocs = await db.collection('staff_notifications').get();
    const uniqueUserIds = new Set();
    
    allDocs.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        uniqueUserIds.add(data.userId);
      }
    });
    
    console.log('   Unique userId values found:');
    Array.from(uniqueUserIds).forEach((userId, index) => {
      console.log(`   ${index + 1}. "${userId}"`);
    });

    console.log('\n✅ Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

debugNotificationData();
