#!/usr/bin/env node

/**
 * Simple Test Job Monitor - Watch for new jobs
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection,
  onSnapshot,
  query,
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

console.log('🚀 TEST JOB MONITOR ACTIVE');
console.log('========================');
console.log('⏰ Started:', new Date().toLocaleString());
console.log('📱 Ready to receive test job from webapp');
console.log('👀 Watching Firebase jobs collection...');
console.log('');

let lastJobCount = 0;

// Monitor recent jobs
const jobsQuery = query(
  collection(db, 'jobs'),
  orderBy('createdAt', 'desc'),
  limit(5)
);

const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
  const currentJobCount = snapshot.docs.length;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`[${timestamp}] 📊 Found ${currentJobCount} recent jobs`);
  
  // Check for new jobs
  if (currentJobCount > lastJobCount && lastJobCount > 0) {
    console.log('🎉 NEW JOB DETECTED!');
  }
  
  // Show recent jobs
  snapshot.docs.forEach((doc, index) => {
    const job = doc.data();
    const statusEmoji = {
      pending: '⏳',
      assigned: '📋',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌'
    }[job.status] || '📄';
    
    const isNew = index === 0 && currentJobCount > lastJobCount;
    const newFlag = isNew ? ' 🆕 NEW!' : '';
    
    console.log(`   ${statusEmoji} ${job.title || 'Untitled Job'}${newFlag}`);
    console.log(`      Status: ${job.status || 'unknown'}`);
    console.log(`      Created: ${job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleString() : 'unknown'}`);
    
    if (job.assignedTo) {
      console.log(`      Assigned to: ${job.assignedTo}`);
    }
    
    if (isNew) {
      console.log('      🎯 This job should appear in mobile app now!');
    }
    
    console.log('');
  });
  
  lastJobCount = currentJobCount;
  console.log('─'.repeat(50));
}, (error) => {
  console.error('❌ Error monitoring jobs:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping job monitor...');
  unsubscribe();
  process.exit(0);
});

console.log('✅ Monitor is ready! Send your test job from the webapp now.');
console.log('   The mobile app will receive it in real-time.');
console.log('');
