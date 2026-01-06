import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Job, JobPhoto } from '@/types/job';
import { jobService } from '@/services/jobService';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { JobCompletionWizard } from '@/components/jobs/JobCompletionWizard';
import { BrandTheme } from '@/constants/BrandTheme';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  Phone,
  Camera,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  User,
  Building,
  FileText,
  Upload,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Cross-platform Map Component
const MapComponent = ({ job, userLocation }: { job: Job; userLocation: any }) => {

  // For now, use web-compatible fallback for all platforms
  // TODO: Add native maps support later with proper conditional loading
  return (
    <View style={styles.webMapContainer}>
      <View style={styles.webMapContent}>
        <MapPin size={32} color={BrandTheme.colors.YELLOW} />
        <Text style={styles.webMapAddress}>{job.location?.address || 'Address not available'}</Text>
        <Text style={styles.webMapCity}>
          {job.location?.city || ''}{job.location?.city && job.location?.state ? ', ' : ''}{job.location?.state || ''} {job.location?.zipCode || ''}
        </Text>
        <TouchableOpacity
          style={styles.webMapButton}
          onPress={() => {
            const address = job.location?.address || '';
            const city = job.location?.city || '';
            const state = job.location?.state || '';
            const fullAddress = `${address}, ${city}, ${state}`.replace(/^,\s*|,\s*$/g, '');
            const encodedAddress = encodeURIComponent(fullAddress);
            const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            Linking.openURL(url);
          }}
        >
          <View style={styles.webMapButtonGradient}>
            <Navigation size={16} color={BrandTheme.colors.BLACK} />
            <Text style={styles.webMapButtonText}>Open in Google Maps</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Safe hook wrapper to handle potential errors
function useSafeLocalSearchParams() {
  try {
    return useLocalSearchParams();
  } catch (error) {
    console.error('❌ Error in useLocalSearchParams:', error);
    return {};
  }
}

export default function JobDetailsScreen() {
  const router = useRouter();
  const { user } = useStaffAuth();
  const { currentProfile } = usePINAuth();
  
  // Safe parameter extraction with error handling
  const params = useSafeLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  
  console.log('🔍 JobDetails: Extracted ID from params:', { params, id });
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompletionWizard, setShowCompletionWizard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [JobDetails]: Screen focused, refreshing job data...');
      if (id && user?.id) {
        loadJobDetails();
      }
    }, [id, user?.id])
  );

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(async () => {
    console.log('🔄 [JobDetails]: Manual refresh triggered');
    setRefreshing(true);
    await loadJobDetails();
    console.log('✅ [JobDetails]: Refresh complete');
    setRefreshing(false);
  }, [id, user?.id]);

  useEffect(() => {
    if (id && user?.id) {
      loadJobDetails();
      getCurrentLocation();
    } else if (id && !user?.id) {
      console.log('🔍 JobDetails: Waiting for user authentication...');
    } else if (!id) {
      console.error('❌ Job ID is missing from URL parameters');
      // Don't show alert immediately, wait a bit for params to load
      const timer = setTimeout(() => {
        Alert.alert('Error', 'Job ID is missing');
        router.back();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, user?.id]);

  const loadJobDetails = async () => {
    if (!id || !user?.id) return;

    try {
      setIsLoading(true);
      
      // Try to get the specific job document directly
      const db = await getDb();
      const jobDocRef = doc(db, 'jobs', id);
      const jobDoc = await getDoc(jobDocRef);
      
      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        
        console.log('🔍 Job Details Debug:', {
          jobId: id,
          jobDataKeys: Object.keys(jobData),
          assignedTo: jobData.assignedTo,
          userId: jobData.userId,
          assignedStaffId: jobData.assignedStaffId,
          assignedStaffDocId: jobData.assignedStaffDocId,
          currentUserId: user.id,
          currentUserFirebaseId: (currentProfile as any)?.userId || 'not available'
        });
        
        // More flexible verification - check multiple possible assignment fields
        const isAssignedToUser = 
          jobData.assignedTo === user.id ||           // Direct staff ID assignment
          jobData.userId === user.id ||              // User ID field
          jobData.staffId === user.id ||             // Staff ID field
          jobData.assignedStaffId === user.id ||     // Assigned staff ID field
          jobData.assignedStaffDocId === user.id ||  // Assigned staff document ID field
          jobData.assignedTo === (currentProfile as any)?.userId ||      // Firebase UID assignment
          jobData.userId === (currentProfile as any)?.userId ||          // Firebase UID in userId field
          jobData.assignedStaffId === (currentProfile as any)?.userId || // Firebase UID in assignedStaffId
          jobData.assignedStaffDocId === (currentProfile as any)?.userId; // Firebase UID in assignedStaffDocId
        
        if (isAssignedToUser) {
          // Convert Firestore Timestamps to JavaScript Dates
          const processedJobData = {
            ...jobData,
            checkInDate: jobData.checkInDate?.toDate ? jobData.checkInDate.toDate() : jobData.checkInDate,
            checkOutDate: jobData.checkOutDate?.toDate ? jobData.checkOutDate.toDate() : jobData.checkOutDate,
            createdAt: jobData.createdAt?.toDate ? jobData.createdAt.toDate() : jobData.createdAt,
            updatedAt: jobData.updatedAt?.toDate ? jobData.updatedAt.toDate() : jobData.updatedAt,
            scheduledFor: jobData.scheduledFor?.toDate ? jobData.scheduledFor.toDate() : jobData.scheduledFor,
            startedAt: jobData.startedAt?.toDate ? jobData.startedAt.toDate() : jobData.startedAt,
            completedAt: jobData.completedAt?.toDate ? jobData.completedAt.toDate() : jobData.completedAt,
            rejectedAt: jobData.rejectedAt?.toDate ? jobData.rejectedAt.toDate() : jobData.rejectedAt,
          };
          
          console.log('✅ Processed dates:', {
            checkInDate: processedJobData.checkInDate,
            checkOutDate: processedJobData.checkOutDate,
            checkInType: typeof processedJobData.checkInDate,
            checkOutType: typeof processedJobData.checkOutDate
          });
          
          setJob({ id: jobDoc.id, ...processedJobData } as unknown as Job);
          setPhotos(jobData.photos || []);
        } else {
          console.warn('❌ Access denied - job assignment mismatch:', {
            jobData: { 
              assignedTo: jobData.assignedTo, 
              userId: jobData.userId, 
              staffId: jobData.staffId,
              assignedStaffId: jobData.assignedStaffId,
              assignedStaffDocId: jobData.assignedStaffDocId
            },
            userData: { 
              id: user.id, 
              userId: (currentProfile as any)?.userId 
            }
          });
          Alert.alert('Access Denied', 'You are not assigned to this job');
          router.back();
        }
      } else {
        Alert.alert('Job Not Found', 'The requested job could not be found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleGetDirections = () => {
    if (!job?.location.coordinates) {
      Alert.alert('Error', 'Job location coordinates not available');
      return;
    }

    const { latitude, longitude } = job.location.coordinates;
    const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri, 'during');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (imageUri: string, type: JobPhoto['type']) => {
    if (!job || !user?.id) return;

    try {
      setIsUploading(true);
      const response = await jobService.uploadJobPhoto(
        job.id,
        imageUri,
        type,
        `Photo taken by ${user.name}`
      );

      if (response.success && response.photo) {
        setPhotos(prev => [...prev, { ...response.photo!, uploadedBy: user.id }]);
        Alert.alert('Success', 'Photo uploaded successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartJob = async () => {
    if (!job || !user?.id) return;

    try {
      const response = await jobService.startJob(job.id, user.id);
      if (response.success) {
        setJob(prev => prev ? { ...prev, status: 'in_progress', startedAt: new Date() } : null);
        Alert.alert('Success', 'Job started successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to start job');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start job');
    }
  };

  const handleCompleteJob = async () => {
    if (!job || !user?.id) return;

    // Show the completion wizard directly
    setShowCompletionWizard(true);
  };

  const handleWizardJobCompleted = async (updatedJob: Job, completionData: any) => {
    try {
      console.log('🏁 Handling job completion from wizard:', updatedJob.id);
      
      // Upload photos to Firebase Storage if any
      const uploadedPhotoUrls: string[] = [];
      if (completionData.uploadedPhotos && completionData.uploadedPhotos.length > 0) {
        console.log('📸 Uploading completion photos:', completionData.uploadedPhotos.length);
        
        for (const [index, photo] of completionData.uploadedPhotos.entries()) {
          try {
            console.log(`📸 Uploading photo ${index + 1}/${completionData.uploadedPhotos.length}:`, {
              id: photo.id,
              uri: photo.uri,
              type: photo.type,
              description: photo.description
            });
            
            const response = await jobService.uploadJobPhoto(
              updatedJob.id,
              photo.uri,
              'completion',
              photo.description || 'Job completion photo'
            );
            
            if (response.success && response.photo?.url) {
              uploadedPhotoUrls.push(response.photo.url);
              console.log(`✅ Photo ${index + 1} uploaded successfully:`, response.photo.url);
            } else {
              console.warn(`⚠️ Photo ${index + 1} upload failed:`, response.error);
            }
          } catch (photoError) {
            console.error(`❌ Error uploading photo ${index + 1}:`, photoError);
            console.error(`❌ Photo details:`, photo);
          }
        }
        
        console.log(`📊 Photo upload summary: ${uploadedPhotoUrls.length}/${completionData.uploadedPhotos.length} successful`);
      }

      // Calculate actual duration
      const actualDuration = job?.startedAt 
        ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / (1000 * 60))
        : job?.estimatedDuration || 0;

      // Create complete job request with all data
      const completeJobRequest = {
        jobId: updatedJob.id,
        staffId: user?.id || '',
        completedAt: completionData.endTime || new Date(),
        actualDuration,
        completionNotes: completionData.completionNotes || 'Job completed via wizard',
        photos: [...uploadedPhotoUrls, ...photos.map(p => p.id)], // Include both new and existing photos
        requirements: (completionData.requirementsSummary || []).map((req: any) => ({
          id: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isCompleted: req.isCompleted || false,
          notes: req.notes || '',
        })),
        actualCost: completionData.actualCost || null,
      };

      console.log('📝 Submitting job completion request:', completeJobRequest);

      // Call the job service to complete the job in Firestore
      const response = await jobService.completeJob(completeJobRequest);

      if (response.success) {
        console.log('✅ Job completed successfully in Firestore');
        setJob(updatedJob);
        setShowCompletionWizard(false);
        
        Alert.alert(
          '🎉 Job Completed!', 
          'Job has been completed and saved to the database successfully. Management can now view the completion data in the webapp.',
          [
            { 
              text: 'Great!', 
              onPress: () => {
                // Navigate to jobs list instead of going back
                router.replace('/(tabs)/jobs-brand');
              },
              style: 'default' 
            }
          ]
        );
      } else {
        console.error('❌ Job completion failed:', response.error);
        Alert.alert(
          'Error', 
          `Failed to complete job: ${response.error}. Please try again.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Error completing job:', error);
      Alert.alert(
        'Error', 
        'Failed to complete job. Please check your connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  if (isLoading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandTheme.colors.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandTheme.colors.YELLOW}
            colors={[BrandTheme.colors.YELLOW]}
            progressBackgroundColor={BrandTheme.colors.SURFACE_1}
          />
        }
      >
        {/* Property Name Section */}
        {job.propertyName && (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.propertyNameSection}>
                <Text style={styles.propertyNameLabel}>PROPERTY</Text>
                <Text style={styles.propertyName}>{job.propertyName}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Property Photos Gallery */}
        {job.propertyPhotos && job.propertyPhotos.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.sectionHeader}>
                <Camera size={20} color={BrandTheme.colors.YELLOW} />
                <Text style={styles.sectionTitle}>Property Photos</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.photosScrollView}
              >
                {job.propertyPhotos.map((photoUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: photoUrl }}
                    style={styles.propertyPhoto}
                    onError={(e) => {
                      console.log('Failed to load property photo:', photoUrl, e.nativeEvent.error);
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.noPhotosSection}>
                <Camera size={32} color={BrandTheme.colors.GREY_SECONDARY} />
                <Text style={styles.noPhotosText}>No property photos available</Text>
              </View>
            </View>
          </View>
        )}

        {/* Access Instructions - CRITICAL */}
        {job.accessInstructions && (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.accessSection}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle size={20} color={BrandTheme.colors.YELLOW} />
                  <Text style={styles.sectionTitle}>Access Instructions</Text>
                </View>
                <Text style={styles.accessText}>{job.accessInstructions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Google Maps Navigation Button */}
        {job.location?.googleMapsLink && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={() => {
                const mapsLink = job.location?.googleMapsLink;
                if (mapsLink && typeof mapsLink === 'string') {
                  Linking.openURL(mapsLink).catch(err => {
                    console.error('Failed to open maps:', err);
                    Alert.alert('Error', 'Could not open Google Maps');
                  });
                }
              }}
            >
              <View style={styles.mapsButtonGradient}>
                <MapPin size={20} color={BrandTheme.colors.BLACK} />
                <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
                <Navigation size={16} color={BrandTheme.colors.BLACK} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Booking Details */}
        {(job.bookingRef || job.checkInDate || job.checkOutDate || job.guestCount) && (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.bookingSection}>
                <Text style={styles.cardTitle}>Booking Information</Text>
                
                {job.bookingRef && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Booking Reference:</Text>
                    <Text style={styles.detailValue}>{job.bookingRef}</Text>
                  </View>
                )}
                
                {job.checkInDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check-in Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(job.checkInDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                
                {job.checkOutDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Check-out Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(job.checkOutDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                
                {job.guestCount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Number of Guests:</Text>
                    <Text style={styles.detailValue}>{job.guestCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Job Info Card */}
        <View style={styles.card}>
          <View style={styles.cardGradient}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobType}>
              {job.type && typeof job.type === 'string' 
                ? job.type.replace('_', ' ').toUpperCase() 
                : 'JOB'}
            </Text>
            
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Clock size={16} color={BrandTheme.colors.YELLOW} />
                <Text style={styles.metaText}>
                  {job.estimatedDuration || 0} min • {job.priority && typeof job.priority === 'string' ? job.priority.toUpperCase() : 'NORMAL'}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Building size={16} color={BrandTheme.colors.YELLOW} />
                <Text style={styles.metaText}>{job.location?.address || 'Location not available'}</Text>
              </View>
            </View>

            {job.description && (
              <View style={styles.descriptionContainer}>
                <FileText size={16} color={BrandTheme.colors.YELLOW} />
                <Text style={styles.description}>{job.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Map Card */}
        {job.location?.coordinates && (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.mapHeader}>
                <Text style={styles.cardTitle}>Location & Navigation</Text>
                <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
                  <Navigation size={16} color={BrandTheme.colors.BLACK} />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              <MapComponent job={job} userLocation={userLocation} />
            </View>
          </View>
        )}

        {/* Special Notes - Important warnings/instructions */}
        {job.specialNotes && (
          <View style={styles.card}>
            <View style={styles.cardGradient}>
              <View style={styles.notesSection}>
                <View style={styles.sectionHeader}>
                  <FileText size={20} color={BrandTheme.colors.WARNING} />
                  <Text style={styles.sectionTitle}>Special Notes</Text>
                </View>
                <Text style={styles.notesText}>{job.specialNotes}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {job.status === 'accepted' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleStartJob}>
              <View
                style={[styles.actionButtonGradient, { backgroundColor: BrandTheme.colors.SUCCESS }]}
              >
                <Play size={20} color={BrandTheme.colors.BLACK} />
                <Text style={[styles.actionButtonText, { color: BrandTheme.colors.BLACK }]}>Start Job</Text>
              </View>
            </TouchableOpacity>
          )}

          {job.status === 'in_progress' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCompleteJob}>
              <View
                style={[styles.actionButtonGradient, { backgroundColor: BrandTheme.colors.YELLOW }]}
              >
                <CheckCircle size={20} color={BrandTheme.colors.BLACK} />
                <Text style={[styles.actionButtonText, { color: BrandTheme.colors.BLACK }]}>Complete Job</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Job Completion Wizard */}
      <JobCompletionWizard
        job={job}
        visible={showCompletionWizard}
        onDismiss={() => setShowCompletionWizard(false)}
        onJobCompleted={handleWizardJobCompleted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
    backgroundColor: BrandTheme.colors.BLACK,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    textAlign: 'center',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: BrandTheme.spacing.LG,
    marginVertical: BrandTheme.spacing.SM,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  cardGradient: {
    padding: BrandTheme.spacing.LG,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 4,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobType: {
    fontSize: 12,
    color: BrandTheme.colors.YELLOW,
    fontWeight: '600',
    marginBottom: BrandTheme.spacing.LG,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  jobMeta: {
    gap: BrandTheme.spacing.SM,
    marginBottom: BrandTheme.spacing.LG,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
  },
  metaText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  descriptionContainer: {
    flexDirection: 'row',
    gap: BrandTheme.spacing.SM,
    marginTop: BrandTheme.spacing.SM,
  },
  description: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    lineHeight: 20,
    flex: 1,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.LG,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.LG,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.colors.YELLOW,
    paddingHorizontal: BrandTheme.spacing.MD,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapContainer: {
    height: 200,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  webMapContainer: {
    height: 200,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    overflow: 'hidden',
  },
  webMapContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: BrandTheme.spacing.XL,
  },
  webMapAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: BrandTheme.spacing.SM,
    marginBottom: 4,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  webMapCity: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: BrandTheme.spacing.LG,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  webMapButton: {
    overflow: 'hidden',
  },
  webMapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.SM,
    gap: BrandTheme.spacing.SM,
    backgroundColor: BrandTheme.colors.YELLOW,
  },
  webMapButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.LG,
  },
  actionButton: {
    overflow: 'hidden',
    marginBottom: BrandTheme.spacing.MD,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BrandTheme.spacing.LG,
    gap: BrandTheme.spacing.SM,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomSpacing: {
    height: BrandTheme.spacing.XL,
  },
  // Property Name Section
  propertyNameSection: {
    marginBottom: BrandTheme.spacing.LG,
    paddingHorizontal: BrandTheme.spacing.XL,
  },
  propertyNameLabel: {
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: 4,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BrandTheme.colors.YELLOW,
    fontFamily: BrandTheme.typography.fontFamily.accent,
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    marginBottom: BrandTheme.spacing.MD,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Property Photos
  photosScrollView: {
    marginTop: BrandTheme.spacing.SM,
  },
  propertyPhoto: {
    width: 300,
    height: 200,
    marginRight: BrandTheme.spacing.MD,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  noPhotosSection: {
    padding: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: BrandTheme.spacing.SM,
  },
  noPhotosText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  // Access Instructions
  accessSection: {
    marginTop: BrandTheme.spacing.SM,
  },
  accessText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    lineHeight: 20,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  // Booking Details
  bookingSection: {
    marginTop: BrandTheme.spacing.SM,
    gap: BrandTheme.spacing.SM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },
  detailLabel: {
    fontSize: 13,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontWeight: '600',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  // Special Notes
  notesSection: {
    marginTop: BrandTheme.spacing.SM,
  },
  notesText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    lineHeight: 20,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  // Google Maps Button
  mapsButton: {
    overflow: 'hidden',
  },
  mapsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: BrandTheme.spacing.LG,
    gap: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.YELLOW,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
