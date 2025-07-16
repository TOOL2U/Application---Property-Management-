/**
 * Manage Jobs View - Admin Only
 * Allows admin users to create, edit, and manage all jobs
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
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import {
  Briefcase,
  Plus,
  Edit3,
  Trash2,
  User,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pause,
  Play,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react-native';

interface ManagedJob {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  propertyName: string;
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
  };
  scheduledDate: Date;
  estimatedDuration: number;
  createdAt: Date;
  createdBy: string;
}

export default function ManageJobsView() {
  const { user } = useAuth();
  const { isAdminOrManager } = useStaffAuth();
  const [jobs, setJobs] = useState<ManagedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual job data loading from Firebase
      // For now, show placeholder data
      
      const mockJobs: ManagedJob[] = [
        {
          id: '1',
          title: 'Pool Cleaning Service',
          description: 'Clean pool, check chemical levels, and maintain equipment.',
          type: 'cleaning',
          status: 'in_progress',
          priority: 'high',
          propertyName: 'Ocean View Villa',
          assignedStaff: {
            id: 'staff1',
            name: 'John Doe',
            role: 'cleaner',
          },
          scheduledDate: new Date('2024-01-16'),
          estimatedDuration: 120,
          createdAt: new Date('2024-01-15'),
          createdBy: 'admin@siamoon.com',
        },
        {
          id: '2',
          title: 'HVAC Maintenance Check',
          description: 'Perform routine maintenance on HVAC system.',
          type: 'maintenance',
          status: 'pending',
          priority: 'medium',
          propertyName: 'Downtown Loft',
          scheduledDate: new Date('2024-01-17'),
          estimatedDuration: 90,
          createdAt: new Date('2024-01-15'),
          createdBy: 'admin@siamoon.com',
        },
        {
          id: '3',
          title: 'Property Inspection',
          description: 'Conduct thorough property inspection.',
          type: 'inspection',
          status: 'completed',
          priority: 'low',
          propertyName: 'Beachfront Condo',
          assignedStaff: {
            id: 'staff2',
            name: 'Jane Smith',
            role: 'staff',
          },
          scheduledDate: new Date('2024-01-14'),
          estimatedDuration: 60,
          createdAt: new Date('2024-01-13'),
          createdBy: 'admin@siamoon.com',
        },
      ];

      setJobs(mockJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleCreateJob = () => {
    Alert.alert('Create Job', 'Job creation feature coming soon!');
  };

  const handleEditJob = (job: ManagedJob) => {
    Alert.alert('Edit Job', `Edit "${job.title}" feature coming soon!`);
  };

  const handleDeleteJob = (job: ManagedJob) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual job deletion
            console.log('Deleting job:', job.id);
            Alert.alert('Success', 'Job deleted successfully');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      case 'accepted': return '#10b981';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Briefcase size={16} color="#8b5cf6" />;
      case 'maintenance': return <AlertTriangle size={16} color="#8b5cf6" />;
      case 'inspection': return <CheckCircle size={16} color="#8b5cf6" />;
      default: return <Briefcase size={16} color="#8b5cf6" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredJobs = jobs.filter(job => {
    if (selectedFilter === 'all') return true;
    return job.status === selectedFilter;
  });

  // Access control check
  if (!isAdminOrManager) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.restrictedContainer}>
            <AlertTriangle size={64} color="#f59e0b" />
            <Text style={styles.restrictedTitle}>Access Restricted</Text>
            <Text style={styles.restrictedText}>
              This feature is only available to admin and manager users.
            </Text>
            <Text style={styles.restrictedSubtext}>
              Contact your administrator for access.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderJobCard = (job: ManagedJob) => (
    <View key={job.id} style={styles.jobCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.jobCardGradient}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            {getTypeIcon(job.type)}
            <Text style={styles.jobTitle}>{job.title}</Text>
          </View>
          <View style={styles.jobBadges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
              <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobProperty}>
            <MapPin size={14} color="#9ca3af" />
            <Text style={styles.propertyName}>{job.propertyName}</Text>
          </View>

          <View style={styles.jobSchedule}>
            <Calendar size={14} color="#8b5cf6" />
            <Text style={styles.scheduleText}>{formatDate(job.scheduledDate)}</Text>
            <Clock size={14} color="#9ca3af" />
            <Text style={styles.durationText}>{job.estimatedDuration}min</Text>
          </View>

          {job.assignedStaff && (
            <View style={styles.assignedStaff}>
              <User size={14} color="#22c55e" />
              <Text style={styles.staffName}>{job.assignedStaff.name}</Text>
              <Text style={styles.staffRole}>({job.assignedStaff.role})</Text>
            </View>
          )}

          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>
        </View>

        <View style={styles.jobActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditJob(job)}
          >
            <Edit3 size={16} color="#8b5cf6" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteJob(job)}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Jobs</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Search size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateJob}>
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobs.filter(j => j.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobs.filter(j => j.status === 'in_progress').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobs.filter(j => j.status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'pending', 'in_progress', 'completed'].map((filter) => (
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
                {filter === 'all' ? 'All' : filter.replace('_', ' ')}
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
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Briefcase size={64} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>No Jobs Found</Text>
              <Text style={styles.emptyStateText}>
                {selectedFilter === 'all' 
                  ? "No jobs have been created yet."
                  : `No ${selectedFilter.replace('_', ' ')} jobs found.`
                }
              </Text>
              <TouchableOpacity style={styles.createJobButton} onPress={handleCreateJob}>
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createJobButtonText}>Create First Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredJobs.map(renderJobCard)
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  createButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterTabActive: {
    backgroundColor: '#8b5cf6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'capitalize',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobBadges: {
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
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
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 16,
  },
  jobProperty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyName: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '600',
  },
  jobSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  durationText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  assignedStaff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffName: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  staffRole: {
    fontSize: 12,
    color: '#9ca3af',
  },
  jobDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  moreButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  restrictedText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  restrictedSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
    marginBottom: 20,
  },
  createJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createJobButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});
