/**
 * Check Properties Collection
 * Uses client-side Firebase SDK to query properties
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

require('dotenv').config({ path: '.env.local' });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

async function checkProperties() {
  try {
    console.log('🔍 Initializing Firebase...');
    console.log('Project ID:', firebaseConfig.projectId);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Checking properties collection...');
    
    const propertiesRef = collection(db, 'properties');
    const snapshot = await getDocs(propertiesRef);
    
    if (snapshot.empty) {
      console.log('❌ No properties found in collection');
      return;
    }

    console.log(`✅ Found ${snapshot.size} properties:`);
    
    let anteCliffFound = false;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n📍 Property:', doc.id);
      console.log('  Name:', data.name || 'No name');
      console.log('  Address:', data.address || 'No address');
      console.log('  Location:', data.location || 'No location');
      console.log('  Coordinates:', data.coordinates || data.googleMapsLocation || 'No coordinates');
      
      // Check if this is Ante Cliff
      if (data.name && data.name.toLowerCase().includes('ante')) {
        console.log('\n🏖️ Found Ante Cliff property!');
        console.log('ID:', doc.id);
        console.log('Full Data:', JSON.stringify(data, null, 2));
        anteCliffFound = true;
      }
    });

    if (!anteCliffFound) {
      console.log('\n❌ Ante Cliff property not found by name. Searching all properties...');
      snapshot.forEach(doc => {
        const data = doc.data();
        const searchText = (data.name || '' + data.address || '' + data.description || '').toLowerCase();
        if (searchText.includes('ante') || searchText.includes('cliff')) {
          console.log('\n🔍 Possible match:');
          console.log('ID:', doc.id);
          console.log('Data:', JSON.stringify(data, null, 2));
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProperties().then(() => {
  console.log('\n✅ Properties check complete');
  process.exit(0);
});
