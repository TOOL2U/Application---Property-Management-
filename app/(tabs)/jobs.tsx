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
import { useRouter, useFocusEffect } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useJobContext } from '@/contexts/JobContext';
import { JobData } from '@/types/jobData';
import EnhancedStaffJobsView from '@/components/jobs/EnhancedStaffJobsView';
import { JobNotificationBanner } from '@/components/JobNotificationBanner';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import SharedJobCard from '@/components/shared/SharedJobCard';
import { useTranslation } from '@/hooks/useTranslation';
import { shouldShowNotification } from '@/utils/notificationDedup';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';
import { Button } from '@/components/ui/BrandButton';

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

  // Auto-refresh on screen focus for better UX
  useFocusEffect(
    React.useCallback(() => {
      if (!isStaffUser) {
        console.log('🔄 Admin Jobs Screen: Screen focused, refreshing jobs...');
        refreshJobs();
      }
    }, [isStaffUser, refreshJobs])
  );

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
      <Card variant="standard" style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {jobCardData.title}
            </Text>
            <Text style={styles.jobProperty} numberOfLines={1}>
              {jobCardData.propertyId || 'Property ID not available'}
            </Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: job.status === 'completed' ? BrandTheme.colors.SUCCESS :
                           job.status === 'in_progress' ? BrandTheme.colors.WARNING :
                           job.status === 'assigned' ? BrandTheme.colors.INFO :
                           BrandTheme.colors.TEXT_SECONDARY
          }]}>
            <Text style={styles.statusText}>
              {job.status?.toUpperCase().replace('_', ' ')}
            </Text>
          </View>
        </View>

        {job.description && (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>
        )}

        <View style={styles.jobDetails}>
          {job.scheduledDate && (
            <View style={styles.jobDetailItem}>
              <Ionicons name="calendar-outline" size={16} color={BrandTheme.colors.TEXT_SECONDARY} />
              <Text style={styles.jobDetailText}>
                {new Date(job.scheduledDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {job.estimatedDuration && (
            <View style={styles.jobDetailItem}>
              <Ionicons name="time-outline" size={16} color={BrandTheme.colors.TEXT_SECONDARY} />
              <Text style={styles.jobDetailText}>
                {job.estimatedDuration}
              </Text>
            </View>
          )}

          <View style={styles.jobDetailItem}>
            <Ionicons name="flag-outline" size={16} color={BrandTheme.colors.TEXT_SECONDARY} />
            <Text style={[styles.jobDetailText, {
              color: job.priority === 'high' ? BrandTheme.colors.ERROR :
                     job.priority === 'medium' ? BrandTheme.colors.WARNING :
                     BrandTheme.colors.SUCCESS
            }]}>
              {(job.priority || 'medium').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.jobActions}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleJobPress(jobCardData)}
          >
            <Text style={styles.viewButtonText}>VIEW DETAILS</Text>
            <Ionicons name="arrow-forward" size={16} color={BrandTheme.colors.YELLOW} />
          </TouchableOpacity>
        </View>
      </Card>
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
          
          <Button
            title="CREATE JOB"
            variant="primary"
            onPress={handleCreateJob}
            style={styles.createButton}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Card variant="standard" style={styles.searchCard}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={BrandTheme.colors.TEXT_SECONDARY} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('jobs.searchJobs')}
                placeholderTextColor={BrandTheme.colors.TEXT_SECONDARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={BrandTheme.colors.TEXT_SECONDARY} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
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
                  {t(filter.label).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
              <Text style={styles.loadingText}>{t('jobs.loadingJobs')}</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={BrandTheme.colors.ERROR} />
              <Text style={styles.emptyTitle}>{t('jobs.errorLoadingJobs')}</Text>
              <Text style={styles.emptyMessage}>{error}</Text>
              <Button
                title="TRY AGAIN"
                variant="primary"
                onPress={refreshJobs}
                style={styles.retryButton}
              />
            </View>
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color={BrandTheme.colors.TEXT_SECONDARY} />
              <Text style={styles.emptyTitle}>{t('jobs.noJobsFound')}</Text>
              <Text style={styles.emptyMessage}>
                {searchQuery || selectedFilter !== 'all' 
                  ? t('jobs.noJobsMatch')
                  : t('jobs.noJobsAvailable')}
              </Text>
              {(searchQuery || selectedFilter !== 'all') && (
                <Button
                  title="CLEAR FILTERS"
                  variant="outline"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  style={styles.clearFiltersButton}
                />
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
                  colors={[BrandTheme.colors.YELLOW]}
                  tintColor={BrandTheme.colors.YELLOW}
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
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.display,
    fontSize: 32,
    color: BrandTheme.colors.TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  headerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
  },

  createButton: {
    marginTop: BrandTheme.spacing.XS,
  },

  searchContainer: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
  },

  searchCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BrandTheme.spacing.MD,
    paddingVertical: BrandTheme.spacing.SM,
    gap: BrandTheme.spacing.SM,
  },

  searchInput: {
    flex: 1,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  filtersContainer: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingBottom: BrandTheme.spacing.MD,
  },

  filtersScrollView: {
    gap: BrandTheme.spacing.SM,
  },

  filterChip: {
    paddingHorizontal: BrandTheme.spacing.MD,
    paddingVertical: BrandTheme.spacing.SM,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 0, // Brand kit: sharp corners
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },

  filterChipActive: {
    backgroundColor: BrandTheme.colors.YELLOW,
    borderColor: BrandTheme.colors.YELLOW,
  },

  filterChipText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_SECONDARY,
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
    paddingVertical: BrandTheme.spacing.XXL,
  },

  loadingText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: BrandTheme.spacing.MD,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XXL,
    paddingHorizontal: BrandTheme.spacing.XXL,
  },

  emptyTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: BrandTheme.spacing.LG,
  },

  emptyMessage: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: BrandTheme.spacing.SM,
    lineHeight: 22,
  },

  retryButton: {
    marginTop: BrandTheme.spacing.XL,
  },

  clearFiltersButton: {
    marginTop: BrandTheme.spacing.XL,
  },

  jobsList: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingBottom: 100,
  },

  jobCard: {
    marginBottom: BrandTheme.spacing.MD,
  },

  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: BrandTheme.spacing.SM,
  },

  jobHeaderLeft: {
    flex: 1,
    marginRight: BrandTheme.spacing.SM,
  },

  jobTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.XS,
  },

  jobProperty: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  statusBadge: {
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: BrandTheme.spacing.XS,
    borderRadius: 0, // Brand kit: sharp corners
  },

  statusText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  jobDescription: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: BrandTheme.spacing.MD,
  },

  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandTheme.spacing.MD,
    marginBottom: BrandTheme.spacing.MD,
  },

  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.XS,
  },

  jobDetailText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  jobActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.XS,
  },

  viewButtonText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
