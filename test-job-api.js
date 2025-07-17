#!/usr/bin/env node

/**
 * API Testing Script for Job Assignment
 * Tests the API endpoints used by the mobile app
 */

const API_BASE_URL = 'http://localhost:8082';

// Test job assignment API
async function testJobAssignmentAPI() {
  console.log('🧪 Testing Job Assignment API');
  console.log('=============================');
  
  const jobData = {
    jobId: 'test_job_' + Date.now(),
    staffId: 'iJxnTcy4xWZIoDVNnl5AgYSVPku2',
    title: 'API Test Job',
    description: 'Test job created via API',
    type: 'cleaning',
    priority: 'medium',
    status: 'pending',
    scheduledDate: new Date().toISOString(),
    estimatedDuration: 90,
    location: {
      address: '123 API Test Street',
      room: 'Room 101'
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/job-assignment/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Job assignment successful:', result);
    } else {
      console.log('❌ Job assignment failed:', result);
    }
  } catch (error) {
    console.error('❌ API request failed:', error);
  }
}

// Test job status update API
async function testJobStatusAPI() {
  console.log('\n🧪 Testing Job Status Update API');
  console.log('=================================');
  
  const statusUpdate = {
    jobId: 'test_job_123',
    staffId: 'iJxnTcy4xWZIoDVNnl5AgYSVPku2',
    status: 'accepted',
    startedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/job-assignment/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusUpdate)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Status update successful:', result);
    } else {
      console.log('❌ Status update failed:', result);
    }
  } catch (error) {
    console.error('❌ API request failed:', error);
  }
}

// Run tests
async function runAPITests() {
  await testJobAssignmentAPI();
  await testJobStatusAPI();
}

runAPITests().catch(console.error);
