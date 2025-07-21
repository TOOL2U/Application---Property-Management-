/**
 * Job Photo Checklist Component
 * Displays and manages photo requirements for job completion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Job } from '@/types/job';
import { PhotoRequirement, JobPhotoChecklist, photoVerificationService } from '@/services/photoVerificationService';
import { PhotoUpload } from './PhotoUpload';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface JobPhotoChecklistModalProps {
  job: Job;
  visible: boolean;
  onDismiss: () => void;
  onChecklistComplete: (canComplete: boolean) => void;
}

export const JobPhotoChecklistModal: React.FC<JobPhotoChecklistModalProps> = ({
  job,
  visible,
  onDismiss,
  onChecklistComplete,
}) => {
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(true);
  const [photoRequirements, setPhotoRequirements] = useState<PhotoRequirement[]>([]);
  const [checklist, setChecklist] = useState<JobPhotoChecklist | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<PhotoRequirement | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Load photo checklist when modal opens
  useEffect(() => {
    if (visible && currentProfile) {
      loadPhotoChecklist();
    }
  }, [visible, currentProfile]);

  // Update checklist when requirements change
  useEffect(() => {
    if (photoRequirements.length > 0) {
      const updatedChecklist = photoVerificationService.getJobPhotoChecklist(job, photoRequirements);
      setChecklist(updatedChecklist);
      onChecklistComplete(updatedChecklist.canCompleteJob);
    }
  }, [photoRequirements, job, onChecklistComplete]);

  const loadPhotoChecklist = async () => {
    try {
      setLoading(true);
      
      if (!currentProfile) {
        throw new Error('No profile available');
      }

      // Generate AI-enhanced photo checklist
      const requirements = await photoVerificationService.generateAIPhotoChecklist(job, currentProfile.id);
      setPhotoRequirements(requirements);
      
      console.log('✅ Photo checklist loaded:', requirements.length, 'requirements');
    } catch (error) {
      console.error('❌ Error loading photo checklist:', error);
      
      // Fallback to basic requirements
      const fallbackRequirements: PhotoRequirement[] = [
        {
          id: 'before-work',
          description: 'Before work photo',
          isRequired: true,
          completed: false,
        },
        {
          id: 'during-work',
          description: 'Work in progress photo',
          isRequired: false,
          completed: false,
        },
        {
          id: 'after-work',
          description: 'Completed work photo',
          isRequired: true,
          completed: false,
        },
      ];
      
      setPhotoRequirements(fallbackRequirements);
    } finally {
      setLoading(false);
    }
  };

  const exportSummary = () => {
    if (!checklist) return;
    
    const summary = photoVerificationService.exportPhotoSummary(checklist);
    Alert.alert(
      'Photo Summary',
      summary.summary,
      [{ text: 'OK' }]
    );
  };

  const getProgressColor = () => {
    if (!checklist) return '#666666';
    if (checklist.overallProgress >= 80) return '#C6FF00';
    if (checklist.overallProgress >= 50) return '#FF9800';
    return '#FF5252';
  };

  const getRequirementIconColor = (requirement: PhotoRequirement) => {
    if (requirement.completed) return '#C6FF00';
    if (requirement.isRequired) return '#FF5252';
    return '#FF9800';
  };

  const getRequirementIcon = (requirement: PhotoRequirement): keyof typeof Ionicons.glyphMap => {
    if (requirement.completed) return 'checkmark-circle';
    if (requirement.description.toLowerCase().includes('before')) return 'eye-outline';
    if (requirement.description.toLowerCase().includes('after') || requirement.description.toLowerCase().includes('completed')) return 'flag-outline';
    if (requirement.description.toLowerCase().includes('tools') || requirement.description.toLowerCase().includes('equipment')) return 'construct-outline';
    if (requirement.description.toLowerCase().includes('clean')) return 'brush-outline';
    return 'camera-outline';
  };

  const handlePhotoRequirementPress = (requirement: PhotoRequirement) => {
    if (requirement.completed) {
      // Show options to view or retake photo
      Alert.alert(
        'Photo Already Uploaded',
        'This requirement already has a photo. Would you like to view it or take a new one?',
        [
          {
            text: 'View Photo',
            onPress: () => {
              // Could navigate to photo viewer
              console.log('View photo:', requirement.photoUri);
            },
          },
          {
            text: 'Retake Photo',
            onPress: () => {
              setSelectedRequirement(requirement);
              setShowPhotoUpload(true);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // Open photo upload
      setSelectedRequirement(requirement);
      setShowPhotoUpload(true);
    }
  };

  const handlePhotoUploaded = (
    requirementId: string, 
    photoUri: string, 
    location?: { latitude: number; longitude: number }
  ) => {
    // Update the specific requirement
    const updatedRequirements = photoVerificationService.updatePhotoRequirement(
      photoRequirements,
      requirementId,
      photoUri,
      location
    );
    
    setPhotoRequirements(updatedRequirements);
    setShowPhotoUpload(false);
    setSelectedRequirement(null);

    // Show success message
    const requirement = photoRequirements.find(req => req.id === requirementId);
    if (requirement) {
      Alert.alert(
        '✅ Photo Added!',
        `Photo for "${requirement.description}" has been uploaded successfully.`,
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <LinearGradient
            colors={['#0B0F1A', '#1A1F2E']}
            style={styles.gradientContainer}
          >
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C6FF00" />
                <Text style={styles.loadingText}>
                  Generating AI photo checklist...
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </Portal>
    );
  }

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <LinearGradient
            colors={['#0B0F1A', '#1A1F2E']}
            style={styles.gradientContainer}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="camera" size={24} color="#C6FF00" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Photo Checklist</Text>
                    <Text style={styles.headerSubtitle}>{job.title}</Text>
                  </View>
                  <TouchableOpacity onPress={exportSummary} style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color="#CCCCCC" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#CCCCCC" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.scrollContainer}>
                {/* Progress Overview */}
                {checklist && (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Progress Overview</Text>
                      <View style={[
                        styles.statusBadge,
                        checklist.canCompleteJob ? styles.successBadge : styles.warningBadge
                      ]}>
                        <Text style={[
                          styles.statusText,
                          checklist.canCompleteJob ? styles.successText : styles.warningText
                        ]}>
                          {checklist.canCompleteJob ? 'Ready to Complete' : 'In Progress'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>
                        {checklist.completedPhotosCount} of {checklist.requirements.length} photos
                      </Text>
                      <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
                        {checklist.overallProgress}%
                      </Text>
                    </View>

                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View style={[
                          styles.progressBarFill,
                          { 
                            width: `${checklist.overallProgress}%`,
                            backgroundColor: getProgressColor()
                          }
                        ]} />
                      </View>
                    </View>

                    <Text style={styles.progressDetails}>
                      {checklist.requiredPhotosCount} required • {checklist.requirements.length - checklist.requiredPhotosCount} optional
                    </Text>
                  </View>
                )}

                {/* Photo Requirements List */}
                <View style={styles.requirementsList}>
                  {photoRequirements.map((requirement, index) => (
                    <TouchableOpacity
                      key={requirement.id}
                      onPress={() => handlePhotoRequirementPress(requirement)}
                      style={[
                        styles.requirementItem,
                        requirement.completed && styles.completedRequirement
                      ]}
                    >
                      <View style={styles.requirementContent}>
                        <View style={[
                          styles.requirementIcon,
                          { backgroundColor: getRequirementIconColor(requirement) + '20' }
                        ]}>
                          <Ionicons 
                            name={getRequirementIcon(requirement)} 
                            size={18} 
                            color={getRequirementIconColor(requirement)} 
                          />
                        </View>
                        
                        <View style={styles.requirementTextContainer}>
                          <View style={styles.requirementHeader}>
                            <Text style={styles.requirementDescription}>
                              {requirement.description}
                            </Text>
                            {requirement.isRequired && (
                              <View style={styles.requiredBadge}>
                                <Text style={styles.requiredText}>Required</Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.requirementStatus}>
                            {requirement.completed ? (
                              <>
                                <Ionicons name="checkmark" size={12} color="#C6FF00" />
                                <Text style={styles.completedText}>Photo uploaded</Text>
                              </>
                            ) : (
                              <>
                                <Ionicons name="camera-outline" size={12} color="#666666" />
                                <Text style={styles.pendingText}>Tap to add photo</Text>
                              </>
                            )}
                          </View>

                          {requirement.completed && requirement.photoUri && (
                            <View style={styles.photoPreview}>
                              <Image
                                source={{ uri: requirement.photoUri }}
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                              />
                              <View style={styles.photoInfo}>
                                <Text style={styles.photoTimestamp}>
                                  {requirement.timestamp ? new Date(requirement.timestamp).toLocaleTimeString() : 'Recent'}
                                </Text>
                                {requirement.location && (
                                  <Text style={styles.photoLocation}>
                                    📍 Location verified
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Completion Status */}
                {checklist && (
                  <View style={[
                    styles.completionCard,
                    checklist.canCompleteJob ? styles.successCard : styles.warningCard
                  ]}>
                    <LinearGradient
                      colors={checklist.canCompleteJob 
                        ? ['rgba(198, 255, 0, 0.1)', 'rgba(139, 195, 74, 0.1)']
                        : ['rgba(255, 152, 0, 0.1)', 'rgba(255, 193, 7, 0.1)']
                      }
                      style={styles.completionGradient}
                    >
                      <Ionicons 
                        name={checklist.canCompleteJob ? "checkmark-circle" : "time"} 
                        size={24} 
                        color={checklist.canCompleteJob ? "#C6FF00" : "#FF9800"}
                      />
                      <Text style={[
                        styles.completionText,
                        { color: checklist.canCompleteJob ? "#C6FF00" : "#FF9800" }
                      ]}>
                        {checklist.canCompleteJob 
                          ? "All required photos completed! Job can be finished."
                          : `${checklist.requiredPhotosCount - photoRequirements.filter(req => req.isRequired && req.completed).length} required photos remaining.`
                        }
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={onDismiss} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>

                {checklist?.canCompleteJob && (
                  <TouchableOpacity
                    onPress={() => {
                      onDismiss();
                      // This would trigger job completion flow
                    }}
                    style={styles.completeButton}
                  >
                    <LinearGradient
                      colors={['#C6FF00', '#8BC34A']}
                      style={styles.completeButtonGradient}
                    >
                      <Ionicons name="checkmark" size={16} color="#0B0F1A" />
                      <Text style={styles.completeButtonText}>Complete Job</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </Portal>

      {/* Photo Upload Modal */}
      {selectedRequirement && (
        <PhotoUpload
          jobId={job.id}
          requirement={selectedRequirement}
          visible={showPhotoUpload}
          onDismiss={() => {
            setShowPhotoUpload(false);
            setSelectedRequirement(null);
          }}
          onPhotoUploaded={handlePhotoUploaded}
        />
      )}
    </>
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
    minHeight: 500,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  successBadge: {
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    borderColor: '#C6FF00',
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successText: {
    color: '#C6FF00',
  },
  warningText: {
    color: '#FF9800',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressDetails: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  completedRequirement: {
    borderColor: '#C6FF00',
    backgroundColor: 'rgba(198, 255, 0, 0.05)',
  },
  requirementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requirementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requirementTextContainer: {
    flex: 1,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requirementDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF5252',
  },
  requirementStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 12,
    color: '#C6FF00',
    fontWeight: '500',
  },
  pendingText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  photoInfo: {
    flex: 1,
  },
  photoTimestamp: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  photoLocation: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    marginTop: 2,
  },
  completionCard: {
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  successCard: {
    borderColor: '#C6FF00',
  },
  warningCard: {
    borderColor: '#FF9800',
  },
  completionGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
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
  completeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B0F1A',
  },
});
