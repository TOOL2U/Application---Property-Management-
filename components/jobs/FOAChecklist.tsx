import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Checkbox, Button, TextInput, Chip, ProgressBar } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFOAChecklist, FOAChecklistStep } from '../../hooks/useFOAChecklist';
import { JobData } from '../../types/jobData';

interface FOAChecklistProps {
  job: JobData;
  onStepExplain?: (step: FOAChecklistStep) => void;
}

// Default explanation handler that can be overridden
const defaultStepExplainHandler = (step: FOAChecklistStep) => {
  // This could integrate with the FOA chat system
  console.log('Step explanation requested for:', step.step);
  // For now, show an alert with the step description
  Alert.alert(
    'Step Explanation',
    step.notes || `This step involves: ${step.step}`,
    [{ text: 'OK' }]
  );
};

const ChecklistStepItem = ({ 
  step, 
  isEditable, 
  onStatusChange, 
  onExplain 
}: { 
  step: FOAChecklistStep; 
  isEditable: boolean; 
  onStatusChange: (stepId: string, status: 'pending' | 'complete', notes?: string) => void;
  onExplain?: (step: FOAChecklistStep) => void;
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(step.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusToggle = async () => {
    if (!isEditable || isUpdating) return;
    
    setIsUpdating(true);
    const newStatus = step.status === 'complete' ? 'pending' : 'complete';
    await onStatusChange(step.id, newStatus, notes);
    setIsUpdating(false);
  };

  const handleNotesUpdate = async () => {
    if (!isEditable) return;
    await onStatusChange(step.id, step.status, notes);
    setShowNotes(false);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'safety': return 'security';
      case 'preparation': return 'build';
      case 'execution': return 'play-circle';
      case 'documentation': return 'camera';
      case 'completion': return 'check-circle';
      default: return 'radio-button-unchecked';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'safety': return '#ef4444';
      case 'preparation': return '#f59e0b';
      case 'execution': return '#3b82f6';
      case 'documentation': return '#8b5cf6';
      case 'completion': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <Card style={[
      styles.stepCard,
      step.status === 'complete' && styles.completedStepCard
    ]}>
      <Card.Content style={styles.stepContent}>
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepInfo}>
            <View style={styles.stepTitleRow}>
              <Checkbox
                status={step.status === 'complete' ? 'checked' : 'unchecked'}
                onPress={handleStatusToggle}
                disabled={!isEditable || isUpdating}
              />
              <Text style={[
                styles.stepText,
                step.status === 'complete' && styles.completedStepText,
                step.isRequired && styles.requiredStepText
              ]}>
                {step.step}
              </Text>
            </View>
            
            {/* Step Metadata */}
            <View style={styles.stepMeta}>
              {step.category && (
                <Chip 
                  icon={() => <MaterialIcons name={getCategoryIcon(step.category)} size={14} color="white" />}
                  style={[styles.categoryChip, { backgroundColor: getCategoryColor(step.category) }]}
                  textStyle={styles.categoryChipText}
                >
                  {step.category}
                </Chip>
              )}
              
              {step.isRequired && (
                <Chip 
                  icon={() => <MaterialIcons name="star" size={14} color="#f59e0b" />}
                  style={styles.requiredChip}
                  textStyle={styles.requiredChipText}
                >
                  Required
                </Chip>
              )}
              
              {step.estimatedDuration && (
                <Chip 
                  icon={() => <MaterialIcons name="schedule" size={14} color="#64748b" />}
                  style={styles.timeChip}
                  textStyle={styles.timeChipText}
                >
                  {step.estimatedDuration}m
                </Chip>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.stepActions}>
            {onExplain && (
              <Button
                mode="outlined"
                onPress={() => onExplain(step)}
                style={styles.explainButton}
                contentStyle={styles.explainButtonContent}
              >
                <MaterialIcons name="help" size={16} color="#4F46E5" />
              </Button>
            )}
            
            <Button
              mode="text"
              onPress={() => setShowNotes(!showNotes)}
              style={styles.notesButton}
              contentStyle={styles.notesButtonContent}
            >
              <MaterialIcons name={showNotes ? "expand-less" : "expand-more"} size={16} color="#64748b" />
            </Button>
          </View>
        </View>

        {/* Completion Timestamp */}
        {step.status === 'complete' && step.timestamp && (
          <View style={styles.completionInfo}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={styles.completionText}>
              Completed {new Date(step.timestamp).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Notes Section */}
        {showNotes && (
          <View style={styles.notesSection}>
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              disabled={!isEditable}
              style={styles.notesInput}
            />
            {isEditable && (
              <Button
                mode="contained"
                onPress={handleNotesUpdate}
                style={styles.saveNotesButton}
              >
                Save Notes
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default function FOAChecklist({ job, onStepExplain = defaultStepExplainHandler }: FOAChecklistProps) {
  const {
    checklist,
    loading,
    error,
    generateChecklist,
    updateStepStatus,
    refreshChecklist,
    isEditable,
    progress
  } = useFOAChecklist(job.id, job);

  const handleGenerateChecklist = async () => {
    const success = await generateChecklist(job, false);
    if (!success) {
      Alert.alert('Error', 'Failed to generate checklist. Please try again.');
    }
  };

  const handleRegenerateChecklist = async () => {
    Alert.alert(
      'Regenerate Checklist',
      'This will replace the current checklist. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'destructive',
          onPress: async () => {
            const success = await generateChecklist(job, true);
            if (!success) {
              Alert.alert('Error', 'Failed to regenerate checklist. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleStepStatusChange = async (stepId: string, status: 'pending' | 'complete', notes?: string) => {
    const success = await updateStepStatus(stepId, status, notes);
    if (!success) {
      Alert.alert('Error', 'Failed to update step. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card style={styles.loadingCard}>
        <Card.Content style={styles.loadingContent}>
          <MaterialIcons name="smart-toy" size={32} color="#4F46E5" />
          <Text style={styles.loadingText}>FOA is generating your checklist...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.errorCard}>
        <Card.Content style={styles.errorContent}>
          <MaterialIcons name="error" size={32} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => handleGenerateChecklist()}>
            Try Again
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (!checklist) {
    return (
      <Card style={styles.noChecklistCard}>
        <Card.Content style={styles.noChecklistContent}>
          <MaterialIcons name="checklist" size={48} color="#64748b" />
          <Text style={styles.noChecklistTitle}>No Checklist Generated</Text>
          <Text style={styles.noChecklistText}>
            Generate an AI-powered checklist to help you complete this job efficiently and safely.
          </Text>
          <Button 
            mode="contained" 
            onPress={handleGenerateChecklist}
            style={styles.generateButton}
          >
            <MaterialIcons name="auto-fix-high" size={16} color="white" style={{ marginRight: 8 }} />
            Generate FOA Checklist
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
              <Text style={styles.headerTitle}>FOA Checklist</Text>
              <Chip 
                style={styles.generatedByChip}
                textStyle={styles.generatedByChipText}
              >
                AI Generated
              </Chip>
            </View>
            
            <View style={styles.headerActions}>
              <Button
                mode="outlined"
                onPress={refreshChecklist}
                style={styles.refreshButton}
                contentStyle={styles.refreshButtonContent}
              >
                <MaterialIcons name="refresh" size={16} color="#4F46E5" />
              </Button>
              
              {isEditable && (
                <Button
                  mode="text"
                  onPress={handleRegenerateChecklist}
                  style={styles.regenerateButton}
                >
                  Regenerate
                </Button>
              )}
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Progress: {progress.completed}/{progress.total} steps
              </Text>
              <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
            </View>
            <ProgressBar 
              progress={progress.percentage / 100} 
              color="#10b981"
              style={styles.progressBar}
            />
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>
                ⏱️ Est. time: {checklist.estimatedTotalTime}m
              </Text>
              {progress.remaining > 0 && (
                <Text style={styles.progressStat}>
                  📋 {progress.remaining} remaining
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Steps */}
      <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
        {checklist.steps.map((step, index) => (
          <ChecklistStepItem
            key={step.id}
            step={step}
            isEditable={isEditable}
            onStatusChange={handleStepStatusChange}
            onExplain={onStepExplain}
          />
        ))}
      </ScrollView>

      {/* Completion Message */}
      {progress.percentage === 100 && (
        <Card style={styles.completionCard}>
          <Card.Content style={styles.completionContent}>
            <MaterialIcons name="celebration" size={32} color="#10b981" />
            <Text style={styles.completionTitle}>Checklist Complete!</Text>
            <Text style={styles.completionCardText}>
              Great job! You've completed all checklist items for this task.
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCard: {
    margin: 16,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorCard: {
    margin: 16,
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    marginVertical: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  noChecklistCard: {
    margin: 16,
  },
  noChecklistContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noChecklistTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  noChecklistText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  generateButton: {
    paddingHorizontal: 24,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    marginRight: 12,
  },
  generatedByChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  generatedByChipText: {
    fontSize: 12,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    borderColor: '#4F46E5',
    marginRight: 8,
  },
  refreshButtonContent: {
    height: 32,
  },
  regenerateButton: {
    paddingHorizontal: 8,
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressStat: {
    fontSize: 12,
    color: '#64748b',
  },
  stepsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepCard: {
    marginBottom: 12,
  },
  completedStepCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  stepContent: {
    paddingVertical: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
    marginLeft: 8,
  },
  completedStepText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  requiredStepText: {
    fontWeight: '600',
  },
  stepMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 40,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  categoryChipText: {
    fontSize: 10,
    color: 'white',
  },
  requiredChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  requiredChipText: {
    fontSize: 10,
    color: '#f59e0b',
  },
  timeChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  timeChipText: {
    fontSize: 10,
    color: '#64748b',
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  explainButton: {
    borderColor: '#4F46E5',
    marginRight: 8,
    minWidth: 40,
  },
  explainButtonContent: {
    height: 32,
  },
  notesButton: {
    minWidth: 40,
  },
  notesButtonContent: {
    height: 32,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 40,
  },
  completionText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 6,
  },
  notesSection: {
    marginTop: 12,
    marginLeft: 40,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  saveNotesButton: {
    alignSelf: 'flex-start',
  },
  completionCard: {
    margin: 16,
    backgroundColor: '#f0fdf4',
  },
  completionContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 12,
    marginBottom: 8,
  },
  completionCardText: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
  },
});
