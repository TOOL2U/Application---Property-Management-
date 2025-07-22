/**
 * Job Execution Screen
 * Complete job workflow with progress tracking, photos, and notes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Job } from '@/types/job';
import { usePINAuth } from '@/contexts/PINAuthContext';
import JobChecklist from './JobChecklist';
import JobCompletionModal from './JobCompletionModal';
import { jobSessionAuditService } from '@/services/jobSessionAuditService';

interface JobPhoto {
  id: string;
  uri: string;
  timestamp: Date;
  description?: string;
}

interface JobExecutionScreenProps {
  job: Job;
  onJobCompleted: (job: Job) => void;
  onGoBack: () => void;
}

export const JobExecutionScreen: React.FC<JobExecutionScreenProps> = ({
  job,
  onJobCompleted,
  onGoBack,
}) => {
  const { currentProfile } = usePINAuth();
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [jobStartTime, setJobStartTime] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize job start time
    setJobStartTime(new Date());
  }, []);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Please allow camera access to take photos for this job.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: JobPhoto = {
          id: `photo_${Date.now()}`,
          uri: result.assets[0].uri,
          timestamp: new Date(),
          description: `Job progress photo ${photos.length + 1}`,
        };
        setPhotos(prev => [...prev, newPhoto]);
        
        // 🔍 INVISIBLE AUDIT LOGGING - Staff unaware
        jobSessionAuditService.logPhotoCapture({
          jobId: job.id,
          photoId: newPhoto.id,
          timestamp: newPhoto.timestamp,
          description: newPhoto.description,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission',
          'Please allow gallery access to select photos for this job.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: JobPhoto = {
          id: `photo_${Date.now()}`,
          uri: result.assets[0].uri,
          timestamp: new Date(),
          description: `Job progress photo ${photos.length + 1}`,
        };
        setPhotos(prev => [...prev, newPhoto]);
        
        // 🔍 INVISIBLE AUDIT LOGGING - Staff unaware
        jobSessionAuditService.logPhotoCapture({
          jobId: job.id,
          photoId: newPhoto.id,
          timestamp: newPhoto.timestamp,
          description: newPhoto.description,
        });
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how to add a photo for this job',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handleSelectFromGallery },
      ]
    );
  };

  const removePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setPhotos(prev => prev.filter(p => p.id !== photoId))
        },
      ]
    );
  };

  const completedChecklist = checklist.filter(item => item.completed);
  const requiredItems = checklist.filter(item => item.required);
  const requiredCompleted = requiredItems.filter(item => item.completed);
  const canComplete = requiredCompleted.length === requiredItems.length;

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = now.getTime() - jobStartTime.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{job.title}</Text>
          <Text style={styles.headerSubtitle}>
            In Progress • {getElapsedTime()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowCompletionModal(true)}
          style={[styles.completeButton, !canComplete && styles.completeButtonDisabled]}
          disabled={!canComplete}
        >
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Information */}
        <View style={styles.jobInfoCard}>
          <Text style={styles.jobAddress}>{job.location?.address}</Text>
          <Text style={styles.jobDescription}>{job.description}</Text>
          {job.specialInstructions && (
            <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <Text style={styles.instructions}>{job.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Checklist */}
        <JobChecklist
          job={job}
          onChecklistUpdate={setChecklist}
          style={styles.checklistCard}
        />

        {/* Photos Section */}
        <View style={styles.photosCard}>
          <View style={styles.photosHeader}>
            <View style={styles.photosTitleRow}>
              <Ionicons name="camera" size={20} color="#10B981" />
              <Text style={styles.photosTitle}>Progress Photos</Text>
            </View>
            <TouchableOpacity onPress={showPhotoOptions} style={styles.addPhotoButton}>
              <Ionicons name="add" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          {photos.length === 0 ? (
            <TouchableOpacity onPress={showPhotoOptions} style={styles.emptyPhotosState}>
              <Ionicons name="camera-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyPhotosText}>No photos yet</Text>
              <Text style={styles.emptyPhotosSubtext}>Tap to add progress photos</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosGrid}>
                {photos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoItem}
                    onLongPress={() => removePhoto(photo.id)}
                  >
                    <View style={styles.photoContainer}>
                      <Text style={styles.photoPlaceholder}>📷</Text>
                      <Text style={styles.photoTimestamp}>
                        {photo.timestamp.toLocaleTimeString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={showPhotoOptions} style={styles.addPhotoCard}>
                  <Ionicons name="add-circle-outline" size={32} color="#6B7280" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>

        {/* Completion Status */}
        {!canComplete && requiredItems.length > 0 && (
          <View style={styles.statusCard}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.statusText}>
              Complete {requiredItems.length - requiredCompleted.length} more required tasks to finish this job
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Completion Modal */}
      <JobCompletionModal
        job={job}
        visible={showCompletionModal}
        onDismiss={() => setShowCompletionModal(false)}
        onJobCompleted={(completedJob) => {
          setShowCompletionModal(false);
          onJobCompleted(completedJob);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 2,
  },
  completeButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  jobInfoCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 8,
    flex: 1,
  },
  checklistCard: {
    marginBottom: 16,
  },
  photosCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  addPhotoButton: {
    padding: 8,
  },
  emptyPhotosState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPhotosText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyPhotosSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoItem: {
    width: 100,
  },
  photoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 32,
  },
  photoTimestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  addPhotoCard: {
    width: 100,
    height: 100,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default JobExecutionScreen;
