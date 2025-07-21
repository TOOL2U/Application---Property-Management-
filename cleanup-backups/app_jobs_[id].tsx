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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Job, JobPhoto } from '@/types/job';
import { jobService } from '@/services/jobService';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { usePINAuth } from '@/contexts/PINAuthContext';
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
        <MapPin size={32} color="#C6FF00" />
        <Text style={styles.webMapAddress}>{job.location.address}</Text>
        <Text style={styles.webMapCity}>
          {job.location.city}, {job.location.state} {job.location.zipCode}
        </Text>
        <TouchableOpacity
          style={styles.webMapButton}
          onPress={() => {
            const address = encodeURIComponent(`${job.location.address}, ${job.location.city}, ${job.location.state}`);
            const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
            Linking.openURL(url);
          }}
        >
          <LinearGradient
            colors={['#C6FF00', '#A3E635']}
            style={styles.webMapButtonGradient}
          >
            <Navigation size={16} color="#0B0F1A" />
            <Text style={styles.webMapButtonText}>Open in Google Maps</Text>
          </LinearGradient>
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
          setJob({ id: jobDoc.id, ...jobData } as Job);
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

    if (photos.length === 0) {
      Alert.alert(
        'Photos Required',
        'You must upload at least one photo before completing the job.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              const actualDuration = job.startedAt 
                ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / (1000 * 60))
                : job.estimatedDuration;

              const response = await jobService.completeJob({
                jobId: job.id,
                staffId: user.id,
                completedAt: new Date(),
                actualDuration,
                completionNotes: 'Job completed successfully',
                photos: photos.map(p => p.id),
                requirements: job.requirements.map(req => ({
                  id: req.id,
                  isCompleted: true,
                })),
              });

              if (response.success) {
                Alert.alert(
                  'Job Completed',
                  'Job has been marked as completed successfully!',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to complete job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete job');
            }
          },
        },
      ]
    );
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
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Job Info Card */}
        <View style={styles.card}>
          <View style={styles.cardGradient}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobType}>{job.type ? job.type.replace('_', ' ').toUpperCase() : 'JOB'}</Text>
            
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Clock size={16} color="#C6FF00" />
                <Text style={styles.metaText}>
                  {job.estimatedDuration || 0} min • {job.priority ? job.priority.toUpperCase() : 'NORMAL'}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Building size={16} color="#C6FF00" />
                <Text style={styles.metaText}>{job.location?.address || 'Location not available'}</Text>
              </View>
            </View>

            {job.description && (
              <View style={styles.descriptionContainer}>
                <FileText size={16} color="#C6FF00" />
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
                  <Navigation size={16} color="#0B0F1A" />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              <MapComponent job={job} userLocation={userLocation} />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {job.status === 'accepted' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleStartJob}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.actionButtonGradient}
              >
                <Play size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Start Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {job.status === 'in_progress' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCompleteJob}>
              <LinearGradient
                colors={['#C6FF00', '#A3E635']}
                style={styles.actionButtonGradient}
              >
                <CheckCircle size={20} color="#0B0F1A" />
                <Text style={[styles.actionButtonText, { color: '#0B0F1A' }]}>Complete Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E9AAE',
    fontFamily: 'Inter_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A3A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardGradient: {
    padding: 16,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  jobType: {
    fontSize: 14,
    color: '#C6FF00',
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  jobMeta: {
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#8E9AAE',
    fontFamily: 'Inter_400Regular',
  },
  descriptionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#8E9AAE',
    lineHeight: 20,
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    fontFamily: 'Inter_700Bold',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C6FF00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B0F1A',
    fontFamily: 'Inter_600SemiBold',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  webMapContainer: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    overflow: 'hidden',
  },
  webMapContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  webMapAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter_700Bold',
  },
  webMapCity: {
    fontSize: 14,
    color: '#8E9AAE',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  webMapButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  webMapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  webMapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F1A',
    fontFamily: 'Inter_600SemiBold',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
  },
  bottomSpacing: {
    height: 20,
  },
});
