/**
 * Test Job Requirements Integration
 * Run this to test the property requirements system
 */

import { jobService } from './services/jobService';
import { propertyService } from './services/propertyService';

// Test function to demonstrate the integration
export const testJobRequirementsIntegration = async () => {
  console.log('🧪 Testing Job Requirements Integration...\n');

  // Test 1: Get property requirements template
  console.log('📋 Test 1: Getting property requirements template');
  const propertyId = 'ante_cliff_001'; // Replace with actual property ID
  const requirements = await propertyService.getPropertyRequirementsTemplate(propertyId);
  console.log(`Found ${requirements.length} requirements:`, requirements);

  // Test 2: Apply requirements to job data
  console.log('\n🔧 Test 2: Applying requirements to job data');
  const sampleJobData = {
    title: 'Test Villa Cleaning',
    description: 'Weekly cleaning service',
    type: 'cleaning',
    priority: 'medium',
    assignedTo: 'staff123',
    scheduledDate: new Date(),
    estimatedDuration: 120, // 2 hours
    location: {
      address: '123 Paradise Beach, Villa 42',
      city: 'Koh Phangan',
      state: 'Surat Thani',
      zipCode: '84280'
    },
    contacts: [
      {
        name: 'Property Manager',
        role: 'Manager',
        phone: '+66123456789',
        email: 'manager@example.com'
      }
    ]
  };

  const jobWithRequirements = await jobService.applyPropertyRequirementsToJob(
    sampleJobData, 
    propertyId
  );

  console.log('Job data with requirements applied:');
  console.log('- Requirements count:', jobWithRequirements.requirements?.length || 0);
  console.log('- Sample requirements:', jobWithRequirements.requirements?.slice(0, 2));

  // Test 3: Simulate completion wizard data
  console.log('\n🎯 Test 3: How completion wizard will receive this data');
  const wizardJob = {
    id: 'test_job_001',
    ...jobWithRequirements,
    status: 'in_progress',
    startedAt: new Date(),
  };

  console.log('Job object for completion wizard:');
  console.log('- Job ID:', wizardJob.id);
  console.log('- Status:', wizardJob.status);
  console.log('- Requirements for validation:', wizardJob.requirements?.length || 0);
  
  if (wizardJob.requirements && wizardJob.requirements.length > 0) {
    console.log('\nRequirements that will appear in wizard:');
    wizardJob.requirements.forEach((req, index) => {
      console.log(`  ${index + 1}. [${req.category.toUpperCase()}] ${req.description}`);
      console.log(`     Required: ${req.isRequired ? 'Yes' : 'No'}`);
      console.log(`     Est. Time: ${req.estimatedTime || 'N/A'} minutes`);
      if (req.templateNotes) {
        console.log(`     Notes: ${req.templateNotes}`);
      }
      console.log('');
    });
  }

  console.log('✅ Integration test complete!\n');
  
  return {
    propertyRequirements: requirements,
    jobWithRequirements,
    wizardJob
  };
};

// Example of how to use in job creation
export const createJobExample = async () => {
  console.log('📝 Example: Creating job with property requirements\n');

  const jobData = {
    title: 'Ante Cliff Villa - Weekly Cleaning',
    description: 'Comprehensive cleaning service for cliff-side villa',
    type: 'cleaning',
    priority: 'high',
    propertyId: 'ante_cliff_001',
    assignedTo: 'staff_001',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    estimatedDuration: 180, // 3 hours
  };

  // Apply property requirements template
  const jobWithRequirements = await jobService.applyPropertyRequirementsToJob(
    jobData,
    jobData.propertyId
  );

  console.log('✅ Job ready for creation with requirements:');
  console.log('- Title:', jobWithRequirements.title);
  console.log('- Property:', jobWithRequirements.propertyId);
  console.log('- Requirements:', jobWithRequirements.requirements?.length || 0);
  
  // This would be passed to your job creation system
  return jobWithRequirements;
};

// Example of completion wizard integration
export const completionWizardExample = () => {
  console.log('🧙‍♂️ Example: How completion wizard will work\n');

  const exampleJob = {
    id: 'job_123',
    title: 'Villa Cleaning',
    status: 'in_progress',
    requirements: [
      {
        id: 'safety_01',
        description: 'Complete safety walkthrough of cliff-side areas',
        isCompleted: false,
        isRequired: true,
        category: 'safety',
        photos: [],
        notes: '',
        estimatedTime: 15,
        templateNotes: 'Pay special attention to railings and cliff edges'
      },
      {
        id: 'clean_01',
        description: 'Clean all bathrooms thoroughly',
        isCompleted: false,
        isRequired: true,
        category: 'cleaning',
        photos: [],
        notes: '',
        estimatedTime: 30
      },
      {
        id: 'photo_01',
        description: 'Take after photos of completed work',
        isCompleted: false,
        isRequired: true,
        category: 'photo',
        photos: [],
        notes: '',
        estimatedTime: 5
      }
    ]
  };

  console.log('🎯 Completion wizard will show:');
  console.log('Step 1: Requirements Check');
  exampleJob.requirements.forEach((req, index) => {
    console.log(`  ☐ ${req.description} (${req.estimatedTime}min)`);
  });

  console.log('\nStep 2: Photo Documentation');
  console.log('  📸 Upload photos for photo requirements');
  
  console.log('\nStep 3: Quality Review');
  console.log('  ✅ Validate all requirements completed');
  
  console.log('\nStep 4: Final Notes');
  console.log('  📝 Add completion notes');
  
  console.log('\nStep 5: Confirmation');
  console.log('  🎉 Submit job completion with requirement data');

  return exampleJob;
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Running Job Requirements Integration Tests\n');
  console.log('=' + '='.repeat(50) + '\n');

  try {
    await testJobRequirementsIntegration();
    await createJobExample();
    completionWizardExample();
    
    console.log('🎉 All tests completed successfully!');
    console.log('The mobile app is ready for property requirements integration.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};
