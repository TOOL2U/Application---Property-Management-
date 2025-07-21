/**
 * Field Operations Assistant Component
 * AI-powered assistant for staff field operations and job completion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from '@/hooks/useTranslation';
import { useFieldOpsAI } from '@/hooks/useFieldOpsAI';
import { Job } from '@/types/job';

interface FieldOpsAssistantProps {
  job: Job;
  visible?: boolean;
  onClose?: () => void;
  embedded?: boolean; // If true, renders inline instead of modal
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  color: string;
}

export default function FieldOpsAssistant({
  job,
  visible = true,
  onClose,
  embedded = false
}: FieldOpsAssistantProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    error,
    jobGuidance,
    photoGuidance,
    safetyRecommendations,
    timeEstimation,
    conversationHistory,
    loadJobGuidance,
    askQuestion,
    getPhotoGuidance,
    getSafetyRecommendations,
    getTimeEstimation,
    clearError,
    isConfigured,
  } = useFieldOpsAI();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<'guidance' | 'chat' | 'photos' | 'safety' | 'timing'>('guidance');
  const [hasLoadedGuidance, setHasLoadedGuidance] = useState(false);

  // Load initial guidance when component mounts
  useEffect(() => {
    if (job && isConfigured() && !hasLoadedGuidance) {
      loadJobGuidance(job);
      setHasLoadedGuidance(true);
    }
  }, [job, isConfigured, loadJobGuidance, hasLoadedGuidance]);

  // Quick actions for common questions
  const quickActions: QuickAction[] = [
    {
      id: 'photos',
      title: 'Photo Guide',
      icon: 'camera-outline',
      action: () => {
        setActiveTab('photos');
        if (!photoGuidance) {
          getPhotoGuidance(job);
        }
      },
      color: '#C6FF00'
    },
    {
      id: 'safety',
      title: 'Safety Tips',
      icon: 'shield-checkmark-outline',
      action: () => {
        setActiveTab('safety');
        if (!safetyRecommendations) {
          getSafetyRecommendations(job);
        }
      },
      color: '#FF6B6B'
    },
    {
      id: 'timing',
      title: 'Time Estimate',
      icon: 'time-outline',
      action: () => {
        setActiveTab('timing');
        if (!timeEstimation) {
          getTimeEstimation(job);
        }
      },
      color: '#4ECDC4'
    },
    {
      id: 'chat',
      title: 'Ask Question',
      icon: 'chatbubble-outline',
      action: () => setActiveTab('chat'),
      color: '#45B7D1'
    },
  ];

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) return;

    await askQuestion(currentQuestion, job);
    setCurrentQuestion('');
  };

  const renderQuickActions = () => (
    <View className="flex-row flex-wrap p-4 gap-3">
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={action.action}
          className="flex-1 min-w-[40%] bg-white rounded-xl p-3 shadow-sm border border-gray-100"
          style={{ minWidth: '45%' }}
        >
          <View className="items-center">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <Ionicons
                name={action.icon}
                size={24}
                color={action.color}
              />
            </View>
            <Text className="text-gray-800 font-medium text-center text-sm">
              {action.title}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="large" color="#C6FF00" />
          <Text className="text-gray-600 mt-4 text-center">
            AI Assistant is analyzing your job...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
          <Text className="text-red-600 mt-4 text-center font-medium">
            {error}
          </Text>
          <TouchableOpacity
            onPress={clearError}
            className="mt-4 bg-red-100 px-4 py-2 rounded-lg"
          >
            <Text className="text-red-600 font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'guidance':
        return renderGuidanceTab();
      case 'chat':
        return renderChatTab();
      case 'photos':
        return renderPhotosTab();
      case 'safety':
        return renderSafetyTab();
      case 'timing':
        return renderTimingTab();
      default:
        return renderGuidanceTab();
    }
  };

  const renderGuidanceTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="clipboard-outline" size={24} color="#C6FF00" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Job Overview
          </Text>
        </View>
        <Text className="text-gray-800 font-medium mb-1">{job.title}</Text>
        <Text className="text-gray-600 mb-2">{job.description}</Text>
        <View className="flex-row items-center">
          <View className="bg-blue-100 px-2 py-1 rounded mr-2">
            <Text className="text-blue-800 text-xs font-medium">{job.type}</Text>
          </View>
          <View className="bg-orange-100 px-2 py-1 rounded">
            <Text className="text-orange-800 text-xs font-medium">{job.priority}</Text>
          </View>
        </View>
      </View>

      {jobGuidance?.data && (
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb-outline" size={24} color="#C6FF00" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              AI Guidance
            </Text>
          </View>
          <Text className="text-gray-700 leading-6">{jobGuidance.data}</Text>
        </View>
      )}

      {jobGuidance?.checklist && jobGuidance.checklist.length > 0 && (
        <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle-outline" size={24} color="#4ECDC4" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Checklist
            </Text>
          </View>
          {jobGuidance.checklist.map((item, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <Ionicons name="radio-button-off-outline" size={20} color="#4ECDC4" className="mr-2 mt-0.5" />
              <Text className="text-gray-700 flex-1">{item}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderChatTab = () => (
    <View className="flex-1">
      <ScrollView className="flex-1 p-4">
        {conversationHistory.map((item, index) => (
          <View key={index} className="mb-4">
            <View className="bg-blue-100 p-3 rounded-lg mb-2 self-end max-w-[80%]">
              <Text className="text-blue-800">{item.question}</Text>
            </View>
            <View className="bg-white p-3 rounded-lg shadow-sm">
              <Text className="text-gray-800">{item.response.data}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-4 py-3 mr-3"
            placeholder="Ask about this job..."
            value={currentQuestion}
            onChangeText={setCurrentQuestion}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleAskQuestion}
            disabled={!currentQuestion.trim() || isLoading}
            className="bg-blue-500 w-12 h-12 rounded-lg items-center justify-center"
            style={{ opacity: !currentQuestion.trim() || isLoading ? 0.5 : 1 }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPhotosTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="camera-outline" size={24} color="#C6FF00" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Photo Documentation Guide
          </Text>
        </View>
        {photoGuidance?.data ? (
          <Text className="text-gray-700 leading-6">{photoGuidance.data}</Text>
        ) : (
          <TouchableOpacity
            onPress={() => getPhotoGuidance(job)}
            className="bg-gray-100 p-4 rounded-lg items-center"
          >
            <Ionicons name="camera-outline" size={32} color="#C6FF00" />
            <Text className="text-gray-600 mt-2">Get Photo Guidance</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderSafetyTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="shield-checkmark-outline" size={24} color="#FF6B6B" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Safety Recommendations
          </Text>
        </View>
        {safetyRecommendations?.data ? (
          <Text className="text-gray-700 leading-6">{safetyRecommendations.data}</Text>
        ) : (
          <TouchableOpacity
            onPress={() => getSafetyRecommendations(job)}
            className="bg-gray-100 p-4 rounded-lg items-center"
          >
            <Ionicons name="shield-checkmark-outline" size={32} color="#FF6B6B" />
            <Text className="text-gray-600 mt-2">Get Safety Tips</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderTimingTab = () => (
    <ScrollView className="flex-1 p-4">
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="time-outline" size={24} color="#4ECDC4" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Time Estimation
          </Text>
        </View>
        {timeEstimation?.data ? (
          <Text className="text-gray-700 leading-6">{timeEstimation.data}</Text>
        ) : (
          <TouchableOpacity
            onPress={() => getTimeEstimation(job)}
            className="bg-gray-100 p-4 rounded-lg items-center"
          >
            <Ionicons name="time-outline" size={32} color="#4ECDC4" />
            <Text className="text-gray-600 mt-2">Get Time Estimate</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderTabs = () => (
    <View className="flex-row bg-gray-100 mx-4 mt-4 rounded-lg overflow-hidden">
      {[
        { id: 'guidance', icon: 'clipboard-outline', label: 'Guide' },
        { id: 'chat', icon: 'chatbubble-outline', label: 'Chat' },
        { id: 'photos', icon: 'camera-outline', label: 'Photos' },
        { id: 'safety', icon: 'shield-checkmark-outline', label: 'Safety' },
        { id: 'timing', icon: 'time-outline', label: 'Timing' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => setActiveTab(tab.id as any)}
          className={`flex-1 py-3 items-center ${
            activeTab === tab.id ? 'bg-white shadow-sm' : ''
          }`}
        >
          <Ionicons
            name={tab.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={activeTab === tab.id ? '#C6FF00' : '#9CA3AF'}
          />
          <Text
            className={`text-xs mt-1 ${
              activeTab === tab.id ? 'text-gray-800 font-medium' : 'text-gray-500'
            }`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!isConfigured()) {
    return (
      <View className="bg-white rounded-xl p-6 m-4 shadow-sm">
        <View className="items-center">
          <Ionicons name="warning-outline" size={48} color="#FFA500" />
          <Text className="text-gray-800 font-bold text-lg mt-4 text-center">
            AI Assistant Not Available
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            OpenAI configuration is required to use the Field Operations Assistant.
          </Text>
        </View>
      </View>
    );
  }

  const content = (
    <View className="flex-1 bg-gray-50">
      {!embedded && (
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center">
            <Ionicons name="hardware-chip-outline" size={24} color="#C6FF00" />
            <Text className="text-lg font-bold text-gray-800 ml-2">
              Field Ops Assistant
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'guidance' && renderQuickActions()}
      {renderTabs()}
      {renderTabContent()}
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      {content}
    </Modal>
  );
}
