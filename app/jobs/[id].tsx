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
import { Job, JobPhoto } from '@/types/job';
import { jobService } from '@/services/jobService';
import { useStaffAuth } from '@/hooks/useStaffAuth';
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
        <MapPin size={32} color="#8b5cf6" />
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
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.webMapButtonGradient}
          >
            <Navigation size={16} color="#ffffff" />
            <Text style={styles.webMapButtonText}>Open in Google Maps</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentProfile } = useStaffAuth();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobDetails();
      getCurrentLocation();
    }
  }, [id]);

  const loadJobDetails = async () => {
    if (!id || !user?.id) return;

    try {
      setIsLoading(true);
      // In a real app, you'd fetch the specific job details
      // For now, we'll simulate this
      const response = await jobService.getStaffJobs(user.id);
      if (response.success) {
        const foundJob = response.jobs.find(j => j.id === id);
        if (foundJob) {
          setJob(foundJob);
          setPhotos(foundJob.photos || []);
        }
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
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.cardGradient}
          >
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobType}>{job.type.replace('_', ' ').toUpperCase()}</Text>
            
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Clock size={16} color="#8b5cf6" />
                <Text style={styles.metaText}>
                  {job.estimatedDuration} min • {job.priority.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Building size={16} color="#8b5cf6" />
                <Text style={styles.metaText}>{job.location.address}</Text>
              </View>
            </View>

            {job.description && (
              <View style={styles.descriptionContainer}>
                <FileText size={16} color="#8b5cf6" />
                <Text style={styles.description}>{job.description}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Map Card */}
        {job.location.coordinates && (
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.mapHeader}>
                <Text style={styles.cardTitle}>Location & Navigation</Text>
                <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
                  <Navigation size={16} color="#ffffff" />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              <MapComponent job={job} userLocation={userLocation} />
            </LinearGradient>
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
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.actionButtonGradient}
              >
                <CheckCircle size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Complete Job</Text>
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
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
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
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  jobType: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 16,
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
    color: '#d1d5db',
  },
  descriptionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  webMapCity: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
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
    color: '#ffffff',
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
  },
  bottomSpacing: {
    height: 20,
  },
});
