import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  FlatList,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useJobContext } from '@/contexts/JobContext';
import { JobData } from '@/types/jobData';
import StaffJobsView from '@/components/jobs/StaffJobsView';
import EnhancedStaffJobsView from '@/components/jobs/EnhancedStaffJobsView';
import JobNotificationBanner from '@/components/JobNotificationBanner';
import ErrorBoundary, { JobListErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingState, EmptyState, LoadingSkeleton, ErrorState } from '@/components/shared/StateComponents';
import SharedJobCard from '@/components/shared/SharedJobCard';
import { 
  getJobTypeIcon, 
  getStatusColor, 
  getStatusText, 
  formatJobDate,
  JOB_COLORS,
  COMMON_STYLES 
} from '@/utils/jobUtils';

const { width: screenWidth } = Dimensions.get('window');

const filterOptions = ['All', 'Assigned', 'In Progress', 'Scheduled', 'Completed'];

export default function JobsScreen() {
  const { currentProfile } = usePINAuth();
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
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);

  // Show active job notification if there are unread notifications
  const activeNotification = notifications.find(n => n.status !== 'read' && n.type === 'job_assigned');

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
    const statusMatches = selectedFilter === 'All' || 
      (selectedFilter === 'Assigned' && job.status === 'assigned') ||
      (selectedFilter === 'In Progress' && job.status === 'in_progress') ||
      (selectedFilter === 'Scheduled' && job.status === 'pending') ||
      (selectedFilter === 'Completed' && job.status === 'completed');

    // Filter by search query
    const searchMatches = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.propertyId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatches && searchMatches;
  });

  const renderJobCard = ({ item: job, index }: { item: JobData; index: number }) => {
    // Convert JobData to JobCardData format
    const jobCardData = {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      priority: job.priority || 'medium',
      jobType: job.jobType,
      estimatedDuration: job.estimatedDuration,
      scheduledDate: job.scheduledDate,
      location: job.location,
      propertyRef: job.propertyRef,
      propertyId: job.propertyId,
    };

    const handleJobPress = (jobData: any) => {
      console.log('View details:', jobData.id);
    };

    const handleActionPress = (jobData: any, action: string) => {
      switch (action) {
        case 'details':
          console.log('View details:', jobData.id);
          break;
        case 'map':
          console.log('Open map:', jobData.id);
          break;
      }
    };

    return (
      <View
        style={{
          width: '47%',
          marginRight: index % 2 === 0 ? '6%' : 0,
        }}
      >
        <SharedJobCard
          job={jobCardData}
          onPress={handleJobPress}
          onActionPress={handleActionPress}
          compact={true}
          animationDelay={index * 100}
          actions={[
            { label: 'Details', action: 'details', icon: 'eye-outline' },
            { label: 'Map', action: 'map', icon: 'map-outline' },
          ]}
        />
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: JOB_COLORS.background }}>
        <StatusBar barStyle="light-content" backgroundColor={JOB_COLORS.background} />
        <SafeAreaView style={{ flex: 1 }}>
          <LoadingSkeleton count={6} />
        </SafeAreaView>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: JOB_COLORS.background }}>
        <StatusBar barStyle="light-content" backgroundColor={JOB_COLORS.background} />
        <SafeAreaView style={{ flex: 1 }}>
          <ErrorState
            title="Unable to load jobs"
            message={error}
            onRetry={refreshJobs}
            retryLabel="Retry"
            icon="briefcase-outline"
          />
        </SafeAreaView>
      </View>
    );
  }

  // Render empty state
  const renderEmptyState = () => (
    <EmptyState
      title="No Jobs Available"
      message="There are no jobs matching your current filter. Try adjusting your search or filter criteria."
      actionLabel="Show All Jobs"
      onAction={() => setSelectedFilter('All')}
      icon="briefcase-outline"
    />
  );

  return (
    <JobListErrorBoundary>
      <View style={{ flex: 1, backgroundColor: JOB_COLORS.background }}>
        <StatusBar barStyle="light-content" backgroundColor={JOB_COLORS.background} />
      
      {/* Job Notification Banner */}
      {activeNotification && (
        <JobNotificationBanner
          notification={activeNotification}
          onDismiss={() => console.log('Notification dismissed')}
        />
      )}
      
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={600}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
        >
          <View>
            <Text style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold',
              fontFamily: 'Urbanist'
            }}>
              Active Jobs
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 4,
              fontFamily: 'Inter'
            }}>
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(198, 255, 0, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => console.log('Add new job')}
            accessibilityLabel="Add new job"
          >
            <Ionicons name="add" size={24} color="#C6FF00" />
          </TouchableOpacity>
        </Animatable.View>

        {/* Search Bar */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={100}
          style={{
            backgroundColor: '#1C1F2A',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#374151',
          }}
        >
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
          <TextInput
            style={{
              flex: 1,
              color: 'white',
              fontSize: 16,
              fontFamily: 'Inter'
            }}
            placeholder="Search jobs..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </Animatable.View>

        {/* Filter Chips */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={200}
          style={{ marginBottom: 24 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0 }}
          >
            {filterOptions.map((filter, index) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={{ marginRight: 12 }}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: selectedFilter === filter 
                      ? 'rgba(198, 255, 0, 0.2)' 
                      : '#1C1F2A',
                    borderWidth: 1,
                    borderColor: selectedFilter === filter 
                      ? 'rgba(198, 255, 0, 0.3)' 
                      : '#374151',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: selectedFilter === filter ? '#C6FF00' : '#9CA3AF',
                      fontFamily: 'Inter'
                    }}
                  >
                    {filter}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animatable.View>

        {/* Jobs Grid */}
        {loading ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingVertical: 60 
          }}>
            <ActivityIndicator size="large" color="#C6FF00" />
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 16,
              fontFamily: 'Inter_400Regular'
            }}>
              Loading jobs...
            </Text>
          </View>
        ) : error ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingVertical: 60,
            paddingHorizontal: 32 
          }}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={{
              color: '#F1F1F1',
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
              textAlign: 'center',
              fontFamily: 'Inter_600SemiBold'
            }}>
              Error Loading Jobs
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center',
              fontFamily: 'Inter_400Regular'
            }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={refreshJobs}
              style={{
                backgroundColor: '#C6FF00',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 24,
              }}
            >
              <Text style={{
                color: '#0B0F1A',
                fontSize: 14,
                fontWeight: '600',
                fontFamily: 'Inter_600SemiBold'
              }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredJobs.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#C6FF00']}
                tintColor="#C6FF00"
                progressBackgroundColor="rgba(198, 255, 0, 0.1)"
              />
            }
            ListEmptyComponent={renderEmptyState}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
          />
        )}
      </SafeAreaView>
    </View>
    </JobListErrorBoundary>
  );
}


