/**
 * Enhanced Staff Jobs View Component
 * Integrates with the new job assignment system for real-time job management
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useAppNotifications } from "@/contexts/AppNotificationContext";
import { FirebaseNotificationService } from '@/lib/firebase';
import { pushNotificationService } from '@/services/pushNotificationService';
import * as Notifications from 'expo-notifications';
import type { JobAssignment } from '@/types/jobAssignment';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';
import JobAcceptanceModal from '@/components/jobs/JobAcceptanceModal';
import ActiveJobsView from '@/components/jobs/ActiveJobsView';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function EnhancedStaffJobsView() {
  const { currentProfile } = usePINAuth();
  const { refreshNotifications } = useAppNotifications();
  const router = useRouter();
  
  const [pendingJobs, setPendingJobs] = useState<JobAssignment[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobAssignment[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Pending'); // Default to Pending to show newly assigned jobs
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (currentProfile?.id) {
      loadJobsAndSetupListeners();
    }

    return () => {
      jobAssignmentService.cleanup();
    };
  }, [currentProfile?.id]);

  const loadJobsAndSetupListeners = async () => {
    if (!currentProfile?.id) return;

    try {
      // Import the Firebase UID service
      const { firebaseUidService } = await import('@/services/firebaseUidService');
      
      // Get Firebase UID for the current profile
      const firebaseUid = await firebaseUidService.getFirebaseUid(currentProfile.id);
      
      if (firebaseUid) {
        console.log('🔍 MOBILE DEBUG: Setting up listeners for Firebase UID:', firebaseUid);
        
        // Initialize push notifications
        try {
          await pushNotificationService.initialize(currentProfile.id);
          console.log('✅ Push notifications initialized for staff:', currentProfile.id);
        } catch (error) {
          console.error('❌ Failed to initialize push notifications:', error);
        }
        
        // Load jobs
        await loadJobs();
        
        // Setup real-time job listeners
        setupRealTimeListeners(firebaseUid);
        
        // Setup notification listeners
        setupNotificationListener(firebaseUid);
      } else {
        console.error('❌ MOBILE DEBUG: No Firebase UID found for profile:', currentProfile.id);
        // Fallback to using profile ID directly
        await loadJobs();
        setupRealTimeListeners(currentProfile.id);
      }
    } catch (error) {
      console.error('❌ MOBILE DEBUG: Error setting up listeners:', error);
      // Fallback
      await loadJobs();
      setupRealTimeListeners(currentProfile.id);
    }
  };

  const loadJobs = async () => {
    if (!currentProfile?.id) return;

    try {
      setIsLoading(true);
      console.log('🔄 EnhancedStaffJobsView: Loading jobs for staff:', currentProfile.id);
      
      const response = await jobAssignmentService.getStaffJobs(currentProfile.id);
      
      console.log('📥 EnhancedStaffJobsView: Job service response:', {
        success: response.success,
        jobCount: response.jobs?.length || 0,
        jobs: response.jobs?.map(j => ({ id: j.id, title: j.title, status: j.status })) || []
      });
      
      if (response.success) {
        categorizeJobs(response.jobs);
      }
    } catch (error) {
      console.error('❌ EnhancedStaffJobsView: Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeListeners = (staffIdOrFirebaseUid: string) => {
    if (!staffIdOrFirebaseUid) return;

    jobAssignmentService.subscribeToStaffJobs(
      staffIdOrFirebaseUid,
      (jobs) => {
        console.log('📱 Real-time jobs update:', jobs.length);
        categorizeJobs(jobs);
      }
    );
  };

  const setupNotificationListener = (firebaseUid: string) => {
    console.log('🔔 MOBILE DEBUG: Setting up notification listener for Firebase UID:', firebaseUid);
    
    FirebaseNotificationService.listenToNotifications(
      firebaseUid,
      async (notifications) => {
        console.log('📱 MOBILE DEBUG: Real-time notifications update:', notifications.length, 'notifications received');
        
        setNotifications(notifications);
        
        // Count unread notifications
        const unreadCount = notifications.filter(notification => !notification.read).length;
        setNotificationCount(unreadCount);
        console.log('🔔 MOBILE DEBUG: Unread notifications:', unreadCount);
        
        // Refresh the AppNotifications context to update the notifications tab
        refreshNotifications();
        
        // Show alert for new job assignments
        const newJobNotifications = notifications.filter(
          notification => !notification.read && notification.type === 'job_assigned'
        );
        
        if (newJobNotifications.length > 0) {
          const latestJob = newJobNotifications[0];
          
          try {
            // Schedule local notification with sound for immediate alert
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🔔 New Job Assignment!',
                body: `Job: ${latestJob.jobTitle || 'New Job'}\nProperty: ${latestJob.propertyName || 'Unknown Property'}`,
                sound: 'default',
                data: { 
                  jobId: latestJob.jobId,
                  type: 'job_assignment'
                },
              },
              trigger: null, // Show immediately
            });
          } catch (error) {
            console.error('Failed to schedule notification:', error);
          }
          
          // Also show alert dialog
          Alert.alert(
            '🔔 New Job Assignment!',
            `Job: ${latestJob.jobTitle || 'New Job'}\nProperty: ${latestJob.propertyName || 'Unknown Property'}\n\nCheck the Pending tab to view details.`,
            [
              { text: 'View Jobs', style: 'default' },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      }
    );
  };

  const categorizeJobs = (jobs: JobAssignment[]) => {
    const pending = jobs.filter(job => job.status === 'assigned');
    const active = jobs.filter(job => ['accepted', 'in_progress'].includes(job.status));
    const completed = jobs.filter(job => job.status === 'completed');

    setPendingJobs(pending);
    setActiveJobs(active);
    setCompletedJobs(completed);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleJobPress = (job: JobAssignment) => {
    console.log('🔄 EnhancedStaffJobsView: Job pressed:', {
      id: job.id,
      status: job.status,
      title: job.title
    });
    
    if (job.status === 'assigned') {
      console.log('✅ EnhancedStaffJobsView: Opening acceptance modal for job:', job.id);
      setSelectedJob(job);
      setShowAcceptanceModal(true);
    } else {
      // Navigate to job details
      // Fix: Type assertion for dynamic route
      router.push(`/job-details/${job.id}` as any);
    }
  };

  const handleJobUpdated = (updatedJob: JobAssignment) => {
    // Real-time listener will handle the update
    console.log('Job updated:', updatedJob.id, updatedJob.status);
  };

  const handleStartJob = async (job: JobAssignment) => {
    try {
      const response = await jobAssignmentService.updateJobStatus({
        jobId: job.id,
        staffId: currentProfile?.id || '',
        status: 'in_progress',
        startedAt: new Date()
      });

      if (response.success) {
        Alert.alert('Job Started', 'You have started working on this job.');
      } else {
        Alert.alert('Error', response.error || 'Failed to start job');
      }
    } catch (error) {
      console.error('Error starting job:', error);
      Alert.alert('Error', 'Failed to start job. Please try again.');
    }
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
      case 'assigned': return '#6b7280';
      case 'accepted': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderJobCard = (job: JobAssignment) => (
    <TouchableOpacity
      key={job.id}
      style={styles.jobCard}
      onPress={() => handleJobPress(job)}
      activeOpacity={0.8}
    >
      <View style={styles.jobCardGradient}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.jobDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#C6FF00" />
            <Text style={styles.jobDetailText}>{formatDate(job.scheduledFor)}</Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <Ionicons name="time-outline" size={16} color="#C6FF00" />
            <Text style={styles.jobDetailText}>{job.estimatedDuration} min</Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <Ionicons name="location-outline" size={16} color="#C6FF00" />
            <Text style={styles.jobDetailText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
        </View>

        {/* Job Actions */}
        <View style={styles.jobActions}>
          {job.status === 'assigned' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleJobPress(job)}
            >
              <View style={styles.actionButtonGradient}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#0B0F1A" />
                <Text style={styles.actionButtonText}>Review & Accept</Text>
              </View>
            </TouchableOpacity>
          )}

          {job.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStartJob(job)}
            >
              <View style={styles.actionButtonGradient}>
                <Ionicons name="play-outline" size={16} color="#0B0F1A" />
                <Text style={styles.actionButtonText}>Start Job</Text>
              </View>
            </TouchableOpacity>
          )}

          {job.status === 'in_progress' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/job-details/${job.id}` as any)}
            >
              <View style={styles.actionButtonGradient}>
                <Ionicons name="camera-outline" size={16} color="#0B0F1A" />
                <Text style={styles.actionButtonText}>Update Progress</Text>
              </View>
            </TouchableOpacity>
          )}

          {job.status === 'completed' && (
            <View style={styles.completedButton}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.completedButtonText}>Completed</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getFilteredJobs = () => {
    switch (selectedFilter) {
      case 'Pending': return pendingJobs;
      case 'Active': return activeJobs;
      case 'Completed': return completedJobs;
      default: return [...pendingJobs, ...activeJobs, ...completedJobs];
    }
  };

  const filteredJobs = getFilteredJobs();

  // If Active filter is selected, render the ActiveJobsView component
  if (selectedFilter === 'Active') {
    return (
      <ErrorBoundary>
        <ActiveJobsView />
      </ErrorBoundary>
    );
  }

  return (
    <JobListErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Jobs</Text>
            <Text style={styles.headerSubtitle}>
              {currentProfile?.name} • {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.statBadge}>
              <Ionicons name="time-outline" size={16} color="#C6FF00" />
              <Text style={styles.statText}>{pendingJobs.length}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="play-outline" size={16} color="#C6FF00" />
              <Text style={styles.statText}>{activeJobs.length}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
          >
            {['All', 'Pending', 'Active', 'Completed'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C6FF00" />
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#8E9AAE" />
              <Text style={styles.emptyTitle}>No Jobs Found</Text>
              <Text style={styles.emptyMessage}>
                {selectedFilter !== 'All' 
                  ? `You have no ${selectedFilter.toLowerCase()} jobs at the moment.`
                  : 'No jobs have been assigned to you yet.'}
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={loadJobs}
              >
                <Ionicons name="refresh-outline" size={20} color="#0B0F1A" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.jobsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#C6FF00']}
                  tintColor="#C6FF00"
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.jobsListContent}
            >
              {filteredJobs.map(renderJobCard)}
              <View style={styles.bottomSpacing} />
            </ScrollView>
          )}
        </View>

        {/* Job Acceptance Modal */}
        <JobAcceptanceModal
          visible={showAcceptanceModal}
          job={selectedJob}
          staffId={currentProfile?.id || ''}
          onClose={() => {
            setShowAcceptanceModal(false);
            setSelectedJob(null);
          }}
          onJobUpdated={() => {
            loadJobs();
            setShowAcceptanceModal(false);
            setSelectedJob(null);
          }}
        />
      </SafeAreaView>
    </JobListErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A3A',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E9AAE',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.3)',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C6FF00',
    fontFamily: 'Inter_600SemiBold',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterScrollView: {
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E2A3A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterChipActive: {
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    borderColor: '#C6FF00',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E9AAE',
    fontFamily: 'Inter_500Medium',
  },
  filterChipTextActive: {
    color: '#C6FF00',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8E9AAE',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    fontFamily: 'Inter_700Bold',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E9AAE',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C6FF00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobsListContent: {
    paddingBottom: 100,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1E2A3A',
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
  },
  jobCardGradient: {
    padding: 16,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
    fontFamily: 'Inter_700Bold',
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
    fontFamily: 'Inter_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 16,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#8E9AAE',
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#C6FF00',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F1A',
    marginLeft: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  completedButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  completedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  bottomSpacing: {
    height: 50,
  },
});
