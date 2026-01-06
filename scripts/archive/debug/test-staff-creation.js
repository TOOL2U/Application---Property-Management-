// Test script to create a staff profile with the Firebase UID
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Creating staff profile for Firebase UID...');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testFirebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';

async function createTestStaffProfile() {
  try {
    // Check if staff profile already exists
    const staffQuery = query(collection(db, 'staff'), where('id', '==', testFirebaseUid));
    const existingStaff = await getDocs(staffQuery);
    
    if (existingStaff.size > 0) {
      console.log('✅ Staff profile already exists');
      existingStaff.forEach(doc => {
        console.log('📄 Existing staff profile:', doc.id, doc.data());
      });
      return;
    }

    // Create a staff profile with the Firebase UID
    const staffProfile = {
      id: testFirebaseUid,
      name: 'Test Staff Member',
      email: 'staff@test.com',
      phone: '+1234567890',
      role: 'cleaner',
      isActive: true,
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      skills: ['cleaning', 'maintenance'],
      rating: 5.0,
      completedTasks: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, 'staff'), staffProfile);
    console.log('✅ Created staff profile for Firebase UID:', testFirebaseUid);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkCollections() {
  try {
    // Check various staff-related collections
    const collections = ['staff', 'staffProfiles', 'users'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`📂 Collection "${collectionName}": ${snapshot.size} documents`);
        
        if (snapshot.size > 0 && snapshot.size <= 5) {
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${doc.id}: ${data.name || data.email || data.id || 'Unknown'}`);
          });
        }
      } catch (error) {
        console.log(`❌ Collection "${collectionName}" not accessible`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

async function main() {
  await checkCollections();
  await createTestStaffProfile();
}

main().catch(console.error);
