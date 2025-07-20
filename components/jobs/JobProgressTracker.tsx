/**
 * Job Progress Tracker Component
 * Real-time job progress tracking with status updates, photo uploads, and completion workflow
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Camera,
  Upload,
  MapPin,
  FileText,
  AlertTriangle,
  CheckSquare
} from 'lucide-react-native';
import type { JobAssignment } from '@/types/jobAssignment';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';

const { width } = Dimensions.get('window');

interface JobProgressTrackerProps {
  job: JobAssignment;
  staffId: string;
  onJobUpdated: (job: JobAssignment) => void;
  onComplete: () => void;
}

interface ProgressPhoto {
  id: string;
  uri: string;
  type: 'before' | 'during' | 'after' | 'issue';
  description?: string;
  timestamp: Date;
  uploaded: boolean;
}

interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  description?: string;
}

export default function JobProgressTracker({
  job,
  staffId,
  onJobUpdated,
  onComplete
}: JobProgressTrackerProps) {
  const [isStarted, setIsStarted] = useState(job.status === 'in_progress');
  const [currentStartTime, setCurrentStartTime] = useState<Date | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(
    new Set(job.requirements.filter(req => req.isCompleted).map(req => req.id))
  );
  const [requirementNotes, setRequirementNotes] = useState<Map<string, string>>(new Map());
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize from existing job data
    if (job.startedAt) {
      const startTime = job.startedAt.toDate ? job.startedAt.toDate() : new Date(job.startedAt as any);
      setCurrentStartTime(startTime);
      
      if (job.status === 'in_progress') {
        setIsStarted(true);
        startTimer();
      }
    }

    // Load requirement notes from job data
    job.requirements.forEach(req => {
      if (req.notes) {
        setRequirementNotes(prev => new Map(prev.set(req.id, req.notes!)));
      }
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [job]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (currentStartTime) {
        const elapsed = Date.now() - currentStartTime.getTime();
        setTotalDuration(elapsed);
      }
    }, 1000) as any;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartJob = async () => {
    try {
      setIsLoading(true);
      
      const startTime = new Date();
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: staffId,
        status: 'in_progress',
        startedAt: startTime
      });

      if (response.success && response.job) {
        setIsStarted(true);
        setCurrentStartTime(startTime);
        startTimer();
        onJobUpdated(response.job);
        
        // Add to time entries
        const newEntry: TimeEntry = {
          id: `${Date.now()}`,
          startTime,
          duration: 0,
          description: 'Job started'
        };
        setTimeEntries(prev => [...prev, newEntry]);
      } else {
        Alert.alert('Error', response.error || 'Failed to start job');
      }
    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert('Error', 'Failed to start job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseResume = () => {
    if (currentStartTime) {
      // Pause
      const endTime = new Date();
      const duration = endTime.getTime() - currentStartTime.getTime();
      
      setTimeEntries(prev => {
        const updated = [...prev];
        const lastEntry = updated[updated.length - 1];
        if (lastEntry && !lastEntry.endTime) {
          lastEntry.endTime = endTime;
          lastEntry.duration = duration;
        }
        return updated;
      });
      
      setCurrentStartTime(null);
      stopTimer();
    } else {
      // Resume
      const startTime = new Date();
      setCurrentStartTime(startTime);
      startTimer();
      
      const newEntry: TimeEntry = {
        id: `${Date.now()}`,
        startTime,
        duration: 0,
        description: 'Job resumed'
      };
      setTimeEntries(prev => [...prev, newEntry]);
    }
  };

  const handleRequirementToggle = async (requirementId: string) => {
    const newCompleted = new Set(completedRequirements);
    const isCompleting = !newCompleted.has(requirementId);
    
    if (isCompleting) {
      newCompleted.add(requirementId);
    } else {
      newCompleted.delete(requirementId);
    }
    
    setCompletedRequirements(newCompleted);

    // Update job requirements
    try {
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: staffId,
        status: job.status,
        requirementUpdates: [{
          requirementId,
          isCompleted: isCompleting,
          notes: requirementNotes.get(requirementId)
        }]
      });

      if (response.success && response.job) {
        onJobUpdated(response.job);
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      // Revert on error
      if (isCompleting) {
        newCompleted.delete(requirementId);
      } else {
        newCompleted.add(requirementId);
      }
      setCompletedRequirements(newCompleted);
    }
  };

  const handleRequirementNote = (requirementId: string, note: string) => {
    setRequirementNotes(prev => new Map(prev.set(requirementId, note)));
  };

  const takePhoto = async (type: 'before' | 'during' | 'after' | 'issue') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: ProgressPhoto = {
          id: `${Date.now()}`,
          uri: result.assets[0].uri,
          type,
          timestamp: new Date(),
          uploaded: false
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const addPhotoDescription = (photoId: string, description: string) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, description }
          : photo
      )
    );
  };

  const uploadPhotos = async () => {
    // This would integrate with your file upload service
    // For now, just mark as uploaded
    setPhotos(prev => 
      prev.map(photo => ({ ...photo, uploaded: true }))
    );
  };

  const handleCompleteJob = async () => {
    try {
      setIsLoading(true);

      // Check if all required requirements are completed
      const requiredRequirements = job.requirements.filter(req => req.isRequired);
      const missingRequired = requiredRequirements.filter(req => !completedRequirements.has(req.id));
      
      if (missingRequired.length > 0) {
        Alert.alert(
          'Required Items Missing',
          `Please complete the following required items:\n${missingRequired.map(req => `• ${req.description}`).join('\n')}`,
          [{ text: 'OK', style: 'cancel' }]
        );
        setIsLoading(false);
        return;
      }

      // Stop timer if running
      let finalDuration = totalDuration;
      if (currentStartTime) {
        finalDuration = Date.now() - currentStartTime.getTime();
        stopTimer();
      }

      // Calculate total time from all entries
      const totalTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) + finalDuration;
      const actualDurationMinutes = Math.round(totalTime / (1000 * 60));

      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: staffId,
        status: 'completed',
        completedAt: new Date(),
        actualDuration: actualDurationMinutes,
        completionNotes: completionNotes.trim() || undefined,
        requirementUpdates: Array.from(completedRequirements).map(reqId => ({
          requirementId: reqId,
          isCompleted: true,
          notes: requirementNotes.get(reqId)
        }))
      });

      if (response.success && response.job) {
        // Upload photos if any
        if (photos.length > 0) {
          await uploadPhotos();
        }

        Alert.alert(
          'Job Completed! ✅',
          `Job completed successfully in ${actualDurationMinutes} minutes.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onJobUpdated(response.job!);
                onComplete();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to complete job');
      }
    } catch (error) {
      console.error('Error completing job:', error);
      Alert.alert('Error', 'Failed to complete job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round((completedRequirements.size / Math.max(job.requirements.length, 1)) * 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Timer Section */}
      <View style={styles.timerSection}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.timerHeader}>
            <Clock size={24} color="#8b5cf6" />
            <Text style={styles.timerTitle}>Job Timer</Text>
          </View>
          
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatDuration(totalDuration)}</Text>
            <Text style={styles.timerSubtext}>
              Estimated: {job.estimatedDuration} minutes
            </Text>
          </View>

          <View style={styles.timerControls}>
            {!isStarted ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartJob}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.buttonGradient}
                >
                  <Play size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Start Job</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePauseResume}
              >
                {currentStartTime ? (
                  <>
                    <Pause size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Pause</Text>
                  </>
                ) : (
                  <>
                    <Play size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Resume</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressSection}>
        <LinearGradient
          colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.progressHeader}>
            <CheckSquare size={20} color="#22c55e" />
            <Text style={styles.sectionTitle}>Progress Overview</Text>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          
          <Text style={styles.progressText}>
            {completedRequirements.size} of {job.requirements.length} requirements completed
          </Text>
        </LinearGradient>
      </View>

      {/* Requirements Checklist */}
      {job.requirements.length > 0 && (
        <View style={styles.requirementsSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <CheckSquare size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Requirements</Text>
            </View>
            
            {job.requirements.map((requirement, index) => (
              <View key={requirement.id} style={styles.requirementItem}>
                <TouchableOpacity
                  style={styles.requirementCheckbox}
                  onPress={() => handleRequirementToggle(requirement.id)}
                >
                  <View style={[
                    styles.checkbox,
                    completedRequirements.has(requirement.id) && styles.checkboxChecked
                  ]}>
                    {completedRequirements.has(requirement.id) && (
                      <CheckCircle size={16} color="#ffffff" />
                    )}
                  </View>
                  <View style={styles.requirementContent}>
                    <Text style={[
                      styles.requirementText,
                      completedRequirements.has(requirement.id) && styles.requirementTextCompleted
                    ]}>
                      {index + 1}. {requirement.description}
                    </Text>
                    {requirement.isRequired && (
                      <Text style={styles.requiredLabel}>Required</Text>
                    )}
                  </View>
                </TouchableOpacity>
                
                <TextInput
                  style={styles.requirementNote}
                  placeholder="Add notes..."
                  placeholderTextColor="#9ca3af"
                  value={requirementNotes.get(requirement.id) || ''}
                  onChangeText={(text) => handleRequirementNote(requirement.id, text)}
                  multiline
                />
              </View>
            ))}
          </LinearGradient>
        </View>
      )}

      {/* Photo Documentation */}
      <View style={styles.photoSection}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.sectionHeader}>
            <Camera size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Photo Documentation</Text>
            <Text style={styles.photoCount}>{photos.length}</Text>
          </View>
          
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => takePhoto('before')}
            >
              <Text style={styles.photoButtonText}>Before</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => takePhoto('during')}
            >
              <Text style={styles.photoButtonText}>During</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => takePhoto('after')}
            >
              <Text style={styles.photoButtonText}>After</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.issueButton]}
              onPress={() => takePhoto('issue')}
            >
              <Text style={styles.photoButtonText}>Issue</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 && (
            <ScrollView horizontal style={styles.photoGallery}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <Text style={styles.photoType}>{photo.type}</Text>
                  <View style={styles.photoStatus}>
                    {photo.uploaded ? (
                      <CheckCircle size={12} color="#22c55e" />
                    ) : (
                      <Upload size={12} color="#f59e0b" />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </LinearGradient>
      </View>

      {/* Completion Notes */}
      {isStarted && (
        <View style={styles.notesSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Completion Notes</Text>
            </View>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional notes about the job completion..."
              placeholderTextColor="#9ca3af"
              value={completionNotes}
              onChangeText={setCompletionNotes}
              multiline
              numberOfLines={4}
            />
          </LinearGradient>
        </View>
      )}

      {/* Complete Job Button */}
      {isStarted && (
        <View style={styles.completeSection}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteJob}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Complete Job</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  timerSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  requirementsSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  notesSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeSection: {
    marginBottom: 32,
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  timerControls: {
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
  requirementItem: {
    marginBottom: 16,
  },
  requirementCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 4,
  },
  requirementTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  requirementNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 36,
  },
  photoCount: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  issueButton: {
    backgroundColor: '#ef4444',
  },
  photoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoGallery: {
    marginTop: 8,
  },
  photoItem: {
    marginRight: 8,
    alignItems: 'center',
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginBottom: 4,
  },
  photoType: {
    fontSize: 10,
    color: '#d1d5db',
    marginBottom: 2,
  },
  photoStatus: {
    alignItems: 'center',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
