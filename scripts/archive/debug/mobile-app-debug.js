/**
 * Mobile App Jobs Debug Script
 * Run this in a browser console after loading the mobile app as staff@siamoon.com
 * to see what's happening with job data
 */

// Test the staffJobService directly in browser
async function testMobileAppJobs() {
  console.log('🔄 Testing mobile app jobs functionality...');
  
  // Check if we have access to the services
  if (typeof window !== 'undefined' && window.staffJobService) {
    console.log('✅ staffJobService is available');
    
    try {
      // Test with the staff document ID (not Firebase UID)
      const staffId = 'IDJrsXWiL2dCHVpveH97';
      console.log('🔍 Testing with staff ID:', staffId);
      
      const response = await window.staffJobService.getStaffJobs(staffId);
      console.log('📊 Staff jobs response:', response);
      
      if (response.success) {
        console.log(`✅ Found ${response.jobs.length} jobs for staff`);
        response.jobs.forEach((job, index) => {
          console.log(`Job ${index + 1}:`, {
            id: job.id,
            title: job.title,
            status: job.status,
            assignedTo: job.assignedTo,
            assignedStaffId: job.assignedStaffId
          });
        });
      } else {
        console.error('❌ Failed to get jobs:', response.error);
      }
    } catch (error) {
      console.error('❌ Error testing jobs:', error);
    }
  } else {
    console.log('❌ staffJobService not available in window');
    console.log('Available services:', Object.keys(window).filter(key => key.includes('Service')));
  }
  
  // Check if we can access the hooks and contexts
  console.log('🔍 Checking React contexts...');
  
  // Try to find React fiber and get current context values
  const appElement = document.querySelector('#root');
  if (appElement && appElement._reactInternalFiber || appElement._reactInternalInstance) {
    console.log('✅ React app detected');
  } else {
    console.log('❌ React app structure not found');
  }
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.testMobileAppJobs = testMobileAppJobs;
  console.log('🚀 Mobile app debug functions loaded. Run testMobileAppJobs() in console.');
}

export default testMobileAppJobs;
