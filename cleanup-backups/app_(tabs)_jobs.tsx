import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useJobContext } from '@/contexts/JobContext';
import { JobData } from '@/types/jobData';
import EnhancedStaffJobsView from '@/components/jobs/EnhancedStaffJobsView';
import { JobNotificationBanner } from '@/components/JobNotificationBanner';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import SharedJobCard from '@/components/shared/SharedJobCard';
import { useTranslation } from '@/hooks/useTranslation';
import { shouldShowNotification } from '@/utils/notificationDedup';

const filterOptions = [
  { key: 'all', label: 'jobs.all' },
  { key: 'assigned', label: 'jobs.assigned' },
  { key: 'inProgress', label: 'jobs.inProgress' },
  { key: 'scheduled', label: 'jobs.scheduled' },
  { key: 'completed', label: 'jobs.completed' }
];

export default function JobsScreen() {
  const router = useRouter();
  const { currentProfile } = usePINAuth();
  const { t } = useTranslation();
  const { 
    jobs, 
    assignedJobs, 
    loading, 
    error, 
    refreshJobs,
    notifications,
    unreadNotificationCount 
  } = useJobContext();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);

  // Show active job notification if there are unread notifications
  // Get the first unread notification that should be displayed
  const activeNotification = notifications.find(n => {
    const isUnread = n.status !== 'read' && n.type === 'job_assigned';
    if (!isUnread) return false;
    
    // Check if this notification should be shown (deduplication)
    return shouldShowNotification(
      n.jobId, 
      currentProfile?.id || '', 
      'banner'
    );
  });

  // Render Enhanced Staff Jobs View for staff users
  if (isStaffUser) {
    return (
      <ErrorBoundary>
        <EnhancedStaffJobsView />
      </ErrorBoundary>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  };

  // Filter jobs based on selected filter and search query
  const filteredJobs = jobs.filter((job: JobData) => {
    // Filter by status
    const statusMatches = selectedFilter === 'all' || 
      (selectedFilter === 'assigned' && job.status === 'assigned') ||
      (selectedFilter === 'inProgress' && job.status === 'in_progress') ||
      (selectedFilter === 'scheduled' && job.status === 'pending') ||
      (selectedFilter === 'completed' && job.status === 'completed');

    // Filter by search query
    const searchMatches = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.propertyId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatches && searchMatches;
  });

  const handleCreateJob = () => {
    Alert.alert(t('jobs.createJob'), t('jobs.createJobComingSoon'));
  };

  const handleJobPress = (jobData: any) => {
    console.log('View details:', jobData.id);
    router.push(`/jobs/${jobData.id}`);
  };

  const handleActionPress = (jobData: any, action: string) => {
    switch (action) {
      case 'details':
        console.log('View details:', jobData.id);
        router.push(`/jobs/${jobData.id}`);
        break;
      case 'map':
        console.log('Open map:', jobData.id);
        break;
    }
  };

  const renderJobItem = ({ item: job }: { item: JobData }) => {
    // Defensive programming - ensure job has required properties
    if (!job || !job.id) {
      console.warn('Invalid job data received:', job);
      return null;
    }

    const jobCardData = {
      id: job.id,
      title: job.title || 'Untitled Job',
      description: job.description || '',
      status: job.status || 'pending',
      priority: job.priority || 'medium',
      jobType: job.jobType || 'other',
      estimatedDuration: job.estimatedDuration,
      scheduledDate: job.scheduledDate,
      location: job.location,
      propertyRef: job.propertyRef,
      propertyId: job.propertyId,
    };

    return (
      <View style={styles.jobCardContainer}>
        <SharedJobCard
          job={jobCardData}
          onPress={handleJobPress}
          onActionPress={handleActionPress}
          compact={false}
          actions={[
            { label: t('jobs.details'), action: 'details', icon: 'eye-outline' },
            { label: t('jobs.map'), action: 'map', icon: 'map-outline' },
          ]}
        />
      </View>
    );
  };

  return (
    <JobListErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Job Notification Banner */}
        {activeNotification && (
          <JobNotificationBanner
            jobId={activeNotification.jobId}
            message={`New job assigned: ${activeNotification.jobTitle}`}
            onDismiss={() => console.log('Notification dismissed')}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('navigation.jobs')}</Text>
            <Text style={styles.headerSubtitle}>
              {currentProfile?.name} • {filteredJobs.length} {t(`jobs.jobCount_${filteredJobs.length === 1 ? 'one' : 'other'}`)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateJob}
          >
            <Ionicons name="add" size={20} color="#0B0F1A" />
            <Text style={styles.createButtonText}>{t('jobs.createJob')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#8E9AAE" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('jobs.searchJobs')}
              placeholderTextColor="#8E9AAE"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8E9AAE" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollView}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter.key && styles.filterChipTextActive
                ]}>
                  {t(filter.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C6FF00" />
              <Text style={styles.loadingText}>{t('jobs.loadingJobs')}</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#FF4444" />
              <Text style={styles.emptyTitle}>{t('jobs.errorLoadingJobs')}</Text>
              <Text style={styles.emptyMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshJobs}>
                <Text style={styles.retryButtonText}>{t('jobs.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#8E9AAE" />
              <Text style={styles.emptyTitle}>{t('jobs.noJobsFound')}</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery || selectedFilter !== 'all' 
                  ? t('jobs.noJobsMatch')
                  : t('jobs.noJobsAvailable')}
              </Text>
              {(searchQuery || selectedFilter !== 'all') && (
                <TouchableOpacity 
                  style={styles.clearFiltersButton} 
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                >
                  <Text style={styles.clearFiltersButtonText}>{t('jobs.clearFilters')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredJobs}
              renderItem={renderJobItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.jobsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#C6FF00']}
                  tintColor="#C6FF00"
                />
              }
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#C6FF00',
    borderRadius: 8,
    marginTop: 4,
  },
  createButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2A3A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filtersScrollView: {
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
  retryButton: {
    backgroundColor: '#C6FF00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  clearFiltersButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6FF00',
    marginTop: 24,
  },
  clearFiltersButtonText: {
    color: '#C6FF00',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  jobsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  jobCardContainer: {
    marginBottom: 16,
  },
});


