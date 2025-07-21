import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Modal, Button, Checkbox, Surface, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types/job';

interface AIChecklistItem {
  id: string;
  task: string;
  description?: string;
  isCompleted: boolean;
  isRequired: boolean;
  estimatedMinutes?: number;
}

interface AIGeneratedChecklistProps {
  visible: boolean;
  onDismiss: () => void;
  job: Job;
  checklist: AIChecklistItem[];
  onChecklistUpdate: (checklist: AIChecklistItem[]) => void;
  onCompleteJob: () => void;
}

export default function AIGeneratedChecklist({
  visible,
  onDismiss,
  job,
  checklist,
  onChecklistUpdate,
  onCompleteJob,
}: AIGeneratedChecklistProps) {
  const [localChecklist, setLocalChecklist] = useState<AIChecklistItem[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    setLocalChecklist(checklist);
  }, [checklist]);

  useEffect(() => {
    if (localChecklist.length > 0) {
      const completedItems = localChecklist.filter(item => item.isCompleted).length;
      const percentage = Math.round((completedItems / localChecklist.length) * 100);
      setCompletionPercentage(percentage);
    }
  }, [localChecklist]);

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = localChecklist.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setLocalChecklist(updatedChecklist);
    onChecklistUpdate(updatedChecklist);
  };

  const getTotalEstimatedTime = () => {
    return localChecklist.reduce((total, item) => {
      return total + (item.estimatedMinutes || 0);
    }, 0);
  };

  const getRemainingTime = () => {
    return localChecklist
      .filter(item => !item.isCompleted)
      .reduce((total, item) => total + (item.estimatedMinutes || 0), 0);
  };

  const canCompleteJob = () => {
    const requiredItems = localChecklist.filter(item => item.isRequired);
    const completedRequiredItems = requiredItems.filter(item => item.isCompleted);
    return completedRequiredItems.length === requiredItems.length;
  };

  const handleCompleteJob = () => {
    if (!canCompleteJob()) {
      const remainingRequired = localChecklist
        .filter(item => item.isRequired && !item.isCompleted)
        .map(item => item.task);
      
      Alert.alert(
        'Incomplete Required Tasks',
        `Please complete these required tasks first: ${remainingRequired.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Job?',
      `You have completed ${completionPercentage}% of the checklist. Mark this job as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete Job', 
          style: 'destructive',
          onPress: onCompleteJob 
        }
      ]
    );
  };

  const getPriorityColor = (item: AIChecklistItem) => {
    if (item.isRequired) return '#FF6B6B';
    if (item.estimatedMinutes && item.estimatedMinutes > 30) return '#FFB366';
    return '#4ECDC4';
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={{
        margin: 20,
        borderRadius: 12,
        maxHeight: '90%',
      }}
    >
      <Surface className="bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              AI Generated Checklist
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {job.title}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
          />
        </View>

        {/* Progress Summary */}
        <View className="p-4 bg-blue-50">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-blue-900">
              Progress: {completionPercentage}%
            </Text>
            <Text className="text-sm text-blue-700">
              {localChecklist.filter(item => item.isCompleted).length} / {localChecklist.length} completed
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View className="h-2 bg-blue-200 rounded-full">
            <View 
              className="h-2 bg-blue-600 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </View>

          {/* Time Estimates */}
          <View className="flex-row justify-between mt-3">
            <Text className="text-xs text-blue-700">
              Total time: {getTotalEstimatedTime()}min
            </Text>
            <Text className="text-xs text-blue-700">
              Remaining: {getRemainingTime()}min
            </Text>
          </View>
        </View>

        {/* Checklist Items */}
        <ScrollView className="max-h-96">
          {localChecklist.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleChecklistItem(item.id)}
              className={`p-4 border-b border-gray-100 ${
                item.isCompleted ? 'bg-green-50' : 'bg-white'
              }`}
            >
              <View className="flex-row items-start">
                {/* Checkbox */}
                <Checkbox
                  status={item.isCompleted ? 'checked' : 'unchecked'}
                  onPress={() => toggleChecklistItem(item.id)}
                  color="#4ECDC4"
                />

                {/* Task Content */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className={`text-base font-medium ${
                      item.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                    }`}>
                      {item.task}
                    </Text>
                    
                    {/* Priority/Required Indicator */}
                    {item.isRequired && (
                      <View className="ml-2 px-2 py-1 bg-red-100 rounded-full">
                        <Text className="text-xs font-medium text-red-700">
                          Required
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {item.description && (
                    <Text className={`text-sm mt-1 ${
                      item.isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {item.description}
                    </Text>
                  )}

                  {/* Time Estimate */}
                  {item.estimatedMinutes && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons 
                        name="time-outline" 
                        size={14} 
                        color={item.isCompleted ? '#059669' : '#6B7280'} 
                      />
                      <Text className={`text-xs ml-1 ${
                        item.isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        ~{item.estimatedMinutes} minutes
                      </Text>
                    </View>
                  )}
                </View>

                {/* Priority Color Indicator */}
                <View 
                  className="w-3 h-3 rounded-full ml-2 mt-1"
                  style={{ backgroundColor: getPriorityColor(item) }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View className="p-4 border-t border-gray-200">
          <View className="flex-row space-x-3">
            <Button
              mode="outlined"
              onPress={onDismiss}
              className="flex-1"
            >
              Close
            </Button>
            
            <Button
              mode="contained"
              onPress={handleCompleteJob}
              disabled={!canCompleteJob()}
              className="flex-1"
              buttonColor={canCompleteJob() ? '#4ECDC4' : '#D1D5DB'}
            >
              Complete Job ({completionPercentage}%)
            </Button>
          </View>

          {/* Help Text */}
          {!canCompleteJob() && (
            <Text className="text-xs text-gray-500 text-center mt-2">
              Complete all required tasks to finish this job
            </Text>
          )}
        </View>
      </Surface>
    </Modal>
  );
}
