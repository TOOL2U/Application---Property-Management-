import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Card, Surface, IconButton, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { aiLoggingService } from '@/services/aiLoggingService';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface AIAnalyticsData {
  totalInteractions: number;
  favoriteFunction: string;
  averageResponseTime: number;
  jobsWithAI: number;
  helpfulnessRating: number;
}

interface AIAnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  progress?: number;
}

function AIAnalyticsCard({ title, value, subtitle, icon, color, progress }: AIAnalyticsCardProps) {
  return (
    <Card className="m-2 flex-1" style={{ minWidth: 150 }}>
      <Surface className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-gray-600">{title}</Text>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        
        <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
        
        {subtitle && (
          <Text className="text-xs text-gray-500">{subtitle}</Text>
        )}
        
        {progress !== undefined && (
          <View className="mt-2">
            <ProgressBar 
              progress={progress / 100} 
              color={color}
              style={{ height: 4, borderRadius: 2 }}
            />
          </View>
        )}
      </Surface>
    </Card>
  );
}

export default function AIAnalytics() {
  const { currentProfile } = usePINAuth();
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async (days: number = 30) => {
    if (!currentProfile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await aiLoggingService.getStaffAIAnalytics(currentProfile.id, days);
      setAnalytics(data);
    } catch (err) {
      console.error('❌ Error loading AI analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [currentProfile]);

  const formatResponseTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  };

  const getFunctionDisplayName = (functionName: string): string => {
    const names = {
      'guidance': 'Job Guidance',
      'chat': 'Q&A Chat',
      'photos': 'Photo Help',
      'safety': 'Safety Tips',
      'timing': 'Time Estimates',
    };
    return names[functionName as keyof typeof names] || functionName;
  };

  if (!currentProfile) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500">Please log in to view analytics</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 mb-4">{error}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={() => loadAnalytics()}
        />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => loadAnalytics()}
        />
      }
    >
      {/* Header */}
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900">AI Assistant Analytics</Text>
        <Text className="text-gray-600 mt-1">Your AI usage insights for the last 30 days</Text>
      </View>

      {analytics && (
        <>
          {/* Main Stats Grid */}
          <View className="flex-row flex-wrap px-2">
            <AIAnalyticsCard
              title="Total Interactions"
              value={analytics.totalInteractions}
              subtitle="AI requests made"
              icon="chatbubbles-outline"
              color="#4F46E5"
            />
            
            <AIAnalyticsCard
              title="Jobs with AI Help"
              value={analytics.jobsWithAI}
              subtitle="Jobs enhanced by AI"
              icon="construct-outline"
              color="#059669"
            />
          </View>

          <View className="flex-row flex-wrap px-2">
            <AIAnalyticsCard
              title="Response Time"
              value={formatResponseTime(analytics.averageResponseTime)}
              subtitle="Average AI response"
              icon="time-outline"
              color="#DC2626"
            />
            
            <AIAnalyticsCard
              title="Helpfulness"
              value={`${Math.round(analytics.helpfulnessRating)}%`}
              subtitle="Helpful responses"
              icon="thumbs-up-outline"
              color="#7C3AED"
              progress={analytics.helpfulnessRating}
            />
          </View>

          {/* Favorite Function */}
          <Card className="mx-4 mt-4">
            <Surface className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Most Used Feature</Text>
                <Ionicons name="star-outline" size={20} color="#F59E0B" />
              </View>
              
              <View className="bg-blue-50 p-3 rounded-lg">
                <Text className="text-base font-medium text-blue-900">
                  {getFunctionDisplayName(analytics.favoriteFunction)}
                </Text>
                <Text className="text-sm text-blue-700 mt-1">
                  Your go-to AI assistant feature
                </Text>
              </View>
            </Surface>
          </Card>

          {/* Usage Tips */}
          <Card className="mx-4 mt-4 mb-6">
            <Surface className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">AI Tips</Text>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              </View>

              <View className="space-y-3">
                {analytics.totalInteractions < 10 && (
                  <View className="bg-yellow-50 p-3 rounded-lg">
                    <Text className="text-sm font-medium text-yellow-800">
                      💡 Try exploring more AI features!
                    </Text>
                    <Text className="text-xs text-yellow-700 mt-1">
                      Use photo guidance, safety tips, and time estimates to get the most out of your AI assistant.
                    </Text>
                  </View>
                )}

                {analytics.helpfulnessRating < 70 && analytics.totalInteractions > 5 && (
                  <View className="bg-blue-50 p-3 rounded-lg">
                    <Text className="text-sm font-medium text-blue-800">
                      🎯 Make your questions more specific
                    </Text>
                    <Text className="text-xs text-blue-700 mt-1">
                      Include job details, location, and specific challenges for better AI responses.
                    </Text>
                  </View>
                )}

                {analytics.jobsWithAI > 0 && analytics.helpfulnessRating > 80 && (
                  <View className="bg-green-50 p-3 rounded-lg">
                    <Text className="text-sm font-medium text-green-800">
                      🌟 You're an AI power user!
                    </Text>
                    <Text className="text-xs text-green-700 mt-1">
                      Keep using AI assistance to maintain high job quality and efficiency.
                    </Text>
                  </View>
                )}
              </View>
            </Surface>
          </Card>
        </>
      )}

      {analytics && analytics.totalInteractions === 0 && (
        <Card className="mx-4 mt-4">
          <Surface className="p-6 items-center">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-900 mt-4 text-center">
              Start Using AI Assistant
            </Text>
            <Text className="text-sm text-gray-600 mt-2 text-center">
              Get AI-powered help with your jobs! Use the AI Assistant tab or click "AI Help" on any job card.
            </Text>
          </Surface>
        </Card>
      )}
    </ScrollView>
  );
}
