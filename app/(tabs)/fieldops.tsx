/**
 * Field Ops AI Dashboard Screen
 * Dedicated AI assistant screen for field operations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { useTranslation } from '@/hooks/useTranslation';
import FieldOpsAssistant from '@/components/ai/FieldOpsAssistant';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { Job } from '@/types/job';

export default function FieldOpsAI() {
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

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showJobSelector, setShowJobSelector] = useState(true);

  // Auto-select the first active job
  useEffect(() => {
    if (activeJobs.length > 0 && !selectedJob) {
      setSelectedJob(activeJobs[0]);
      setShowJobSelector(false);
    }
  }, [activeJobs, selectedJob]);

  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);

  // Redirect if not staff user
  useEffect(() => {
    if (!isStaffUser) {
      Alert.alert(
        'Access Restricted',
        'Field Operations Assistant is only available for staff members.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    }
  }, [isStaffUser, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setShowJobSelector(false);
  };

  const renderJobSelector = () => (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <View className="items-center">
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              className="w-16 h-16 bg-lime-100 rounded-full items-center justify-center mb-4"
            >
              <Ionicons name="hardware-chip-outline" size={32} color="#C6FF00" />
            </Animatable.View>
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Field Ops AI Assistant
            </Text>
            <Text className="text-gray-600 text-center">
              Select a job to get AI-powered guidance, safety tips, and completion assistance.
            </Text>
          </View>
        </View>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Active Jobs
            </Text>
            {activeJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => handleJobSelect(job)}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4 border-lime-400"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 mb-1">{job.title}</Text>
                    <Text className="text-gray-600 text-sm mb-2">{job.description}</Text>
                    <View className="flex-row items-center">
                      <View className="bg-lime-100 px-2 py-1 rounded mr-2">
                        <Text className="text-lime-800 text-xs font-medium">{job.type}</Text>
                      </View>
                      <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-blue-800 text-xs font-medium">{job.status}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C6FF00" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pending Jobs */}
        {pendingJobs.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Pending Jobs
            </Text>
            {pendingJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => handleJobSelect(job)}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4 border-orange-400"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 mb-1">{job.title}</Text>
                    <Text className="text-gray-600 text-sm mb-2">{job.description}</Text>
                    <View className="flex-row items-center">
                      <View className="bg-orange-100 px-2 py-1 rounded mr-2">
                        <Text className="text-orange-800 text-xs font-medium">{job.type}</Text>
                      </View>
                      <View className="bg-gray-100 px-2 py-1 rounded">
                        <Text className="text-gray-800 text-xs font-medium">{job.status}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFA500" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Jobs */}
        {jobs.length === 0 && !loading && (
          <View className="bg-white rounded-xl p-8 shadow-sm">
            <View className="items-center">
              <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-800 font-bold text-lg mt-4">
                No Jobs Available
              </Text>
              <Text className="text-gray-600 mt-2 text-center">
                You don't have any assigned jobs at the moment. Pull down to refresh.
              </Text>
            </View>
          </View>
        )}

        {/* Quick Access Features */}
        <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Quick Access
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/jobs')}
            className="flex-row items-center p-3 bg-gray-50 rounded-lg mb-2"
          >
            <Ionicons name="briefcase-outline" size={20} color="#C6FF00" />
            <Text className="text-gray-800 font-medium ml-3">View All Jobs</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="ml-auto" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            className="flex-row items-center p-3 bg-gray-50 rounded-lg"
          >
            <Ionicons name="notifications-outline" size={20} color="#C6FF00" />
            <Text className="text-gray-800 font-medium ml-3">View Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="ml-auto" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (!isStaffUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="warning-outline" size={64} color="#FFA500" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            Access Restricted
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Field Operations Assistant is only available for staff members.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-gray-50">
        {showJobSelector || !selectedJob ? (
          <>
            <View className="bg-white border-b border-gray-200 px-4 py-3">
              <View className="flex-row items-center">
                <Ionicons name="hardware-chip-outline" size={24} color="#C6FF00" />
                <Text className="text-xl font-bold text-gray-800 ml-2">
                  Field Ops AI
                </Text>
              </View>
            </View>
            {renderJobSelector()}
          </>
        ) : (
          <View className="flex-1">
            <View className="bg-white border-b border-gray-200 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setShowJobSelector(true)}
                  className="flex-row items-center"
                >
                  <Ionicons name="arrow-back" size={24} color="#C6FF00" />
                  <Text className="text-lg font-bold text-gray-800 ml-2">
                    {selectedJob.title}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowJobSelector(true)}
                  className="bg-gray-100 px-3 py-1 rounded-lg"
                >
                  <Text className="text-gray-600 text-sm">Change Job</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FieldOpsAssistant
              job={selectedJob}
              embedded={true}
            />
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}
