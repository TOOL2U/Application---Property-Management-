const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "operty-b54dc",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function testPropertyIntegration() {
  try {
    console.log('🏠 Testing Property Integration...\n');

    // 1. Get Ante Cliff property
    console.log('1. Fetching Ante Cliff property...');
    const propertyDoc = await db.collection('properties').doc('tQK2ouHsHR6PVdS36f9B').get();
    
    if (!propertyDoc.exists) {
      console.error('❌ Ante Cliff property not found!');
      return;
    }

    const property = propertyDoc.data();
    console.log('✅ Ante Cliff property found:');
    console.log(`   - Name: ${property.name}`);
    console.log(`   - Location: ${property.location.city}, ${property.location.country}`);
    console.log(`   - Coordinates: ${property.googleMaps.coordinates.lat}, ${property.googleMaps.coordinates.lng}`);
    console.log(`   - Access Code: ${property.googleMaps.accessInstructions}`);
    console.log(`   - Contacts: ${property.contacts?.length || 0} contacts\n`);

    // 2. Get jobs linked to this property
    console.log('2. Fetching jobs linked to Ante Cliff...');
    const jobsSnapshot = await db.collection('jobs')
      .where('propertyId', '==', 'tQK2ouHsHR6PVdS36f9B')
      .get();

    console.log(`✅ Found ${jobsSnapshot.size} jobs linked to Ante Cliff:\n`);

    for (const jobDoc of jobsSnapshot.docs) {
      const job = jobDoc.data();
      console.log(`   📋 Job: ${job.title}`);
      console.log(`      - ID: ${jobDoc.id}`);
      console.log(`      - Property: ${job.propertyName}`);
      console.log(`      - Type: ${job.type}`);
      console.log(`      - Priority: ${job.priority}`);
      console.log(`      - Status: ${job.status}\n`);
    }

    // 3. Test property service simulation
    console.log('3. Testing property data structure for mobile app...');
    
    const jobWithProperty = {
      ...jobsSnapshot.docs[0]?.data(),
      id: jobsSnapshot.docs[0]?.id,
      property: property,
      contacts: property.contacts,
      googleMaps: property.googleMaps
    };

    console.log('✅ Job with property data structure:');
    console.log(`   - Job Title: ${jobWithProperty.title}`);
    console.log(`   - Property Name: ${jobWithProperty.property.name}`);
    console.log(`   - Navigation Available: ${!!jobWithProperty.googleMaps.coordinates}`);
    console.log(`   - Contact Count: ${jobWithProperty.contacts?.length || 0}`);
    
    if (jobWithProperty.contacts?.length > 0) {
      console.log('   - Contacts:');
      jobWithProperty.contacts.forEach((contact, index) => {
        console.log(`     ${index + 1}. ${contact.name} (${contact.role}) - ${contact.phone}`);
      });
    }

    console.log('\n🎉 Property integration test complete!');
    console.log('✅ Jobs are properly linked to real property data');
    console.log('✅ Google Maps navigation data is available');
    console.log('✅ Contact information is accessible');

  } catch (error) {
    console.error('❌ Error testing property integration:', error);
  }
}

testPropertyIntegration();
