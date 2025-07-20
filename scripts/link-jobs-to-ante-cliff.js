/**
 * Link Test Jobs to Real Ante Cliff Property
 * This script updates existing test jobs to use the real Ante Cliff property data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

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

// Ante Cliff property data
const ANTE_CLIFF_PROPERTY_ID = 'tQK2ouHsHR6PVdS36f9B';
const ANTE_CLIFF_DATA = {
  propertyId: ANTE_CLIFF_PROPERTY_ID,
  propertyName: 'Ante Cliff',
  propertyAddress: '55/45 Moo 8, Koh Phangan, Surathani 84280, Thailand',
  location: {
    address: '55/45 Moo 8, Koh Phangan, Surathani 84280, Thailand',
    city: 'Koh Phangan',
    state: 'Surathani',
    zipCode: '84280',
    country: 'Thailand',
    coordinates: {
      latitude: 9.7601,
      longitude: 100.0356
    },
    accessInstructions: 'Take the main road from Thong Sala pier, follow signs to Haad Rin, then turn left at Moo 8. The villa is on the cliff overlooking the sea.',
    accessCode: '1234'
  },
  contacts: [
    {
      name: 'Luke Byrne',
      role: 'Emergency Contact',
      phone: '+660937533309',
      email: 'luke@siamoon.com'
    },
    {
      name: 'Property Manager',
      role: 'Property Manager', 
      phone: '+66123456789',
      email: 'manager@siamoon.com'
    }
  ]
};

async function linkJobsToAnteCliff() {
  try {
    console.log('🔍 Initializing Firebase...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Finding test jobs to update...');
    
    // Check jobs collection for test jobs
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(jobsRef);
    
    let jobsUpdated = 0;
    
    if (!jobsSnapshot.empty) {
      console.log(`Found ${jobsSnapshot.size} jobs in 'jobs' collection`);
      
      for (const jobDoc of jobsSnapshot.docs) {
        const jobData = jobDoc.data();
        
        // Update if it's a test job (contains TEST in title or description)
        if (jobData.title?.includes('TEST') || jobData.description?.includes('test')) {
          console.log(`\n🔄 Updating job: ${jobDoc.id}`);
          console.log(`  Title: ${jobData.title}`);
          
          const updateData = {
            ...ANTE_CLIFF_DATA,
            // Keep the existing job details but update property info
            title: jobData.title?.replace('TEST JOB:', '🏖️ ANTE CLIFF:') || '🏖️ ANTE CLIFF: Villa Cleaning',
            description: `Professional cleaning service for the beautiful Ante Cliff villa on Koh Phangan. This property features 3 bedrooms, 3 bathrooms, a pool, and stunning cliff-side ocean views.`,
            // Update any existing location references
            specialInstructions: `Property: Ante Cliff Villa\nLocation: Cliff-side villa with ocean views\nAccess: ${ANTE_CLIFF_DATA.location.accessInstructions}\nAccess Code: ${ANTE_CLIFF_DATA.location.accessCode}\n\nPlease ensure all areas are thoroughly cleaned including the pool area and outdoor spaces with ocean views.`,
          };
          
          const jobRef = doc(db, 'jobs', jobDoc.id);
          await updateDoc(jobRef, updateData);
          
          jobsUpdated++;
          console.log(`  ✅ Updated with Ante Cliff property data`);
        }
      }
    }
    
    // Check job_assignments collection for test jobs
    const jobAssignmentsRef = collection(db, 'job_assignments');
    const assignmentsSnapshot = await getDocs(jobAssignmentsRef);
    
    if (!assignmentsSnapshot.empty) {
      console.log(`\nFound ${assignmentsSnapshot.size} jobs in 'job_assignments' collection`);
      
      for (const jobDoc of assignmentsSnapshot.docs) {
        const jobData = jobDoc.data();
        
        // Update if it's a test job
        if (jobData.title?.includes('TEST') || jobData.jobTitle?.includes('TEST') || jobData.description?.includes('test')) {
          console.log(`\n🔄 Updating job assignment: ${jobDoc.id}`);
          console.log(`  Title: ${jobData.title || jobData.jobTitle}`);
          
          const updateData = {
            ...ANTE_CLIFF_DATA,
            // Keep existing assignment data but update property info
            title: (jobData.title || jobData.jobTitle)?.replace('TEST JOB:', '🏖️ ANTE CLIFF:') || '🏖️ ANTE CLIFF: Villa Cleaning',
            jobTitle: (jobData.title || jobData.jobTitle)?.replace('TEST JOB:', '🏖️ ANTE CLIFF:') || '🏖️ ANTE CLIFF: Villa Cleaning',
            description: `Professional cleaning service for the beautiful Ante Cliff villa on Koh Phangan. This property features 3 bedrooms, 3 bathrooms, a pool, and stunning cliff-side ocean views.`,
            specialInstructions: `Property: Ante Cliff Villa\nLocation: Cliff-side villa with ocean views\nAccess: ${ANTE_CLIFF_DATA.location.accessInstructions}\nAccess Code: ${ANTE_CLIFF_DATA.location.accessCode}\n\nPlease ensure all areas are thoroughly cleaned including the pool area and outdoor spaces with ocean views.`,
          };
          
          const jobRef = doc(db, 'job_assignments', jobDoc.id);
          await updateDoc(jobRef, updateData);
          
          jobsUpdated++;
          console.log(`  ✅ Updated with Ante Cliff property data`);
        }
      }
    }
    
    console.log(`\n✅ Successfully updated ${jobsUpdated} jobs with Ante Cliff property data!`);
    console.log('🏖️ All test jobs now linked to real Ante Cliff property');
    console.log('📍 Jobs now include real Google Maps coordinates');
    console.log('🗺️ Staff can navigate to actual property location');

  } catch (error) {
    console.error('❌ Error linking jobs to Ante Cliff:', error);
  }
}

linkJobsToAnteCliff().then(() => {
  console.log('\n✅ Job linking complete');
  process.exit(0);
});
