/**
 * Enhanced Active Jobs View with Progressive Loading
 * Implements 4-tier data structure for optimal mobile performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEnhancedMobileJob } from '../../hooks/useEnhancedMobileJob';
import enhancedMobileJobService from '../../services/enhancedMobileJobService';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to get priority style
const getPriorityStyle = (priority: string = 'medium') => {
  switch (priority.toLowerCase()) {
    case 'low': return styles.priorityLow;
    case 'medium': return styles.priorityMedium;
    case 'high': return styles.priorityHigh;
    case 'urgent': return styles.priorityUrgent;
    default: return styles.priorityMedium;
  }
};

interface ActiveJobsViewProps {
  staffId: string;
}

interface JobCardProps {
  jobId: string;
  staffId: string;
  onJobUpdate?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ jobId, staffId, onJobUpdate }) => {
  const {
    criticalData,
    jobDetails,
    propertyContext,
    completionData,
    uiState,
    isLoading,
    error,
    acceptJob,
    startJob,
    completeJob,
    loadJobDetails,
    loadPropertyContext,
    loadCompletionData,
    updateChecklistItem,
    getProgress,
    hasAllCriticalData,
    canStartJob,
    canCompleteJob
  } = useEnhancedMobileJob(jobId, staffId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'property' | 'completion'>('details');
  const animatedHeight = useState(new Animated.Value(0))[0];

  // Progress tracking
  const progress = getProgress();

  // Handle job acceptance
  const handleAcceptJob = useCallback(async () => {
    try {
      await acceptJob();
      onJobUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    }
  }, [acceptJob, onJobUpdate]);

  // Handle job start
  const handleStartJob = useCallback(async () => {
    try {
      await startJob();
      onJobUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to start job. Please try again.');
    }
  }, [startJob, onJobUpdate]);

  // Handle job completion
  const handleCompleteJob = useCallback(async () => {
    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await completeJob({
                completedAt: new Date().toISOString(),
                finalNotes: 'Job completed successfully'
              });
              onJobUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete job. Please try again.');
            }
          }
        }
      ]
    );
  }, [completeJob, onJobUpdate]);

  // Handle navigation
  const handleNavigate = useCallback(async () => {
    if (!criticalData?.googleMapsLink) {
      Alert.alert('Error', 'Navigation information not available');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(criticalData.googleMapsLink);
      if (supported) {
        await Linking.openURL(criticalData.googleMapsLink);
      } else {
        Alert.alert('Error', 'Cannot open navigation app');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open navigation');
    }
  }, [criticalData?.googleMapsLink]);

  // Handle calling
  const handleCall = useCallback(async () => {
    if (!criticalData?.emergencyContact) {
      Alert.alert('Error', 'Contact information not available');
      return;
    }

    const phoneUrl = `tel:${criticalData.emergencyContact}`;
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Cannot make phone calls');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make call');
    }
  }, [criticalData?.emergencyContact]);

  // Toggle expanded view
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 0 : 300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animatedHeight]);

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        if (!jobDetails && !isLoading.details) {
          return (
            <TouchableOpacity style={styles.loadButton} onPress={loadJobDetails}>
              <Text style={styles.loadButtonText}>Load Job Details</Text>
            </TouchableOpacity>
          );
        }
        
        if (isLoading.details) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading job details...</Text>
            </View>
          );
        }

        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Supplies Required</Text>
            {jobDetails?.suppliesRequired.map((supply, index) => (
              <Text key={index} style={styles.listItem}>• {supply}</Text>
            ))}
            
            <Text style={styles.sectionTitle}>Checklist</Text>
            {jobDetails?.checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => updateChecklistItem(item.id, !uiState.checklistProgress[item.id])}
              >
                <Ionicons
                  name={uiState.checklistProgress[item.id] ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={uiState.checklistProgress[item.id] ? '#4CAF50' : '#666'}
                />
                <Text style={[
                  styles.checklistText,
                  uiState.checklistProgress[item.id] && styles.checklistTextCompleted
                ]}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'property':
        if (!propertyContext && !isLoading.property) {
          return (
            <TouchableOpacity style={styles.loadButton} onPress={loadPropertyContext}>
              <Text style={styles.loadButtonText}>Load Property Info</Text>
            </TouchableOpacity>
          );
        }

        if (isLoading.property) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading property context...</Text>
            </View>
          );
        }

        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <Text style={styles.infoText}>Layout: {propertyContext?.layout}</Text>
            <Text style={styles.infoText}>Guest Status: {propertyContext?.guestStatus}</Text>
            <Text style={styles.infoText}>Last Cleaning: {propertyContext?.lastCleaning}</Text>
            
            {propertyContext?.specialNotes && propertyContext.specialNotes.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Special Notes</Text>
                {propertyContext.specialNotes.map((note, index) => (
                  <Text key={index} style={styles.listItem}>• {note}</Text>
                ))}
              </>
            )}

            {propertyContext?.safetyNotes && propertyContext.safetyNotes.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Safety Notes</Text>
                {propertyContext.safetyNotes.map((note, index) => (
                  <Text key={index} style={[styles.listItem, styles.safetyNote]}>⚠️ {note}</Text>
                ))}
              </>
            )}
          </View>
        );

      case 'completion':
        if (!completionData && !isLoading.completion) {
          return (
            <TouchableOpacity style={styles.loadButton} onPress={loadCompletionData}>
              <Text style={styles.loadButtonText}>Load Completion Data</Text>
            </TouchableOpacity>
          );
        }

        if (isLoading.completion) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading completion data...</Text>
            </View>
          );
        }

        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Photo Requirements</Text>
            {completionData?.photoRequirements.map((photo) => (
              <View key={photo.id} style={styles.photoRequirement}>
                <Ionicons
                  name={uiState.photosCompleted[photo.id] ? 'camera' : 'camera-outline'}
                  size={20}
                  color={uiState.photosCompleted[photo.id] ? '#4CAF50' : '#666'}
                />
                <Text style={styles.photoText}>{photo.description}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Next Steps</Text>
            {completionData?.nextSteps.map((step, index) => (
              <Text key={index} style={styles.listItem}>• {step}</Text>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  // Don't render if critical data is not loaded
  if (!hasAllCriticalData) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading job...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.jobCard}>
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.cardGradient}
      >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.jobTitle}>{criticalData?.title}</Text>
            <Text style={styles.jobTime}>{criticalData?.scheduledTime}</Text>
            <Text style={styles.jobAddress}>{criticalData?.propertyAddress}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.priorityBadge, getPriorityStyle(criticalData?.priority)]}>
              <Text style={styles.priorityText}>{criticalData?.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.overall}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress.overall)}% Complete</Text>
        </View>

        {/* Access Information */}
        <View style={styles.accessInfo}>
          <Text style={styles.accessLabel}>Access Code:</Text>
          <Text style={styles.accessValue}>{criticalData?.accessCodes}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toggleExpanded}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Job Status Actions */}
        <View style={styles.statusActions}>
          {!uiState.isAccepted && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleAcceptJob}>
              <Text style={styles.primaryButtonText}>Accept Job</Text>
            </TouchableOpacity>
          )}

          {uiState.isAccepted && !uiState.isStarted && canStartJob && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartJob}>
              <Text style={styles.primaryButtonText}>Start Job</Text>
            </TouchableOpacity>
          )}

          {uiState.isStarted && canCompleteJob && (
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteJob}>
              <Text style={styles.completeButtonText}>Complete Job</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Expandable Details Section */}
      {isExpanded && (
        <Animated.View style={[styles.expandedSection, { height: animatedHeight }]}>
          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            {['details', 'property', 'completion'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.tabContentContainer}>
            {renderTabContent()}
          </ScrollView>
        </Animated.View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const ActiveJobsView: React.FC<ActiveJobsViewProps> = ({ staffId }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const unsubscribe = await enhancedMobileJobService.subscribeToJobUpdates(
        staffId,
        (updatedJobs) => {
          setJobs(updatedJobs);
          setIsLoading(false);
          setRefreshing(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs. Please try again.');
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [staffId]);

  useEffect(() => {
    const unsubscribePromise = loadJobs();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [loadJobs]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs();
  }, [loadJobs]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading active jobs...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Jobs</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#ccc" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No active jobs</Text>
            <Text style={styles.emptySubtext}>New assignments will appear here</Text>
          </View>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              jobId={job.id}
              staffId={staffId}
              onJobUpdate={handleRefresh}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  jobCard: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  jobTime: {
    fontSize: 16,
    color: '#E3F2FD',
    marginBottom: 2,
  },
  jobAddress: {
    fontSize: 14,
    color: '#BBDEFB',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityLow: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  priorityMedium: {
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
  },
  priorityHigh: {
    backgroundColor: 'rgba(255, 87, 34, 0.8)',
  },
  priorityUrgent: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    color: '#E3F2FD',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  accessInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  accessLabel: {
    color: '#E3F2FD',
    fontSize: 14,
    marginRight: 8,
  },
  accessValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  statusActions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedSection: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  safetyNote: {
    color: '#FF5722',
    fontWeight: '500',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  checklistTextCompleted: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  photoRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  photoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  loadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default ActiveJobsView;
