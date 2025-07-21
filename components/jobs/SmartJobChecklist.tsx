/**
 * Smart Job Checklist Component
 * Interactive checklist with real-time sync and FOA integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Brain,
  Timer,
  Target
} from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import { jobChecklistService, ChecklistItem, JobChecklist } from '@/services/jobChecklistService';
import { embeddedFOAChatService } from '@/services/embeddedFOAChatService';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface SmartJobChecklistProps {
  job: JobData;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onItemComplete?: (item: ChecklistItem) => void;
}

export default function SmartJobChecklist({
  job,
  onProgress,
  onComplete,
  onItemComplete
}: SmartJobChecklistProps) {
  const [checklist, setChecklist] = useState<JobChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['safety', 'preparation']));
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [noteText, setNoteText] = useState('');
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [animatedValues] = useState(() => new Map<string, Animated.Value>());

  const { currentProfile } = usePINAuth();

  useEffect(() => {
    loadChecklist();
  }, [job.id]);

  useEffect(() => {
    if (!checklist) return;

    const unsubscribe = jobChecklistService.subscribeToChecklist(
      job.id,
      (updatedChecklist) => {
        if (updatedChecklist) {
          setChecklist(updatedChecklist);
          onProgress?.(updatedChecklist.progress);
          
          if (updatedChecklist.progress === 100 && !updatedChecklist.completedAt) {
            onComplete?.();
          }
        }
      }
    );

    return unsubscribe;
  }, [checklist?.id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      let existingChecklist = await jobChecklistService.getJobChecklist(job.id);
      
      if (!existingChecklist && currentProfile) {
        // Generate new checklist
        setGeneratingChecklist(true);
        existingChecklist = await jobChecklistService.generateSmartChecklist(job, currentProfile.id);
        setGeneratingChecklist(false);
      }
      
      setChecklist(existingChecklist);
    } catch (error) {
      console.error('Error loading checklist:', error);
      Alert.alert('Error', 'Failed to load checklist. Please try again.');
    } finally {
      setLoading(false);
      setGeneratingChecklist(false);
    }
  };

  const toggleItemComplete = async (item: ChecklistItem) => {
    if (!checklist || !currentProfile) return;

    try {
      // Animate the change
      const animValue = animatedValues.get(item.id) || new Animated.Value(0);
      animatedValues.set(item.id, animValue);
      
      Animated.spring(animValue, {
        toValue: item.completed ? 0 : 1,
        useNativeDriver: false,
      }).start();

      await jobChecklistService.updateChecklistItem(
        job.id,
        item.id,
        { completed: !item.completed }
      );

      onItemComplete?.(item);
      
      // Trigger FOA context message for checklist progress
      if (!item.completed) {
        // Item was just completed - trigger progress message
        setTimeout(() => {
          embeddedFOAChatService.triggerContextMessage(
            job.id,
            currentProfile.id,
            {
              type: 'checklist_progress',
              condition: { completedItems: [checklist.completedItems + 1] },
              enabled: true
            },
            job
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      Alert.alert('Error', 'Failed to update checklist item.');
    }
  };

  const openNoteModal = (item: ChecklistItem) => {
    setSelectedItem(item);
    setNoteText(item.notes || '');
    setNoteModalVisible(true);
  };

  const saveNote = async () => {
    if (!selectedItem || !currentProfile) return;

    try {
      await jobChecklistService.updateChecklistItem(
        job.id,
        selectedItem.id,
        { notes: noteText.trim() || undefined }
      );
      
      setNoteModalVisible(false);
      setSelectedItem(null);
      setNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryItems = (category: string): ChecklistItem[] => {
    return checklist?.items.filter(item => item.category === category) || [];
  };

  const getCategoryProgress = (category: string): { completed: number; total: number } => {
    const items = getCategoryItems(category);
    const completed = items.filter(item => item.completed).length;
    return { completed, total: items.length };
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      safety: '#ef4444',
      preparation: '#f59e0b',
      execution: '#3b82f6',
      documentation: '#8b5cf6',
      completion: '#10b981',
      inspection: '#06b6d4',
      cleanup: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      safety: AlertTriangle,
      preparation: Clock,
      execution: Target,
      documentation: Edit3,
      completion: CheckCircle2,
      inspection: Circle,
      cleanup: Plus
    };
    const IconComponent = icons[category] || Circle;
    return <IconComponent size={20} color="#ffffff" />;
  };

  const getRequiredIncompleteCount = (): number => {
    return checklist?.items.filter(item => item.required && !item.completed).length || 0;
  };

  const categories = ['safety', 'preparation', 'execution', 'documentation', 'completion', 'inspection', 'cleanup'];
  const categoriesWithItems = categories.filter(cat => getCategoryItems(cat).length > 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  if (generatingChecklist) {
    return (
      <View style={styles.loadingContainer}>
        <Brain size={48} color="#6366f1" />
        <Text style={styles.loadingText}>Generating smart checklist...</Text>
        <Text style={styles.loadingSubtext}>FOA is creating a customized checklist for this job</Text>
      </View>
    );
  }

  if (!checklist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No checklist available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChecklist}>
          <Text style={styles.retryButtonText}>Generate Checklist</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.progressHeader}
      >
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Job Checklist</Text>
          <Text style={styles.progressSubtitle}>
            {checklist.completedItems} of {checklist.totalItems} completed
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{checklist.progress}%</Text>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              { width: `${checklist.progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {getRequiredIncompleteCount()} required items remaining
        </Text>
      </View>

      {/* Checklist Items */}
      <ScrollView style={styles.checklistContainer} showsVerticalScrollIndicator={false}>
        {categoriesWithItems.map(category => {
          const items = getCategoryItems(category);
          const progress = getCategoryProgress(category);
          const isExpanded = expandedCategories.has(category);
          const categoryColor = getCategoryColor(category);

          return (
            <View key={category} style={styles.categoryContainer}>
              {/* Category Header */}
              <TouchableOpacity
                style={[styles.categoryHeader, { backgroundColor: categoryColor }]}
                onPress={() => toggleCategory(category)}
              >
                <View style={styles.categoryIcon}>
                  {getCategoryIcon(category)}
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.categoryProgress}>
                    {progress.completed}/{progress.total} completed
                  </Text>
                </View>
                <View style={styles.categoryChevron}>
                  {isExpanded ? (
                    <ChevronDown size={24} color="#ffffff" />
                  ) : (
                    <ChevronRight size={24} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Category Items */}
              {isExpanded && (
                <View style={styles.categoryItems}>
                  {items.map(item => {
                    const animValue = animatedValues.get(item.id) || new Animated.Value(item.completed ? 1 : 0);
                    
                    return (
                      <Animated.View
                        key={item.id}
                        style={[
                          styles.checklistItem,
                          {
                            opacity: animValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.6, 1]
                            }),
                            transform: [{
                              scale: animValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.98, 1]
                              })
                            }]
                          }
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.itemCheckbox}
                          onPress={() => toggleItemComplete(item)}
                        >
                          {item.completed ? (
                            <CheckCircle2 size={24} color="#10b981" />
                          ) : (
                            <Circle size={24} color="#9ca3af" />
                          )}
                        </TouchableOpacity>

                        <View style={styles.itemContent}>
                          <View style={styles.itemHeader}>
                            <Text style={[
                              styles.itemLabel,
                              item.completed && styles.itemLabelCompleted
                            ]}>
                              {item.label}
                            </Text>
                            {item.required && (
                              <View style={styles.requiredBadge}>
                                <Text style={styles.requiredText}>Required</Text>
                              </View>
                            )}
                          </View>

                          {item.description && (
                            <Text style={styles.itemDescription}>{item.description}</Text>
                          )}

                          <View style={styles.itemFooter}>
                            {item.estimatedMinutes && (
                              <View style={styles.timeEstimate}>
                                <Timer size={14} color="#6b7280" />
                                <Text style={styles.timeText}>{item.estimatedMinutes}min</Text>
                              </View>
                            )}

                            <View style={styles.itemActions}>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => openNoteModal(item)}
                              >
                                <Edit3 size={16} color="#6366f1" />
                                <Text style={styles.actionText}>
                                  {item.notes ? 'Edit Note' : 'Add Note'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {item.notes && (
                            <View style={styles.noteContainer}>
                              <Text style={styles.noteText}>{item.notes}</Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {checklist.progress === 100 && (
          <View style={styles.completionBanner}>
            <CheckCircle2 size={32} color="#10b981" />
            <Text style={styles.completionTitle}>Checklist Complete!</Text>
            <Text style={styles.completionSubtitle}>
              Great job! You've completed all checklist items.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <View style={styles.modalContent}>
              <Text style={styles.modalItemTitle}>{selectedItem.label}</Text>
              
              <TextInput
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add notes about this task..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A', // Dark theme background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C6FF00', // Neon green accent
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#C6FF00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(198, 255, 0, 0.2)', // Neon green circle
    borderWidth: 2,
    borderColor: '#C6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C6FF00',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#2A3A4A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C6FF00',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  checklistContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: '#1A1F2E', // Dark card background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3A4A',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(198, 255, 0, 0.05)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  categoryProgress: {
    fontSize: 14,
    color: '#C6FF00',
  },
  categoryChevron: {
    paddingLeft: 8,
  },
  categoryItems: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0B0F1A',
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2A3A4A',
  },
  itemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  itemLabelCompleted: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  requiredBadge: {
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C6FF00',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#C6FF00',
    marginLeft: 4,
  },
  noteContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1A1F2E',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  noteText: {
    fontSize: 14,
    color: '#ffffff',
  },
  completionBanner: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6FF00',
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C6FF00',
    marginTop: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancel: {
    fontSize: 16,
    color: '#C6FF00',
  },
  modalContent: {
    padding: 20,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#2A3A4A',
    backgroundColor: '#1A1F2E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 100,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#C6FF00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0B0F1A',
    fontSize: 16,
    fontWeight: '600',
  },
});
