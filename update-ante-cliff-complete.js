#!/usr/bin/env node

/**
 * Update Ante Cliff Property with Google Maps Data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'development-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'operty-b54dc.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'operty-b54dc.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

async function updateAnteCliffProperty() {
  try {
    console.log('🔄 Updating Ante Cliff Property with Google Maps data...\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // First, let's see what's currently there
    const propertyRef = doc(db, 'properties', 'tQK2ouHsHR6PVdS36f9B');
    const propertySnap = await getDoc(propertyRef);
    
    if (!propertySnap.exists()) {
      console.log('❌ Property not found!');
      return;
    }

    console.log('📋 Current property data:');
    console.log(JSON.stringify(propertySnap.data(), null, 2));
    
    // Update with Google Maps integration and contact info
    const updateData = {
      type: 'villa',
      googleMaps: {
        coordinates: {
          lat: 9.7601,
          lng: 100.0356
        },
        address: "Ante Cliff Villa, Koh Phangan, Thailand",
        accessInstructions: "Use access code 1234. Villa entrance is via the wooden gate on the cliff side. Follow the stone path to the main entrance.",
        navigationUrl: "https://maps.google.com/?q=9.7601,100.0356"
      },
      contacts: [
        {
          name: "Marina Cliff",
          role: "Property Manager",
          phone: "+66 77 123 4567",
          email: "marina@antecliff.com",
          emergencyOnly: false
        },
        {
          name: "Tommy Resort",
          role: "Emergency Contact",
          phone: "+66 77 999 8888",
          email: "emergency@kohphangan-resorts.com",
          emergencyOnly: true
        }
      ],
      amenities: [
        "Ocean View",
        "Private Pool",
        "WiFi",
        "Air Conditioning",
        "Kitchen",
        "Beach Access",
        "Parking"
      ],
      checkInTime: "15:00",
      checkOutTime: "11:00",
      lastUpdated: new Date().toISOString(),
      integrationStatus: "complete"
    };

    await updateDoc(propertyRef, updateData);
    
    console.log('\n✅ Ante Cliff property updated successfully!');
    console.log('\n📍 Added Google Maps integration:');
    console.log('   - Coordinates: 9.7601, 100.0356');
    console.log('   - Address and access instructions');
    console.log('   - Navigation URL for maps');
    
    console.log('\n📞 Added contact information:');
    console.log('   - Property Manager: Marina Cliff');
    console.log('   - Emergency Contact: Tommy Resort');
    
    console.log('\n🎯 Property is now ready for mobile app integration!');

  } catch (error) {
    console.error('❌ Error updating property:', error);
  }
}

updateAnteCliffProperty();
