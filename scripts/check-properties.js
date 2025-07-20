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

async function checkProperties() {
  try {
    console.log('🔍 Checking properties collection...');
    
    const snapshot = await db.collection('properties').get();
    
    if (snapshot.empty) {
      console.log('❌ No properties found in collection');
      return;
    }

    console.log(`✅ Found ${snapshot.size} properties:`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('\n📍 Property:', doc.id);
      console.log('  Name:', data.name || 'No name');
      console.log('  Address:', data.address || 'No address');
      console.log('  Location:', data.location || 'No location');
      console.log('  Google Maps:', data.googleMapsLocation || data.coordinates || 'No coordinates');
    });

    // Look specifically for Ante Cliff
    const anteCliffQuery = await db.collection('properties')
      .where('name', '>=', 'Ante')
      .where('name', '<=', 'Ante\uf8ff')
      .get();
    
    if (!anteCliffQuery.empty) {
      console.log('\n🏖️ Found Ante Cliff property:');
      anteCliffQuery.forEach(doc => {
        console.log('ID:', doc.id);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('\n❌ Ante Cliff property not found with name search, checking all properties...');
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes('ante')) {
          console.log('\n🏖️ Found Ante property:');
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
