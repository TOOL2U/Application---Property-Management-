/**
 * Active Jobs View Component - Redesigned
 * Shows all accepted jobs for the staff user with modern design and proper service integration
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';
import type { JobAssignment } from '@/types/jobAssignment';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  User,
  Building,
  ArrowLeft,
} from 'lucide-react-native';

export default function ActiveJobsView() {
  const { currentProfile, isLoading: authLoading } = usePINAuth();

  // Early return if auth is still loading
  if (authLoading || !currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C6FF00" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // State management
  const [activeJobs, setActiveJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Load active jobs function
  const loadActiveJobs = async () => {
    if (!currentProfile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 ActiveJobsView: Loading active jobs for staff:', currentProfile.id);
      
      const response = await jobAssignmentService.getStaffJobs(currentProfile.id);
      
      if (response.success) {
        // Filter for active jobs (accepted and in_progress)
        const activeJobsOnly = response.jobs.filter(job => 
          ['accepted', 'in_progress'].includes(job.status)
        );
        setActiveJobs(activeJobsOnly);
        setError(null);
        console.log(`✅ ActiveJobsView: Loaded ${activeJobsOnly.length} active jobs`);
      } else {
        setError(response.error || 'Failed to load jobs');
        console.error('❌ ActiveJobsView: Failed to load jobs:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ ActiveJobsView: Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    await loadActiveJobs();
    setRefreshing(false);
  };

  // Load jobs on component mount and when profile changes
  useEffect(() => {
    loadActiveJobs();
  }, [currentProfile?.id]);

  // Navigation functions
  const openMaps = (job: JobAssignment) => {
    if (job.location.coordinates) {
      const { latitude, longitude } = job.location.coordinates;
      const urls = {
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}`,
        web: `https://maps.google.com/?q=${latitude},${longitude}`
      };
      
      const url = Platform.select(urls) || urls.web;
      Linking.openURL(url).catch(() => {
        Linking.openURL(urls.web);
      });
    } else if (job.location.address) {
      const address = `${job.location.address}, ${job.location.city}, ${job.location.state}`;
      const encodedAddress = encodeURIComponent(address);
      
      const urls = {
        ios: `http://maps.apple.com/?q=${encodedAddress}`,
        android: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        web: `https://maps.google.com/?q=${encodedAddress}`
      };
      
      const url = Platform.select(urls) || urls.web;
      Linking.openURL(url);
    } else {
      Alert.alert('Navigation Error', 'No location information available for this job.');
    }
  };

  const handleStartJob = async (job: JobAssignment) => {
    try {
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: currentProfile?.id || '',
        status: 'in_progress'
      });
      
      if (response.success) {
        Alert.alert('Success', 'Job started successfully!');
        await loadActiveJobs();
      } else {
        Alert.alert('Error', response.error || 'Failed to start job');
      }
    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert('Error', 'Failed to start job. Please try again.');
    }
  };

  const handleCompleteJob = async (job: JobAssignment) => {
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
              const response = await jobAssignmentService.updateJobStatus({
                jobId: job.id,
                staffId: currentProfile?.id || '',
                status: 'completed'
              });
              
              if (response.success) {
                Alert.alert('Success', 'Job completed successfully!');
                await loadActiveJobs();
              } else {
                Alert.alert('Error', response.error || 'Failed to complete job');
              }
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'Failed to complete job. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderJobCard = (job: JobAssignment) => {
    const isExpanded = expandedJob === job.id;

    return (
      <View key={job.id} style={styles.jobCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          {/* Job Header */}
          <TouchableOpacity
            style={styles.jobHeader}
            onPress={() => setExpandedJob(isExpanded ? null : job.id)}
          >
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.jobMeta}>
                <Clock size={14} color="#a1a1aa" />
                <Text style={styles.scheduleText}>
                  {job.scheduledFor?.toDate()?.toLocaleDateString() || 'Not scheduled'}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {job.status === 'accepted' ? '⏳ Ready to Start' : '🔄 In Progress'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {job.description || 'No description provided'}
                </Text>
              </View>

              {/* Location */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.addressText}>
                  {job.location.address}, {job.location.city}, {job.location.state}
                </Text>
                {job.location.accessCode && (
                  <Text style={styles.accessCode}>
                    Access Code: {job.location.accessCode}
                  </Text>
                )}
              </View>

              {/* Contact Information */}
              {job.bookingDetails?.contactInfo && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Contact</Text>
                  {job.bookingDetails.contactInfo.phone && (
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`tel:${job.bookingDetails?.contactInfo?.phone}`)}
                    >
                      <Phone size={16} color="#22c55e" />
                      <Text style={styles.contactText}>
                        {job.bookingDetails.contactInfo.phone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {/* Navigation Button */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.navigationButton]}
                  onPress={() => openMaps(job)}
                >
                  <Navigation size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Navigate</Text>
                </TouchableOpacity>

                {/* Start/Complete Button */}
                {job.status === 'accepted' ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => handleStartJob(job)}
                  >
                    <Play size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Start Job</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteJob(job)}
                  >
                    <CheckCircle size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f0f23', '#1a1a3e']} style={styles.backgroundGradient} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading active jobs...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0f23', '#1a1a3e']} style={styles.backgroundGradient} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Jobs</Text>
          <Text style={styles.jobCount}>{activeJobs.length} jobs</Text>
        </View>

        {/* Jobs List */}
        <ScrollView
          style={styles.jobsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshJobs} tintColor="#8b5cf6" />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={64} color="#4b5563" />
              <Text style={styles.emptyTitle}>No Active Jobs</Text>
              <Text style={styles.emptyDescription}>
                You don't have any active jobs at the moment. Check back later or refresh to see if new jobs are available.
              </Text>
            </View>
          ) : (
            activeJobs.map(job => renderJobCard(job))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobCount: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
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
  cardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobHeader: {
    padding: 16,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#a1a1aa',
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  accessCode: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  contactText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigationButton: {
    backgroundColor: '#3b82f6',
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  completeButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});
