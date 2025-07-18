/**
 * Test notification query with fallback for missing index
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already done)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY || '{}');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function testNotificationQuery() {
  try {
    console.log('🧪 Testing notification query for Firebase UID...\n');

    const firebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1'; // From the logs
    
    console.log('1. Testing simple query (no orderBy)...');
    const simpleQuery = db.collection('staff_notifications')
      .where('userId', '==', firebaseUid)
      .limit(10);
    
    const simpleSnapshot = await simpleQuery.get();
    console.log(`   ✅ Simple query successful: ${simpleSnapshot.size} notifications found`);
    
    if (simpleSnapshot.size > 0) {
      console.log('\n   Sample notifications:');
      simpleSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. [${doc.id}]`);
        console.log(`      • Title: ${data.title || 'No title'}`);
        console.log(`      • Type: ${data.type || 'unknown'}`);
        console.log(`      • Read: ${data.read || false}`);
        console.log(`      • Timestamp: ${data.timestamp?.toDate?.() || data.timestamp}`);
      });
    }

    console.log('\n2. Testing ordered query (with orderBy)...');
    try {
      const orderedQuery = db.collection('staff_notifications')
        .where('userId', '==', firebaseUid)
        .orderBy('timestamp', 'desc')
        .limit(10);
      
      const orderedSnapshot = await orderedQuery.get();
      console.log(`   ✅ Ordered query successful: ${orderedSnapshot.size} notifications found`);
      
    } catch (error) {
      console.log(`   ❌ Ordered query failed: ${error.message}`);
      if (error.message.includes('index')) {
        console.log('   → This is expected if the composite index is still building');
      }
    }

    console.log('\n✅ Test completed! The simple query should work for the mobile app.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationQuery();
