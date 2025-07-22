/**
 * Streamlined Job Start Flow
 * Simple confirmation -> GPS tracking -> Job session creation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Job } from '@/types/job';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { jobSessionAuditService } from '@/services/jobSessionAuditService';

interface JobStartModalProps {
  job: Job | null;
  visible: boolean;
  onDismiss: () => void;
  onJobStarted: (job: Job, sessionData: JobSessionData) => void;
}

interface JobSessionData {
  jobId: string;
  staffId: string;
  startTime: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  status: 'in_progress';
}

export const JobStartModal: React.FC<JobStartModalProps> = ({
  job,
  visible,
  onDismiss,
  onJobStarted,
}) => {
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(false);

  const handleStartJob = async () => {
    if (!job || !currentProfile) return;

    setLoading(true);
    
    try {
      // Step 1: Get current timestamp
      const startTime = new Date();
      
      // Step 2: Fetch GPS location
      let startLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds timeout
          });
          
          startLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
          };
        }
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        // Continue without location - not blocking
      }

      // Step 3: Create job session data
      const sessionData: JobSessionData = {
        jobId: job.id,
        staffId: currentProfile.id,
        startTime,
        startLocation,
        status: 'in_progress',
      };

      // Step 4: Update job status and create session in Firestore
      const { getDb } = await import('@/lib/firebase');
      const { doc, updateDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const db = await getDb();
      
      // Update job status
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create job session
      const sessionRef = doc(db, 'job_sessions', job.id);
      await setDoc(sessionRef, {
        ...sessionData,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 🔍 INVISIBLE AUDIT LOGGING - Staff unaware
      await jobSessionAuditService.createJobSession({
        jobId: job.id,
        staffId: currentProfile.id,
        startTime,
        startLocation,
        jobDetails: {
          title: job.title,
          description: job.description || '',
          category: job.type || 'general',
          priority: job.priority || 'medium',
          estimatedDuration: job.estimatedDuration,
          specialInstructions: job.specialInstructions,
        },
        staffDetails: {
          staffId: currentProfile.id,
          name: currentProfile.name,
          role: currentProfile.role,
          department: currentProfile.department,
        },
      });

      // Step 5: Call parent callback with updated job
      const updatedJob = { ...job, status: 'in_progress' as const };
      onJobStarted(updatedJob, sessionData);
      
      // Close modal
      onDismiss();

      // Show success feedback
      Alert.alert(
        '✅ Job Started!',
        `${job.title} is now in progress.${startLocation ? ' Location logged.' : ''}`,
        [{ text: 'Continue', style: 'default' }]
      );

    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert(
        'Error',
        'Failed to start job. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="play-circle" size={32} color="#10B981" />
          <Text style={styles.title}>Start Job?</Text>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobAddress}>{job.location?.address || 'Location not specified'}</Text>
        </View>

        {/* Confirmation Message */}
        <Text style={styles.message}>
          Are you ready to begin this job now?
        </Text>

        {/* Location Notice */}
        <View style={styles.notice}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.noticeText}>
            Your location will be recorded when starting the job
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartJob}
            style={[styles.startButton, loading && styles.startButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="play" size={16} color="#ffffff" />
                <Text style={styles.startButtonText}>Yes, Start</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#1F2937',
    margin: 20,
    borderRadius: 16,
    padding: 0,
    maxWidth: 400,
    alignSelf: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  jobInfo: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  jobAddress: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  noticeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default JobStartModal;
