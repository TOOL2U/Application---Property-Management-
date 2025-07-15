import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Filter,
  Plus,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react-native';
import { NeumorphicCard, NeumorphicButton } from '@/components/ui/NeumorphicComponents';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAuth } from '@/contexts/AuthContext';
import StaffJobsView from '@/components/jobs/StaffJobsView';
import EnhancedStaffJobsView from '@/components/jobs/EnhancedStaffJobsView';

const { width: screenWidth } = Dimensions.get('window');

// Mock jobs data
const mockJobs = [
  {
    id: '1',
    title: 'HVAC System Maintenance',
    property: 'Oceanview Apartments',
    unit: 'Unit 4B',
    address: '2847 Coastal Drive, Miami Beach, FL',
    priority: 'high',
    status: 'in_progress',
    scheduledTime: '2:30 PM',
    estimatedDuration: '2-3 hours',
    tenant: 'Maria Rodriguez',
    phone: '(305) 555-0123',
    description: 'Annual HVAC system maintenance and filter replacement',
    completedTasks: 2,
    totalTasks: 5,
  },
  {
    id: '2',
    title: 'Emergency Plumbing Repair',
    property: 'Sunset Gardens',
    unit: 'Building C',
    address: '1456 Garden View Blvd, Coral Gables, FL',
    priority: 'urgent',
    status: 'assigned',
    scheduledTime: '4:00 PM',
    estimatedDuration: '1-2 hours',
    tenant: 'James Chen',
    phone: '(305) 555-0456',
    description: 'Kitchen sink leak causing water damage',
    completedTasks: 0,
    totalTasks: 3,
  },
  {
    id: '3',
    title: 'Electrical Outlet Installation',
    property: 'Downtown Lofts',
    unit: 'Unit 12A',
    address: '789 Biscayne Boulevard, Miami, FL',
    priority: 'medium',
    status: 'scheduled',
    scheduledTime: '10:00 AM',
    estimatedDuration: '1 hour',
    tenant: 'Sarah Williams',
    phone: '(305) 555-0789',
    description: 'Install additional electrical outlets in bedroom',
    completedTasks: 0,
    totalTasks: 2,
  },
  {
    id: '4',
    title: 'Pool Cleaning Service',
    property: 'Luxury Villas',
    unit: 'Villa 8',
    address: '456 Ocean Drive, Key Biscayne, FL',
    priority: 'low',
    status: 'completed',
    scheduledTime: '11:00 AM',
    estimatedDuration: '45 minutes',
    tenant: 'Michael Johnson',
    phone: '(305) 555-0321',
    description: 'Weekly pool cleaning and chemical balancing',
    completedTasks: 3,
    totalTasks: 3,
  },
];

const filterOptions = ['All', 'Assigned', 'In Progress', 'Scheduled', 'Completed'];

export default function JobsScreen() {
  const { hasRole } = useStaffAuth();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);

  // Render Enhanced Staff Jobs View for staff users
  if (isStaffUser) {
    return <EnhancedStaffJobsView />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return NeumorphicTheme.colors.semantic.error;
      case 'high': return NeumorphicTheme.colors.semantic.warning;
      case 'medium': return NeumorphicTheme.colors.brand.primary;
      default: return NeumorphicTheme.colors.semantic.success;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return NeumorphicTheme.colors.semantic.info;
      case 'assigned': return NeumorphicTheme.colors.semantic.warning;
      case 'completed': return NeumorphicTheme.colors.semantic.success;
      default: return NeumorphicTheme.colors.text.tertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return Play;
      case 'assigned': return Clock;
      case 'completed': return CheckCircle;
      default: return Pause;
    }
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesFilter = selectedFilter === 'All' || 
      job.status.replace('_', ' ').toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.property.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={NeumorphicTheme.gradients.backgroundMain}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jobs</Text>
          <TouchableOpacity style={styles.addButton}>
            <NeumorphicCard style={styles.addButtonCard}>
              <Plus size={20} color={NeumorphicTheme.colors.brand.primary} />
            </NeumorphicCard>
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <NeumorphicCard style={styles.searchCard}>
            <View style={styles.searchContent}>
              <Search size={20} color={NeumorphicTheme.colors.text.tertiary} />
              <Text
                style={styles.searchInput}
                placeholder="Search jobs..."
                placeholderTextColor={NeumorphicTheme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </NeumorphicCard>

          <TouchableOpacity style={styles.filterButton}>
            <NeumorphicCard style={styles.filterButtonCard}>
              <Filter size={20} color={NeumorphicTheme.colors.text.secondary} />
            </NeumorphicCard>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={styles.filterChip}
            >
              <NeumorphicCard 
                variant={selectedFilter === filter ? 'elevated' : 'default'}
                style={[
                  styles.filterChipCard,
                  selectedFilter === filter && styles.filterChipSelected
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextSelected
                ]}>
                  {filter}
                </Text>
              </NeumorphicCard>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Jobs List */}
        <ScrollView
          style={styles.jobsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[NeumorphicTheme.colors.brand.primary]}
              tintColor={NeumorphicTheme.colors.brand.primary}
              progressBackgroundColor="rgba(139, 92, 246, 0.1)"
            />
          }
        >
          {filteredJobs.map((job) => {
            const StatusIcon = getStatusIcon(job.status);
            const priorityColor = getPriorityColor(job.priority);
            const statusColor = getStatusColor(job.status);

            return (
              <TouchableOpacity key={job.id} style={styles.jobItem}>
                <NeumorphicCard style={styles.jobCard}>
                  {/* Job Header */}
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleSection}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <View style={styles.jobLocation}>
                        <MapPin size={12} color={NeumorphicTheme.colors.text.tertiary} />
                        <Text style={styles.jobLocationText}>
                          {job.property} - {job.unit}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.jobBadges}>
                      <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                        <Text style={[styles.priorityText, { color: priorityColor }]}>
                          {job.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Job Details */}
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetailRow}>
                      <View style={styles.jobDetailItem}>
                        <Clock size={14} color={NeumorphicTheme.colors.text.tertiary} />
                        <Text style={styles.jobDetailText}>{job.scheduledTime}</Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <Phone size={14} color={NeumorphicTheme.colors.text.tertiary} />
                        <Text style={styles.jobDetailText}>{job.tenant}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.jobDescription}>{job.description}</Text>
                  </View>

                  {/* Job Progress */}
                  <View style={styles.jobProgress}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>
                        Progress: {job.completedTasks}/{job.totalTasks} tasks
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill,
                            { 
                              width: `${(job.completedTasks / job.totalTasks) * 100}%`,
                              backgroundColor: statusColor
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                      <StatusIcon size={12} color={statusColor} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Job Actions */}
                  <View style={styles.jobActions}>
                    {job.status === 'assigned' && (
                      <NeumorphicButton
                        title="Start Job"
                        onPress={() => console.log('Start job:', job.id)}
                        variant="primary"
                        size="small"
                        style={styles.actionButton}
                      />
                    )}
                    {job.status === 'in_progress' && (
                      <NeumorphicButton
                        title="Update Progress"
                        onPress={() => console.log('Update progress:', job.id)}
                        variant="secondary"
                        size="small"
                        style={styles.actionButton}
                      />
                    )}
                    <TouchableOpacity style={styles.moreButton}>
                      <Text style={styles.moreButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </NeumorphicCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[5],
    paddingTop: NeumorphicTheme.spacing[4],
    paddingBottom: NeumorphicTheme.spacing[6],
  },
  headerTitle: {
    color: NeumorphicTheme.colors.text.primary,
    fontSize: NeumorphicTheme.typography.sizes['3xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
  },
  addButton: {
    width: 44,
    height: 44,
  },
  addButtonCard: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: NeumorphicTheme.spacing[5],
    marginBottom: NeumorphicTheme.spacing[4],
    gap: NeumorphicTheme.spacing[3],
  },
  searchCard: {
    flex: 1,
    height: 48,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[4],
    gap: NeumorphicTheme.spacing[3],
  },
  searchInput: {
    flex: 1,
    color: NeumorphicTheme.colors.text.primary,
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
  },
  filterButton: {
    width: 48,
    height: 48,
  },
  filterButtonCard: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersContainer: {
    marginBottom: NeumorphicTheme.spacing[6],
  },
  filtersContent: {
    paddingHorizontal: NeumorphicTheme.spacing[5],
    gap: NeumorphicTheme.spacing[2],
  },
  filterChip: {
    height: 36,
  },
  filterChipCard: {
    height: 36,
    paddingHorizontal: NeumorphicTheme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: `${NeumorphicTheme.colors.brand.primary}20`,
  },
  filterChipText: {
    color: NeumorphicTheme.colors.text.secondary,
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
  filterChipTextSelected: {
    color: NeumorphicTheme.colors.brand.primary,
  },

  // Jobs List
  jobsList: {
    flex: 1,
    paddingHorizontal: NeumorphicTheme.spacing[5],
  },
  jobItem: {
    marginBottom: NeumorphicTheme.spacing[4],
  },
  jobCard: {
    padding: NeumorphicTheme.spacing[4],
  },

  // Job Header
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: NeumorphicTheme.spacing[3],
  },
  jobTitleSection: {
    flex: 1,
    marginRight: NeumorphicTheme.spacing[3],
  },
  jobTitle: {
    color: NeumorphicTheme.colors.text.primary,
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[1],
  },
  jobLocationText: {
    color: NeumorphicTheme.colors.text.tertiary,
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
  },
  jobBadges: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
  },
  priorityText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
  },

  // Job Details
  jobDetails: {
    marginBottom: NeumorphicTheme.spacing[3],
  },
  jobDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: NeumorphicTheme.spacing[2],
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[1],
  },
  jobDetailText: {
    color: NeumorphicTheme.colors.text.secondary,
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
  },
  jobDescription: {
    color: NeumorphicTheme.colors.text.tertiary,
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    lineHeight: 20,
  },

  // Job Progress
  jobProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: NeumorphicTheme.spacing[3],
  },
  progressInfo: {
    flex: 1,
    marginRight: NeumorphicTheme.spacing[3],
  },
  progressText: {
    color: NeumorphicTheme.colors.text.secondary,
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  progressBar: {
    height: 4,
    backgroundColor: NeumorphicTheme.colors.surface.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[1],
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
  },
  statusText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
  },

  // Job Actions
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginRight: NeumorphicTheme.spacing[3],
  },
  moreButton: {
    paddingVertical: NeumorphicTheme.spacing[2],
  },
  moreButtonText: {
    color: NeumorphicTheme.colors.brand.primary,
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
});
