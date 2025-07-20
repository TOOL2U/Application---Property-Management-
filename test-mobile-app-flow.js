/**
 * Test the mobile app authentication and job loading flow
 */

const { adminAuth, adminDb } = require('./lib/firebase-admin');

async function testMobileAppFlow() {
  console.log('🔄 Testing complete mobile app flow...');
  
  try {
    // Step 1: Check if staff account exists
    console.log('1️⃣ Checking staff account...');
    const staffAccountQuery = await adminDb
      .collection('staff_accounts')
      .where('email', '==', 'staff@siamoon.com')
      .get();
    
    if (staffAccountQuery.empty) {
      console.error('❌ Staff account not found for staff@siamoon.com');
      return;
    }
    
    const staffAccount = staffAccountQuery.docs[0];
    const staffData = staffAccount.data();
    console.log('✅ Staff account found:', {
      id: staffAccount.id,
      email: staffData.email,
      name: staffData.name,
      firebaseUid: staffData.firebaseUid
    });
    
    // Step 2: Check jobs assigned to this staff's Firebase UID
    console.log('2️⃣ Checking jobs assigned to Firebase UID...');
    const jobsQuery = await adminDb
      .collection('jobs')
      .where('assignedStaffId', '==', staffData.firebaseUid)
      .get();
    
    console.log(`✅ Found ${jobsQuery.docs.length} jobs assigned to Firebase UID`);
    
    jobsQuery.docs.forEach((doc, index) => {
      const job = doc.data();
      console.log(`Job ${index + 1}:`, {
        id: doc.id,
        title: job.title,
        status: job.status,
        assignedStaffId: job.assignedStaffId
      });
    });
    
    // Step 3: Test what staffJobService would return
    console.log('3️⃣ Testing staffJobService...');
    const { staffJobService } = require('./services/staffJobService.ts');
    
    // The mobile app uses the staff document ID (not Firebase UID)
    const response = await staffJobService.getStaffJobs(staffAccount.id);
    
    if (response.success) {
      console.log(`✅ staffJobService returned ${response.jobs.length} jobs`);
      
      // Filter jobs like the mobile app hook does
      const pendingJobs = response.jobs.filter(job => job.status === 'assigned');
      const activeJobs = response.jobs.filter(job => ['accepted', 'in_progress'].includes(job.status));
      
      console.log('📱 Mobile app would show:');
      console.log(`- Pending filter: ${pendingJobs.length} jobs`);
      console.log(`- Active filter: ${activeJobs.length} jobs`);
      console.log(`- All filter: ${response.jobs.length} jobs`);
      
      if (pendingJobs.length === 0 && activeJobs.length === 0) {
        console.log('⚠️ THIS IS THE ISSUE: No jobs would show in any filter!');
      }
      
    } else {
      console.error('❌ staffJobService failed:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Error in mobile app flow test:', error);
  }
}

testMobileAppFlow();
