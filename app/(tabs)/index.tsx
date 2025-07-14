import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useNotifications } from '@/hooks/useNotifications';
import { Task } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { Card } from '@/components/ui/Card';
import { NotificationBanner } from '@/components/NotificationBanner';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Calendar,
  AlertTriangle,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { 
    tasks, 
    loading, 
    error, 
    lastUpdate, 
    updateTaskStatus, 
    refreshTasks 
  } = useRealtimeTasks(user?.id || '');
  
  const { 
    expoPushToken, 
    notification, 
    permissionStatus, 
    error: notificationError,
    sendLocalNotification,
    clearBadge 
  } = useNotifications(user?.id);

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  // Clear notification badge when app is opened
  useEffect(() => {
    clearBadge();
  }, []);

  // Show notification permission status
  useEffect(() => {
    if (notificationError) {
      console.log('Notification setup error:', notificationError);
    }
    
    if (expoPushToken) {
      console.log('✅ Push notifications enabled. Token:', expoPushToken.substring(0, 20) + '...');
    }
  }, [expoPushToken, notificationError]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(task => task.status === selectedFilter);
    }

    // Filter by date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (selectedDate === 'today') {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.scheduledDate);
        return taskDate.toDateString() === today.toDateString();
      });
    } else if (selectedDate === 'tomorrow') {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.scheduledDate);
        return taskDate.toDateString() === tomorrow.toDateString();
      });
    } else if (selectedDate === 'week') {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.scheduledDate);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      });
    }

    return filtered.sort((a, b) => {
      // Sort by priority first (urgent > high > medium > low)
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by scheduled date
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }, [tasks, selectedFilter, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayTasks = tasks.filter(task => 
      new Date(task.scheduledDate).toDateString() === today.toDateString()
    );

    return {
      total: tasks.length,
      today: todayTasks.length,
      completed: tasks.filter(task => task.status === 'completed').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      notStarted: tasks.filter(task => task.status === 'not_started').length,
      overdue: tasks.filter(task => 
        task.status !== 'completed' && 
        new Date(task.scheduledDate) < today
      ).length,
      urgent: tasks.filter(task => task.priority === 'urgent').length,
    };
  }, [tasks]);

  // Filter chips configuration
  const statusFilters = [
    { id: 'all', label: 'All Tasks', count: stats.total },
    { id: 'not_started', label: 'Not Started', count: stats.notStarted },
    { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
    { id: 'completed', label: 'Completed', count: stats.completed },
  ];

  const dateFilters = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'week', label: 'This Week' },
    { id: 'all', label: 'All Dates' },
  ];

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={48} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No tasks found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all' 
          ? 'You have no assigned tasks for the selected date range.'
          : `No ${selectedFilter.replace('_', ' ')} tasks found.`
        }
      </Text>
    </View>
  );

  const handleTaskStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    const success = await updateTaskStatus(taskId, newStatus);
    if (!success) {
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with real-time status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName}!
          </Text>
          <Text style={styles.subtitle}>Here are your assigned tasks</Text>
        </View>
        
        <View style={styles.statusIndicators}>
          {/* Real-time connection status */}
          <View style={styles.statusIndicator}>
            <Wifi size={16} color="#10b981" />
            <Text style={styles.statusText}>Live</Text>
          </View>
          
          {/* Notification status */}
          <View style={styles.statusIndicator}>
            {permissionStatus === 'granted' ? (
              <>
                <Bell size={16} color="#3b82f6" />
                <Text style={styles.statusText}>On</Text>
              </>
            ) : (
              <>
                <BellOff size={16} color="#ef4444" />
                <Text style={styles.statusText}>Off</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Show recent notification if any */}
      {notification && (
        <NotificationBanner 
          notification={notification}
          onDismiss={() => {/* Handle dismiss */}}
        />
      )}

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Today's Tasks"
          value={stats.today}
          icon={Calendar}
          color="#3b82f6"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Play}
          color="#f59e0b"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="#10b981"
        />
        <StatCard
          title="Urgent"
          value={stats.urgent}
          icon={AlertTriangle}
          color="#ef4444"
        />
      </View>

      {/* Date Filter */}
      <FilterChips
        chips={dateFilters}
        selectedChip={selectedDate}
        onChipPress={setSelectedDate}
      />

      {/* Status Filter */}
      <FilterChips
        chips={statusFilters}
        selectedChip={selectedFilter}
        onChipPress={setSelectedFilter}
      />

      {/* Last Update Indicator */}
      <View style={styles.updateIndicator}>
        <Clock size={12} color="#6b7280" />
        <Text style={styles.updateText}>
          Last updated: {lastUpdate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <TaskCard 
            task={item} 
            onStatusUpdate={() => {/* Task card handles its own updates */}}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusIndicators: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  updateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
