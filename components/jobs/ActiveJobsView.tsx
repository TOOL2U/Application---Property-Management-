/**
 * Active Jobs View Component
 * Shows all accepted jobs for the staff user with Google Maps integration and photo upload
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { jobService } from '@/services/jobService';
import type { Job } from '@/types/job';
import {
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
  ExternalLink,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ActiveJobsView() {
  const { currentProfile } = usePINAuth();

  // Use the enhanced staff jobs hook with filtering for active jobs
  const {
    activeJobs,
    loading: isLoading,
    refreshing,
    error,
    refreshJobs,
    startJob,
    completeJob,
    clearError,
  } = useStaffJobs({
    filters: { status: ['accepted', 'in_progress'] },
    enableRealtime: true,
    enableCache: true,
  });

  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<string | null>(null);
  const [completingJob, setCompletingJob] = useState<string | null>(null);

  // Show error alert when error occurs
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const openMaps = (job: Job) => {
    const address = `${job.location.address}, ${job.location.city}, ${job.location.state} ${job.location.zipCode}`;
    const encodedAddress = encodeURIComponent(address);

    if (Platform.OS === 'ios') {
      // Open Apple Maps
      const url = `http://maps.apple.com/?q=${encodedAddress}`;
      Linking.openURL(url);
    } else {
      // Open Google Maps
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(url);
    }
  };

  const pickImages = async (jobId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        setUploadingPhotos(jobId);
        
        // Convert assets to base64 or upload to storage
        const photoUrls = result.assets.map(asset => asset.uri);
        
        const response = await jobService.uploadJobPhotos(jobId, photoUrls);
        
        if (response.success) {
          Alert.alert('Success', 'Photos uploaded successfully!');
          await loadActiveJobs(); // Refresh to show updated photos
        } else {
          Alert.alert('Error', response.error || 'Failed to upload photos');
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    } finally {
      setUploadingPhotos(null);
    }
  };

  const handleCompleteJob = async (job: Job) => {
    if (!job.photos || job.photos.length === 0) {
      Alert.alert(
        'Photos Required',
        'Please upload at least one photo before completing the job.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Job',
      `Are you sure you want to mark "${job.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              setCompletingJob(job.id);

              const success = await completeJob(job.id, 'Job completed by staff member');

              if (success) {
                Alert.alert('Success', 'Job completed successfully!');
              } else {
                Alert.alert('Error', 'Failed to complete job. Please try again.');
              }
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'Failed to complete job. Please try again.');
            } finally {
              setCompletingJob(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const renderJobCard = (job: Job) => {
    const isExpanded = expandedJob === job.id;
    const hasPhotos = job.photos && job.photos.length > 0;

    return (
      <View key={job.id} style={styles.jobCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.jobCardGradient}
        >
          {/* Job Header */}
          <TouchableOpacity
            style={styles.jobHeader}
            onPress={() => setExpandedJob(isExpanded ? null : job.id)}
          >
            <View style={styles.jobTitleSection}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.statusBadges}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Property Information */}
            <View style={styles.propertySection}>
              <View style={styles.propertyRow}>
                <Building size={16} color="#8b5cf6" />
                <Text style={styles.propertyName} numberOfLines={1}>
                  {job.location.address}
                </Text>
              </View>
              <Text style={styles.propertyAddress}>
                {job.location.city}, {job.location.state} {job.location.zipCode}
              </Text>
            </View>

            {/* Schedule */}
            <View style={styles.scheduleSection}>
              <Clock size={16} color="#8b5cf6" />
              <Text style={styles.scheduleText}>{formatDate(job.scheduledDate)}</Text>
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Job Description</Text>
                <Text style={styles.descriptionText}>
                  {job.description || job.specialInstructions || 'No description provided'}
                </Text>
              </View>

              {/* Contact Information */}
              {job.contacts && job.contacts.length > 0 && (
                <View style={styles.contactSection}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  {job.contacts.map((contact, index) => (
                    <View key={index} style={styles.contactItem}>
                      <View style={styles.contactInfo}>
                        <User size={16} color="#8b5cf6" />
                        <Text style={styles.contactName}>{contact.name} ({contact.role})</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.phoneButton}
                        onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                      >
                        <Phone size={16} color="#22c55e" />
                        <Text style={styles.phoneText}>{contact.phone}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Photos Section */}
              <View style={styles.photosSection}>
                <View style={styles.photosSectionHeader}>
                  <Text style={styles.sectionTitle}>Completion Photos</Text>
                  <Text style={styles.photosCount}>
                    {hasPhotos ? `${job.photos.length} photo${job.photos.length > 1 ? 's' : ''}` : 'No photos'}
                  </Text>
                </View>

                {hasPhotos && (
                  <ScrollView horizontal style={styles.photosScroll} showsHorizontalScrollIndicator={false}>
                    {job.photos.map((photo, index) => (
                      <Image key={index} source={{ uri: photo }} style={styles.photoThumbnail} />
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImages(job.id)}
                  disabled={uploadingPhotos === job.id}
                >
                  <Camera size={18} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>
                    {uploadingPhotos === job.id ? 'Uploading...' : 'Add Photos'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.mapsButton}
                  onPress={() => openMaps(job)}
                >
                  <Navigation size={18} color="#ffffff" />
                  <Text style={styles.mapsButtonText}>Go to Job</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    (!hasPhotos || completingJob === job.id) && styles.completeButtonDisabled
                  ]}
                  onPress={() => handleCompleteJob(job)}
                  disabled={!hasPhotos || completingJob === job.id}
                >
                  <LinearGradient
                    colors={hasPhotos ? ['#22c55e', '#16a34a'] : ['#6b7280', '#4b5563']}
                    style={styles.completeButtonGradient}
                  >
                    <CheckCircle size={18} color="#ffffff" />
                    <Text style={styles.completeButtonText}>
                      {completingJob === job.id ? 'Completing...' : 'Complete Job'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Jobs</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{activeJobs.length}</Text>
          </View>
        </View>

        {/* Jobs List */}
        <ScrollView
          style={styles.jobsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshJobs}
              tintColor="#C6FF00"
              colors={['#C6FF00']}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading active jobs...</Text>
            </View>
          ) : activeJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Play size={64} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>No Active Jobs</Text>
              <Text style={styles.emptyStateText}>
                You don't have any active jobs at the moment. Accept jobs from the dashboard to see them here.
              </Text>
            </View>
          ) : (
            activeJobs.map(renderJobCard)
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  jobCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobHeader: {
    padding: 16,
  },
  jobTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  propertySection: {
    marginBottom: 12,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 24,
  },
  scheduleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactItem: {
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 24,
  },
  phoneText: {
    fontSize: 14,
    color: '#22c55e',
    textDecorationLine: 'underline',
  },
  photosSection: {
    marginBottom: 16,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photosCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  photosScroll: {
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  completeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});
