/**
 * Unified AI Hub - Main AI Assistant Screen
 * Consolidates all AI features into one organized interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { useTranslation } from '@/hooks/useTranslation';
import { shadowStyles } from '@/utils/shadowUtils';

// Import AI components
import FOAChatBox from '@/components/ai/FOAChatBox';
import FieldOpsAssistant from '@/components/ai/FieldOpsAssistant';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Types
import { Job } from '@/types/job';
import { JobData } from '@/types/jobData';

const { width } = Dimensions.get('window');

type AITabType = 'assistant' | 'chat' | 'analytics' | 'logs';

interface AITabOption {
  id: AITabType;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
  gradient: string[];
}

const AI_TABS: AITabOption[] = [
  {
    id: 'assistant',
    title: 'Field Assistant',
    icon: 'hardware-chip',
    description: 'Real-time job guidance & task optimization',
    color: '#C6FF00',
    gradient: ['#C6FF00', '#8BC34A'],
  },
  {
    id: 'chat',
    title: 'FOA Chat',
    icon: 'chatbubbles',
    description: 'Interactive AI conversations & support',
    color: '#00E5FF',
    gradient: ['#00E5FF', '#0091EA'],
  },
  {
    id: 'analytics',
    title: 'AI Analytics',
    icon: 'analytics',
    description: 'Performance insights & productivity metrics',
    color: '#FF6B35',
    gradient: ['#FF6B35', '#F7931E'],
  },
  {
    id: 'logs',
    title: 'Activity Logs',
    icon: 'list',
    description: 'AI interaction history & timeline',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#673AB7'],
  },
];

export default function AIHubScreen() {
  const { currentProfile } = usePINAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const {
    jobs,
    activeJobs,
    pendingJobs,
    loading,
    refreshJobs,
  } = useStaffJobs({
    enableRealtime: true,
  });

  const [activeTab, setActiveTab] = useState<AITabType>('assistant');
  const [selectedJob, setSelectedJob] = useState<Job | JobData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tabAnimation] = useState(new Animated.Value(0));

  // Auto-select the first active job
  useEffect(() => {
    if (activeJobs.length > 0 && !selectedJob) {
      setSelectedJob(activeJobs[0]);
    }
  }, [activeJobs, selectedJob]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshJobs();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle tab change with animation
  const handleTabChange = (tabId: AITabType) => {
    if (tabId === activeTab) return;

    Animated.timing(tabAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tabId);
      Animated.timing(tabAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Render tab selector
  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContainer}
      >
        {AI_TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                isActive && styles.activeTabButton,
              ]}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={[tab.gradient[0], tab.gradient[1]] as const}
                  style={styles.activeTabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.tabContent}>
                    <Ionicons 
                      name={tab.icon} 
                      size={20} 
                      color="#0B0F1A" 
                    />
                    <Text style={styles.activeTabText}>{tab.title}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.tabContent}>
                  <Ionicons 
                    name={tab.icon} 
                    size={20} 
                    color="#666666" 
                  />
                  <Text style={styles.inactiveTabText}>{tab.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    const animationStyle = {
      opacity: tabAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    };

    return (
      <Animated.View style={[styles.contentContainer, animationStyle]}>
        <ErrorBoundary>
          {activeTab === 'assistant' && (
            <View style={styles.assistantContainer}>
              {selectedJob ? (
                <View style={styles.fieldOpsWrapper}>
                  <FieldOpsAssistant
                    job={selectedJob as Job}
                    visible={true}
                    embedded={true}
                  />
                </View>
              ) : (
                <View style={styles.noJobContainer}>
                  <Ionicons name="hardware-chip-outline" size={64} color="#C6FF00" />
                  <Text style={styles.noJobTitle}>No Active Job Selected</Text>
                  <Text style={styles.noJobDescription}>
                    Accept a job to get AI-powered field operations guidance
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'chat' && (
            <View style={styles.chatContainer}>
              {selectedJob ? (
                <View style={styles.foaChatWrapper}>
                  <FOAChatBox 
                    job={selectedJob as JobData}
                    staffId={currentProfile?.id || ''}
                    style={styles.foaChatStyle}
                  />
                </View>
              ) : (
                <View style={styles.noJobContainer}>
                  <Ionicons name="chatbubbles-outline" size={64} color="#666666" />
                  <Text style={styles.noJobTitle}>No Active Job Selected</Text>
                  <Text style={styles.noJobDescription}>
                    Accept a job to start chatting with the FOA Assistant
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'analytics' && (
            <View style={styles.placeholderContent}>
              <Ionicons name="analytics" size={64} color="#FF6B35" />
              <Text style={styles.placeholderTitle}>AI Analytics Dashboard</Text>
              <Text style={styles.placeholderDescription}>
                Performance insights and productivity metrics from your AI interactions
              </Text>
              <View style={styles.analyticsPreview}>
                <Text style={styles.analyticsText}>• Total AI Interactions: 127</Text>
                <Text style={styles.analyticsText}>• Avg Response Time: 1.2s</Text>
                <Text style={styles.analyticsText}>• Helpfulness Rating: 4.8/5</Text>
                <Text style={styles.analyticsText}>• Jobs Completed with AI: 23</Text>
              </View>
            </View>
          )}
          
          {activeTab === 'logs' && (
            <View style={styles.placeholderContent}>
              <Ionicons name="list" size={64} color="#9C27B0" />
              <Text style={styles.placeholderTitle}>AI Activity Timeline</Text>
              <Text style={styles.placeholderDescription}>
                Comprehensive history of all AI interactions and assistance
              </Text>
              <View style={styles.logsPreview}>
                <View style={styles.logItem}>
                  <View style={styles.logDot} />
                  <Text style={styles.logText}>Asked about safety protocols - 2h ago</Text>
                </View>
                <View style={styles.logItem}>
                  <View style={styles.logDot} />
                  <Text style={styles.logText}>Received job optimization tips - 4h ago</Text>
                </View>
                <View style={styles.logItem}>
                  <View style={styles.logDot} />
                  <Text style={styles.logText}>Generated task checklist - 1d ago</Text>
                </View>
              </View>
            </View>
          )}
        </ErrorBoundary>
      </Animated.View>
    );
  };

  // Render header
  const renderHeader = () => {
    const activeTabData = AI_TABS.find(tab => tab.id === activeTab);
    
    return (
      <LinearGradient
        colors={['#0B0F1A', '#1A1F2E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>AI Assistant Hub</Text>
              <Text style={styles.headerSubtitle}>
                {activeTabData?.description || 'AI-powered field operations'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={refreshing ? "#666666" : "#C6FF00"} 
              />
            </TouchableOpacity>
          </View>

          {/* Job Selector for Assistant and Chat tabs */}
          {(activeTab === 'assistant' || activeTab === 'chat') && activeJobs.length > 0 && (
            <View style={styles.jobSelectorContainer}>
              <Text style={styles.jobSelectorLabel}>Active Job:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.jobScrollContainer}
              >
                {activeJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[
                      styles.jobChip,
                      selectedJob?.id === job.id && styles.selectedJobChip,
                    ]}
                    onPress={() => setSelectedJob(job)}
                  >
                    <Text style={[
                      styles.jobChipText,
                      selectedJob?.id === job.id && styles.selectedJobChipText,
                    ]}>
                      {job.title || job.description || 'Job ' + job.id.slice(-4)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#666666" />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorDescription}>
            Please log in to access AI Assistant features
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      
      {renderHeader()}
      {renderTabSelector()}
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C6FF00"
            colors={['#C6FF00']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#C6FF00',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  jobSelectorContainer: {
    gap: 8,
  },
  jobSelectorLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  jobScrollContainer: {
    flexGrow: 0,
  },
  jobChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedJobChip: {
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    borderColor: '#C6FF00',
  },
  jobChipText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  selectedJobChipText: {
    color: '#C6FF00',
    fontWeight: '600' as const,
  },
  tabContainer: {
    backgroundColor: '#1A1F2E',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  tabScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tabButton: {
    minWidth: 140,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  activeTabButton: {
    ...shadowStyles.large,
  },
  activeTabGradient: {
    flex: 1,
    borderRadius: 16,
  },
  tabContent: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#0B0F1A',
    textAlign: 'center' as const,
  },
  inactiveTabText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#666666',
    textAlign: 'center' as const,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    minHeight: 600,
  },
  assistantContainer: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  fieldOpsWrapper: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  foaChatWrapper: {
    flex: 1,
    backgroundColor: '#0B0F1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  foaChatStyle: {
    backgroundColor: '#0B0F1A',
  },
  noJobContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    gap: 16,
  },
  noJobTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  noJobDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  errorDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    paddingVertical: 60,
    gap: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  selectedJobInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.3)',
  },
  selectedJobTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#C6FF00',
    textAlign: 'center' as const,
  },
  analyticsPreview: {
    marginTop: 24,
    gap: 12,
    alignSelf: 'stretch' as const,
  },
  analyticsText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  logsPreview: {
    marginTop: 24,
    gap: 16,
    alignSelf: 'stretch' as const,
  },
  logItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9C27B0',
  },
  logText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
};
