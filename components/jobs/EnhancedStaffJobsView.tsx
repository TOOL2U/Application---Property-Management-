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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import type { JobAssignment } from '@/types/jobAssignment';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';
import JobAcceptanceModal from '@/components/jobs/JobAcceptanceModal';
import ActiveJobsView from '@/components/jobs/ActiveJobsView';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingState, EmptyState } from '@/components/shared/StateComponents';
import { 
  getPriorityColor, 
  getStatusColor, 
  formatJobDate,
  getJobTypeIcon,
  JOB_COLORS,
  COMMON_STYLES 
} from '@/utils/jobUtils';
import {
  Briefcase,
  Clock,
  MapPin,
  Play,
  CheckCircle,
  Calendar,
  Bell,
  Camera,
} from 'lucide-react-native';

export default function EnhancedStaffJobsView() {
  const { currentProfile } = usePINAuth();
  const router = useRouter();
  
  const [pendingJobs, setPendingJobs] = useState<JobAssignment[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobAssignment[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Active'); // Default to Active for staff users
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  useEffect(() => {
    if (currentProfile?.id) {
      loadJobs();
      setupRealTimeListeners();
    }

    return () => {
      jobAssignmentService.cleanup();
    };
  }, [currentProfile?.id]);

  const loadJobs = async () => {
    if (!currentProfile?.id) return;

    try {
      setIsLoading(true);
      const response = await jobAssignmentService.getStaffJobs(currentProfile.id);
      
      if (response.success) {
        categorizeJobs(response.jobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    if (!currentProfile?.id) return;

    jobAssignmentService.subscribeToStaffJobs(
      currentProfile.id,
      (jobs) => {
        console.log('📱 Real-time jobs update:', jobs.length);
        categorizeJobs(jobs);
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
    if (job.status === 'assigned') {
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
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
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
            <Calendar size={16} color="#8b5cf6" />
            <Text style={styles.jobDetailText}>{formatDate(job.scheduledFor)}</Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <Clock size={16} color="#8b5cf6" />
            <Text style={styles.jobDetailText}>{job.estimatedDuration} min</Text>
          </View>
          
          <View style={styles.jobDetailRow}>
            <MapPin size={16} color="#8b5cf6" />
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
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.actionButtonGradient}
              >
                <CheckCircle size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Review & Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {job.status === 'accepted' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStartJob(job)}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.actionButtonGradient}
              >
                <Play size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Start Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {job.status === 'in_progress' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/job-details/${job.id}` as any)}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionButtonGradient}
              >
                <Camera size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Update Progress</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {job.status === 'completed' && (
            <View style={styles.completedIndicator}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
      </LinearGradient>
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
      <View style={styles.container}>
        <LinearGradient
          colors={[JOB_COLORS.background, '#16213e']}
          style={styles.backgroundGradient}
        />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Bell size={16} color="#ef4444" />
              <Text style={styles.statText}>{pendingJobs.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Play size={16} color="#3b82f6" />
              <Text style={styles.statText}>{activeJobs.length}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['All', 'Pending', 'Active', 'Completed'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Jobs List */}
        <ScrollView
          style={styles.jobsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
        >
          {isLoading ? (
            <LoadingState message="Loading jobs..." />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title="No Jobs Found"
              message={selectedFilter === 'All' 
                ? "You don't have any jobs assigned at the moment."
                : `No ${selectedFilter.toLowerCase()} jobs found.`
              }
              icon="briefcase-outline"
            />
          ) : (
            filteredJobs.map(renderJobCard)
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      {/* Job Acceptance Modal */}
      <JobAcceptanceModal
        visible={showAcceptanceModal}
        job={selectedJob}
        staffId={currentProfile?.id || ''}
        onClose={() => {
          setShowAcceptanceModal(false);
          setSelectedJob(null);
        }}
        onJobUpdated={handleJobUpdated}
      />
    </View>
    </JobListErrorBoundary>
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
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#8b5cf6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterTabTextActive: {
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
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
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
    color: '#d1d5db',
    flex: 1,
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
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
