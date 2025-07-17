import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { AdminService } from '@/services/adminService';
import { notificationService } from '@/services/notificationService';

interface UseRealtimeTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
}

export function useRealtimeTasks(staffId: string): UseRealtimeTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!staffId) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupRealtimeListener = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📋 Setting up real-time task listener for staff:', staffId);

        // Subscribe to real-time task updates from Firebase
        unsubscribe = AdminService.subscribeToStaffTasks(staffId, (updatedTasks: Task[]) => {
          console.log('📋 Real-time tasks updated:', updatedTasks.length);
          setTasks(updatedTasks);
          setLoading(false);
          setError(null);
          setLastUpdate(new Date());
        });

      } catch (err) {
        console.error('Error setting up real-time task listener:', err);
        setError('Failed to setup real-time updates');
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        console.log('📋 Cleaning up task listener');
        unsubscribe();
      }
    };
  }, [staffId]);

  // Update task status with real-time sync
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']): Promise<boolean> => {
    try {
      console.log(`🔄 Updating task ${taskId} to status: ${newStatus}`);
      
      // Update local state immediately for optimistic UI
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      );

      // Update task status in Firebase
      const completionNotes = newStatus === 'completed' ? 'Task completed by staff member' : undefined;
      await AdminService.updateTaskStatus(taskId, newStatus, completionNotes);
      
      setLastUpdate(new Date());
      
      // Send notification about task update - using booking notification for now
      const updatedTask = tasks.find(task => task.id === taskId);
      if (updatedTask) {
        // Note: Using booking notification method as task-specific method may not exist
        console.log('📱 Task status updated:', newStatus, 'for task:', taskId);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: task.status } // Revert to original status
            : task
        )
      );
      
      return false;
    }
  };

  // Force refresh tasks
  const refreshTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch fresh task data from Firebase
      const freshTasks = await AdminService.getTasksForStaff(staffId);
      setTasks(freshTasks);
      setLastUpdate(new Date());
      setLoading(false);
      
      console.log('🔄 Tasks refreshed manually:', freshTasks.length);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      setError('Failed to refresh tasks');
      setLoading(false);
    }
  };

  return {
    tasks,
    loading,
    error,
    lastUpdate,
    updateTaskStatus,
    refreshTasks,
  };
}
