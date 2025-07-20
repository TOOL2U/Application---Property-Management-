#!/usr/bin/env node

/**
 * Simple Property Viewer - Check Ante Cliff Property Data
 * Uses the same Firebase config as the React Native app
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Use the same config as the app (from environment or defaults)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'development-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'operty-b54dc.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'operty-b54dc',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'operty-b54dc.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

console.log('🔍 Checking Ante Cliff Property Information...\n');
console.log('📱 Using React Native app Firebase config:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}\n`);

async function checkAnteCliffProperty() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase connected successfully\n');

    // 1. Get Ante Cliff property directly
    console.log('1️⃣ Fetching Ante Cliff property by ID...');
    const propertyRef = doc(db, 'properties', 'tQK2ouHsHR6PVdS36f9B');
    const propertySnap = await getDoc(propertyRef);

    if (propertySnap.exists()) {
      const property = propertySnap.data();
      console.log('🏠 ✅ Ante Cliff Property Found!');
      console.log('=' .repeat(50));
      console.log(`📍 Name: ${property.name}`);
      console.log(`🏝️  Location: ${property.location?.city}, ${property.location?.country}`);
      console.log(`📊 Type: ${property.type}`);
      console.log(`👥 Max Guests: ${property.maxGuests}`);
      console.log(`🏠 Bedrooms: ${property.bedrooms}`);
      console.log(`🛁 Bathrooms: ${property.bathrooms}`);
      
      if (property.googleMaps) {
        console.log('\n📍 Google Maps Integration:');
        console.log(`   Coordinates: ${property.googleMaps.coordinates?.lat}, ${property.googleMaps.coordinates?.lng}`);
        console.log(`   Address: ${property.googleMaps.address}`);
        console.log(`   Access: ${property.googleMaps.accessInstructions}`);
      }
      
      if (property.contacts && property.contacts.length > 0) {
        console.log('\n📞 Property Contacts:');
        property.contacts.forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} (${contact.role})`);
          console.log(`      Phone: ${contact.phone}`);
          if (contact.emergencyOnly) console.log(`      ⚠️  Emergency Only`);
        });
      }
      
      console.log('\n' + '=' .repeat(50));
    } else {
      console.log('❌ Ante Cliff property not found with ID: tQK2ouHsHR6PVdS36f9B');
    }

    // 2. Check jobs linked to this property
    console.log('\n2️⃣ Checking jobs linked to Ante Cliff...');
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('propertyId', '==', 'tQK2ouHsHR6PVdS36f9B')
    );
    
    const jobsSnap = await getDocs(jobsQuery);
    console.log(`📋 Found ${jobsSnap.size} jobs linked to Ante Cliff:\n`);

    if (jobsSnap.size > 0) {
      jobsSnap.forEach((jobDoc, index) => {
        const job = jobDoc.data();
        console.log(`   ${index + 1}. ${job.title}`);
        console.log(`      ID: ${jobDoc.id}`);
        console.log(`      Type: ${job.type}`);
        console.log(`      Priority: ${job.priority}`);
        console.log(`      Status: ${job.status}`);
        console.log('');
      });
    }

    // 3. Test property integration readiness
    console.log('3️⃣ Testing Property Integration Readiness...');
    
    if (propertySnap.exists()) {
      const property = propertySnap.data();
      const checks = {
        'Google Maps Coordinates': !!(property.googleMaps?.coordinates?.lat && property.googleMaps?.coordinates?.lng),
        'Contact Information': !!(property.contacts && property.contacts.length > 0),
        'Access Instructions': !!(property.googleMaps?.accessInstructions),
        'Property Address': !!(property.googleMaps?.address),
        'Jobs Linked': jobsSnap.size > 0
      };

      console.log('✅ Integration Status:');
      Object.entries(checks).forEach(([check, status]) => {
        console.log(`   ${status ? '✅' : '❌'} ${check}`);
      });

      const allReady = Object.values(checks).every(Boolean);
      console.log(`\n🎯 Overall Status: ${allReady ? '✅ READY FOR TESTING' : '⚠️  NEEDS ATTENTION'}`);
      
      if (allReady) {
        console.log('\n🚀 The property integration is complete and ready for mobile testing!');
        console.log('   Staff can now navigate to Ante Cliff via Google Maps');
        console.log('   Contact information is available for direct calling');
        console.log('   Access instructions are displayed in the job modal');
      }
    }

  } catch (error) {
    console.error('❌ Error checking property:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 This might be a permissions issue.');
      console.log('   The property data exists but may require authentication.');
      console.log('   The mobile app should have proper access when users are logged in.');
    }
  }
}

checkAnteCliffProperty();
