import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';
import { Job } from '@/types/job';
import { Clock, MapPin, User } from 'lucide-react-native';

interface JobCardProps {
  job: Job;
  onAccept: (job: Job) => void;
  onDecline: (job: Job) => void;
}

/**
 * Individual job card component
 */
const JobCard: React.FC<JobCardProps> = ({ job, onAccept, onDecline }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'; // red
      case 'medium': return '#f59e0b'; // orange
      case 'low': return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  return (
    <View className="bg-dark-surface rounded-lg p-4 mb-3 border border-dark-border">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold mb-1">
            {job.title}
          </Text>
          <View 
            className="self-start px-2 py-1 rounded-full"
            style={{ backgroundColor: `${getPriorityColor(job.priority)}20` }}
          >
            <Text 
              className="text-xs font-medium capitalize"
              style={{ color: getPriorityColor(job.priority) }}
            >
              {job.priority} Priority
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {job.description && (
        <Text className="text-gray-300 text-sm mb-3">
          {job.description}
        </Text>
      )}

      {/* Job Details */}
      <View className="space-y-2 mb-4">
        <View className="flex-row items-center">
          <Clock size={16} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-2">
            Scheduled: {formatDate(job.scheduledDate)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={16} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-2">
            {job.location.address || 'Location not specified'}
          </Text>
        </View>

        <View className="flex-row items-center">
          <User size={16} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-2">
            Assigned by: {job.assignedBy}
          </Text>
        </View>

        {job.estimatedDuration && (
          <View className="flex-row items-center">
            <Clock size={16} color="#9ca3af" />
            <Text className="text-gray-400 text-sm ml-2">
              Duration: {job.estimatedDuration} minutes
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-red-500/20 border border-red-500/30 rounded-lg py-3 active:bg-red-500/30"
          onPress={() => onDecline(job)}
        >
          <Text className="text-red-400 text-center font-medium">
            Decline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-primary-500 rounded-lg py-3 active:bg-primary-600"
          onPress={() => onAccept(job)}
        >
          <Text className="text-white text-center font-medium">
            Accept Job
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Real-time jobs list component that demonstrates useRealtimeJobs hook usage
 */
export const RealtimeJobsList: React.FC = () => {
  const { jobs, loading, error } = useRealtimeJobs();

  const handleAcceptJob = (job: Job) => {
    Alert.alert(
      'Accept Job',
      `Are you sure you want to accept "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => {
            // TODO: Implement job acceptance logic
            console.log('Accepting job:', job.id);
            Alert.alert('Success', 'Job accepted successfully!');
          },
        },
      ]
    );
  };

  const handleDeclineJob = (job: Job) => {
    Alert.alert(
      'Decline Job',
      `Are you sure you want to decline "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement job decline logic
            console.log('Declining job:', job.id);
            Alert.alert('Job Declined', 'Job has been declined.');
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-bg">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-gray-400 mt-4">Loading pending jobs...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-bg p-4">
        <Text className="text-red-400 text-lg font-semibold mb-2">
          Error Loading Jobs
        </Text>
        <Text className="text-gray-400 text-center">
          {error.message}
        </Text>
      </View>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-bg p-4">
        <Text className="text-gray-400 text-lg font-semibold mb-2">
          No Pending Jobs
        </Text>
        <Text className="text-gray-500 text-center">
          You don't have any pending job assignments at the moment.
        </Text>
      </View>
    );
  }

  // Jobs list
  return (
    <View className="flex-1 bg-dark-bg">
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onAccept={handleAcceptJob}
            onDecline={handleDeclineJob}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default RealtimeJobsList;
