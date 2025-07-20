/**
 * Enhanced Staff Jobs Dashboard
 * Comprehensive job management dashboard with enhanced workflow, GPS tracking, and offline capabilities
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
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  Settings,
  Wifi,
  WifiOff,
  Bell,
  User
} from 'lucide-react-native';

// Enhanced components
import EnhancedJobAcceptanceModal from '@/components/jobs/EnhancedJobAcceptanceModal';
import JobProgressTracker from '@/components/jobs/JobProgressTracker';

// Existing hooks and services
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/contexts/PushNotificationContext';
import type { JobAssignment, JobAssignmentStatus } from '@/types/jobAssignment';
import type { Job } from '@/types/job';

const { width } = Dimensions.get('window');

interface JobFilters {
  status: JobAssignmentStatus[];
  priority: string[];
  type: string[];
  dateRange: 'today' | 'week' | 'month' | 'all';
}

interface EnhancedStaffJobsDashboardProps {
  enableGPSVerification?: boolean;
  enableOfflineMode?: boolean;
  enableProgressTracking?: boolean;
  enableAdvancedFiltering?: boolean;
}

export default function EnhancedStaffJobsDashboard({
  enableGPSVerification = true,
  enableOfflineMode = true,
  enableProgressTracking = true,
  enableAdvancedFiltering = true
}: EnhancedStaffJobsDashboardProps) {
  const insets = useSafeAreaInsets();
  const { currentProfile } = useAuth();
  const { hasPermission: hasPushPermission } = usePushNotifications();
  
  const {
    jobs,
    loading,
    refreshing,
    error,
    refreshJobs,
    acceptJob,
    startJob,
    completeJob
  } = useStaffJobs();

  // Enhanced state
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({
    status: ['assigned', 'accepted', 'in_progress'],
    priority: [],
    type: [],
    dateRange: 'today'
  });

  // Job statistics
  const jobStats = {
    total: jobs.length,
    pending: jobs.filter(job => job.status === 'assigned').length,
    accepted: jobs.filter(job => job.status === 'accepted').length,
    inProgress: jobs.filter(job => job.status === 'in_progress').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    overdue: jobs.filter(job => {
      if (!job.dueDate) return false;
      const dueDate = job.dueDate.toDate ? job.dueDate.toDate() : new Date(job.dueDate as any);
      return dueDate < new Date() && job.status !== 'completed';
    }).length
  };

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(job.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(job.priority)) {
      return false;
    }

    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(job.type)) {
      return false;
    }

    // Date range filter
    const jobDate = job.scheduledFor.toDate ? job.scheduledFor.toDate() : new Date(job.scheduledFor as any);
    const now = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        return jobDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return jobDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return jobDate >= monthAgo;
      default:
        return true;
    }
  });

  useEffect(() => {
    // Simple network monitoring
    const checkNetworkStatus = async () => {
      try {
        await fetch('https://www.google.com/favicon.ico', { method: 'HEAD' });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkNetworkStatus, 10000);
    checkNetworkStatus();

    return () => clearInterval(interval);
  }, []);

  const handleJobPress = (job: JobAssignment) => {
    setSelectedJob(job);
    
    if (job.status === 'assigned') {
      setShowAcceptanceModal(true);
    } else if (job.status === 'accepted' || job.status === 'in_progress') {
      setShowProgressTracker(true);
    }
  };

  const handleJobUpdated = (updatedJob: JobAssignment) => {
    // Update will be handled by the useStaffJobs hook's real-time listener
    setSelectedJob(updatedJob);
  };

  const handleJobAccepted = () => {
    setShowAcceptanceModal(false);
    if (selectedJob && enableProgressTracking) {
      setShowProgressTracker(true);
    }
  };

  const handleJobCompleted = () => {
    setShowProgressTracker(false);
    setSelectedJob(null);
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
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

  const getStatusColor = (status: JobAssignmentStatus) => {
    switch (status) {
      case 'assigned': return '#8b5cf6';
      case 'accepted': return '#22c55e';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderJobCard = (job: JobAssignment) => (
    <TouchableOpacity
      key={job.id}
      style={styles.jobCard}
      onPress={() => handleJobPress(job)}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job.title}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                <Text style={styles.badgeText}>{job.priority.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                <Text style={styles.badgeText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#8b5cf6" />
            <Text style={styles.detailText}>
              {formatDate(job.scheduledFor)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#8b5cf6" />
            <Text style={styles.detailText}>
              {job.estimatedDuration} minutes
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MapPin size={16} color="#8b5cf6" />
            <Text style={styles.detailText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
        </View>

        {/* Job Type */}
        <View style={styles.jobType}>
          <Text style={styles.jobTypeText}>
            {job.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Progress indicator for in-progress jobs */}
        {job.status === 'in_progress' && enableProgressTracking && (
          <View style={styles.progressIndicator}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={[styles.progressFill, { 
                  width: `${Math.round((job.requirements.filter(req => req.isCompleted).length / Math.max(job.requirements.length, 1)) * 100)}%` 
                }]}
              />
            </View>
            <Text style={styles.progressText}>
              {job.requirements.filter(req => req.isCompleted).length}/{job.requirements.length} completed
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <User size={24} color="#ffffff" />
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.userName}>{currentProfile?.displayName || 'Staff Member'}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {/* Network status */}
            <View style={styles.networkStatus}>
              {isOnline ? (
                <Wifi size={20} color="#22c55e" />
              ) : (
                <WifiOff size={20} color="#ef4444" />
              )}
            </View>
            
            {/* Notification status */}
            <TouchableOpacity style={styles.notificationStatus}>
              <Bell size={20} color={hasPushPermission ? "#22c55e" : "#ef4444"} />
            </TouchableOpacity>
            
            {/* Filter button */}
            {enableAdvancedFiltering && (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
              >
                <Filter size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Job Statistics */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{jobStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{jobStats.accepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{jobStats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{jobStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          {jobStats.overdue > 0 && (
            <View style={[styles.statCard, styles.overdueCard]}>
              <Text style={[styles.statNumber, styles.overdueText]}>{jobStats.overdue}</Text>
              <Text style={[styles.statLabel, styles.overdueText]}>Overdue</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshJobs}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No jobs found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {jobs.length === 0 
                ? "You don't have any jobs assigned yet."
                : "No jobs match your current filters."
              }
            </Text>
          </View>
        ) : (
          <>
            {/* Urgent/Overdue jobs first */}
            {filteredJobs
              .filter(job => job.priority === 'urgent' || (job.dueDate && new Date(job.dueDate as any) < new Date()))
              .map(renderJobCard)
            }
            
            {/* Other jobs */}
            {filteredJobs
              .filter(job => job.priority !== 'urgent' && !(job.dueDate && new Date(job.dueDate as any) < new Date()))
              .sort((a, b) => {
                // Sort by scheduled time
                const aTime = a.scheduledFor.toDate ? a.scheduledFor.toDate().getTime() : new Date(a.scheduledFor as any).getTime();
                const bTime = b.scheduledFor.toDate ? b.scheduledFor.toDate().getTime() : new Date(b.scheduledFor as any).getTime();
                return aTime - bTime;
              })
              .map(renderJobCard)
            }
          </>
        )}
      </ScrollView>

      {/* Enhanced Job Acceptance Modal */}
      <EnhancedJobAcceptanceModal
        visible={showAcceptanceModal}
        job={selectedJob}
        staffId={currentProfile?.id || ''}
        onClose={() => {
          setShowAcceptanceModal(false);
          setSelectedJob(null);
        }}
        onJobUpdated={handleJobUpdated}
        enableGPSVerification={enableGPSVerification}
        enableOfflineMode={enableOfflineMode}
        enableProgressTracking={enableProgressTracking}
        enableRequirementChecking={true}
      />

      {/* Job Progress Tracker Modal */}
      <Modal
        visible={showProgressTracker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgressTracker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Job Progress</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProgressTracker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedJob && (
            <JobProgressTracker
              job={selectedJob}
              staffId={currentProfile?.id || ''}
              onJobUpdated={handleJobUpdated}
              onComplete={handleJobCompleted}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  networkStatus: {
    padding: 4,
  },
  notificationStatus: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  overdueCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
  overdueText: {
    color: '#ef4444',
  },
  jobsList: {
    flex: 1,
    padding: 20,
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
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  jobType: {
    marginBottom: 8,
  },
  jobTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  progressIndicator: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#16213e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});
