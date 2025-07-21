/**
 * Test Implementation Guide for Enhanced Job Acceptance Modal
 * 
 * This demonstrates the correct way to integrate the enhanced modal
 */

import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import EnhancedJobAcceptanceModalCompat from '@/components/jobs/EnhancedJobAcceptanceModalCompat';
import type { Job } from '@/types/job';

// Example of how to use the enhanced modal correctly
export default function TestJobAcceptanceIntegration() {
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Mock job data that matches the Job type structure
  const createMockJob = (): Job => ({
    id: 'test-job-123',
    title: 'Property Cleaning - Apartment 2B',
    description: 'Deep clean apartment including kitchen, bathroom, and living areas',
    type: 'cleaning',
    status: 'assigned',
    priority: 'high',
    assignedBy: 'admin-123',
    assignedAt: new Date(),
    scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
    estimatedDuration: 120, // 2 hours
    propertyId: 'property-456',
    location: {
      address: '123 Main Street, Apt 2B',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94107',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    },
    contacts: [
      {
        name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        role: 'tenant',
        preferredContactMethod: 'phone'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Bring cleaning supplies',
        isCompleted: false
      },
      {
        id: 'req-2', 
        description: 'Take before and after photos',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Report any maintenance issues',
        isCompleted: false
      }
    ],
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-123',
    notificationsEnabled: true,
    reminderSent: false
  });

  const handleOpenModal = () => {
    // Create a proper job object
    const mockJob = createMockJob();
    
    // Debug logging to see what we're passing
    console.log('🔍 Opening modal with job:', {
      id: mockJob.id,
      title: mockJob.title,
      hasRequirements: mockJob.requirements?.length > 0,
      hasLocation: !!mockJob.location,
      hasCoordinates: !!mockJob.location.coordinates
    });
    
    setSelectedJob(mockJob);
    setShowModal(true);
  };

  const handleJobAccepted = (job: Job) => {
    console.log('✅ Job accepted:', job.id);
    Alert.alert('Success', `Job "${job.title}" has been accepted!`);
    
    // Here you would typically:
    // 1. Update your local state
    // 2. Sync with backend
    // 3. Show success message
    // 4. Navigate to job details or dashboard
  };

  const handleCloseModal = () => {
    console.log('🔄 Closing modal');
    setShowModal(false);
    setSelectedJob(null);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title="Test Enhanced Job Acceptance"
        onPress={handleOpenModal}
      />

      <EnhancedJobAcceptanceModalCompat
        visible={showModal}
        job={selectedJob}
        staffId="staff-123" // Replace with actual staff ID
        onClose={handleCloseModal}
        onJobAccepted={handleJobAccepted}
        enableGPSVerification={true}
        enableOfflineMode={true}
        enableProgressTracking={true}
        enableRequirementChecking={true}
      />
    </View>
  );
}

// Common integration issues and solutions:

/**
 * ISSUE 1: "Job not found" error
 * CAUSE: Passing null or undefined job
 * SOLUTION: Always check job exists before opening modal
 */
const handleJobSelection = (job: Job | null) => {
  if (!job) {
    Alert.alert('Error', 'No job selected');
    return;
  }
  
  // Check job has required fields
  if (!job.id) {
    Alert.alert('Error', 'Invalid job data - missing ID');
    return;
  }
  
  setSelectedJob(job);
  setShowModal(true);
};

/**
 * ISSUE 2: Type mismatch between Job and JobAssignment
 * CAUSE: Using JobAssignment type where Job type expected
 * SOLUTION: Convert JobAssignment to Job format or use correct modal
 */
const convertJobAssignmentToJob = (assignment: any): Job | null => {
  if (!assignment) return null;
  
  // Map JobAssignment fields to Job fields
  return {
    id: assignment.id || assignment.jobId,
    title: assignment.title || 'Untitled Job',
    description: assignment.description || '',
    type: assignment.type || 'general',
    status: assignment.status || 'assigned',
    priority: assignment.priority || 'medium',
    // ... map other required fields
    assignedBy: assignment.assignedBy || '',
    assignedAt: assignment.assignedAt || new Date(),
    scheduledDate: assignment.scheduledFor || assignment.scheduledDate || new Date(),
    estimatedDuration: assignment.estimatedDuration || 60,
    propertyId: assignment.propertyId || '',
    location: assignment.location || {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contacts: assignment.contacts || [],
    requirements: assignment.requirements || [],
    photos: assignment.photos || [],
    createdAt: assignment.createdAt || new Date(),
    updatedAt: assignment.updatedAt || new Date(),
    createdBy: assignment.createdBy || assignment.assignedBy || '',
    notificationsEnabled: true,
    reminderSent: false
  };
};

/**
 * ISSUE 3: Missing required props
 * CAUSE: Not providing staffId or callback functions
 * SOLUTION: Ensure all required props are provided
 */
const EnhancedModalUsage = () => {
  // ❌ WRONG - missing required props
  // <EnhancedJobAcceptanceModalCompat
  //   visible={true}
  //   job={someJob}
  // />

  // ✅ CORRECT - all required props provided
  return (
    <EnhancedJobAcceptanceModalCompat
      visible={showModal}
      job={selectedJob}
      staffId={currentUser?.id || ''}
      onClose={() => setShowModal(false)}
      onJobAccepted={(job) => {
        console.log('Job accepted:', job);
        // Handle acceptance
      }}
      // Optional props with defaults
      enableGPSVerification={true}
      enableOfflineMode={true}
      enableProgressTracking={true}
      enableRequirementChecking={true}
    />
  );
};

export { TestJobAcceptanceIntegration, convertJobAssignmentToJob };
