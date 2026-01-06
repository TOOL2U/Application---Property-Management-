#!/usr/bin/env node
/**
 * Check Jobs Assigned to Cleaner
 * Diagnostic script to see what fields are actually in job documents
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase config (from your project)
const firebaseConfig = {
  apiKey: "AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "1045698691062",
  appId: "1:1045698691062:web:20ea3e91ae49ff8c75baa2",
  measurementId: "G-KC2BMTXMSR"
};

let app, db;

async function checkCleanerJobs() {
  console.log('\n🔍 Checking jobs in Firebase...\n');
  
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Get all jobs
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(jobsRef);
    
    console.log(`📊 Total jobs in database: ${jobsSnapshot.size}\n`);
    
    if (jobsSnapshot.empty) {
      console.log('❌ No jobs found in database');
      return;
    }
    
    // Check each job
    console.log('📋 Job Assignment Fields:\n');
    jobsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n${index + 1}. Job ID: ${doc.id}`);
      console.log(`   Title: ${data.title || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   scheduledDate: ${data.scheduledDate || 'N/A'}`);
      
      // Check ALL possible assignment fields
      console.log(`\n   Assignment Fields:`);
      console.log(`   - assignedStaffId: ${data.assignedStaffId || 'NOT SET'}`);
      console.log(`   - assignedTo: ${data.assignedTo || 'NOT SET'}`);
      console.log(`   - assignedStaff: ${data.assignedStaff || 'NOT SET'}`);
      console.log(`   - staffId: ${data.staffId || 'NOT SET'}`);
      console.log(`   - cleaner: ${data.cleaner || 'NOT SET'}`);
      console.log(`   - assignedStaffName: ${data.assignedStaffName || 'NOT SET'}`);
      console.log(`   - assignedStaffEmail: ${data.assignedStaffEmail || 'NOT SET'}`);
      
      // Check if this might be the cleaner's job
      const possibleCleanerJob = 
        data.assignedStaffId === 'dEnHUdPyZU0Uutwt6Aj5' ||
        data.assignedTo === 'dEnHUdPyZU0Uutwt6Aj5' ||
        data.assignedStaff === 'Cleaner' ||
        data.assignedStaffName === 'Cleaner' ||
        data.assignedStaffEmail === 'cleaner@siamoon.com' ||
        data.staffId === 'dEnHUdPyZU0Uutwt6Aj5';
      
      if (possibleCleanerJob) {
        console.log(`\n   🎯 THIS LOOKS LIKE THE CLEANER'S JOB!`);
      }
      
      console.log(`\n   Full assignment-related fields:`);
      Object.keys(data).forEach(key => {
        if (key.toLowerCase().includes('assign') || 
            key.toLowerCase().includes('staff') || 
            key.toLowerCase().includes('clean')) {
          console.log(`   - ${key}: ${JSON.stringify(data[key])}`);
        }
      });
    });
    
    console.log('\n\n📊 SUMMARY:\n');
    console.log('Fields the mobile app queries:');
    console.log('  1. assignedStaffId == "dEnHUdPyZU0Uutwt6Aj5" (Primary)');
    console.log('  2. assignedTo == "dEnHUdPyZU0Uutwt6Aj5" (Fallback)');
    
    console.log('\nTo assign job to mobile cleaner, backend needs to set:');
    console.log('  assignedStaffId: "dEnHUdPyZU0Uutwt6Aj5"');
    console.log('  OR');
    console.log('  assignedTo: "dEnHUdPyZU0Uutwt6Aj5"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCleanerJobs()
  .then(() => {
    console.log('\n✅ Diagnostic complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
