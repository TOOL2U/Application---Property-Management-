/**
 * Quick notification test for mobile debugging
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function testSimpleNotificationQuery() {
  try {
    console.log('🧪 Testing simple notification query...\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const firebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
    console.log('Firebase UID:', firebaseUid);

    console.log('Testing simple query without orderBy...');
    const simpleQuery = query(
      collection(db, 'staff_notifications'),
      where('userId', '==', firebaseUid),
      limit(10)
    );

    const snapshot = await getDocs(simpleQuery);
    console.log(`✅ Query successful: ${snapshot.size} notifications found`);

    if (snapshot.size > 0) {
      console.log('\nSample notifications:');
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. [${doc.id}]`);
        console.log(`   Title: ${data.title || 'No title'}`);
        console.log(`   Type: ${data.type || 'unknown'}`);
        console.log(`   Read: ${data.read || false}`);
      });
    }

    console.log('\n✅ Simple query test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in mobile app
export { testSimpleNotificationQuery };
