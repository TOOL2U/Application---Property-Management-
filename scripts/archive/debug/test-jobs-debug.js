// Debug script to check Firebase connection and find job collections
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

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

async function debugFirestore() {
  try {
    console.log('🔍 Connecting to Firebase...');
    console.log('Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Try multiple possible collection names
    const possibleCollections = [
      'jobs',
      'job_assignments', 
      'jobAssignments',
      'staff_jobs',
      'staffJobs',
      'tasks',
      'bookings',
      'work_orders',
      'workOrders'
    ];
    
    console.log('\n🔍 Checking for job-related collections...\n');
    
    for (const collectionName of possibleCollections) {
      try {
        console.log(`📂 Checking collection: ${collectionName}`);
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        console.log(`  📊 Found ${snapshot.size} documents`);
        
        if (snapshot.size > 0) {
          console.log(`  📋 Sample documents from ${collectionName}:`);
          let count = 0;
          snapshot.forEach((doc) => {
            if (count < 3) { // Show first 3 docs
              const data = doc.data();
              console.log(`    - ${doc.id}: ${JSON.stringify(Object.keys(data).slice(0, 10))} ${Object.keys(data).length > 10 ? '...' : ''}`);
              count++;
            }
          });
        }
        console.log('');
      } catch (error) {
        console.log(`  ❌ Error accessing ${collectionName}: ${error.message}`);
      }
    }
    
    // Also check if we can access a test document
    console.log('🧪 Testing document access...');
    try {
      const testDocRef = doc(db, 'jobs', 'test');
      const testDoc = await getDoc(testDocRef);
      // Test simple document access to verify permissions
console.log('✅ Firestore connection working');

// Detailed analysis of jobs collection
console.log('🔍 DETAILED JOBS ANALYSIS:');
const jobsSnapshot = await db.collection('jobs').get();
jobsSnapshot.docs.forEach((doc, index) => {
  const data = doc.data();
  console.log(`
📄 Job ${index + 1} (${doc.id}):`);
  console.log(`   Status: ${data.status || 'NO STATUS'}`);
  console.log(`   Assigned To: ${data.assignedTo || data.assignedStaffId || data.assignedStaffRef || data.assignedStaffDocId || 'NO ASSIGNMENT'}`);
  console.log(`   Job Type: ${data.jobType || 'NO TYPE'}`);
  console.log(`   Description: ${data.description || 'NO DESCRIPTION'}`);
  console.log(`   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'NO DATE'}`);
  console.log(`   All fields: [${Object.keys(data).join(', ')}]`);
});

// Detailed analysis of job_assignments collection
console.log('🔍 DETAILED JOB_ASSIGNMENTS ANALYSIS:');
const assignmentsSnapshot = await db.collection('job_assignments').get();
assignmentsSnapshot.docs.forEach((doc, index) => {
  const data = doc.data();
  console.log(`
📄 Assignment ${index + 1} (${doc.id}):`);
  console.log(`   Status: ${data.status || 'NO STATUS'}`);
  console.log(`   Assigned To: ${data.assignedStaffId || data.assignedStaffEmail || data.assignedTo || 'NO ASSIGNMENT'}`);
  console.log(`   Job Type: ${data.jobType || 'NO TYPE'}`);
  console.log(`   Description: ${data.description || 'NO DESCRIPTION'}`);
  console.log(`   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'NO DATE'}`);
  console.log(`   All fields: [${Object.keys(data).join(', ')}]`);
});
    } catch (error) {
      console.log('❌ Firestore connection error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Setup Error:', error);
  }
  
  process.exit(0);
}

debugFirestore();
