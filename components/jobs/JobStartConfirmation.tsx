/**
 * Job Start Confirmation Component
 * Handles job start confirmation with photo checklist
 * Enhanced with modern dark theme
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Modal, Portal, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

import { Job } from '@/types/job';
import { jobService } from '@/services/jobService';
import { photoVerificationService, PhotoRequirement, JobPhotoChecklist } from '@/services/photoVerificationService';
import { smartJobNotificationService } from '@/services/smartJobNotificationService';
import { usePINAuth } from '@/contexts/PINAuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface JobStartConfirmationProps {
  job: Job;
  visible: boolean;
  onDismiss: () => void;
  onJobStarted: (job: Job) => void;
}

export const JobStartConfirmation: React.FC<JobStartConfirmationProps> = ({
  job,
  visible,
  onDismiss,
  onJobStarted,
}) => {
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(false);
  const [photoChecklist, setPhotoChecklist] = useState<PhotoRequirement[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // Load photo checklist when modal opens
  useEffect(() => {
    if (visible && currentProfile) {
      loadPhotoChecklist();
    }
  }, [visible, currentProfile]);

  const loadPhotoChecklist = async () => {
    if (!currentProfile) return;
    
    try {
      setChecklistLoading(true);
      
      // Generate photo checklist
      const requirements = await photoVerificationService.generateAIPhotoChecklist(job, currentProfile.id);
      setPhotoChecklist(requirements);
    } catch (error) {
      console.error('❌ Error loading photo checklist:', error);
      
      // Fallback to basic requirements
      const fallbackRequirements = await photoVerificationService.generatePhotoRequirements(job);
      setPhotoChecklist(fallbackRequirements);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleStartJob = async () => {
    if (!currentProfile) return;

    try {
      setLoading(true);

      // First accept the job if not already accepted
      if (job.status === 'assigned') {
        await jobService.acceptJob({
          jobId: job.id,
          staffId: currentProfile.id,
          acceptedAt: new Date(),
        });
      }

      // Update job status to in_progress using direct Firestore update
      const { getDb } = await import('@/lib/firebase');
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      const db = await getDb();
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const updatedJob = { ...job, status: 'in_progress' as const };

      // Call parent callback
      onJobStarted(updatedJob);
      
      // Close modal
      onDismiss();

      // Show success message
      Alert.alert(
        '✅ Job Started!',
        `${job.title} is now in progress. You can view job details and updates in the Jobs tab.`,
        [
          {
            text: 'Continue',
            style: 'default',
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error starting job:', error);
      Alert.alert(
        'Error',
        'Failed to start job. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    const icons: Record<string, string> = {
      maintenance: 'tools',
      cleaning: 'broom',
      inspection: 'search',
      plumbing: 'water',
      electrical: 'bolt',
      general: 'clipboard-list',
    };
    return icons[jobType] || 'clipboard-list';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
    };
    return colors[priority] || '#6B7280';
  };

  const getPhotoProgress = () => {
    if (photoChecklist.length === 0) return 0;
    const completed = photoChecklist.filter(req => req.completed).length;
    return completed / photoChecklist.length;
  };

  const getRequiredPhotosCount = () => {
    return photoChecklist.filter(req => req.isRequired).length;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <LinearGradient
          colors={['#1A1F2E', '#0B0F1A']}
          style={styles.gradientContainer}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={[
                  styles.jobIconContainer,
                  { backgroundColor: `${getPriorityColor(job.priority)}20` }
                ]}>
                  <FontAwesome5 
                    name={getJobTypeIcon(job.type)} 
                    size={24} 
                    color={getPriorityColor(job.priority)} 
                  />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Start Job Confirmation</Text>
                  <Text style={styles.headerSubtitle}>{job.title}</Text>
                </View>
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {/* Job Details Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Job Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(job.priority)}20` }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(job.priority) }
                    ]}>
                      {job.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{job.type.charAt(0).toUpperCase() + job.type.slice(1)}</Text>
                </View>

                {job.location?.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                      {job.location.address}
                    </Text>
                  </View>
                )}

                {job.estimatedDuration && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{job.estimatedDuration}</Text>
                  </View>
                )}
              </View>

              {/* Photo Requirements Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="camera-outline" size={20} color="#C6FF00" />
                    <Text style={styles.cardTitle}>Photo Requirements</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPhotoPreview(!showPhotoPreview)}
                    style={styles.expandButton}
                  >
                    <Ionicons 
                      name={showPhotoPreview ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#CCCCCC" 
                    />
                  </TouchableOpacity>
                </View>

                {checklistLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#C6FF00" />
                    <Text style={styles.loadingText}>
                      Generating AI photo checklist...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.photoSummary}>
                    <View style={styles.photoStats}>
                      <Text style={styles.photoStatsText}>
                        {getRequiredPhotosCount()} required • {photoChecklist.length} total photos
                      </Text>
                    </View>

                    <View style={styles.progressContainer}>
                      <ProgressBar 
                        progress={getPhotoProgress()} 
                        color="#C6FF00"
                        style={styles.progressBar}
                      />
                      <Text style={styles.progressText}>
                        {Math.round(getPhotoProgress() * 100)}% complete
                      </Text>
                    </View>

                    {showPhotoPreview && (
                      <View style={styles.photoPreviewContainer}>
                        {photoChecklist.slice(0, 3).map((requirement, index) => (
                          <View key={requirement.id} style={styles.photoPreviewItem}>
                            <View style={[
                              styles.requirementIndicator,
                              { backgroundColor: requirement.isRequired ? '#FF5722' : '#FF6B35' }
                            ]}>
                              <Text style={styles.requirementIndicatorText}>
                                {requirement.isRequired ? '!' : '?'}
                              </Text>
                            </View>
                            <Text style={styles.photoPreviewText}>
                              {requirement.description}
                            </Text>
                          </View>
                        ))}
                        {photoChecklist.length > 3 && (
                          <Text style={styles.morePhotosText}>
                            +{photoChecklist.length - 3} more requirements...
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

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
                <LinearGradient
                  colors={loading ? ['#666666', '#555555'] : ['#C6FF00', '#8BC34A']}
                  style={styles.startButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="play" size={16} color="#0B0F1A" />
                      <Text style={styles.startButtonText}>Start Job</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: 20,
    minHeight: 400,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C6FF00',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  photoSummary: {
    gap: 12,
  },
  photoStats: {
    alignItems: 'center',
  },
  photoStatsText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#C6FF00',
    fontWeight: '600',
    textAlign: 'center',
  },
  photoPreviewContainer: {
    marginTop: 8,
    gap: 8,
  },
  photoPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  requirementIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requirementIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoPreviewText: {
    fontSize: 14,
    color: '#CCCCCC',
    flex: 1,
  },
  morePhotosText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aiCard: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.2)',
    borderRadius: 16,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C6FF00',
    marginBottom: 4,
  },
  aiCardDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  startButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B0F1A',
  },
});

export default JobStartConfirmation;
