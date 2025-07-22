/**
 * Admin-Only AI Interface
 * Provides access to AI tools and background insights for administrators only
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { aiBackgroundService } from '@/services/aiBackgroundService';

interface AIInsight {
  id?: string;
  type: 'job_delay' | 'staff_performance' | 'scheduling_optimization' | 'maintenance_prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  createdAt: Date;
}

export default function AdminAIInterface() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Check if user is admin (simplified - implement your actual admin check)
  const isAdmin = () => {
    // TODO: Implement actual admin role check
    return user?.id !== null;
  };

  const loadInsights = async () => {
    if (!user?.id || !isAdmin()) return;
    
    setIsLoading(true);
    try {
      const data = await aiBackgroundService.getInsights(user.id);
      setInsights(data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      Alert.alert('Error', 'Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!user?.id || !isAdmin()) return;
    
    try {
      await aiBackgroundService.startBackgroundMonitoring(user.id);
      setIsMonitoring(true);
      Alert.alert('Success', 'AI background monitoring started');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      Alert.alert('Error', 'Failed to start AI monitoring');
    }
  };

  const stopMonitoring = () => {
    aiBackgroundService.stopBackgroundMonitoring();
    setIsMonitoring(false);
    Alert.alert('Success', 'AI background monitoring stopped');
  };

  useEffect(() => {
    if (isAdmin()) {
      loadInsights();
    }
  }, [user]);

  if (!isAdmin()) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
        <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4 text-center">
          Admin Access Required
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
          This AI interface is only available to administrators
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Operations Center
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mt-1">
          Background AI monitoring and insights
        </Text>
      </View>

      {/* Monitoring Controls */}
      <View className="bg-white dark:bg-gray-800 m-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Background Monitoring
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {isMonitoring ? 'AI is actively monitoring' : 'AI monitoring is stopped'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg ${
              isMonitoring ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            <Text className="text-white font-medium">
              {isMonitoring ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Refresh Insights */}
      <View className="bg-white dark:bg-gray-800 mx-4 mb-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={loadInsights}
          disabled={isLoading}
          className="flex-row items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="refresh" size={20} color="#3B82F6" />
          )}
          <Text className="text-blue-500 font-medium ml-2">
            {isLoading ? 'Loading...' : 'Refresh Insights'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Insights */}
      <View className="mx-4 mb-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          AI Insights ({insights.length})
        </Text>
        
        {insights.length === 0 ? (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 items-center">
            <Ionicons name="analytics" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
              No AI insights available yet
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1 text-center">
              Start monitoring to generate insights
            </Text>
          </View>
        ) : (
          insights.map((insight, index) => (
            <View
              key={insight.id || index}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <View className={`w-3 h-3 rounded-full mr-2 ${
                      insight.severity === 'critical' ? 'bg-red-500' :
                      insight.severity === 'high' ? 'bg-orange-500' :
                      insight.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <Text className="font-semibold text-gray-900 dark:text-white flex-1">
                      {insight.title}
                    </Text>
                  </View>
                  <Text className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {insight.description}
                  </Text>
                  {insight.recommendation && (
                    <Text className="text-blue-600 dark:text-blue-400 mt-2 text-sm">
                      💡 {insight.recommendation}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
