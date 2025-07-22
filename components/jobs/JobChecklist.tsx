/**
 * Simple Job Checklist Component
 * Optional checklist for job execution phase
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Job } from '@/types/job';

interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  completed: boolean;
  notes?: string;
}

interface JobChecklistProps {
  job: Job;
  onChecklistUpdate: (checklist: ChecklistItem[]) => void;
  style?: any;
}

export const JobChecklist: React.FC<JobChecklistProps> = ({
  job,
  onChecklistUpdate,
  style,
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [noteInput, setNoteInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Generate basic checklist from job requirements
    const items: ChecklistItem[] = job.requirements?.map((req, index) => ({
      id: req.id || `req_${index}`,
      description: req.description || `Requirement ${index + 1}`,
      required: index < 2, // First 2 requirements are required by default
      completed: req.isCompleted || false,
      notes: req.notes,
    })) || [];

    // Add default checklist items if no requirements
    if (items.length === 0) {
      items.push(
        {
          id: 'arrival',
          description: 'Arrive at the property',
          required: true,
          completed: false,
        },
        {
          id: 'assessment',
          description: 'Assess the work area',
          required: true,
          completed: false,
        },
        {
          id: 'work_completed',
          description: 'Complete assigned work',
          required: true,
          completed: false,
        },
        {
          id: 'cleanup',
          description: 'Clean up work area',
          required: false,
          completed: false,
        },
      );
    }

    setChecklist(items);
  }, [job]);

  const toggleItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    );
    setChecklist(updatedChecklist);
    onChecklistUpdate(updatedChecklist);
  };

  const updateNotes = (itemId: string, notes: string) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId 
        ? { ...item, notes }
        : item
    );
    setChecklist(updatedChecklist);
    onChecklistUpdate(updatedChecklist);
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="list" size={20} color="#10B981" />
          <Text style={styles.title}>Job Checklist</Text>
        </View>
        <Text style={styles.progress}>
          {completedCount}/{totalCount} completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
      </View>

      {/* Checklist Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {checklist.map((item) => (
          <View key={item.id} style={styles.checklistItem}>
            <TouchableOpacity
              style={styles.itemHeader}
              onPress={() => toggleItem(item.id)}
            >
              <View style={styles.checkbox}>
                {item.completed ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons 
                    name="ellipse-outline" 
                    size={24} 
                    color={item.required ? "#F59E0B" : "#6B7280"} 
                  />
                )}
              </View>
              
              <View style={styles.itemContent}>
                <Text style={[
                  styles.itemDescription,
                  item.completed && styles.completedText
                ]}>
                  {item.description}
                </Text>
                {item.required && (
                  <Text style={styles.requiredBadge}>Required</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Optional Notes */}
            <View style={styles.notesSection}>
              <TextInput
                style={styles.notesInput}
                value={noteInput[item.id] || item.notes || ''}
                onChangeText={(text) => {
                  setNoteInput(prev => ({ ...prev, [item.id]: text }));
                }}
                onBlur={() => {
                  updateNotes(item.id, noteInput[item.id] || '');
                }}
                placeholder="Add notes (optional)..."
                placeholderTextColor="#6B7280"
                multiline
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  progress: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    minWidth: 35,
    textAlign: 'right',
  },
  itemsContainer: {
    maxHeight: 300,
  },
  checklistItem: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  requiredBadge: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  notesSection: {
    marginLeft: 36,
  },
  notesInput: {
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 8,
    color: '#D1D5DB',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
});

export default JobChecklist;
