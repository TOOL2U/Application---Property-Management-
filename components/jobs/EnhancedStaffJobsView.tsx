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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Modal, Portal } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useAppNotifications } from "@/contexts/AppNotificationContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { FirebaseNotificationService } from '@/lib/firebase';
import { pushNotificationService } from '@/services/pushNotificationService';
import * as Notifications from 'expo-notifications';
import type { Job } from '@/types/job';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import JobAcceptanceModal from '@/components/jobs/JobAcceptanceModal';
import { JobStartModal } from '@/components/jobs/JobStartModal';
import { JobExecutionScreen } from '@/components/jobs/JobExecutionScreen';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import { BrandTheme } from '@/constants/BrandTheme';

export default function EnhancedStaffJobsView() {
  const { currentProfile } = usePINAuth();
  const { refreshNotifications } = useAppNotifications();
  const { t } = useTranslationContext();
  const router = useRouter();
  
  // Use the same hook as the home screen for data consistency
  const {
    jobs,
    pendingJobs,
    activeJobs, 
    completedJobs,
    loading: isLoading,
    refreshing,
    error,
    refreshJobs,
    acceptJob,
    startJob,
    completeJob,
    updateJobStatus
  } = useStaffJobs({
    enableRealtime: true,
    enableCache: true
  });
  
  const [selectedFilter, setSelectedFilter] = useState('all'); // Show all jobs by default to debug
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showJobStartModal, setShowJobStartModal] = useState(false);
  const [jobToStart, setJobToStart] = useState<Job | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Auto-refresh on screen focus for better UX
  useFocusEffect(
    React.useCallback(() => {
      if (currentProfile?.id) {
        console.log('🔄 Jobs Screen: Screen focused, refreshing jobs...');
        refreshJobs();
      }
    }, [currentProfile?.id, refreshJobs])
  );

  useEffect(() => {
    if (currentProfile?.id) {
      setupNotificationListeners();
    }
  }, [currentProfile?.id]);

  const setupNotificationListeners = async () => {
    if (!currentProfile?.id) return;

    try {
      // Import the Firebase UID service
      const { firebaseUidService } = await import('@/services/firebaseUidService');
      
      // Get Firebase UID for the current profile
      const firebaseUid = await firebaseUidService.getFirebaseUid(currentProfile.id);
      
      if (firebaseUid) {
        console.log('🔍 MOBILE DEBUG: Setting up notification listeners for Firebase UID:', firebaseUid);
        
        // Initialize push notifications
        try {
          await pushNotificationService.initialize(currentProfile.id);
          console.log('✅ Push notifications initialized for staff:', currentProfile.id);
        } catch (error) {
          console.error('❌ Failed to initialize push notifications:', error);
        }
        
        // Setup notification listeners
        setupNotificationListener(firebaseUid);
      } else {
        console.error('❌ MOBILE DEBUG: No Firebase UID found for profile:', currentProfile.id);
      }
    } catch (error) {
      console.error('❌ MOBILE DEBUG: Error setting up notification listeners:', error);
    }
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
                title: t('jobs.newJobAssignment'),
                body: t('jobs.jobNotificationBody', { 
                  jobTitle: latestJob.jobTitle || t('jobs.newJob'),
                  propertyName: latestJob.propertyName || t('jobs.unknownProperty')
                }),
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
            t('jobs.newJobAssignment'),
            t('jobs.jobNotificationBody', { 
              jobTitle: latestJob.jobTitle || t('jobs.newJob'),
              propertyName: latestJob.propertyName || t('jobs.unknownProperty')
            }) + '\n\n' + t('jobs.checkPendingTab'),
            [
              { text: t('jobs.viewJobs'), style: 'default' },
              { text: t('common.ok'), style: 'cancel' }
            ]
          );
        }
      }
    );
  };

  const onRefresh = async () => {
    await refreshJobs();
  };

  const handleJobPress = (job: any) => {
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
      router.push(`/jobs/${job.id}` as any);
    }
  };

  const handleJobUpdated = (updatedJob: any) => {
    // Real-time listener will handle the update
    console.log('Job updated:', updatedJob.id, updatedJob.status);
  };

  const handleStartJob = async (job: Job) => {
    // Open job start confirmation modal instead of directly starting
    setJobToStart(job);
    setShowJobStartModal(true);
  };

  const handleJobStartConfirmed = async (job: Job) => {
    try {
      // The JobStartModal handles the actual job start logic with audit integration
      console.log('✅ Job started successfully with audit tracking:', job.id);
      
      // Refresh jobs to get updated status
      refreshJobs();
      
      // Navigate to job execution screen for in-progress jobs
      if (job.status === 'in_progress') {
        console.log('🔄 Job now in progress, ready for execution phase');
      }
      
    } catch (error) {
      console.error('Error in job start confirmation:', error);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'assigned': return '#C6FF00';
      case 'accepted': return '#60A5FA';
      case 'in_progress': return '#F59E0B';
      // Removed completed status color - completed jobs don't appear in mobile app
      default: return '#8E9AAE';
    }
  };  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderJobCard = (job: Job) => (
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
            <Text style={styles.jobDetailText}>{formatDate(job.scheduledDate)}</Text>
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
            <View style={styles.acceptButtonContainer}>
              {/* Glow Effect - Same as JOBS button */}
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  right: -6,
                  bottom: -6,
                  borderRadius: 14,
                  backgroundColor: '#C6FF00',
                  opacity: 0.4,
                  shadowColor: '#C6FF00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                  elevation: 12,
                }}
              />
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleJobPress(job)}
              >
                <View style={styles.actionButtonGradient}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#0B0F1A" />
                  <Text style={styles.actionButtonText}>{t('jobs.acceptJob')}</Text>
                </View>
              </TouchableOpacity>
              
              {/* Pulse Animation */}
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: 'rgba(198, 255, 0, 0.4)',
                }}
              />
            </View>
          )}

          {job.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStartJob(job)}
            >
              <View style={styles.actionButtonGradient}>
                <Ionicons name="play-outline" size={16} color="#0B0F1A" />
                <Text style={styles.actionButtonText}>{t('jobs.startJob')}</Text>
              </View>
            </TouchableOpacity>
          )}

          {job.status === 'in_progress' && (
            <View style={{ flexDirection: 'column', gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => router.push(`/jobs/${job.id}` as any)}
                >
                  <View style={styles.actionButtonGradient}>
                    <Ionicons name="camera-outline" size={16} color="#0B0F1A" />
                    <Text style={styles.actionButtonText}>{t('jobs.viewDetails')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Removed completed job UI - completed jobs should not appear in mobile app */}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getFilteredJobs = () => {
    // Filter out completed jobs entirely - they should not appear in mobile app
    const activeJobsOnly = [...pendingJobs, ...activeJobs];
    
    switch (selectedFilter) {
      case 'pending': return pendingJobs;
      case 'active': return activeJobs;
      default: return activeJobsOnly; // Only show pending and active jobs
    }
  };

  const filteredJobs = getFilteredJobs();

  return (
    <JobListErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Image 
                source={{ uri: 'https://res.cloudinary.com/dkamf5p9a/image/upload/v1/Logo%20-%20Black-bg%20-%20Sia%20Moon' }}
                style={styles.brandLogo}
                resizeMode="contain"
                onError={(error) => console.log('Logo failed to load:', error)}
              />
              <View style={styles.headerTextContent}>
                <Text style={styles.headerTitle}>{t('jobs.myJobs')}</Text>
                <Text style={styles.headerSubtitle}>
                  {currentProfile?.name}
                </Text>
              </View>
            </View>
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

        {/* Filter Tabs - Removed completed filter */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
          >
            {['all', 'pending', 'active'].map((filter) => (
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
                  {t(`jobs.${filter}`)}
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
              <Text style={styles.loadingText}>{t('jobs.loadingJobs')}</Text>
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#8E9AAE" />
              <Text style={styles.emptyTitle}>{t('jobs.noJobsFound')}</Text>
              <Text style={styles.emptyMessage}>
                {selectedFilter !== 'all' 
                  ? t('jobs.noJobsInFilter', { filter: t(`jobs.${selectedFilter}`) })
                  : t('jobs.noJobsAssigned')}
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={refreshJobs}
              >
                <Ionicons name="refresh-outline" size={20} color="#0B0F1A" />
                <Text style={styles.refreshButtonText}>{t('jobs.refresh')}</Text>
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
          job={selectedJob as any} // Temporary type conversion
          staffId={currentProfile?.id || ''}
          onClose={() => {
            setShowAcceptanceModal(false);
            setSelectedJob(null);
          }}
          onJobUpdated={() => {
            refreshJobs();
            setShowAcceptanceModal(false);
            setSelectedJob(null);
          }}
        />

        {/* Job Start Modal with Audit Integration */}
        {jobToStart && (
          <JobStartModal
            job={jobToStart}
            visible={showJobStartModal}
            onDismiss={() => {
              setShowJobStartModal(false);
              setJobToStart(null);
            }}
            onJobStarted={(updatedJob, sessionData) => {
              console.log('✅ Job started with audit data:', updatedJob.id, sessionData);
              setShowJobStartModal(false);
              setJobToStart(null);
              handleJobStartConfirmed(updatedJob);
            }}
          />
        )}

        {/* Job Execution Screen for In-Progress Jobs */}
        {jobToStart && jobToStart.status === 'in_progress' && (
          <JobExecutionScreen
            job={jobToStart}
            onJobCompleted={(completedJob) => {
              console.log('✅ Job completed:', completedJob.id);
              setJobToStart(null);
              refreshJobs();
            }}
            onGoBack={() => {
              setJobToStart(null);
            }}
          />
        )}
      </SafeAreaView>
    </JobListErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.display,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: 4,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  headerTextContent: {
    flex: 1,
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
    backgroundColor: BrandTheme.colors.YELLOW,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterScrollView: {
    gap: 12,
    justifyContent: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  filterChipActive: {
    backgroundColor: BrandTheme.colors.YELLOW,
    borderColor: BrandTheme.colors.YELLOW,
  },
  filterChipText: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: BrandTheme.colors.BLACK,
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
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: 16,
    fontFamily: BrandTheme.typography.fontFamily.regular,
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
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: 20,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  emptyMessage: {
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandTheme.colors.YELLOW,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 0,
    marginTop: 24,
  },
  refreshButtonText: {
    color: BrandTheme.colors.BLACK,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: BrandTheme.typography.fontFamily.primary,
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
    borderRadius: 0,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
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
    color: BrandTheme.colors.TEXT_PRIMARY,
    flex: 1,
    marginRight: 12,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
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
    color: BrandTheme.colors.TEXT_SECONDARY,
    flex: 1,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 0,
    backgroundColor: BrandTheme.colors.YELLOW,
  },
  acceptButtonContainer: {
    position: 'relative',
    flex: 1,
  },
  acceptButton: {
    // Additional styling for the accept button specifically
    shadowColor: BrandTheme.colors.YELLOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
    color: BrandTheme.colors.BLACK,
    marginLeft: 6,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  // Removed completedButton and completedButtonText styles - not needed since completed jobs don't appear in mobile app
  bottomSpacing: {
    height: 50,
  },
});
