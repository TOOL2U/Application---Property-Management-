#!/usr/bin/env node

/**
 * Monitor Test Job Progress
 * Usage: node monitor-test-job.js [jobId]
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit
} = require('firebase/firestore');

// Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get job ID from command line or use the latest one
const jobId = process.argv[2] || '2x227J1zwlAFvuAuT0a0';

console.log('📊 Real-time Job Monitoring Dashboard');
console.log('=====================================');
console.log(`Monitoring Job ID: ${jobId}`);
console.log('Press Ctrl+C to stop monitoring');
console.log('');

/**
 * Monitor specific job
 */
function monitorJob(jobId) {
  const jobRef = doc(db, 'jobs', jobId);
  
  return onSnapshot(jobRef, (doc) => {
    if (doc.exists()) {
      const job = doc.data();
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(`[${timestamp}] 📋 Job Status Update:`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Title: ${job.title}`);
      console.log(`   Assigned To: ${job.assignedTo}`);
      console.log(`   Priority: ${job.priority}`);
      
      if (job.acceptedAt) {
        console.log(`   ✅ Accepted: ${new Date(job.acceptedAt.seconds * 1000).toLocaleString()}`);
      }
      
      if (job.startedAt) {
        console.log(`   🚀 Started: ${new Date(job.startedAt.seconds * 1000).toLocaleString()}`);
      }
      
      if (job.completedAt) {
        console.log(`   ✅ Completed: ${new Date(job.completedAt.seconds * 1000).toLocaleString()}`);
      }
      
      if (job.requirements) {
        const completed = job.requirements.filter(req => req.isCompleted).length;
        const total = job.requirements.length;
        console.log(`   📝 Requirements: ${completed}/${total} completed`);
      }
      
      console.log('   ─────────────────────────────────────');
    } else {
      console.log(`❌ Job ${jobId} not found`);
    }
  }, (error) => {
    console.error('❌ Error monitoring job:', error);
  });
}

/**
 * Monitor all pending jobs for the staff member
 */
function monitorStaffJobs() {
  const staffId = 'iJxnTcy4xWZIoDVNnl5AgYSVPku2';
  
  const jobsQuery = query(
    collection(db, 'jobs'),
    where('assignedTo', '==', staffId),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  
  return onSnapshot(jobsQuery, (snapshot) => {
    console.log(`\n📱 Active Jobs for staff@siamoon.com:`);
    
    snapshot.docs.forEach((doc) => {
      const job = doc.data();
      const statusEmoji = {
        pending: '⏳',
        accepted: '✅',
        in_progress: '🔄',
        completed: '✅',
        rejected: '❌'
      }[job.status] || '📋';
      
      console.log(`   ${statusEmoji} ${job.title} (${job.status})`);
    });
    
    console.log('   ─────────────────────────────────────');
  });
}

// Start monitoring
console.log('🔄 Starting real-time monitoring...\n');

const jobUnsubscribe = monitorJob(jobId);
const staffUnsubscribe = monitorStaffJobs();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping monitoring...');
  jobUnsubscribe();
  staffUnsubscribe();
  process.exit(0);
});

// Keep the script running
setInterval(() => {
  // Just keep alive
}, 1000);
