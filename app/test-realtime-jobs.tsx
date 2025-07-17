import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { RealtimeJobsList } from '@/components/jobs/RealtimeJobsList';

/**
 * Test page for demonstrating the useRealtimeJobs hook
 * Navigate to this page to see real-time job updates in action
 */
export default function TestRealtimeJobsPage() {
  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-dark-border">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4 p-2 rounded-lg bg-dark-surface active:bg-dark-border"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          Real-time Jobs Test
        </Text>
      </View>

      {/* Info Banner */}
      <View className="bg-primary-500/20 border border-primary-500/30 rounded-lg m-4 p-4">
        <Text className="text-primary-400 text-sm font-medium mb-2">
          🔔 Real-time Job Sync Active
        </Text>
        <Text className="text-primary-300 text-xs">
          This page demonstrates the useRealtimeJobs hook. Jobs assigned to your user ID with 'pending' status will appear here in real-time.
        </Text>
      </View>

      {/* Real-time Jobs List */}
      <RealtimeJobsList />
    </SafeAreaView>
  );
}
