/**
 * Job Completion Wizard
 * Multi-step wizard for comprehensive job completion requirements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { Job } from '@/types/job';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { jobSessionAuditService } from '@/services/jobSessionAuditService';

const { width: screenWidth } = Dimensions.get('window');

interface JobCompletionWizardProps {
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
  requirementsSummary: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    notes?: string;
  }>;
  photosSummary: Array<{
    id: string;
    type: string;
    description: string;
    isCompleted: boolean;
  }>;
  finalQualityCheck: {
    isComplete: boolean;
    notes: string;
  };
  uploadedPhotos?: Array<{
    id: string;
    uri: string;
    type: string;
    description: string;
  }>;
}

const WIZARD_STEPS = [
  { id: 'requirements', title: 'Requirements Check', icon: 'checkbox-outline' },
  { id: 'photos', title: 'Photo Documentation', icon: 'camera-outline' },
  { id: 'quality', title: 'Quality Review', icon: 'star-outline' },
  { id: 'notes', title: 'Final Notes', icon: 'document-text-outline' },
  { id: 'confirm', title: 'Confirmation', icon: 'checkmark-circle-outline' },
];

export const JobCompletionWizard: React.FC<JobCompletionWizardProps> = ({
  job,
  visible,
  onDismiss,
  onJobCompleted,
}) => {
  const { currentProfile } = usePINAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completionData, setCompletionData] = useState<Partial<JobCompletionData>>({});

  // Step-specific state
  const [requirementChecks, setRequirementChecks] = useState<Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    notes: string;
  }>>([]);
  const [photoChecks, setPhotoChecks] = useState<Array<{
    id: string;
    type: string;
    description: string;
    isCompleted: boolean;
  }>>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{
    id: string;
    uri: string;
    type: string;
    description: string;
  }>>([]);
  const [qualityNotes, setQualityNotes] = useState('');
  const [qualityChecklist, setQualityChecklist] = useState([
    { id: 'workCompleted', text: 'Work completed to specification', isChecked: false, required: true },
    { id: 'areaClean', text: 'Area cleaned and restored', isChecked: false, required: true },
    { id: 'noHazards', text: 'No safety hazards remaining', isChecked: false, required: true },
    { id: 'materialsRemoved', text: 'All materials and tools removed', isChecked: false, required: true },
    { id: 'customerSatisfied', text: 'Work meets quality standards', isChecked: false, required: true },
    { id: 'properFunctioning', text: 'All systems functioning properly', isChecked: false, required: false },
  ]);
  const [finalNotes, setFinalNotes] = useState('');

  useEffect(() => {
    if (job && visible) {
      initializeWizardData();
    }
  }, [job, visible]);

  const initializeWizardData = () => {
    if (!job) return;

    // Initialize requirement checks
    const requirements = job.requirements?.map(req => ({
      id: req.id,
      description: req.description,
      isCompleted: false,
      notes: '',
    })) || [];
    setRequirementChecks(requirements);

    // Initialize photo checks (based on job requirements with photos)
    const photos = job.requirements?.filter(req => req.photos && req.photos.length > 0).map(req => ({
      id: req.id,
      type: 'photo',
      description: req.description,
      isCompleted: false,
    })) || [];
    
    // Add default photo requirements if none specified
    if (photos.length === 0) {
      photos.push(
        { id: 'before', type: 'before', description: 'Before photo of work area', isCompleted: false },
        { id: 'during', type: 'during', description: 'Progress photos during work', isCompleted: false },
        { id: 'after', type: 'after', description: 'After photo showing completed work', isCompleted: false }
      );
    }
    setPhotoChecks(photos);

    // Reset other states
    setQualityNotes('');
    setQualityChecklist(prev => prev.map(item => ({ ...item, isChecked: false })));
    setFinalNotes('');
    setCurrentStep(0);
  };

  const toggleQualityChecklistItem = (itemId: string) => {
    setQualityChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const getCurrentStepData = () => {
    const step = WIZARD_STEPS[currentStep];
    switch (step.id) {
      case 'requirements':
        return {
          title: 'Check Job Requirements',
          subtitle: 'Verify all job requirements have been completed',
          canProceed: requirementChecks.length === 0 || requirementChecks.every(req => req.isCompleted),
          completedCount: requirementChecks.filter(req => req.isCompleted).length,
          totalCount: requirementChecks.length,
        };
      case 'photos':
        const photoStatus = getPhotoUploadStatus();
        const hasRequiredPhotos = photoStatus.isValid;
        const allPhotosCompleted = photoChecks.length === 0 || photoChecks.every(photo => photo.isCompleted);
        return {
          title: 'Photo Documentation',
          subtitle: 'Confirm all required photos have been taken',
          canProceed: allPhotosCompleted && hasRequiredPhotos,
          completedCount: photoChecks.filter(photo => photo.isCompleted).length + (hasRequiredPhotos ? 1 : 0),
          totalCount: photoChecks.length + 1, // +1 for uploaded photos requirement
        };
      case 'quality':
        const requiredQualityItems = qualityChecklist.filter(item => item.required);
        const completedRequiredItems = requiredQualityItems.filter(item => item.isChecked);
        const allRequiredCompleted = requiredQualityItems.length > 0 && completedRequiredItems.length === requiredQualityItems.length;
        return {
          title: 'Quality Review',
          subtitle: 'Complete quality checklist to proceed',
          canProceed: allRequiredCompleted,
          completedCount: completedRequiredItems.length,
          totalCount: requiredQualityItems.length,
        };
      case 'notes':
        return {
          title: 'Final Notes',
          subtitle: 'Add any additional completion notes',
          canProceed: true, // Optional step
          completedCount: finalNotes.trim().length > 0 ? 1 : 0,
          totalCount: 1,
        };
      case 'confirm':
        return {
          title: 'Complete Job',
          subtitle: 'Review and confirm job completion',
          canProceed: true,
          completedCount: 1,
          totalCount: 1,
        };
      default:
        return {
          title: 'Unknown Step',
          subtitle: '',
          canProceed: false,
          completedCount: 0,
          totalCount: 1,
        };
    }
  };

  const handleNextStep = () => {
    const stepData = getCurrentStepData();
    if (!stepData.canProceed) {
      Alert.alert('Incomplete', 'Please complete all required items before proceeding.');
      return;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteJob();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleRequirement = (requirementId: string) => {
    setRequirementChecks(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, isCompleted: !req.isCompleted }
          : req
      )
    );
  };

  const updateRequirementNotes = (requirementId: string, notes: string) => {
    setRequirementChecks(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, notes }
          : req
      )
    );
  };

  const togglePhotoCheck = (photoId: string) => {
    setPhotoChecks(prev => 
      prev.map(photo => 
        photo.id === photoId 
          ? { ...photo, isCompleted: !photo.isCompleted }
          : photo
      )
    );
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please grant photo library permission to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photos',
      'Choose how to add photos:',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addPhotoToCollection(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach(asset => {
          addPhotoToCollection(asset.uri);
        });
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const addPhotoToCollection = (uri: string) => {
    const newPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uri,
      type: 'completion',
      description: 'Job completion photo',
    };

    setUploadedPhotos(prev => [...prev, newPhoto]);
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
          onPress: () => {
            setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
          }
        }
      ]
    );
  };

  const getPhotoUploadStatus = () => {
    const minPhotos = 3;
    const currentCount = uploadedPhotos.length;
    return {
      isValid: currentCount >= minPhotos,
      count: currentCount,
      required: minPhotos,
      message: currentCount < minPhotos 
        ? `${minPhotos - currentCount} more photo${minPhotos - currentCount !== 1 ? 's' : ''} required`
        : `${currentCount} photos uploaded ✓`
    };
  };

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
            timeInterval: 10000,
          });
          
          endLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
          };
        }
      } catch (locationError) {
        console.warn('Could not get completion location:', locationError);
      }

      // Step 3: Create comprehensive completion data
      const completionData: JobCompletionData = {
        jobId: job.id,
        staffId: currentProfile.id,
        endTime,
        endLocation,
        completionNotes: finalNotes.trim(),
        status: 'completed',
        requirementsSummary: requirementChecks.map(req => ({
          id: req.id,
          description: req.description,
          isCompleted: req.isCompleted,
          notes: req.notes,
        })),
        photosSummary: photoChecks.map(photo => ({
          id: photo.id,
          type: photo.type,
          description: photo.description,
          isCompleted: photo.isCompleted,
        })),
        finalQualityCheck: {
          isComplete: qualityChecklist.filter(item => item.required).every(item => item.isChecked),
          notes: `Quality checklist completed. Items checked: ${qualityChecklist.filter(item => item.isChecked).map(item => item.text).join(', ')}${qualityNotes.trim() ? `. Additional notes: ${qualityNotes}` : ''}`,
        },
        uploadedPhotos: uploadedPhotos, // Add uploaded photos to completion data
      };

      // Step 4: Log completion data for audit
      await jobSessionAuditService.completeJobSession({
        jobId: job.id,
        endTime,
        endLocation,
        completionNotes: finalNotes.trim(),
        finalChecklistData: requirementChecks.map((req, index) => ({
          id: req.id,
          title: req.description,
          description: req.description,
          required: true,
          completed: req.isCompleted,
          notes: req.notes,
          order: index,
        })),
        finalPhotos: photoChecks.map((photo, index) => ({
          id: photo.id,
          filename: `job_${job.id}_${photo.type}_${index + 1}.jpg`,
          timestamp: new Date(),
          description: photo.description,
        })),
      });

      // Step 5: Call parent callback with updated job
      const updatedJob = { 
        ...job, 
        status: 'completed' as const,
        completionNotes: finalNotes.trim(),
        completedAt: endTime,
      };
      onJobCompleted(updatedJob, completionData);
      
      // Close modal
      onDismiss();

      // Show success feedback
      Alert.alert(
        '🎉 Job Completed!',
        `${job.title} has been marked as completed successfully.`,
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

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {WIZARD_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted,
              ]}>
                <Ionicons 
                  name={isCompleted ? 'checkmark' as any : step.icon as any} 
                  size={16} 
                  color={isActive || isCompleted ? '#ffffff' : '#6B7280'} 
                />
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted,
              ]}>
                {step.title}
              </Text>
              {index < WIZARD_STEPS.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  isCompleted && styles.stepConnectorCompleted,
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderRequirementsStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepDescription}>
          Please confirm that all job requirements have been completed:
        </Text>
        
        {requirementChecks.map((requirement) => (
          <View key={requirement.id} style={styles.requirementItem}>
            <TouchableOpacity
              style={styles.requirementHeader}
              onPress={() => toggleRequirement(requirement.id)}
            >
              <View style={[
                styles.checkbox,
                requirement.isCompleted && styles.checkboxChecked
              ]}>
                {requirement.isCompleted && (
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                )}
              </View>
              <Text style={[
                styles.requirementText,
                requirement.isCompleted && styles.requirementTextCompleted
              ]}>
                {requirement.description}
              </Text>
            </TouchableOpacity>
            
            {requirement.isCompleted && (
              <TextInput
                style={styles.requirementNotes}
                placeholder="Add notes about this requirement (optional)"
                placeholderTextColor="#6B7280"
                value={requirement.notes}
                onChangeText={(text) => updateRequirementNotes(requirement.id, text)}
                multiline
                numberOfLines={2}
              />
            )}
          </View>
        ))}

        {requirementChecks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.emptyStateText}>No specific requirements defined</Text>
            <Text style={styles.emptyStateSubtext}>You can proceed to the next step</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPhotosStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepDescription}>
          Confirm all required photos have been taken and uploaded:
        </Text>
        
        {photoChecks.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            style={styles.photoItem}
            onPress={() => togglePhotoCheck(photo.id)}
          >
            <View style={[
              styles.checkbox,
              photo.isCompleted && styles.checkboxChecked
            ]}>
              {photo.isCompleted && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </View>
            <View style={styles.photoContent}>
              <Text style={[
                styles.photoText,
                photo.isCompleted && styles.photoTextCompleted
              ]}>
                {photo.description}
              </Text>
              <Text style={styles.photoType}>
                {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)} Photo
              </Text>
            </View>
            <Ionicons 
              name="camera" 
              size={20} 
              color={photo.isCompleted ? '#10B981' : '#6B7280'} 
            />
          </TouchableOpacity>
        ))}

        {/* Uploaded Photos Section */}
        {uploadedPhotos.length > 0 && (
          <View style={styles.uploadedPhotosSection}>
            <Text style={styles.uploadedPhotosTitle}>Uploaded Photos ({uploadedPhotos.length})</Text>
            <View style={styles.uploadedPhotosGrid}>
              {uploadedPhotos.map((photo, index) => (
                <View key={photo.id} style={styles.uploadedPhotoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.uploadedPhotoImage} />
                  <TouchableOpacity 
                    style={styles.uploadedPhotoRemove}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upload Photos Button */}
        <View style={styles.uploadPhotosSection}>
          <TouchableOpacity 
            style={styles.uploadPhotosButton}
            onPress={() => {
              Alert.alert(
                'Upload Photos',
                'Choose how you would like to add photos:',
                [
                  {
                    text: 'Camera',
                    onPress: takePhoto,
                  },
                  {
                    text: 'Photo Library',
                    onPress: pickFromLibrary,
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ]
              );
            }}
          >
            <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.uploadPhotosButtonText}>Upload Photos</Text>
          </TouchableOpacity>
          
          <Text style={styles.uploadPhotosHint}>
            {getPhotoUploadStatus().message}
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderQualityStep = () => {
    const requiredItems = qualityChecklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.isChecked).length;
    
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepDescription}>
          Complete the quality checklist to verify the job meets all standards:
        </Text>
        
        <View style={styles.qualityChecklistContainer}>
          <Text style={styles.qualityChecklistTitle}>
            Quality Checklist ({completedRequired}/{requiredItems.length} required items)
          </Text>
          
          {qualityChecklist.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.qualityChecklistItem,
                item.isChecked && styles.qualityChecklistItemChecked
              ]}
              onPress={() => toggleQualityChecklistItem(item.id)}
            >
              <View style={[
                styles.qualityCheckbox,
                item.isChecked && styles.qualityCheckboxChecked
              ]}>
                {item.isChecked && (
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                )}
              </View>
              
              <View style={styles.qualityChecklistContent}>
                <Text style={[
                  styles.qualityChecklistText,
                  item.isChecked && styles.qualityChecklistTextChecked
                ]}>
                  {item.text}
                </Text>
                {item.required && (
                  <Text style={styles.qualityRequiredLabel}>Required</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional additional notes */}
        <View style={styles.qualityNotesSection}>
          <Text style={styles.qualityNotesLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.qualityNotesInput}
            placeholder="Add any specific observations or issues found..."
            placeholderTextColor="#6B7280"
            value={qualityNotes}
            onChangeText={setQualityNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Progress indicator */}
        <View style={styles.qualityProgressSection}>
          <Text style={styles.qualityProgressText}>
            {completedRequired === requiredItems.length 
              ? '✅ All required items completed' 
              : `${requiredItems.length - completedRequired} required items remaining`
            }
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderNotesStep = () => {
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepDescription}>
          Add any additional notes about the job completion:
        </Text>
        
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Final Completion Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional notes, observations, or recommendations..."
            placeholderTextColor="#6B7280"
            value={finalNotes}
            onChangeText={setFinalNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.notesHint}>
            Optional - These notes will be included in the job completion report
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderConfirmStep = () => {
    const stepData = getCurrentStepData();
    
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepDescription}>
          Review your completion summary and confirm:
        </Text>
        
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Ionicons name="checkbox-outline" size={20} color="#10B981" />
            <Text style={styles.summaryText}>
              Requirements: {requirementChecks.filter(r => r.isCompleted).length}/{requirementChecks.length} completed
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="camera-outline" size={20} color="#10B981" />
            <Text style={styles.summaryText}>
              Photos: {photoChecks.filter(p => p.isCompleted).length}/{photoChecks.length} completed
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="star-outline" size={20} color="#10B981" />
            <Text style={styles.summaryText}>
              Quality Review: {qualityChecklist.filter(item => item.required).every(item => item.isChecked) ? 'Completed' : 'Pending'}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="document-text-outline" size={20} color="#10B981" />
            <Text style={styles.summaryText}>
              Final Notes: {finalNotes.trim().length > 0 ? 'Added' : 'None'}
            </Text>
          </View>
        </View>

        <View style={styles.confirmationBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.confirmationText}>
            By completing this job, you confirm that all work has been performed to specification and the site has been left in good condition.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep];
    
    switch (step.id) {
      case 'requirements':
        return renderRequirementsStep();
      case 'photos':
        return renderPhotosStep();
      case 'quality':
        return renderQualityStep();
      case 'notes':
        return renderNotesStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  if (!job) return null;

  const stepData = getCurrentStepData();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
      <View style={styles.wizardContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Complete Job</Text>
            <Text style={styles.headerSubtitle}>{job.title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.stepCounter}>
              {currentStep + 1}/{WIZARD_STEPS.length}
            </Text>
          </View>
        </View>

        {/* Step Indicator */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.stepIndicatorContainer}
        >
          {renderStepIndicator()}
        </ScrollView>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stepData.completedCount}/{stepData.totalCount} items completed
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.contentContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{stepData.title}</Text>
            <Text style={styles.stepSubtitle}>{stepData.subtitle}</Text>
          </View>
          
          {renderStepContent()}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={handlePrevStep}
            style={[styles.navButton, styles.prevButton]}
            disabled={currentStep === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={currentStep === 0 ? '#6B7280' : '#374151'} 
            />
            <Text style={[
              styles.navButtonText, 
              currentStep === 0 && styles.navButtonTextDisabled
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextStep}
            style={[
              styles.navButton, 
              styles.nextButton,
              !stepData.canProceed && styles.nextButtonDisabled
            ]}
            disabled={!stepData.canProceed || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === WIZARD_STEPS.length - 1 ? 'Complete Job' : 'Next'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
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
    margin: 0,
    height: '100%',
  },
  wizardContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  stepIndicatorContainer: {
    maxHeight: 80,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
  },
  stepCircleCompleted: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 80,
  },
  stepLabelActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: '#059669',
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: 32,
    width: 20,
    height: 2,
    backgroundColor: '#374151',
  },
  stepConnectorCompleted: {
    backgroundColor: '#059669',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 20,
    lineHeight: 20,
  },
  requirementItem: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  requirementText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
  },
  requirementTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  requirementNotes: {
    marginTop: 12,
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  photoContent: {
    flex: 1,
    marginLeft: 12,
  },
  photoText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  photoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  photoType: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  qualitySection: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  qualityInput: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  qualityHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  qualityChecklist: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  qualityChecklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  qualityCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityCheckText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 8,
  },
  notesSection: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  notesHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  summarySection: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 12,
  },
  confirmationBox: {
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  prevButton: {
    backgroundColor: '#374151',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  navButtonTextDisabled: {
    color: '#6B7280',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  uploadedPhotosSection: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  uploadedPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  uploadedPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  uploadedPhotoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  uploadedPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#4B5563',
  },
  uploadedPhotoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  uploadPhotosSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  uploadPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadPhotosButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadPhotosHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  qualityChecklistContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  qualityChecklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  qualityChecklistItemChecked: {
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  qualityCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  qualityCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  qualityChecklistContent: {
    flex: 1,
  },
  qualityChecklistText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 4,
  },
  qualityChecklistTextChecked: {
    color: '#D1FAE5',
  },
  qualityRequiredLabel: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  qualityNotesSection: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  qualityNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  qualityNotesInput: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  qualityProgressSection: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  qualityProgressText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default JobCompletionWizard;
