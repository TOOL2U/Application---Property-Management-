import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { LocationButton } from '@/components/LocationButton';
import { MapPreview } from '@/components/MapPreview';
import { TaskCompletionModal } from '@/components/TaskCompletionModal';
import {
  MapPin,
  Clock,
  User,
  Navigation,
  Play,
  CheckCircle,
  Calendar,
} from 'lucide-react-native';

interface TaskCardProps {
  task: Task;
  onStatusUpdate?: () => void;
  showMap?: boolean;
}

export function TaskCard({ task, onStatusUpdate, showMap = true }: TaskCardProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const updateTaskStatus = async (newStatus: Task['status']) => {
    try {
      if (newStatus === 'completed') {
        // Show completion modal instead of directly updating status
        setShowCompletionModal(true);
        return;
      }

      // For other status updates, proceed normally
      console.log(`Updating task ${task.id} to status: ${newStatus}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert('Success', `Task status updated to ${newStatus.replace('_', ' ')}`);
      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleTaskCompleted = () => {
    // This will be called when the completion modal is submitted
    Alert.alert('Task Completed', 'Task has been marked as completed with all submission data.');
    onStatusUpdate?.();
  };

  const openMaps = () => {
    const address = encodeURIComponent(task.propertyAddress);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'cleaning':
        return '#10b981';
      case 'inspection':
        return '#3b82f6';
      case 'maintenance':
        return '#f59e0b';
      case 'showing':
        return '#8b5cf6';
      case 'checkout':
        return '#ef4444';
      case 'checkin':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNextStatus = () => {
    switch (task.status) {
      case 'not_started':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonConfig = () => {
    switch (task.status) {
      case 'not_started':
        return {
          title: 'Start Task',
          icon: Play,
          variant: 'primary' as const,
        };
      case 'in_progress':
        return {
          title: 'Complete Task',
          icon: CheckCircle,
          variant: 'primary' as const,
        };
      default:
        return null;
    }
  };

  const statusButtonConfig = getStatusButtonConfig();
  const nextStatus = getNextStatus();

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.taskInfo}>
            <View style={styles.taskTypeContainer}>
              <View
                style={[
                  styles.taskTypeIcon,
                  { backgroundColor: `${getTaskTypeColor(task.taskType)}20` },
                ]}
              >
                <Calendar size={16} color={getTaskTypeColor(task.taskType)} />
              </View>
              <Text style={styles.taskType}>
                {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
              </Text>
            </View>
            <StatusBadge status={task.status} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.propertyName}>{task.propertyName}</Text>
          
          <View style={styles.addressRow}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.address}>{task.propertyAddress}</Text>
          </View>

          {task.clientName && (
            <View style={styles.clientRow}>
              <User size={16} color="#6b7280" />
              <Text style={styles.clientName}>{task.clientName}</Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.timeText}>
              {formatDate(task.scheduledDate)} at {formatTime(task.scheduledDate)}
            </Text>
            <Text style={styles.duration}>
              ({task.estimatedDuration}min)
            </Text>
          </View>

          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}

          {/* Google Maps Preview */}
          {showMap && <MapPreview task={task} />}
        </View>

        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
              <Navigation size={16} color="#3b82f6" />
              <Text style={styles.mapsButtonText}>Navigate</Text>
            </TouchableOpacity>
            
            {/* Location sharing button */}
            <LocationButton taskId={task.id} />
          </View>

          {statusButtonConfig && nextStatus && (
            <Button
              title={statusButtonConfig.title}
              onPress={() => updateTaskStatus(nextStatus)}
              variant="primary"
              size="sm"
              style={styles.statusButton}
            />
          )}
        </View>
      </Card>

      {/* Task Completion Modal */}
      <TaskCompletionModal
        visible={showCompletionModal}
        task={task}
        onClose={() => setShowCompletionModal(false)}
        onSubmit={handleTaskCompleted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    gap: 8,
    marginBottom: 16,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  statusButton: {
    minWidth: 100,
  },
});
