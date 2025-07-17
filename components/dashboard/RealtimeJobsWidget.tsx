import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';
import { Job } from '@/types/job';
import { Clock, MapPin, AlertCircle } from 'lucide-react-native';

interface RealtimeJobsWidgetProps {
  onAcceptJob?: (job: Job) => void;
  onDeclineJob?: (job: Job) => void;
  maxJobs?: number;
}

/**
 * Dashboard widget that displays real-time pending jobs
 * Uses the useRealtimeJobs hook for live updates
 */
export const RealtimeJobsWidget: React.FC<RealtimeJobsWidgetProps> = ({
  onAcceptJob,
  onDeclineJob,
  maxJobs = 3
}) => {
  const { jobs, loading, error } = useRealtimeJobs();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <Text className="text-white text-lg font-semibold mb-4">
          Pending Jobs
        </Text>
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text className="text-gray-400 ml-2">Loading jobs...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <Text className="text-white text-lg font-semibold mb-4">
          Pending Jobs
        </Text>
        <View className="flex-row items-center py-4">
          <AlertCircle size={20} color="#ef4444" />
          <Text className="text-red-400 ml-2 flex-1">
            Error loading jobs: {error.message}
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <View className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <Text className="text-white text-lg font-semibold mb-4">
          Pending Jobs
        </Text>
        <View className="py-8 items-center">
          <Text className="text-gray-400 text-center">
            No pending jobs at the moment
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-1">
            New assignments will appear here automatically
          </Text>
        </View>
      </View>
    );
  }

  // Display jobs (limited by maxJobs)
  const displayJobs = jobs.slice(0, maxJobs);

  return (
    <View className="bg-dark-surface rounded-lg p-4 border border-dark-border">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-semibold">
          Pending Jobs
        </Text>
        <View className="bg-primary-500/20 px-2 py-1 rounded-full">
          <Text className="text-primary-400 text-xs font-medium">
            {jobs.length} pending
          </Text>
        </View>
      </View>

      {/* Jobs List */}
      <View className="space-y-3">
        {displayJobs.map((job) => (
          <View
            key={job.id}
            className="bg-dark-card rounded-lg p-3 border border-dark-border/50"
          >
            {/* Job Header */}
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-white font-medium flex-1" numberOfLines={1}>
                {job.title}
              </Text>
              <View
                className="px-2 py-1 rounded-full ml-2"
                style={{ backgroundColor: `${getPriorityColor(job.priority)}20` }}
              >
                <Text
                  className="text-xs font-medium capitalize"
                  style={{ color: getPriorityColor(job.priority) }}
                >
                  {job.priority}
                </Text>
              </View>
            </View>

            {/* Job Details */}
            <View className="space-y-1 mb-3">
              <View className="flex-row items-center">
                <Clock size={12} color="#9ca3af" />
                <Text className="text-gray-400 text-xs ml-1">
                  {formatTime(job.scheduledDate)}
                </Text>
              </View>
              
              {job.location.address && (
                <View className="flex-row items-center">
                  <MapPin size={12} color="#9ca3af" />
                  <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                    {job.location.address}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-red-500/20 border border-red-500/30 rounded py-2 active:bg-red-500/30"
                onPress={() => onDeclineJob?.(job)}
              >
                <Text className="text-red-400 text-center text-xs font-medium">
                  Decline
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-primary-500 rounded py-2 active:bg-primary-600"
                onPress={() => onAcceptJob?.(job)}
              >
                <Text className="text-white text-center text-xs font-medium">
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Show More Link */}
      {jobs.length > maxJobs && (
        <TouchableOpacity className="mt-3 py-2">
          <Text className="text-primary-400 text-center text-sm">
            View {jobs.length - maxJobs} more jobs
          </Text>
        </TouchableOpacity>
      )}

      {/* Real-time Indicator */}
      <View className="flex-row items-center justify-center mt-3 pt-3 border-t border-dark-border/50">
        <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Text className="text-gray-500 text-xs ml-2">
          Real-time sync active
        </Text>
      </View>
    </View>
  );
};

export default RealtimeJobsWidget;
