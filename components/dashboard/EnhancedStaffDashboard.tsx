/**
 * Enhanced Staff Dashboard with Job Assignment Integration
 * Real-time job assignments from webapp with acceptance/rejection workflow
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Calendar,
  User,
  Briefcase,
  TrendingUp,
  Bell,
  Play,
  XCircle,
} from 'lucide-react-native';
import type { JobAssignment } from '@/types/jobAssignment';
import type { User as AuthUser } from '@/types/auth';
import { mobileJobAssignmentService as jobAssignmentService } from '@/services/jobAssignmentService';
import JobAcceptanceModal from '@/components/jobs/JobAcceptanceModal';

const { width } = Dimensions.get('window');

interface EnhancedStaffDashboardProps {
  user: AuthUser;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function EnhancedStaffDashboard({
  user,
  refreshing,
  onRefresh
}: EnhancedStaffDashboardProps) {
  const [pendingJobs, setPendingJobs] = useState<JobAssignment[]>([]);
  const [todaysJobs, setTodaysJobs] = useState<JobAssignment[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobAssignment | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadJobAssignments();
      setupRealTimeListeners();
    }

    return () => {
      jobAssignmentService.cleanup();
    };
  }, [user?.id]);

  const loadJobAssignments = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Get all jobs for this staff member
      const response = await jobAssignmentService.getStaffJobs(user.id);
      
      if (response.success) {
        const jobs = response.jobs;
        
        // Categorize jobs
        const pending = jobs.filter(job => job.status === 'assigned');
        const today = jobs.filter(job => {
          const jobDate = job.scheduledFor?.toDate ? job.scheduledFor.toDate() : new Date(job.scheduledFor);
          const today = new Date();
          return jobDate.toDateString() === today.toDateString() && 
                 ['accepted', 'in_progress'].includes(job.status);
        });
        const active = jobs.filter(job => job.status === 'in_progress');

        setPendingJobs(pending);
        setTodaysJobs(today);
        setActiveJobs(active);
      }
    } catch (error) {
      console.error('Error loading job assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    if (!user?.id) return;

    // Listen for real-time updates to staff jobs
    jobAssignmentService.subscribeToStaffJobs(
      user.id,
      (jobs) => {
        console.log('📱 Real-time update: received', jobs.length, 'jobs');
        
        // Categorize jobs
        const pending = jobs.filter(job => job.status === 'assigned');
        const today = jobs.filter(job => {
          const jobDate = job.scheduledFor?.toDate ? job.scheduledFor.toDate() : new Date(job.scheduledFor);
          const todayDate = new Date();
          return jobDate.toDateString() === todayDate.toDateString() && 
                 ['accepted', 'in_progress'].includes(job.status);
        });
        const active = jobs.filter(job => job.status === 'in_progress');

        setPendingJobs(pending);
        setTodaysJobs(today);
        setActiveJobs(active);

        // Show notification for new assignments
        const newAssignments = pending.filter(job => {
          const assignedTime = job.assignedAt?.toDate ? job.assignedAt.toDate() : new Date(job.assignedAt);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return assignedTime > fiveMinutesAgo;
        });

        if (newAssignments.length > 0) {
          Alert.alert(
            '🔔 New Job Assignment',
            `You have ${newAssignments.length} new job${newAssignments.length > 1 ? 's' : ''} assigned to you!`,
            [{ text: 'View Jobs', onPress: () => {} }]
          );
        }
      }
    );
  };

  const handleJobPress = (job: JobAssignment) => {
    if (job.status === 'assigned') {
      setSelectedJob(job);
      setShowAcceptanceModal(true);
    } else {
      // Navigate to job details
      console.log('Navigate to job details:', job.id);
    }
  };

  const handleJobUpdated = (updatedJob: JobAssignment) => {
    // The real-time listener will handle the update
    console.log('Job updated:', updatedJob.id, updatedJob.status);
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

  const renderJobCard = (job: JobAssignment, showAcceptButton = false) => (
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
          <Text style={styles.jobType}>{job.type.replace('_', ' ').toUpperCase()}</Text>
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

        {/* Action Button for Pending Jobs */}
        {showAcceptButton && job.status === 'assigned' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleJobPress(job)}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.acceptButtonGradient}
            >
              <CheckCircle size={16} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Review & Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Status Indicator for Active Jobs */}
        {job.status === 'in_progress' && (
          <View style={styles.statusIndicator}>
            <Play size={16} color="#22c55e" />
            <Text style={styles.statusText}>In Progress</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
        </View>
        <View style={styles.notificationBadge}>
          <Bell size={24} color="#8b5cf6" />
          {pendingJobs.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingJobs.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.statCardGradient}
            >
              <Bell size={24} color="#8b5cf6" />
              <Text style={styles.statNumber}>{pendingJobs.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
              style={styles.statCardGradient}
            >
              <Calendar size={24} color="#22c55e" />
              <Text style={styles.statNumber}>{todaysJobs.length}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(249, 115, 22, 0.2)', 'rgba(249, 115, 22, 0.1)']}
              style={styles.statCardGradient}
            >
              <Play size={24} color="#f97316" />
              <Text style={styles.statNumber}>{activeJobs.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Pending Job Assignments */}
        {pendingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 New Job Assignments</Text>
              <Text style={styles.sectionSubtitle}>
                {pendingJobs.length} job{pendingJobs.length > 1 ? 's' : ''} waiting for your response
              </Text>
            </View>
            {pendingJobs.map(job => renderJobCard(job, true))}
          </View>
        )}

        {/* Today's Jobs */}
        {todaysJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Today's Schedule</Text>
              <Text style={styles.sectionSubtitle}>
                {todaysJobs.length} job{todaysJobs.length > 1 ? 's' : ''} scheduled for today
              </Text>
            </View>
            {todaysJobs.map(job => renderJobCard(job))}
          </View>
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🚀 Active Jobs</Text>
              <Text style={styles.sectionSubtitle}>
                {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} in progress
              </Text>
            </View>
            {activeJobs.map(job => renderJobCard(job))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && pendingJobs.length === 0 && todaysJobs.length === 0 && activeJobs.length === 0 && (
          <View style={styles.emptyState}>
            <Briefcase size={64} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No Jobs Assigned</Text>
            <Text style={styles.emptyStateText}>
              You don't have any jobs assigned at the moment. Check back later or contact your manager.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Job Acceptance Modal */}
      <JobAcceptanceModal
        visible={showAcceptanceModal}
        job={selectedJob}
        staffId={user?.id || ''}
        onClose={() => {
          setShowAcceptanceModal(false);
          setSelectedJob(null);
        }}
        onJobUpdated={handleJobUpdated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  jobCard: {
    marginBottom: 12,
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
    marginBottom: 4,
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
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  jobDetails: {
    gap: 8,
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
  acceptButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
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
