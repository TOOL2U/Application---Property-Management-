#!/usr/bin/env node

/**
 * Real-time Job Assignment Test
 * Creates jobs and watches for mobile app responses
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase config
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test configuration
const STAFF_EMAIL = 'staff@siamoon.com';
const STAFF_ID = 'iJxnTcy4xWZIoDVNnl5AgYSVPku2';

// Job types for testing
const JOB_TYPES = [
  { type: 'cleaning', title: 'Room Cleaning', description: 'Clean and sanitize room' },
  { type: 'maintenance', title: 'AC Repair', description: 'Fix air conditioning unit' },
  { type: 'inspection', title: 'Property Inspection', description: 'Routine property inspection' },
  { type: 'setup', title: 'Guest Setup', description: 'Prepare room for incoming guest' }
];

// Priorities
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Create a random test job
 */
async function createRandomJob() {
  const jobType = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
  const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
  const now = new Date();
  
  const jobData = {
    title: `${jobType.title} - ${now.toLocaleTimeString()}`,
    description: `${jobType.description} (Test job created at ${now.toLocaleString()})`,
    type: jobType.type,
    priority,
    status: 'pending',
    
    // Assignment
    assignedStaffId: STAFF_ID,
    assignedBy: 'test-script',
    assignedAt: serverTimestamp(),
    
    // Scheduling
    scheduledDate: serverTimestamp(),
    estimatedDuration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
    
    // Location
    propertyId: `test_prop_${Date.now()}`,
    propertyName: 'Test Property - Sia Moon Resort',
    location: {
      address: '123 Test Resort Drive, Paradise City',
      room: `Room ${Math.floor(Math.random() * 500) + 100}`,
      floor: Math.floor(Math.random() * 10) + 1
    },
    
    // Requirements
    requirements: [
      `Complete ${jobType.type} checklist`,
      'Take before and after photos',
      'Report any issues found'
    ],
    
    // Metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: 'realtime-test-script'
  };

  try {
    const docRef = await addDoc(collection(db, 'jobs'), jobData);
    console.log(`✅ Created job: ${docRef.id} - ${jobData.title} (${priority})`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating job:', error);
    return null;
  }
}

/**
 * Watch for job status changes
 */
function watchJobUpdates() {
  const jobsRef = collection(db, 'jobs');
  const q = query(
    jobsRef,
    where('assignedStaffId', '==', STAFF_ID),
    orderBy('createdAt', 'desc')
  );

  console.log('👁️  Watching for job updates...');

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const job = change.doc.data();
      const jobId = change.doc.id;

      if (change.type === 'added') {
        console.log(`📋 New job: ${jobId} - ${job.title} (${job.status})`);
      } else if (change.type === 'modified') {
        console.log(`🔄 Job updated: ${jobId} - ${job.title} (${job.status})`);
        
        // Log status changes
        if (job.status === 'accepted') {
          console.log(`   ✅ Job accepted by mobile app`);
        } else if (job.status === 'rejected') {
          console.log(`   ❌ Job rejected by mobile app`);
        } else if (job.status === 'in_progress') {
          console.log(`   🔄 Job started by mobile app`);
        } else if (job.status === 'completed') {
          console.log(`   ✅ Job completed by mobile app`);
        }
      }
    });
  });
}

/**
 * Main testing function
 */
async function runRealtimeTest() {
  console.log('🧪 Starting Real-time Job Assignment Test');
  console.log('==========================================');
  console.log(`📱 Target Staff: ${STAFF_EMAIL}`);
  console.log(`📱 Mobile App: http://localhost:8082`);
  console.log('');
  
  // Start watching for updates
  const unsubscribe = watchJobUpdates();
  
  console.log('🎯 Instructions:');
  console.log('1. Open mobile app: http://localhost:8082');
  console.log('2. Login with: staff@siamoon.com / password123');
  console.log('3. Watch the dashboard and jobs tab');
  console.log('4. Accept/decline jobs as they appear');
  console.log('5. Press Ctrl+C to stop');
  console.log('');
  
  // Create initial job
  await createRandomJob();
  
  // Create jobs every 30 seconds
  const interval = setInterval(async () => {
    await createRandomJob();
  }, 30000);
  
  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Stopping test...');
    clearInterval(interval);
    unsubscribe();
    process.exit(0);
  });
}

// Run the test
runRealtimeTest().catch(console.error);
