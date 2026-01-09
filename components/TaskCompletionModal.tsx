import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Task } from '@/types';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useTaskCompletion, PhotoUpload } from '@/hooks/useTaskCompletion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Camera,
  Image as ImageIcon,
  X,
  Plus,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import uuid from 'react-native-uuid';

interface TaskCompletionModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: () => void;
}

const { width } = Dimensions.get('window');
const photoSize = (width - 80) / 3; // 3 photos per row with padding

export function TaskCompletionModal({ visible, task, onClose, onSubmit }: TaskCompletionModalProps) {
  const { currentProfile } = usePINAuth();
  const { submitting, uploadProgress, error, submitTaskCompletion } = useTaskCompletion();
  
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [notes, setNotes] = useState('');
  const [issues, setIssues] = useState('');
  const [startTime] = useState(new Date());

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setPhotos([]);
      setNotes('');
      setIssues('');
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access to take photos for task completion.'
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access to select photos for task completion.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async (type: PhotoUpload['type']) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: PhotoUpload = {
          id: uuid.v4() as string,
          type,
          uri: result.assets[0].uri,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const selectPhoto = async (type: PhotoUpload['type']) => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: PhotoUpload = {
          id: uuid.v4() as string,
          type,
          uri: result.assets[0].uri,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const showPhotoOptions = (type: PhotoUpload['type']) => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => selectPhoto(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    setPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId ? { ...photo, caption } : photo
      )
    );
  };

  const handleSubmit = async () => {
    if (!task || !user) return;

    // Validate required fields
    if (photos.length === 0) {
      Alert.alert('Photos Required', 'Please add at least one photo to complete the task.');
      return;
    }

    const completedAt = new Date();
    const duration = Math.round((completedAt.getTime() - startTime.getTime()) / (1000 * 60)); // minutes

    const completionData = {
      taskId: task.id,
      staffId: user.id,
      notes: notes.trim(),
      issues: issues.trim(),
      photos,
      completedAt,
      duration,
    };

    const success = await submitTaskCompletion(completionData);
    
    if (success) {
      Alert.alert(
        'Task Completed!',
        'Your task completion has been submitted successfully.',
        [{ text: 'OK', onPress: () => { onSubmit(); onClose(); } }]
      );
    } else {
      Alert.alert(
        'Submission Failed',
        error || 'Failed to submit task completion. Please try again.'
      );
    }
  };

  const getPhotoTypeLabel = (type: PhotoUpload['type']) => {
    switch (type) {
      case 'before':
        return 'Before';
      case 'after':
        return 'After';
      case 'issue':
        return 'Issue';
      case 'general':
        return 'General';
      default:
        return 'Photo';
    }
  };

  const getPhotoTypeColor = (type: PhotoUpload['type']) => {
    switch (type) {
      case 'before':
        return '#f59e0b';
      case 'after':
        return '#10b981';
      case 'issue':
        return '#ef4444';
      case 'general':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Complete Task</Text>
            <Text style={styles.subtitle}>{task.propertyName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Task Info */}
          <Card style={styles.taskInfo}>
            <View style={styles.taskHeader}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.taskTitle}>
                {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
              </Text>
            </View>
            <Text style={styles.taskDescription}>{task.description}</Text>
          </Card>

          {/* Photo Upload Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <View style={[styles.photoTypeLabel, { backgroundColor: getPhotoTypeColor(photo.type) }]}>
                    <Text style={styles.photoTypeLabelText}>
                      {getPhotoTypeLabel(photo.type)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: '#fef3c7' }]}
                onPress={() => showPhotoOptions('before')}
              >
                <Plus size={16} color="#f59e0b" />
                <Text style={[styles.photoActionText, { color: '#f59e0b' }]}>Before</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: '#d1fae5' }]}
                onPress={() => showPhotoOptions('after')}
              >
                <Plus size={16} color="#10b981" />
                <Text style={[styles.photoActionText, { color: '#10b981' }]}>After</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: '#fee2e2' }]}
                onPress={() => showPhotoOptions('issue')}
              >
                <Plus size={16} color="#ef4444" />
                <Text style={[styles.photoActionText, { color: '#ef4444' }]}>Issue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: '#dbeafe' }]}
                onPress={() => showPhotoOptions('general')}
              >
                <Plus size={16} color="#3b82f6" />
                <Text style={[styles.photoActionText, { color: '#3b82f6' }]}>General</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Notes Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Completion Notes</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Add notes about the completed work, observations, or recommendations..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>

          {/* Issues Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Issues Found (Optional)</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Report any issues, damages, or concerns discovered during the task..."
              value={issues}
              onChangeText={setIssues}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Card>

          {/* Time Info */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#6b7280" />
              <Text style={styles.sectionTitle}>Time Information</Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Started:</Text>
              <Text style={styles.timeValue}>
                {startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Estimated Duration:</Text>
              <Text style={styles.timeValue}>{task.estimatedDuration} minutes</Text>
            </View>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          {submitting && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {uploadProgress < 90 ? 'Uploading photos...' : 'Finalizing submission...'}
              </Text>
            </View>
          )}
          
          <Button
            title="Submit Completion"
            onPress={handleSubmit}
            variant="primary"
            loading={submitting}
            disabled={photos.length === 0}
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskInfo: {
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  photoTypeLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoTypeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    minHeight: 80,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});
