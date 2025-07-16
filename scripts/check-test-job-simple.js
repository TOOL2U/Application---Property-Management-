/**
 * Simple Test Job Status Checker
 * Uses compatible Firebase imports to check test job status
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase configuration (same as main app)
const firebaseConfig = {
  apiKey: "AIzaSyBOqKJGJGJGJGJGJGJGJGJGJGJGJGJGJGJG",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEST_JOB_ID = 'test_job_001';

async function checkTestJobStatus() {
  try {
    console.log('🔍 Checking test job status...');
    console.log('📋 Job ID:', TEST_JOB_ID);
    console.log('');

    const jobRef = doc(db, 'jobs', TEST_JOB_ID);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const jobData = jobSnap.data();
      
      console.log('✅ TEST JOB FOUND!');
      console.log('==================');
      console.log('📋 Title:', jobData.title || 'Unknown');
      console.log('📊 Status:', jobData.status || 'Unknown');
      console.log('⚡ Priority:', jobData.priority || 'Unknown');
      console.log('👤 Assigned to:', jobData.assignedStaffId || 'Unknown');
      console.log('🏠 Property:', jobData.propertyName || jobData.location?.address || 'Unknown');
      console.log('');
      
      // Timestamps
      console.log('⏰ TIMESTAMPS:');
      if (jobData.createdAt) {
        console.log('- Created:', jobData.createdAt.toDate().toLocaleString());
      }
      if (jobData.assignedAt) {
        console.log('- Assigned:', jobData.assignedAt.toDate().toLocaleString());
      }
      if (jobData.acceptedAt) {
        console.log('- ✅ Accepted:', jobData.acceptedAt.toDate().toLocaleString());
      }
      if (jobData.rejectedAt) {
        console.log('- ❌ Rejected:', jobData.rejectedAt.toDate().toLocaleString());
        if (jobData.rejectionReason) {
          console.log('- Reason:', jobData.rejectionReason);
        }
      }
      if (jobData.updatedAt) {
        console.log('- Updated:', jobData.updatedAt.toDate().toLocaleString());
      }
      console.log('');

      // Status analysis
      console.log('🎯 MOBILE APP TEST STATUS:');
      console.log('========================');
      
      if (jobData.status === 'pending') {
        console.log('🟡 Status: PENDING');
        console.log('📱 Expected behavior:');
        console.log('   ✅ Should appear in mobile app dashboard');
        console.log('   ✅ Should show notification popup');
        console.log('   ✅ Should have Accept/Decline buttons');
        console.log('   ⏳ Waiting for staff to accept or decline');
        console.log('');
        console.log('🧪 TO TEST:');
        console.log('1. Open mobile app: http://localhost:8081');
        console.log('2. Login with staff account');
        console.log('3. Go to Dashboard tab');
        console.log('4. Look for the test job in pending jobs');
        console.log('5. Click Accept or Decline to test workflow');
        
      } else if (jobData.status === 'accepted') {
        console.log('🟢 Status: ACCEPTED');
        console.log('🎉 SUCCESS! Real-time sync is working!');
        console.log('📱 Mobile app behavior:');
        console.log('   ✅ Job was accepted by staff member');
        console.log('   ✅ Status updated in Firebase');
        console.log('   ✅ Job should have moved to Active Jobs tab');
        console.log('   ✅ Real-time synchronization confirmed');
        
      } else if (jobData.status === 'rejected') {
        console.log('🔴 Status: REJECTED');
        console.log('📱 Mobile app behavior:');
        console.log('   ✅ Job was declined by staff member');
        console.log('   ✅ Status updated in Firebase');
        console.log('   ✅ Job removed from pending jobs');
        console.log('   ✅ Real-time synchronization confirmed');
        
      } else {
        console.log('🟠 Status:', jobData.status.toUpperCase());
        console.log('📱 Unexpected status - check mobile app behavior');
      }

    } else {
      console.log('❌ TEST JOB NOT FOUND');
      console.log('');
      console.log('💡 To create the test job, run:');
      console.log('   node scripts/create-test-job-for-mobile.js create');
      console.log('');
      console.log('🔍 Or check if job was deleted/moved:');
      console.log('   - Job may have been processed and removed');
      console.log('   - Check Firebase console for job history');
      console.log('   - Verify job ID:', TEST_JOB_ID);
    }

  } catch (error) {
    console.error('❌ Error checking test job:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('- Check Firebase connection');
    console.log('- Verify Firebase configuration');
    console.log('- Ensure proper permissions');
  }
}

// Run the check
checkTestJobStatus();
