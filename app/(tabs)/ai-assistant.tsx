/**
 * AI Assistant Tab Screen
 * Shows FOA activity tracking, logs, and AI interaction history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, ProgressBar } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTranslation } from '@/hooks/useTranslation';
import { shadowStyles } from '@/utils/shadowUtils';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useTranslationContext } from '@/contexts/TranslationContext';
import { aiLoggingService } from '@/services/aiLoggingService';
import { FOALogTimeline } from '@/components/ai/FOALogTimeline';
import AIAnalytics from '@/components/ai/AIAnalytics';

export default function AIAssistantScreen() {
  const { t } = useTranslation();
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'analytics' | 'recent'>('recent');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (currentProfile) {
      loadAIData();
    }
  }, [currentProfile]);

  const loadAIData = async () => {
    if (!currentProfile) return;
    
    try {
      setLoading(true);
      
      // Load recent AI interactions and analytics
      const [analyticsData] = await Promise.all([
        aiLoggingService.getStaffAIAnalytics(currentProfile.id),
      ]);
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('❌ Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAIData();
    setRefreshing(false);
  };

  const renderQuickStats = () => (
    <View className="p-4">
      <Text className="text-xl font-bold text-white mb-4">
        🧠 AI Assistant Dashboard
      </Text>
      
      {analytics && (
        <View className="flex-row flex-wrap gap-3">
          <Card className="flex-1 min-w-[45%]" style={{ backgroundColor: '#1F2937' }}>
            <Card.Content className="p-3">
              <View className="flex-row items-center">
                <FontAwesome5 name="robot" size={20} color="#60A5FA" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-400">Total Interactions</Text>
                  <Text className="text-lg font-bold text-white">
                    {analytics.totalInteractions}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card className="flex-1 min-w-[45%]" style={{ backgroundColor: '#1F2937' }}>
            <Card.Content className="p-3">
              <View className="flex-row items-center">
                <FontAwesome5 name="star" size={20} color="#F59E0B" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-400">Avg Rating</Text>
                  <Text className="text-lg font-bold text-white">
                    {analytics.averageRating?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card className="flex-1 min-w-[45%]" style={{ backgroundColor: '#1F2937' }}>
            <Card.Content className="p-3">
              <View className="flex-row items-center">
                <FontAwesome5 name="clock" size={20} color="#10B981" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-400">Response Time</Text>
                  <Text className="text-lg font-bold text-white">
                    {analytics.averageResponseTime || 'N/A'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card className="flex-1 min-w-[45%]" style={{ backgroundColor: '#1F2937' }}>
            <Card.Content className="p-3">
              <View className="flex-row items-center">
                <FontAwesome5 name="heart" size={20} color="#EF4444" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-400">Favorite Feature</Text>
                  <Text className="text-sm font-medium text-white capitalize">
                    {analytics.favoriteFunction || 'Guidance'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );

  const renderTabSelector = () => (
    <View className="flex-row px-4 mb-4">
      {[
        { id: 'recent', label: 'Recent', icon: 'clock' },
        { id: 'timeline', label: 'Timeline', icon: 'list' },
        { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => setActiveTab(tab.id as any)}
          className={`flex-1 py-3 px-4 rounded-lg mr-2 ${
            activeTab === tab.id ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <FontAwesome5 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.id ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text 
              className={`ml-2 text-sm font-medium ${
                activeTab === tab.id ? 'text-white' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecentActivities = () => (
    <View className="px-4">
      <Card style={{ backgroundColor: '#1F2937' }}>
        <Card.Content>
          <View className="flex-row items-center mb-4">
            <FontAwesome5 name="history" size={20} color="#60A5FA" />
            <Text className="text-lg font-bold text-white ml-2">
              Recent AI Activities
            </Text>
          </View>

          {analytics?.recentJobs?.length > 0 ? (
            analytics.recentJobs.slice(0, 5).map((job: any, index: number) => (
              <TouchableOpacity
                key={job.jobId}
                onPress={() => router.push(`/jobs/${job.jobId}`)}
                className="border-b border-gray-600 py-3 last:border-b-0"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white font-medium">
                      {job.jobTitle || `Job ${job.jobId.slice(-6)}`}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Chip
                        mode="outlined"
                        style={{
                          backgroundColor: '#374151',
                          borderColor: '#4B5563',
                          height: 24,
                        }}
                      >
                        <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                          {job.interactionCount} interactions
                        </Text>
                      </Chip>
                      <Text className="text-xs text-gray-400 ml-2">
                        {job.lastInteraction}
                      </Text>
                    </View>
                  </View>
                  <FontAwesome5 name="chevron-right" size={14} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="py-8 items-center">
              <FontAwesome5 name="robot" size={40} color="#4B5563" />
              <Text className="text-gray-400 text-center mt-4">
                No AI interactions yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Start using the Field Ops Assistant to see activity here
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={{ backgroundColor: '#1F2937' }} className="mt-4">
        <Card.Content>
          <Text className="text-lg font-bold text-white mb-4">
            Quick Actions
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => router.push('/ai-hub')}
              className="bg-blue-600 py-3 px-4 rounded-lg flex-row items-center"
            >
              <FontAwesome5 name="robot" size={20} color="white" />
              <Text className="text-white font-medium ml-3 flex-1">
                Open Field Ops Assistant
              </Text>
              <FontAwesome5 name="arrow-right" size={16} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/jobs')}
              className="bg-gray-600 py-3 px-4 rounded-lg flex-row items-center"
            >
              <FontAwesome5 name="clipboard-list" size={20} color="white" />
              <Text className="text-white font-medium ml-3 flex-1">
                View Active Jobs
              </Text>
              <FontAwesome5 name="arrow-right" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (loading && !currentProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text className="text-gray-400 mt-4">Loading AI Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#60A5FA"
          />
        }
      >
        {renderQuickStats()}
        {renderTabSelector()}
        
        {activeTab === 'recent' && renderRecentActivities()}
        
        {activeTab === 'timeline' && currentProfile && (
          <View className="px-4">
            <FOALogTimeline staffId={currentProfile.id} />
          </View>
        )}
        
        {activeTab === 'analytics' && currentProfile && (
          <View className="px-4">
            <AIAnalytics />
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
