import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Job } from '@/types/job';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  User,
  Briefcase,
  Star,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface StaffDashboardProps {
  user: any;
  todaysJobs: Job[];
  pendingJobs: Job[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onAcceptJob: (job: Job) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent': return AlertTriangle;
    case 'high': return AlertTriangle;
    case 'medium': return Clock;
    case 'low': return CheckCircle;
    default: return Clock;
  }
};

const JobCard: React.FC<{
  job: Job;
  onAccept?: (job: Job) => void;
  showAcceptButton?: boolean;
}> = ({ job, onAccept, showAcceptButton = false }) => {
  const PriorityIcon = getPriorityIcon(job.priority);
  const priorityColor = getPriorityColor(job.priority);

  return (
    <View style={styles.jobCard}>
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
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <PriorityIcon size={12} color="#ffffff" />
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.jobType}>{job.type.replace('_', ' ').toUpperCase()}</Text>
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

          {job.description && (
            <Text style={styles.jobDescription} numberOfLines={2}>
              {job.description}
            </Text>
          )}
        </View>

        {/* Accept Button */}
        {showAcceptButton && onAccept && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(job)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.acceptButtonGradient}
            >
              <CheckCircle size={20} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Accept Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

export default function StaffDashboard({
  user,
  todaysJobs,
  pendingJobs,
  isLoading,
  refreshing,
  onRefresh,
  onAcceptJob,
}: StaffDashboardProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
              <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
            </View>
            <View style={styles.headerIcon}>
              <User size={32} color="#8b5cf6" />
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.statGradient}
            >
              <Briefcase size={24} color="#8b5cf6" />
              <Text style={styles.statNumber}>{pendingJobs.length}</Text>
              <Text style={styles.statLabel}>Pending Jobs</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
              style={styles.statGradient}
            >
              <CheckCircle size={24} color="#22c55e" />
              <Text style={styles.statNumber}>{todaysJobs.length}</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
              style={styles.statGradient}
            >
              <Star size={24} color="#fbbf24" />
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Pending Jobs Section */}
        {pendingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jobs Awaiting Acceptance</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{pendingJobs.length}</Text>
              </View>
            </View>
            
            {pendingJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAccept={onAcceptJob}
                showAcceptButton={true}
              />
            ))}
          </View>
        )}

        {/* Today's Active Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Active Jobs</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{todaysJobs.length}</Text>
            </View>
          </View>

          {todaysJobs.length > 0 ? (
            todaysJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#6b7280" />
              <Text style={styles.emptyStateText}>No active jobs for today</Text>
              <Text style={styles.emptyStateSubtext}>
                Check back later or accept pending jobs above
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobType: {
    fontSize: 12,
    color: '#8b5cf6',
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
  jobDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginTop: 4,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  bottomSpacing: {
    height: 20,
  },
});
