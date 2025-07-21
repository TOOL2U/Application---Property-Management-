/**
 * Job Start Workflow Component
 * Comprehensive step-by-step workflow for staff to start jobs with GPS tracking,
 * confirmation modals, checklist, and Firestore integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Pressable,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  MapPin,
  Camera,
  CheckCircle,
  Clock,
  Navigation,
  FileText,
  Loader,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobData } from '@/types/jobData';
import { usePINAuth } from '@/contexts/PINAuthContext';
import MapView, { Marker } from 'react-native-maps';

const { width: screenWidth } = Dimensions.get('window');

interface JobStartWorkflowProps {
  job: JobData;
  visible: boolean;
  onClose: () => void;
  onJobStarted: (jobSession: JobSession) => void;
  enableGPSTracking?: boolean;
  enableChecklist?: boolean;
  enablePhotoUpload?: boolean;
}

interface JobSession {
  id: string;
  jobId: string;
  staffId: string;
  startTime: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'in_progress';
  checklist?: ChecklistItem[];
  photos: JobPhoto[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
}

interface JobPhoto {
  id: string;
  uri: string;
  type: 'before' | 'progress' | 'after' | 'issue';
  description?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

type WorkflowStep = 'confirmation' | 'gps_fetch' | 'checklist' | 'execution' | 'completed';

export default function JobStartWorkflow({
  job,
  visible,
  onClose,
  onJobStarted,
  enableGPSTracking = true,
  enableChecklist = true,
  enablePhotoUpload = true,
}: JobStartWorkflowProps) {
  const { currentProfile } = usePINAuth();
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('confirmation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Job session data
  const [jobSession, setJobSession] = useState<JobSession | null>(null);
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [sessionPhotos, setSessionPhotos] = useState<JobPhoto[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});
  
  // UI state
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Initialize checklist based on job type
  useEffect(() => {
    if (visible && enableChecklist) {
      generateJobChecklist();
    }
  }, [visible, job.jobType, enableChecklist]);

  // Reset workflow when modal opens
  useEffect(() => {
    if (visible) {
      resetWorkflow();
    }
  }, [visible]);

  const resetWorkflow = () => {
    setCurrentStep('confirmation');
    setIsLoading(false);
    setError(null);
    setJobSession(null);
    setStartLocation(null);
    setSessionPhotos([]);
    setSessionNotes('');
    setChecklistNotes({});
    setShowMap(false);
  };

  const generateJobChecklist = () => {
    // Generate default checklist based on job type
    const defaultChecklists: Record<string, ChecklistItem[]> = {
      cleaning: [
        {
          id: 'safety_check',
          title: 'Safety Equipment Check',
          description: 'Verify all cleaning supplies and safety equipment are available',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'access_property',
          title: 'Property Access',
          description: 'Successfully enter the property using provided access instructions',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'initial_inspection',
          title: 'Initial Property Inspection',
          description: 'Document property condition before starting work',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'supplies_ready',
          title: 'Organize Cleaning Supplies',
          description: 'Set up all necessary cleaning supplies and tools',
          isRequired: false,
          isCompleted: false,
        },
      ],
      maintenance: [
        {
          id: 'safety_check',
          title: 'Safety Equipment Check',
          description: 'Verify tools and safety equipment are in good condition',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'tools_inventory',
          title: 'Tools and Materials Inventory',
          description: 'Confirm all required tools and materials are available',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'property_assessment',
          title: 'Property Assessment',
          description: 'Evaluate the maintenance tasks required',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'work_area_prep',
          title: 'Work Area Preparation',
          description: 'Prepare and secure the work area',
          isRequired: false,
          isCompleted: false,
        },
      ],
      inspection: [
        {
          id: 'documentation_ready',
          title: 'Inspection Documentation',
          description: 'Prepare inspection forms and documentation tools',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'camera_setup',
          title: 'Camera and Photo Equipment',
          description: 'Ensure camera/phone is ready for documentation',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'property_exterior',
          title: 'Exterior Property Review',
          description: 'Initial review of property exterior condition',
          isRequired: true,
          isCompleted: false,
        },
        {
          id: 'access_all_areas',
          title: 'Access to All Areas',
          description: 'Confirm access to all areas requiring inspection',
          isRequired: true,
          isCompleted: false,
        },
      ],
    };

    const jobTypeChecklist = defaultChecklists[job.jobType] || defaultChecklists.cleaning;
    setChecklist(jobTypeChecklist);
  };

  // Step 1: Confirmation Modal
  const handleConfirmStart = async () => {
    if (!currentProfile?.id) {
      setError('User profile not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (enableGPSTracking) {
        setCurrentStep('gps_fetch');
        await fetchCurrentLocation();
      } else {
        await startJobSession();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
      setIsLoading(false);
    }
  };

  // Step 2: GPS Location Fetch
  const fetchCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required to start the job');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
      });

      // Get address from coordinates
      let address = 'Location recorded';
      try {
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (addressResult) {
          address = [
            addressResult.name,
            addressResult.street,
            addressResult.city,
            addressResult.region,
          ].filter(Boolean).join(', ');
        }
      } catch (reverseGeocodeError) {
        console.warn('Reverse geocoding failed:', reverseGeocodeError);
      }

      const startLocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };

      setStartLocation(startLocationData);
      
      // Show location on map briefly
      setShowMap(true);
      setTimeout(() => {
        setShowMap(false);
        startJobSession();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setIsLoading(false);
    }
  };

  // Step 3: Start Job Session
  const startJobSession = async () => {
    if (!currentProfile?.id) {
      throw new Error('User profile not available');
    }

    try {
      const sessionId = `${job.id}_${currentProfile.id}_${Date.now()}`;
      const startTime = new Date();

      const session: JobSession = {
        id: sessionId,
        jobId: job.id,
        staffId: currentProfile.id,
        startTime,
        startLocation: startLocation || {
          latitude: 0,
          longitude: 0,
          address: 'Location not available',
        },
        status: 'in_progress',
        checklist: enableChecklist ? checklist : undefined,
        photos: [],
        notes: '',
        createdAt: startTime,
        updatedAt: startTime,
      };

      // Save job session to Firestore
      const sessionRef = doc(collection(db, 'job_sessions'), sessionId);
      await setDoc(sessionRef, {
        ...session,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update job status to in_progress
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        startedBy: currentProfile.id,
        currentSession: sessionId,
        updatedAt: serverTimestamp(),
      });

      setJobSession(session);
      setIsLoading(false);

      if (enableChecklist && checklist.length > 0) {
        setCurrentStep('checklist');
      } else {
        setCurrentStep('execution');
      }

    } catch (err) {
      console.error('Error starting job session:', err);
      throw new Error('Failed to start job session');
    }
  };

  // Step 4: Checklist Management
  const toggleChecklistItem = (itemId: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              isCompleted: !item.isCompleted, 
              completedAt: !item.isCompleted ? new Date() : undefined 
            }
          : item
      )
    );
  };

  const updateChecklistNotes = (itemId: string, notes: string) => {
    setChecklistNotes(prev => ({ ...prev, [itemId]: notes }));
  };

  const proceedToExecution = async () => {
    // Check if all required items are completed
    const requiredItems = checklist.filter(item => item.isRequired);
    const completedRequired = requiredItems.filter(item => item.isCompleted);

    if (completedRequired.length < requiredItems.length) {
      Alert.alert(
        'Required Items',
        `Please complete all required checklist items (${completedRequired.length}/${requiredItems.length} completed).`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Update checklist in job session
    if (jobSession) {
      try {
        const updatedChecklist = checklist.map(item => ({
          ...item,
          notes: checklistNotes[item.id] || item.notes,
        }));

        const sessionRef = doc(db, 'job_sessions', jobSession.id);
        await updateDoc(sessionRef, {
          checklist: updatedChecklist,
          updatedAt: serverTimestamp(),
        });

        setJobSession(prev => prev ? { ...prev, checklist: updatedChecklist } : null);
      } catch (error) {
        console.error('Error updating checklist:', error);
      }
    }

    setCurrentStep('execution');
  };

  // Step 5: Photo Upload
  const takePhoto = async (type: JobPhoto['type']) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoId = `photo_${Date.now()}`;
        const newPhoto: JobPhoto = {
          id: photoId,
          uri: result.assets[0].uri,
          type,
          timestamp: new Date(),
          location: startLocation ? {
            latitude: startLocation.latitude,
            longitude: startLocation.longitude,
          } : undefined,
        };

        setSessionPhotos(prev => [...prev, newPhoto]);

        // Update job session with new photo
        if (jobSession) {
          const sessionRef = doc(db, 'job_sessions', jobSession.id);
          await updateDoc(sessionRef, {
            photos: [...sessionPhotos, newPhoto],
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Complete job workflow
  const completeWorkflow = () => {
    if (jobSession) {
      onJobStarted({
        ...jobSession,
        photos: sessionPhotos,
        notes: sessionNotes,
        checklist: checklist.map(item => ({
          ...item,
          notes: checklistNotes[item.id] || item.notes,
        })),
      });
    }
    onClose();
  };

  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Play size={48} color="#3b82f6" />
      </View>
      
      <Text style={styles.stepTitle}>Start Job?</Text>
      <Text style={styles.stepDescription}>
        Are you ready to begin this job now?
      </Text>
      
      <View style={styles.jobInfoContainer}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobDescription}>{job.description}</Text>
        
        {job.location && (
          <View style={styles.locationInfo}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.locationText}>
              {job.location.address}
            </Text>
          </View>
        )}
        
        <View style={styles.timeInfo}>
          <Clock size={16} color="#6b7280" />
          <Text style={styles.timeText}>
            Estimated duration: {job.estimatedDuration || 60} minutes
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirmStart}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader size={20} color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Yes, Start</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGPSStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Navigation size={48} color="#10b981" />
      </View>
      
      <Text style={styles.stepTitle}>Getting Location</Text>
      <Text style={styles.stepDescription}>
        Recording your current GPS location...
      </Text>
      
      {startLocation && (
        <View style={styles.locationResult}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.locationResultText}>
            Location recorded: {startLocation.address}
          </Text>
        </View>
      )}

      {showMap && startLocation && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
              }}
              title="Your Location"
              description="Job start location"
            />
          </MapView>
        </View>
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Loader size={24} color="#3b82f6" />
          <Text style={styles.loadingText}>Fetching GPS coordinates...</Text>
        </View>
      )}
    </View>
  );

  const renderChecklistStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pre-Job Checklist</Text>
      <Text style={styles.stepDescription}>
        Complete the required items before starting work
      </Text>
      
      <ScrollView style={styles.checklistScrollView} showsVerticalScrollIndicator={false}>
        {checklist.map((item) => (
          <View key={item.id} style={styles.checklistItem}>
            <TouchableOpacity 
              style={styles.checklistItemHeader}
              onPress={() => toggleChecklistItem(item.id)}
            >
              {item.isCompleted ? (
                <CheckSquare size={24} color="#10b981" />
              ) : (
                <Square size={24} color="#6b7280" />
              )}
              
              <View style={styles.checklistItemContent}>
                <Text style={[
                  styles.checklistItemTitle,
                  item.isCompleted && styles.checklistItemCompleted
                ]}>
                  {item.title}
                  {item.isRequired && <Text style={styles.requiredIndicator}> *</Text>}
                </Text>
                
                {item.description && (
                  <Text style={styles.checklistItemDescription}>
                    {item.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            <TextInput
              style={styles.checklistNotesInput}
              placeholder="Add notes (optional)"
              value={checklistNotes[item.id] || ''}
              onChangeText={(text) => updateChecklistNotes(item.id, text)}
              multiline
            />
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.checklistFooter}>
        <Text style={styles.checklistProgress}>
          {checklist.filter(item => item.isCompleted).length} of {checklist.length} completed
          {checklist.filter(item => item.isRequired && !item.isCompleted).length > 0 && (
            <Text style={styles.requiredRemaining}>
              {' '}({checklist.filter(item => item.isRequired && !item.isCompleted).length} required remaining)
            </Text>
          )}
        </Text>
        
        <TouchableOpacity 
          style={styles.proceedButton}
          onPress={proceedToExecution}
        >
          <Text style={styles.proceedButtonText}>Continue to Job</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExecutionStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <CheckCircle size={48} color="#10b981" />
      </View>
      
      <Text style={styles.stepTitle}>Job Started Successfully!</Text>
      <Text style={styles.stepDescription}>
        You can now begin working on this job. Use the tools below to document your progress.
      </Text>
      
      {enablePhotoUpload && (
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Document Progress</Text>
          
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => takePhoto('progress')}
            >
              <Camera size={24} color="#3b82f6" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          
          {sessionPhotos.length > 0 && (
            <View style={styles.photoGallery}>
              <Text style={styles.photoGalleryTitle}>
                Photos ({sessionPhotos.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sessionPhotos.map((photo) => (
                  <View key={photo.id} style={styles.photoPreview}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <Text style={styles.photoType}>{photo.type}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Job Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes about the job progress..."
          value={sessionNotes}
          onChangeText={setSessionNotes}
          multiline
          numberOfLines={4}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={completeWorkflow}
      >
        <Text style={styles.completeButtonText}>Continue Working</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f8fafc', '#e2e8f0']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Start Job</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${
                      currentStep === 'confirmation' ? 25 :
                      currentStep === 'gps_fetch' ? 50 :
                      currentStep === 'checklist' ? 75 : 100
                    }%` 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Error display */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Step content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {currentStep === 'confirmation' && renderConfirmationStep()}
            {currentStep === 'gps_fetch' && renderGPSStep()}
            {currentStep === 'checklist' && renderChecklistStep()}
            {currentStep === 'execution' && renderExecutionStep()}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '400',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  jobInfoContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  locationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationResultText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 12,
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
  },
  checklistScrollView: {
    width: '100%',
    maxHeight: 400,
    marginBottom: 20,
  },
  checklistItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checklistItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checklistItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  checklistItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  checklistItemCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  checklistItemDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  requiredIndicator: {
    color: '#ef4444',
  },
  checklistNotesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    minHeight: 40,
  },
  checklistFooter: {
    width: '100%',
    alignItems: 'center',
  },
  checklistProgress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  requiredRemaining: {
    color: '#ef4444',
    fontWeight: '500',
  },
  proceedButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 8,
  },
  photoGallery: {
    width: '100%',
  },
  photoGalleryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  photoPreview: {
    alignItems: 'center',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  notesSection: {
    width: '100%',
    marginBottom: 32,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completeButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
