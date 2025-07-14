import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useLocation } from '@/hooks/useLocation';
import { Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LocationButton } from '@/components/LocationButton';
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  User,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

export default function MapScreen() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks(user?.id || '');
  const { hasPermission, requestPermission, getCurrentLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  // Filter tasks for today
  const todayTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate.toDateString() === today.toDateString();
    }).sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [tasks]);

  const handleRefreshLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to view your position on the map.'
        );
        return;
      }
    }

    setRefreshing(true);
    try {
      await getCurrentLocation();
      Alert.alert('Success', 'Your location has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setRefreshing(false);
    }
  };

  const openTaskInMaps = (task: Task) => {
    const address = encodeURIComponent(task.propertyAddress);
    const url = `https://maps.google.com/?q=${address}`;
    // In a real app, you might want to open a native map view here
    console.log('Opening task in maps:', url);
    Alert.alert('Navigation', `Opening directions to ${task.propertyName}`);
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

  const TaskMapCard = ({ task }: { task: Task }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <View
            style={[
              styles.taskTypeIcon,
              { backgroundColor: `${getTaskTypeColor(task.taskType)}20` },
            ]}
          >
            <Calendar size={16} color={getTaskTypeColor(task.taskType)} />
          </View>
          <View style={styles.taskDetails}>
            <Text style={styles.taskTitle}>{task.propertyName}</Text>
            <Text style={styles.taskType}>
              {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
            </Text>
          </View>
        </View>
        <StatusBadge status={task.status} />
      </View>

      <View style={styles.taskContent}>
        <View style={styles.infoRow}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.infoText} numberOfLines={2}>
            {task.propertyAddress}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {formatTime(task.scheduledDate)} ({task.estimatedDuration}min)
          </Text>
        </View>

        {task.clientName && (
          <View style={styles.infoRow}>
            <User size={14} color="#6b7280" />
            <Text style={styles.infoText}>{task.clientName}</Text>
          </View>
        )}
      </View>

      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => openTaskInMaps(task)}
        >
          <Navigation size={16} color="#3b82f6" />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>

        <LocationButton taskId={task.id} />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading today's tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Jobs Map</Text>
        <Text style={styles.subtitle}>
          {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} scheduled for today
        </Text>
      </View>

      {/* Map placeholder */}
      <Card style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={48} color="#3b82f6" />
          <Text style={styles.mapPlaceholderTitle}>Interactive Map View</Text>
          <Text style={styles.mapPlaceholderText}>
            This would show all today's tasks on a Google Maps view
          </Text>
          
          <Button
            title="Refresh My Location"
            onPress={handleRefreshLocation}
            variant="outline"
            size="sm"
            loading={refreshing}
            style={styles.refreshButton}
          />
        </View>
      </Card>

      {/* Tasks list */}
      <View style={styles.tasksHeader}>
        <Text style={styles.tasksTitle}>Today's Tasks</Text>
        {!hasPermission && (
          <View style={styles.permissionWarning}>
            <AlertCircle size={16} color="#f59e0b" />
            <Text style={styles.permissionWarningText}>
              Enable location to share your position
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
        {todayTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar size={32} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No tasks for today</Text>
            <Text style={styles.emptyText}>
              You have no scheduled tasks for today. Check back tomorrow!
            </Text>
          </Card>
        ) : (
          todayTasks.map((task) => (
            <TaskMapCard key={task.id} task={task} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 200,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  refreshButton: {
    marginTop: 12,
  },
  tasksHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionWarningText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  taskType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  taskContent: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
