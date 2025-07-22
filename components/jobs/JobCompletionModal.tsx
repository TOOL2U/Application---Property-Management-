/**
 * Job Completion Modal
 * Handles job completion with location logging and final notes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Job } from '@/types/job';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { jobSessionAuditService } from '@/services/jobSessionAuditService';

interface JobCompletionModalProps {
  job: Job | null;
  visible: boolean;
  onDismiss: () => void;
  onJobCompleted: (job: Job, completionData: JobCompletionData) => void;
}

interface JobCompletionData {
  jobId: string;
  staffId: string;
  endTime: Date;
  endLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  completionNotes: string;
  status: 'completed';
}

export const JobCompletionModal: React.FC<JobCompletionModalProps> = ({
  job,
  visible,
  onDismiss,
  onJobCompleted,
}) => {
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const handleCompleteJob = async () => {
    if (!job || !currentProfile) return;

    setLoading(true);
    
    try {
      // Step 1: Get current timestamp
      const endTime = new Date();
      
      // Step 2: Fetch GPS location
      let endLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // 10 seconds timeout
          });
          
          endLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
          };
        }
      } catch (locationError) {
        console.warn('Could not get completion location:', locationError);
        // Continue without location - not blocking
      }

      // Step 3: Create completion data
      const completionData: JobCompletionData = {
        jobId: job.id,
        staffId: currentProfile.id,
        endTime,
        endLocation,
        completionNotes: completionNotes.trim(),
        status: 'completed',
      };

      // Step 4: Update job status and session in Firestore
      const { getDb } = await import('@/lib/firebase');
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      const db = await getDb();
      
      // Update job status
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completionNotes: completionNotes.trim(),
        updatedAt: serverTimestamp(),
      });

      // Update job session
      const sessionRef = doc(db, 'job_sessions', job.id);
      await updateDoc(sessionRef, {
        status: 'completed',
        endTime: serverTimestamp(),
        endLocation,
        completionNotes: completionNotes.trim(),
        updatedAt: serverTimestamp(),
      });

      // 🔍 INVISIBLE AUDIT LOGGING - Complete session for AI analysis
      await jobSessionAuditService.completeJobSession({
        jobId: job.id,
        endTime,
        endLocation,
        completionNotes: completionNotes.trim(),
        finalChecklistData: [], // Will be passed from parent component
        finalPhotos: [], // Will be passed from parent component
      });

      // Step 5: Call parent callback with updated job
      const updatedJob = { 
        ...job, 
        status: 'completed' as const,
        completionNotes: completionNotes.trim(),
        completedAt: endTime,
      };
      onJobCompleted(updatedJob, completionData);
      
      // Close modal
      onDismiss();

      // Show success feedback
      Alert.alert(
        '🎉 Job Completed!',
        `${job.title} has been marked as completed.${endLocation ? ' Final location logged.' : ''}`,
        [{ text: 'Great!', style: 'default' }]
      );

    } catch (error) {
      console.error('Error completing job:', error);
      Alert.alert(
        'Error',
        'Failed to complete job. Please try again.',
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
          <Text style={styles.title}>Complete Job?</Text>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobAddress}>{job.location?.address || 'Location not specified'}</Text>
        </View>

        {/* Completion Message */}
        <Text style={styles.message}>
          Are you ready to mark this job as completed?
        </Text>

        {/* Completion Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>
            Completion Notes <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TextInput
            style={styles.notesInput}
            value={completionNotes}
            onChangeText={setCompletionNotes}
            placeholder="Add any final notes about the job completion..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Location Notice */}
        <View style={styles.notice}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.noticeText}>
            Your completion location and timestamp will be recorded
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
            onPress={handleCompleteJob}
            style={[styles.completeButton, loading && styles.completeButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#ffffff" />
                <Text style={styles.completeButtonText}>Complete Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    maxHeight: '80%',
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
    marginBottom: 20,
    lineHeight: 24,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  optional: {
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  notesInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#4B5563',
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
  completeButton: {
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
  completeButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default JobCompletionModal;
