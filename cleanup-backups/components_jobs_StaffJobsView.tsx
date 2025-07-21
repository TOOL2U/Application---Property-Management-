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
import { useRouter } from 'expo-router';
import { Job } from '@/types/job';
import { jobService } from '@/services/jobService';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingState, EmptyState } from '@/components/shared/StateComponents';
import { 
  getPriorityColor, 
  getStatusColor, 
  JOB_COLORS,
  COMMON_STYLES 
} from '@/utils/jobUtils';
import {
  Briefcase,
  Clock,
  MapPin,
  Play,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StaffJobsViewProps {
  onJobSelect?: (job: Job) => void;
}

const JobCard: React.FC<{
  job: Job;
  onPress: () => void;
  onStart?: () => void;
}> = ({ job, onPress, onStart }) => {
  const priorityColor = getPriorityColor(job.priority);
  const statusColor = getStatusColor(job.status);

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.jobMetaRow}>
            <Text style={styles.jobType}>{job.type.replace('_', ' ').toUpperCase()}</Text>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {job.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#8b5cf6" />
            <Text style={styles.detailText} numberOfLines={1}>
              {job.location.address}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#8b5cf6" />
            <Text style={styles.detailText}>
              {job.estimatedDuration} min • {new Date(job.scheduledDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={16} color="#8b5cf6" />
            <Text style={styles.detailText}>
              Scheduled: {new Date(job.scheduledDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {job.status === 'accepted' && onStart && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={(e) => {
              e.stopPropagation();
              onStart();
            }}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.startButtonGradient}
            >
              <Play size={16} color="#ffffff" />
              <Text style={styles.startButtonText}>Start Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function StaffJobsView({ onJobSelect }: StaffJobsViewProps) {
  const { user, isLoading: authLoading } = useStaffAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'accepted' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    if (user?.id) {
      loadJobs();
    }
  }, [user?.id]);

  useEffect(() => {
    filterJobs();
  }, [jobs, activeFilter]);

  const loadJobs = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await jobService.getStaffJobs(user.id);
      
      if (response.success) {
        setJobs(response.jobs);
      } else {
        Alert.alert('Error', response.error || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    if (activeFilter === 'all') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.status === activeFilter));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleStartJob = async (job: Job) => {
    if (!user?.id) return;

    Alert.alert(
      'Start Job',
      `Are you ready to start "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'default',
          onPress: async () => {
            try {
              const response = await jobService.startJob(job.id, user.id);
              
              if (response.success) {
                Alert.alert('Success', 'Job started successfully!');
                await loadJobs();
                
                // Navigate to job details
                if (onJobSelect) {
                  onJobSelect(job);
                }
              } else {
                Alert.alert('Error', response.error || 'Failed to start job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to start job');
            }
          },
        },
      ]
    );
  };

  const handleJobPress = (job: Job) => {
    if (onJobSelect) {
      onJobSelect(job);
    } else {
      // Navigate to job details page
      router.push(`/jobs/${job.id}`);
    }
  };

  const getFilterCount = (filter: typeof activeFilter) => {
    if (filter === 'all') return jobs.length;
    return jobs.filter(job => job.status === filter).length;
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg px-4 pt-8">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <Text style={styles.headerSubtitle}>
          {filteredJobs.length} {activeFilter === 'all' ? 'total' : activeFilter} jobs
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All', icon: Briefcase },
          { key: 'accepted', label: 'Accepted', icon: CheckCircle },
          { key: 'in_progress', label: 'In Progress', icon: Play },
          { key: 'completed', label: 'Completed', icon: CheckCircle },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterTab,
              activeFilter === key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(key as typeof activeFilter)}
          >
            <Icon 
              size={16} 
              color={activeFilter === key ? '#ffffff' : '#8b5cf6'} 
            />
            <Text
              style={[
                styles.filterTabText,
                activeFilter === key && styles.filterTabTextActive,
              ]}
            >
              {label}
            </Text>
            <View style={[
              styles.filterBadge,
              activeFilter === key && styles.filterBadgeActive,
            ]}>
              <Text style={[
                styles.filterBadgeText,
                activeFilter === key && styles.filterBadgeTextActive,
              ]}>
                {getFilterCount(key as typeof activeFilter)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List */}
      <ScrollView
        style={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => handleJobPress(job)}
              onStart={job.status === 'accepted' ? () => handleStartJob(job) : undefined}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Briefcase size={48} color="#6b7280" />
            <Text style={styles.emptyStateText}>
              No {activeFilter === 'all' ? '' : activeFilter} jobs found
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeFilter === 'all' 
                ? 'Jobs will appear here when assigned to you'
                : `Switch to "All" to see jobs in other statuses`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterContent: {
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  filterBadgeTextActive: {
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
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
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
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobType: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
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
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
