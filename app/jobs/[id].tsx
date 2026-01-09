import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<{
    propertyDetails: boolean;
    payment: boolean;
    checklist: boolean;
    contacts: boolean;
    issues: boolean;
    guestInfo: boolean;
    supplies: boolean;
    safety: boolean;
    skills: boolean;
  }>({
    propertyDetails: false,
    payment: false,
    checklist: false,
    contacts: false,
    issues: false,
    guestInfo: false,
    supplies: false,
    safety: false,
    skills: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
      
      // Try to get the job from both 'jobs' and 'operational_jobs' collections
      const db = await getDb();
      
      // Try 'jobs' collection first
      let jobDocRef = doc(db, 'jobs', id);
      let jobDoc = await getDoc(jobDocRef);
      let collection = 'jobs';
      
      // If not found, try 'operational_jobs' collection
      if (!jobDoc.exists()) {
        console.log('🔍 Job not found in jobs collection, trying operational_jobs...');
        jobDocRef = doc(db, 'operational_jobs', id);
        jobDoc = await getDoc(jobDocRef);
        collection = 'operational_jobs';
      }
      
      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        
        console.log(`🔍 Job Details Debug (from ${collection}):`, {
          jobId: id,
          collection,
          jobDataKeys: Object.keys(jobData),
          assignedTo: jobData.assignedTo,
          userId: jobData.userId,
          assignedStaffId: jobData.assignedStaffId,
          assignedStaffDocId: jobData.assignedStaffDocId,
          status: jobData.status,
          currentUserId: user.id,
          currentUserFirebaseId: (currentProfile as any)?.userId || 'not available'
        });
        
        // For unassigned operational_jobs (status: pending, no assignedStaffId), allow any cleaner to view
        const isUnassignedOperationalJob = 
          collection === 'operational_jobs' && 
          jobData.status === 'pending' && 
          !jobData.assignedStaffId;
        
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
        
        if (isAssignedToUser || isUnassignedOperationalJob) {
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
          
          if (isUnassignedOperationalJob) {
            console.log('✅ Unassigned operational job - accessible to all cleaners');
          }
          
          setJob({ id: jobDoc.id, ...processedJobData } as unknown as Job);
          setPhotos(jobData.photos || []);
        } else {
          console.warn('❌ Access denied - job assignment mismatch:', {
            jobData: { 
              assignedTo: jobData.assignedTo, 
              userId: jobData.userId, 
              staffId: jobData.staffId,
              assignedStaffId: jobData.assignedStaffId,
              assignedStaffDocId: jobData.assignedStaffDocId,
              status: jobData.status
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
        console.error('❌ Job not found in either collection:', id);
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

  const handleAcceptJob = async () => {
    if (!job || !user?.id) return;

    try {
      const response = await jobService.acceptJob({
        jobId: job.id,
        staffId: user.id,
        acceptedAt: new Date()
      });
      
      if (response.success) {
        setJob(prev => prev ? { ...prev, status: 'accepted', acceptedAt: new Date() } : null);
        Alert.alert('Success', 'Job accepted successfully! You can now start the job when you\'re ready.');
      } else {
        Alert.alert('Error', response.error || 'Failed to accept job');
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      Alert.alert('Error', 'Failed to accept job');
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
                router.replace('/(tabs)' as any);
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

  // Collapsible Card Component
  const CollapsibleCard = ({ 
    title, 
    icon, 
    sectionKey, 
    children,
    badge 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    sectionKey: keyof typeof expandedSections; 
    children: React.ReactNode;
    badge?: string;
  }) => {
    const isExpanded = expandedSections[sectionKey];
    const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [isExpanded]);

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            {icon}
            <Text style={styles.collapsibleTitle}>{title}</Text>
            {badge && (
              <View style={styles.collapsibleBadge}>
                <Text style={styles.collapsibleBadgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="chevron-down" size={20} color={BrandTheme.colors.YELLOW} />
          </Animated.View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.collapsibleContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  // Flashing Accept Button Component
  const FlashingAcceptButton = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();
      
      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    }, []);

    return (
      <View style={styles.flashingButtonContainer}>
        {/* Multiple glow layers for intense effect */}
        <Animated.View
          style={[
            styles.flashingButtonGlow1,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.flashingButtonGlow2,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [0.3, 0.6],
              }),
              transform: [{ 
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: [1.1, 1.2],
                }),
              }],
            },
          ]}
        />
        
        <TouchableOpacity
          style={styles.flashingButton}
          onPress={handleAcceptJob}
        >
          <Animated.View
            style={[
              styles.flashingButtonGradient,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <CheckCircle size={22} color={BrandTheme.colors.BLACK} />
            <Text style={styles.flashingButtonText}>ACCEPT JOB</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
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
                    <Text style={styles.detailValue}>
                      {typeof job.bookingRef === 'object' 
                        ? (job.bookingRef as any).confirmationCode || (job.bookingRef as any).id || JSON.stringify(job.bookingRef)
                        : job.bookingRef
                      }
                    </Text>
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

        {/* Property Details Card - Collapsible */}
        {(job as any).propertyRef && (
          <CollapsibleCard
            title="Property Details"
            icon={<Building size={20} color={BrandTheme.colors.YELLOW} />}
            sectionKey="propertyDetails"
          >
            <View style={styles.propertyDetailsGrid}>
              {(job as any).propertyRef.type && (
                <View style={styles.propertyDetail}>
                  <Text style={styles.propertyDetailLabel}>Type:</Text>
                  <Text style={styles.propertyDetailValue}>
                    {(job as any).propertyRef.type.charAt(0).toUpperCase() + (job as any).propertyRef.type.slice(1)}
                  </Text>
                </View>
              )}
              {(job as any).propertyRef.bedrooms && (
                <View style={styles.propertyDetail}>
                  <Text style={styles.propertyDetailLabel}>Bedrooms:</Text>
                  <Text style={styles.propertyDetailValue}>{(job as any).propertyRef.bedrooms}</Text>
                </View>
              )}
              {(job as any).propertyRef.bathrooms && (
                <View style={styles.propertyDetail}>
                  <Text style={styles.propertyDetailLabel}>Bathrooms:</Text>
                  <Text style={styles.propertyDetailValue}>{(job as any).propertyRef.bathrooms}</Text>
                </View>
              )}
              {(job as any).propertyRef.size && (
                <View style={styles.propertyDetail}>
                  <Text style={styles.propertyDetailLabel}>Size:</Text>
                  <Text style={styles.propertyDetailValue}>{(job as any).propertyRef.size}</Text>
                </View>
              )}
            </View>
          </CollapsibleCard>
        )}

        {/* Payment Information - Collapsible */}
        {(job as any).compensation && (
          <CollapsibleCard
            title="Payment"
            icon={<Text style={styles.paymentIcon}>💰</Text>}
            sectionKey="payment"
          >
            <View style={styles.paymentContent}>
              <Text style={styles.paymentAmount}>
                {(job as any).compensation.amount?.toLocaleString()} {(job as any).compensation.currency || 'THB'}
              </Text>
              {(job as any).compensation.paymentMethod && (
                <Text style={styles.paymentDetail}>
                  Via {(job as any).compensation.paymentMethod.replace('_', ' ')}
                </Text>
              )}
              {(job as any).compensation.paymentTiming && (
                <Text style={styles.paymentDetail}>
                  Paid {(job as any).compensation.paymentTiming === 'completion' ? 'upon completion' : (job as any).compensation.paymentTiming}
                </Text>
              )}
            </View>
          </CollapsibleCard>
        )}

        {/* Interactive Checklist - Collapsible */}
        {(job as any).checklist && (job as any).checklist.length > 0 && (
          <CollapsibleCard
            title="Checklist"
            icon={<CheckCircle size={20} color={BrandTheme.colors.YELLOW} />}
            sectionKey="checklist"
            badge={`${(job as any).checklist.filter((item: any) => item.completed).length}/${(job as any).checklist.length}`}
          >
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((job as any).checklist.filter((item: any) => item.completed).length / (job as any).checklist.length) * 100}%` }
                ]} 
              />
            </View>

            {/* Checklist Items */}
            <View style={styles.checklistItems}>
              {(job as any).checklist.map((item: any, index: number) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.checklistItem}
                  onPress={() => {
                    // Toggle checklist item
                    const updatedChecklist = [...(job as any).checklist];
                    updatedChecklist[index].completed = !updatedChecklist[index].completed;
                    setJob({ ...job, checklist: updatedChecklist } as any);
                    // TODO: Sync to Firebase
                  }}
                >
                  <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                    {item.task}
                  </Text>
                  {item.required && (
                    <Text style={styles.requiredBadge}>Required</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </CollapsibleCard>
        )}

        {/* Issues to Check - Collapsible */}
        {(job as any).issuesReported && (job as any).issuesReported.length > 0 && (
          <CollapsibleCard
            title="Issues to Check"
            icon={<AlertTriangle size={20} color={BrandTheme.colors.WARNING} />}
            sectionKey="issues"
            badge={`${(job as any).issuesReported.length}`}
          >
            {(job as any).issuesReported.map((issue: any, index: number) => (
              <View key={index} style={styles.issueItem}>
                <View style={styles.issueHeader}>
                  <View style={[styles.severityBadge, { 
                    backgroundColor: issue.severity === 'high' ? '#ff4444' : 
                                    issue.severity === 'medium' ? '#ff9800' : '#ffc107'
                  }]}>
                    <Text style={styles.severityText}>
                      {issue.severity?.toUpperCase() || 'LOW'}
                    </Text>
                  </View>
                  <Text style={styles.issueStatus}>{issue.status || 'Needs inspection'}</Text>
                </View>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                {issue.reportedBy && (
                  <Text style={styles.issueReportedBy}>Reported by: {issue.reportedBy}</Text>
                )}
              </View>
            ))}
          </CollapsibleCard>
        )}

        {/* Contact Information - Collapsible */}
        {(job as any).contacts && (
          <CollapsibleCard
            title="Contact Information"
            icon={<Phone size={20} color={BrandTheme.colors.YELLOW} />}
            sectionKey="contacts"
          >
            {/* Property Manager */}
            {(job as any).contacts.propertyManager && (
              <View style={styles.contactCard}>
                <Text style={styles.contactRole}>Property Manager</Text>
                <Text style={styles.contactName}>{(job as any).contacts.propertyManager.name}</Text>
                {(job as any).contacts.propertyManager.availability && (
                  <Text style={styles.contactAvailability}>
                    Available: {(job as any).contacts.propertyManager.availability}
                  </Text>
                )}
                <View style={styles.contactButtons}>
                  {(job as any).contacts.propertyManager.phone && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`tel:${(job as any).contacts.propertyManager.phone}`)}
                    >
                      <Phone size={16} color={BrandTheme.colors.BLACK} />
                      <Text style={styles.contactButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {(job as any).contacts.propertyManager.email && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`mailto:${(job as any).contacts.propertyManager.email}`)}
                    >
                      <Text style={styles.contactButtonText}>✉️ Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Emergency Contact */}
            {(job as any).contacts.emergencyContact && (
              <View style={[styles.contactCard, styles.emergencyContactCard]}>
                <Text style={styles.emergencyLabel}>🚨 EMERGENCY (24/7)</Text>
                <Text style={styles.contactName}>{(job as any).contacts.emergencyContact.name}</Text>
                <TouchableOpacity 
                  style={[styles.contactButton, styles.emergencyButton]}
                  onPress={() => Linking.openURL(`tel:${(job as any).contacts.emergencyContact.phone}`)}
                >
                  <Phone size={18} color="#fff" />
                  <Text style={styles.emergencyButtonText}>
                    {(job as any).contacts.emergencyContact.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Maintenance Team */}
            {(job as any).contacts.maintenanceTeam && (
              <View style={styles.contactCard}>
                <Text style={styles.contactRole}>Maintenance Team</Text>
                <Text style={styles.contactName}>{(job as any).contacts.maintenanceTeam.name}</Text>
                <View style={styles.contactButtons}>
                  {(job as any).contacts.maintenanceTeam.phone && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`tel:${(job as any).contacts.maintenanceTeam.phone}`)}
                    >
                      <Phone size={16} color={BrandTheme.colors.BLACK} />
                      <Text style={styles.contactButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {(job as any).contacts.maintenanceTeam.email && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`mailto:${(job as any).contacts.maintenanceTeam.email}`)}
                    >
                      <Text style={styles.contactButtonText}>✉️ Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </CollapsibleCard>
        )}

        {/* Guest Information - Collapsible */}
        {((job as any).guestName || (job as any).guestContact || (job as any).guestNationality) && (
          <CollapsibleCard
            title="Guest Information"
            icon={<User size={20} color={BrandTheme.colors.YELLOW} />}
            sectionKey="guestInfo"
          >
            {(job as any).guestName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{(job as any).guestName}</Text>
              </View>
            )}
            {(job as any).guestCount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guests:</Text>
                <Text style={styles.detailValue}>{(job as any).guestCount} people</Text>
              </View>
            )}
            {(job as any).guestNationality && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nationality:</Text>
                <Text style={styles.detailValue}>{(job as any).guestNationality}</Text>
              </View>
            )}
            {(job as any).guestContact && (
              <TouchableOpacity 
                style={styles.guestContactButton}
                onPress={() => Linking.openURL(`tel:${(job as any).guestContact}`)}
              >
                <Phone size={16} color={BrandTheme.colors.BLACK} />
                <Text style={styles.guestContactText}>{(job as any).guestContact}</Text>
              </TouchableOpacity>
            )}
          </CollapsibleCard>
        )}

        {/* Required Supplies & Equipment - Collapsible */}
        {(((job as any).requiredSupplies && (job as any).requiredSupplies.length > 0) || 
          ((job as any).equipmentNeeded && (job as any).equipmentNeeded.length > 0)) && (
          <CollapsibleCard
            title="Bring With You"
            icon={<Text style={styles.paymentIcon}>🧰</Text>}
            sectionKey="supplies"
          >
            {(job as any).equipmentNeeded && (job as any).equipmentNeeded.length > 0 && (
              <View style={styles.suppliesSection}>
                <Text style={styles.suppliesSectionTitle}>Equipment:</Text>
                {(job as any).equipmentNeeded.map((item: string, index: number) => (
                  <Text key={index} style={styles.supplyItem}>• {item}</Text>
                ))}
              </View>
            )}

            {(job as any).requiredSupplies && (job as any).requiredSupplies.length > 0 && (
              <View style={styles.suppliesSection}>
                <Text style={styles.suppliesSectionTitle}>Supplies to Restock:</Text>
                {(job as any).requiredSupplies.slice(0, 5).map((item: string, index: number) => (
                  <Text key={index} style={styles.supplyItem}>• {item}</Text>
                ))}
                {(job as any).requiredSupplies.length > 5 && (
                  <Text style={styles.supplyMore}>
                    + {(job as any).requiredSupplies.length - 5} more items
                  </Text>
                )}
              </View>
            )}
          </CollapsibleCard>
        )}

        {/* Safety Notes - Collapsible */}
        {(job as any).safetyNotes && (job as any).safetyNotes.length > 0 && (
          <CollapsibleCard
            title="Safety Guidelines"
            icon={<AlertTriangle size={20} color={BrandTheme.colors.WARNING} />}
            sectionKey="safety"
            badge={`${(job as any).safetyNotes.length}`}
          >
            {(job as any).safetyNotes.map((note: string, index: number) => (
              <View key={index} style={styles.safetyNoteItem}>
                <Text style={styles.safetyNoteBullet}>⚠️</Text>
                <Text style={styles.safetyNoteText}>{note}</Text>
              </View>
            ))}
          </CollapsibleCard>
        )}

        {/* Required Skills */}
        {/* Required Skills - Collapsible */}
        {(job as any).requiredSkills && (job as any).requiredSkills.length > 0 && (
          <CollapsibleCard
            title="Required Skills"
            icon={<Text style={styles.paymentIcon}>✓</Text>}
            sectionKey="skills"
            badge={`${(job as any).requiredSkills.length}`}
          >
            <View style={styles.skillsContainer}>
              {(job as any).requiredSkills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </CollapsibleCard>
        )}
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {(job.status === 'pending' || job.status === 'assigned') && (
            <FlashingAcceptButton />
          )}

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
  // Property Details
  propertyDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandTheme.spacing.MD,
    marginTop: BrandTheme.spacing.SM,
  },
  propertyDetail: {
    flex: 1,
    minWidth: '45%',
    padding: BrandTheme.spacing.SM,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  propertyDetailLabel: {
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  propertyDetailValue: {
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  // Payment Information
  paymentIcon: {
    fontSize: 20,
    marginRight: BrandTheme.spacing.SM,
  },
  paymentContent: {
    alignItems: 'center',
    marginTop: BrandTheme.spacing.LG,
    padding: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 2,
    borderColor: BrandTheme.colors.YELLOW,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandTheme.colors.YELLOW,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    marginBottom: BrandTheme.spacing.SM,
  },
  paymentDetail: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginTop: 4,
  },
  // Interactive Checklist
  checklistProgress: {
    marginLeft: 'auto',
    fontSize: 14,
    color: BrandTheme.colors.YELLOW,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    marginVertical: BrandTheme.spacing.MD,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandTheme.colors.YELLOW,
  },
  checklistItems: {
    gap: BrandTheme.spacing.SM,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
    padding: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: BrandTheme.colors.BORDER,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BrandTheme.colors.YELLOW,
    borderColor: BrandTheme.colors.YELLOW,
  },
  checkmark: {
    fontSize: 16,
    color: BrandTheme.colors.BLACK,
    fontWeight: 'bold',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: BrandTheme.colors.TEXT_SECONDARY,
  },
  requiredBadge: {
    fontSize: 10,
    color: BrandTheme.colors.WARNING,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 1,
    borderColor: BrandTheme.colors.WARNING,
  },
  // Issues Section
  issueItem: {
    padding: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    marginTop: BrandTheme.spacing.SM,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.SM,
  },
  severityBadge: {
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  issueStatus: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  issueDescription: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginBottom: BrandTheme.spacing.SM,
    lineHeight: 20,
  },
  issueReportedBy: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontStyle: 'italic',
  },
  // Contact Cards
  contactCard: {
    padding: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    marginTop: BrandTheme.spacing.MD,
  },
  emergencyContactCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#f44336',
    borderWidth: 2,
  },
  contactRole: {
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emergencyLabel: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    marginBottom: BrandTheme.spacing.SM,
  },
  contactName: {
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    marginBottom: BrandTheme.spacing.SM,
  },
  contactAvailability: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginBottom: BrandTheme.spacing.MD,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: BrandTheme.spacing.SM,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BrandTheme.spacing.SM,
    padding: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.YELLOW,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  emergencyButton: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  // Guest Information
  guestContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    padding: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.YELLOW,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
    marginTop: BrandTheme.spacing.MD,
    justifyContent: 'center',
  },
  guestContactText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  // Supplies & Equipment
  suppliesSection: {
    marginTop: BrandTheme.spacing.MD,
  },
  suppliesSectionTitle: {
    fontSize: 13,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: BrandTheme.spacing.SM,
  },
  supplyItem: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginVertical: 2,
    lineHeight: 20,
  },
  supplyMore: {
    fontSize: 13,
    color: BrandTheme.colors.YELLOW,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginTop: BrandTheme.spacing.SM,
    fontStyle: 'italic',
  },
  // Safety Notes
  safetyNoteItem: {
    flexDirection: 'row',
    gap: BrandTheme.spacing.SM,
    padding: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    marginTop: BrandTheme.spacing.SM,
  },
  safetyNoteBullet: {
    fontSize: 18,
  },
  safetyNoteText: {
    flex: 1,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    lineHeight: 20,
  },
  // Required Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandTheme.spacing.SM,
    marginTop: BrandTheme.spacing.SM,
  },
  skillBadge: {
    paddingHorizontal: BrandTheme.spacing.MD,
    paddingVertical: BrandTheme.spacing.SM,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
  },
  skillText: {
    fontSize: 12,
    color: BrandTheme.colors.YELLOW,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
  },
  // Collapsible Card Styles
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  collapsibleBadge: {
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: 4,
    backgroundColor: BrandTheme.colors.YELLOW,
    borderRadius: 12,
  },
  collapsibleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  collapsibleContent: {
    padding: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.SURFACE_1,
  },
  // Flashing Accept Button Styles
  flashingButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: BrandTheme.spacing.LG,
  },
  flashingButtonGlow1: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 16,
    backgroundColor: BrandTheme.colors.YELLOW,
    shadowColor: BrandTheme.colors.YELLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  flashingButtonGlow2: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 24,
    backgroundColor: BrandTheme.colors.YELLOW,
    shadowColor: BrandTheme.colors.YELLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 25,
  },
  flashingButton: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: BrandTheme.colors.YELLOW,
    shadowColor: BrandTheme.colors.YELLOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  flashingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  flashingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
