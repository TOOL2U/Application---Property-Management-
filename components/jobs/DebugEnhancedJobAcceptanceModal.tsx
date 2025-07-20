/**
 * Debug Enhanced Job Acceptance Modal
 * This version includes extensive logging to help diagnose the "job not found" issue
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import EnhancedJobAcceptanceModalCompat from '@/components/jobs/EnhancedJobAcceptanceModalCompat';
import type { Job } from '@/types/job';

interface DebugEnhancedJobAcceptanceModalProps {
  visible: boolean;
  job: Job | null;
  staffId: string;
  onClose: () => void;
  onJobAccepted: (job: Job) => void;
  enableGPSVerification?: boolean;
  enableOfflineMode?: boolean;
  enableProgressTracking?: boolean;
  enableRequirementChecking?: boolean;
}

export default function DebugEnhancedJobAcceptanceModal(props: DebugEnhancedJobAcceptanceModalProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (props.visible) {
      const debug = {
        timestamp: new Date().toISOString(),
        jobExists: !!props.job,
        jobId: props.job?.id || 'N/A',
        jobTitle: props.job?.title || 'N/A',
        staffId: props.staffId || 'N/A',
        hasRequirements: props.job?.requirements?.length || 0,
        hasLocation: !!props.job?.location,
        hasCoordinates: !!props.job?.location?.coordinates,
        jobType: props.job?.type || 'N/A',
        jobStatus: props.job?.status || 'N/A',
        jobKeys: props.job ? Object.keys(props.job) : [],
        propsKeys: Object.keys(props)
      };

      setDebugInfo(debug);

      console.log('🔍 DEBUG: Enhanced Modal Opening', debug);

      // Alert if job is null/undefined
      if (!props.job) {
        console.error('❌ DEBUG: Job is null/undefined when modal opens');
        Alert.alert(
          'Debug Error',
          'Job is null or undefined. Check the component that\'s calling this modal.',
          [
            { 
              text: 'Show Debug Info', 
              onPress: () => Alert.alert('Debug Info', JSON.stringify(debug, null, 2))
            },
            { text: 'Close', onPress: props.onClose }
          ]
        );
        return;
      }

      // Alert if job is missing critical fields
      if (!props.job.id) {
        console.error('❌ DEBUG: Job is missing ID field');
        Alert.alert('Debug Error', `Job object exists but missing ID. Job: ${JSON.stringify(props.job, null, 2)}`);
        return;
      }
    }
  }, [props.visible, props.job]);

  const handleJobAccepted = (job: Job) => {
    console.log('✅ DEBUG: Job accepted callback triggered', {
      jobId: job.id,
      jobTitle: job.title,
      timestamp: new Date().toISOString()
    });
    
    try {
      props.onJobAccepted(job);
    } catch (error) {
      console.error('❌ DEBUG: Error in onJobAccepted callback:', error);
      Alert.alert('Debug Error', `Error in job accepted callback: ${error}`);
    }
  };

  const handleClose = () => {
    console.log('🔄 DEBUG: Modal closing', {
      timestamp: new Date().toISOString(),
      hadJob: !!props.job
    });
    
    try {
      props.onClose();
    } catch (error) {
      console.error('❌ DEBUG: Error in onClose callback:', error);
      Alert.alert('Debug Error', `Error in close callback: ${error}`);
    }
  };

  // Add debug overlay if needed
  if (props.visible && !props.job) {
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 1000
      }}>
        <View style={{
          backgroundColor: '#1a1a2e',
          padding: 20,
          borderRadius: 12,
          maxWidth: '90%'
        }}>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Debug: Job Not Found
          </Text>
          <Text style={{ color: '#ef4444', marginBottom: 16 }}>
            The modal was opened with a null or undefined job. This usually means:
          </Text>
          <Text style={{ color: '#ffffff', marginBottom: 8 }}>
            • The job selection function isn't working correctly
          </Text>
          <Text style={{ color: '#ffffff', marginBottom: 8 }}>
            • The job data isn't being passed properly
          </Text>
          <Text style={{ color: '#ffffff', marginBottom: 16 }}>
            • There's a timing issue with state updates
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: '#ef4444',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 8
            }}
            onPress={() => {
              console.log('🔍 Debug Info:', debugInfo);
              Alert.alert('Debug Info', JSON.stringify(debugInfo, null, 2));
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Show Debug Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#6b7280',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleClose}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <EnhancedJobAcceptanceModalCompat
      {...props}
      onJobAccepted={handleJobAccepted}
      onClose={handleClose}
    />
  );
}

// Helper function to validate job object before passing to modal
export const validateJobForModal = (job: any): Job | null => {
  console.log('🔍 Validating job for modal:', job);

  if (!job) {
    console.error('❌ Job is null/undefined');
    return null;
  }

  if (!job.id) {
    console.error('❌ Job missing required field: id');
    return null;
  }

  if (!job.title) {
    console.warn('⚠️ Job missing title, using default');
    job.title = 'Untitled Job';
  }

  if (!job.location) {
    console.warn('⚠️ Job missing location');
    job.location = {
      address: 'No address provided',
      city: '',
      state: '',
      zipCode: ''
    };
  }

  if (!job.requirements) {
    console.warn('⚠️ Job missing requirements, using empty array');
    job.requirements = [];
  }

  console.log('✅ Job validation passed');
  return job;
};

// Usage example:
export const useDebugJobModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const openModal = (job: any) => {
    console.log('📞 openModal called with:', job);
    
    const validatedJob = validateJobForModal(job);
    if (!validatedJob) {
      Alert.alert('Error', 'Invalid job data. Cannot open acceptance modal.');
      return;
    }

    setSelectedJob(validatedJob);
    setShowModal(true);
  };

  const closeModal = () => {
    console.log('📞 closeModal called');
    setShowModal(false);
    setSelectedJob(null);
  };

  return {
    showModal,
    selectedJob,
    openModal,
    closeModal
  };
};
