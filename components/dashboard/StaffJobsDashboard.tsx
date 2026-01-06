/**
 * Staff Jobs Dashboard Component
 * Displays pending jobs assigned to the logged-in staff member with accept/decline functionality
 * Optimized for mobile UX (iPhone 15 size)
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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { jobService } from '@/services/jobService';
import type { Job } from '@/types/job';
import { SiaMoonCard, SiaMoonButton, SiaMoonGradientButton, SiaMoonText } from '@/components/ui/SiaMoonUI';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Briefcase,
  AlertTriangle,
  Home,
  LogOut,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StaffJobsDashboardProps {
  testPendingJobs?: Job[];
  onTestAcceptJob?: (jobId: string) => Promise<void>;
  onTestDeclineJob?: (jobId: string) => Promise<void>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function StaffJobsDashboard({
  testPendingJobs,
  onTestAcceptJob,
  onTestDeclineJob,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh
}: StaffJobsDashboardProps) {
  const { user, signOut } = usePINAuth();
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [jobToDecline, setJobToDecline] = useState<Job | null>(null);

  // Use external refresh state if available, otherwise use internal
  const isRefreshing = externalRefreshing ?? refreshing;

  useEffect(() => {
    if (user?.id) {
      loadPendingJobs();
    }
  }, [user?.id]);

  // Merge test pending jobs with regular pending jobs
  const allPendingJobs = React.useMemo(() => {
    const regularJobs = pendingJobs || [];
    const testJobs = testPendingJobs || [];

    // Combine and deduplicate by job ID
    const combined = [...testJobs, ...regularJobs];
    const unique = combined.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    console.log('📋 All pending jobs:', unique.length, 'jobs');
    console.log('🧪 Test jobs:', testJobs.length);
    console.log('📝 Regular jobs:', regularJobs.length);

    return unique;
  }, [pendingJobs, testPendingJobs]);

  const loadPendingJobs = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const jobs = await jobService.getPendingJobs(user.id);
      setPendingJobs(jobs);
    } catch (error) {
      console.error('Error loading pending jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingJobs();
    setRefreshing(false);
  };

  // Use external refresh function if available, otherwise use internal
  const handleRefresh = externalOnRefresh ?? onRefresh;

  const handleAcceptJob = async (job: Job) => {
    if (!user?.id) return;

    // Check if this is a test job and use test accept function
    const isTestJob = testPendingJobs?.some(testJob => testJob.id === job.id);

    Alert.alert(
      'Accept Job',
      `Are you sure you want to accept "${job.title}"?${isTestJob ? '\n\n🧪 This is a test job from the web app.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingJobId(job.id);

              if (isTestJob && onTestAcceptJob) {
                console.log('🧪 Using test accept function for job:', job.id);
                await onTestAcceptJob(job.id);
              } else {
                console.log('📝 Using regular accept function for job:', job.id);
                const response = await jobService.acceptJob({
                  jobId: job.id,
                  staffId: user.id,
                });

                if (response.success) {
                  Alert.alert('Success', 'Job accepted successfully!');
                  // Remove from pending jobs list
                  setPendingJobs(prev => prev.filter(j => j.id !== job.id));
                } else {
                  Alert.alert('Error', response.error || 'Failed to accept job');
                }
              }
            } catch (error) {
              console.error('Error accepting job:', error);
              Alert.alert('Error', 'Failed to accept job. Please try again.');
            } finally {
              setProcessingJobId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeclineJob = (job: Job) => {
    setJobToDecline(job);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const confirmDeclineJob = async () => {
    if (!user?.id || !jobToDecline) return;

    // Check if this is a test job and use test decline function
    const isTestJob = testPendingJobs?.some(testJob => testJob.id === jobToDecline.id);

    try {
      setProcessingJobId(jobToDecline.id);

      if (isTestJob && onTestDeclineJob) {
        console.log('🧪 Using test decline function for job:', jobToDecline.id);
        await onTestDeclineJob(jobToDecline.id);
      } else {
        console.log('📝 Using regular decline function for job:', jobToDecline.id);
        const response = await jobService.declineJob(jobToDecline.id, user.id, declineReason);

        if (response.success) {
          Alert.alert('Job Declined', 'Job has been declined successfully.');
          // Remove from pending jobs list
          setPendingJobs(prev => prev.filter(j => j.id !== jobToDecline.id));
        } else {
          Alert.alert('Error', response.error || 'Failed to decline job');
        }
      }
    } catch (error) {
      console.error('Error declining job:', error);
      Alert.alert('Error', 'Failed to decline job. Please try again.');
    } finally {
      setProcessingJobId(null);
      setShowDeclineModal(false);
      setJobToDecline(null);
      setDeclineReason('');
    }
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

  const handleSignOut = () => {
    console.log('🔴 Sign out button clicked in StaffJobsDashboard');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign back in with either a staff or admin account.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting sign out process from staff dashboard...');
              setLocalLoading(true);
              
              // Check auth state before sign out
              console.log('🔍 Pre-signout auth state:', { 
                isAuthenticated: user !== null, 
                userEmail: user?.email,
                isLoading: localLoading 
              });
              
              // Perform sign out
              console.log('🔄 Calling signOut() function...');
              await signOut();
              
              console.log('✅ Sign out completed successfully');
              
              // Don't manually navigate - let the tab layout handle it
              // This prevents race conditions and ensures proper auth flow
              console.log('🔄 Waiting for automatic redirect to login...');
              
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert(
                'Sign Out Error',
                'There was an error signing out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLocalLoading(false);
            }
          }
        },
      ]
    );
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

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Home size={20} color="#8b5cf6" />;
      case 'maintenance': return <AlertTriangle size={20} color="#8b5cf6" />;
      case 'inspection': return <CheckCircle size={20} color="#8b5cf6" />;
      default: return <Briefcase size={20} color="#8b5cf6" />;
    }
  };

  const renderJobCard = (job: Job) => (
    <View key={job.id} style={styles.jobCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            <View style={styles.jobTypeContainer}>
              {getJobTypeIcon(job.type)}
              <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
        </View>

        {/* Property Information */}
        <View style={styles.propertySection}>
          <View style={styles.propertyRow}>
            <MapPin size={16} color="#8b5cf6" />
            <Text style={styles.propertyName} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
          <Text style={styles.propertyAddress}>
            {job.location.city}, {job.location.state} {job.location.zipCode}
          </Text>
        </View>

        {/* Booking Date */}
        <View style={styles.dateSection}>
          <Calendar size={16} color="#C6FF00" />
          <Text style={styles.bookingDate}>{formatDate(job.scheduledDate)}</Text>
        </View>

        {/* Task Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Task Description:</Text>
          <Text style={styles.taskDescription} numberOfLines={3}>
            {job.description || job.specialInstructions || 'No description provided'}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.durationSection}>
          <Clock size={16} color="#8b5cf6" />
          <Text style={styles.duration}>
            Estimated: {job.estimatedDuration} minutes
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineJob(job)}
            disabled={processingJobId === job.id}
          >
            <XCircle size={18} color="#ffffff" />
            <Text style={styles.declineButtonText}>
              {processingJobId === job.id ? 'Processing...' : 'Decline'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptJob(job)}
            disabled={processingJobId === job.id}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.acceptButtonGradient}
            >
              <CheckCircle size={18} color="#ffffff" />
              <Text style={styles.acceptButtonText}>
                {processingJobId === job.id ? 'Processing...' : 'Accept'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-bg px-4 pt-8">
      <LinearGradient
        colors={['#0B0F1A', '#111827', '#1C1F2A']}
        style={styles.backgroundGradient}
      />
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Pending Jobs</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{allPendingJobs.length}</Text>
            </View>
          </View>
          
          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={localLoading}
          >
            <LogOut size={20} color={localLoading ? '#6b7280' : '#ef4444'} />
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        <ScrollView
          style={styles.jobsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : allPendingJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Briefcase size={64} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>No Pending Jobs</Text>
              <Text style={styles.emptyStateText}>
                You don't have any pending job assignments at the moment.
                {testPendingJobs && testPendingJobs.length > 0 && '\n\n🧪 Waiting for test jobs from web app...'}
              </Text>
            </View>
          ) : (
            allPendingJobs.map(renderJobCard)
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

      {/* Decline Job Modal */}
      <Modal
        visible={showDeclineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View
            className="w-full max-w-sm"
          >
            <SiaMoonCard
              variant="elevated"
              className="p-6"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 24,
                elevation: 16,
              }}
            >
              <SiaMoonText variant="h2" className="mb-2 text-center">
                Decline Job
              </SiaMoonText>
              <SiaMoonText variant="body" color="secondary" className="mb-4 text-center">
                Please provide a reason for declining "{jobToDecline?.title}":
              </SiaMoonText>

              {testPendingJobs?.some(testJob => testJob.id === jobToDecline?.id) && (
                <View className="bg-info/20 border border-info/30 rounded-xl p-3 mb-4">
                  <SiaMoonText variant="caption" color="info" className="text-center">
                    🧪 This is a test job from the web app.
                  </SiaMoonText>
                </View>
              )}

              <TextInput
                className="bg-dark-surface border border-dark-border rounded-xl p-4 text-text-primary mb-6 min-h-24"
                placeholder="Enter reason for declining..."
                placeholderTextColor="#71717a"
                value={declineReason}
                onChangeText={setDeclineReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ fontFamily: 'Inter' }}
              />

              <View className="flex-row gap-3">
                <SiaMoonButton
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setShowDeclineModal(false)}
                  className="flex-1"
                />

                <SiaMoonGradientButton
                  title={processingJobId === jobToDecline?.id ? 'Processing...' : 'Decline Job'}
                  onPress={confirmDeclineJob}
                  disabled={!declineReason.trim() || processingJobId === jobToDecline?.id}
                  loading={processingJobId === jobToDecline?.id}
                  gradientColors={['#ef4444', '#dc2626']}
                  size="md"
                  className="flex-1"
                />
              </View>
            </SiaMoonCard>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  signOutButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
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
  jobTitle: {
    fontSize: 18,
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
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bookingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  descriptionSection: {
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  duration: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  acceptButtonText: {
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  testJobNote: {
    fontSize: 14,
    color: '#fbbf24',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reasonInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
