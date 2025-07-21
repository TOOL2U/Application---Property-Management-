// Debug script to check Firebase connection and find job collections
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Connecting to Firebase...');

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

console.log(`Project ID: ${firebaseConfig.projectId}`);

async function debugDatabase() {
  console.log('\n🔍 Checking for job-related collections...\n');
  
  const collections = [
    'jobs', 
    'job_assignments', 
    'jobAssignments', 
    'staff_jobs', 
    'staffJobs', 
    'tasks',
    'bookings',
    'work_orders',
    'workOrders',
    'staff_accounts',
    'staff',
    'users'
  ];

  for (const collectionName of collections) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`📂 Checking collection: ${collectionName}`);
      console.log(`  📊 Found ${querySnapshot.size} documents`);
      
      if (querySnapshot.size > 0) {
        console.log(`  📋 Sample documents from ${collectionName}:`);
        let count = 0;
        querySnapshot.forEach((doc) => {
          if (count < 3) {
            const fields = Object.keys(doc.data());
            console.log(`    - ${doc.id}: [${fields.slice(0, 10).join('","')}] ${fields.length > 10 ? '...' : ''}`);
            count++;
          }
        });
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Error accessing ${collectionName}:`, error.message);
    }
  }

  // Detailed analysis of jobs collection
  console.log('\n🔍 DETAILED JOBS ANALYSIS:');
  try {
    const jobsSnapshot = await getDocs(collection(db, 'jobs'));
    jobsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📄 Job ${index + 1} (${doc.id}):`);
      console.log(`   Status: ${data.status || 'NO STATUS'}`);
      console.log(`   Assigned To: ${data.assignedTo || data.assignedStaffId || data.assignedStaffRef || data.assignedStaffDocId || 'NO ASSIGNMENT'}`);
      console.log(`   Job Type: ${data.jobType || 'NO TYPE'}`);
      console.log(`   Description: ${data.description || 'NO DESCRIPTION'}`);
      console.log(`   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'NO DATE'}`);
      console.log(`   All fields: [${Object.keys(data).join(', ')}]`);
    });
  } catch (error) {
    console.error('❌ Error analyzing jobs:', error.message);
  }

  // Detailed analysis of job_assignments collection
  console.log('\n🔍 DETAILED JOB_ASSIGNMENTS ANALYSIS:');
  try {
    const assignmentsSnapshot = await getDocs(collection(db, 'job_assignments'));
    assignmentsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📄 Assignment ${index + 1} (${doc.id}):`);
      console.log(`   Status: ${data.status || 'NO STATUS'}`);
      console.log(`   Assigned To: ${data.assignedStaffId || data.assignedStaffEmail || data.assignedTo || 'NO ASSIGNMENT'}`);
      console.log(`   Job Type: ${data.jobType || 'NO TYPE'}`);
      console.log(`   Description: ${data.description || 'NO DESCRIPTION'}`);
      console.log(`   Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'NO DATE'}`);
      console.log(`   All fields: [${Object.keys(data).join(', ')}]`);
    });
  } catch (error) {
    console.error('❌ Error analyzing job_assignments:', error.message);
  }

  // Test simple document access to verify permissions
  try {
    const testQuery = query(collection(db, 'jobs'), limit(1));
    const testSnapshot = await getDocs(testQuery);
    console.log('\n✅ Firestore connection working');
  } catch (error) {
    console.error('\n❌ Firestore access failed:', error.message);
  }
}

debugDatabase().catch(console.error);
