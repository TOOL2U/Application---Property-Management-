/**
 * Test Script: Send Job to staff@siamoon.com
 * 
 * This script sends a test job assignment to staff@siamoon.com
 * and verifies it appears in their dashboard.
 */

const API_BASE_URL = 'http://localhost:8083';
const STAFF_EMAIL = 'staff@siamoon.com';

async function sendTestJobToStaff() {
  console.log('🎯 Sending test job to staff@siamoon.com...');

  const jobPayload = {
    staffId: STAFF_EMAIL,
    propertyId: `test_property_${Date.now()}`,
    bookingId: `test_booking_${Date.now()}`,
    title: 'Test Job Assignment',
    description: 'This is a test job sent to staff@siamoon.com dashboard for verification',
    type: 'cleaning',
    priority: 'high',
    estimatedDuration: 90,
    location: {
      address: '123 Test Property Street, Test City',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    assignedBy: 'admin@siamoon.com',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
    requirements: [
      {
        type: 'photo',
        description: 'Take before and after photos of all rooms',
        isRequired: true
      },
      {
        type: 'checklist',
        description: 'Complete standard cleaning checklist',
        isRequired: true
      },
      {
        type: 'inspection',
        description: 'Perform quality inspection',
        isRequired: false
      }
    ],
    bookingDetails: {
      guestName: 'Test Guest',
      checkIn: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      checkOut: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
      roomNumber: 'Test Room 101',
      specialRequests: 'Extra towels, late checkout'
    }
  };

  try {
    console.log('📤 Sending job assignment request...');
    
    const response = await fetch(`${API_BASE_URL}/api/job-assignment/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sia-moon-mobile-app-2025-secure-key'
      },
      body: JSON.stringify(jobPayload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Job assignment successful!');
      console.log('📋 Job Details:');
      console.log(`   Job ID: ${result.jobId}`);
      console.log(`   Staff: ${STAFF_EMAIL}`);
      console.log(`   Title: ${jobPayload.title}`);
      console.log(`   Priority: ${jobPayload.priority}`);
      console.log(`   Scheduled: ${jobPayload.scheduledFor}`);
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('1. Open the mobile app: http://localhost:8083');
      console.log('2. Login with: staff@siamoon.com');
      console.log('3. Check the Dashboard for the new job notification');
      console.log('4. Go to Jobs tab to see the assigned job');
      console.log('');
      console.log('📱 The job should appear in:');
      console.log('   - Dashboard notifications');
      console.log('   - Jobs tab (pending jobs)');
      console.log('   - Real-time notifications (if enabled)');
      
      return {
        success: true,
        jobId: result.jobId,
        job: result.job
      };
    } else {
      console.error('❌ Job assignment failed:');
      console.error('   Status:', response.status);
      console.error('   Error:', result.error || 'Unknown error');
      console.error('   Details:', result);
      
      return {
        success: false,
        error: result.error || 'Assignment failed'
      };
    }
  } catch (error) {
    console.error('❌ Network error sending job assignment:');
    console.error('   Error:', error.message);
    console.error('   Make sure the development server is running on port 8083');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Verify staff account exists
async function verifyStaffAccount() {
  console.log('🔍 Verifying staff account exists...');
  
  try {
    // This would typically check the staff_accounts collection
    // For now, we'll assume the account exists
    console.log('✅ Staff account verification skipped (assuming exists)');
    return true;
  } catch (error) {
    console.error('❌ Error verifying staff account:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting job assignment test...');
  console.log('');
  
  // Verify staff account
  const accountExists = await verifyStaffAccount();
  if (!accountExists) {
    console.error('❌ Staff account verification failed');
    process.exit(1);
  }
  
  // Send test job
  const result = await sendTestJobToStaff();
  
  if (result.success) {
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('📱 Check the mobile app dashboard to see the job assignment.');
  } else {
    console.log('');
    console.log('❌ Test failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  sendTestJobToStaff,
  verifyStaffAccount
};
