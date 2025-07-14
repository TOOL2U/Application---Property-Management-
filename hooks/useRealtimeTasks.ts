import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc,
  updateDoc,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/types';
import { notificationService } from '@/services/notificationService';

// Mock data for demo - in production this would come from Firestore
const mockTasks: Task[] = [
  {
    id: '1',
    staffId: 'demo-user-123',
    propertyId: 'prop-1',
    propertyName: 'Sunset Apartments - Unit 204',
    propertyAddress: '123 Sunset Blvd, Los Angeles, CA 90028',
    clientName: 'Sarah Johnson',
    clientPhone: '+1 (555) 987-6543',
    taskType: 'cleaning',
    status: 'not_started',
    priority: 'medium',
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    estimatedDuration: 90,
    description: 'Deep cleaning after tenant move-out. Focus on kitchen and bathrooms.',
    coordinates: {
      latitude: 34.0928,
      longitude: -118.3287,
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    staffId: 'demo-user-123',
    propertyId: 'prop-2',
    propertyName: 'Downtown Loft - Unit 15B',
    propertyAddress: '456 Spring St, Los Angeles, CA 90013',
    clientName: 'Michael Chen',
    clientPhone: '+1 (555) 456-7890',
    taskType: 'inspection',
    status: 'in_progress',
    priority: 'high',
    scheduledDate: new Date(Date.now() - 30 * 60 * 1000),
    estimatedDuration: 60,
    description: 'Pre-lease inspection for new tenant. Check all appliances and fixtures.',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

export function useRealtimeTasks(staffId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!staffId) {
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    const setupRealtimeListener = () => {
      try {
        // For demo purposes, simulate real-time updates with mock data
        console.log('🔄 Setting up real-time task listener for staff:', staffId);
        
        // Filter mock tasks for the current staff member
        const staffTasks = mockTasks.filter(task => task.staffId === staffId);
        
        // Simulate initial load
        setTimeout(() => {
          setTasks(staffTasks);
          setLoading(false);
          setLastUpdate(new Date());
          console.log('📋 Initial tasks loaded:', staffTasks.length);
        }, 1000);

        // Simulate real-time updates every 30 seconds
        const simulateUpdates = setInterval(() => {
          // Randomly update a task or add a new one
          const shouldUpdate = Math.random() > 0.7; // 30% chance of update
          
          if (shouldUpdate) {
            setTasks(prevTasks => {
              const updatedTasks = [...prevTasks];
              
              // Simulate different types of updates
              const updateType = Math.random();
              
              if (updateType > 0.8 && updatedTasks.length > 0) {
                // Update existing task status
                const randomIndex = Math.floor(Math.random() * updatedTasks.length);
                const task = updatedTasks[randomIndex];
                
                if (task.status === 'not_started') {
                  updatedTasks[randomIndex] = {
                    ...task,
                    status: 'in_progress',
                    updatedAt: new Date(),
                  };
                  
                  console.log('🔄 Task status updated to in_progress:', task.propertyName);
                  
                  // Send notification about task update
                  notificationService.sendTaskUpdateNotification(
                    staffId,
                    updatedTasks[randomIndex],
                    'status_changed'
                  );
                }
              } else if (updateType > 0.6) {
                // Add new urgent task
                const newTask: Task = {
                  id: `urgent-${Date.now()}`,
                  staffId: staffId,
                  propertyId: `prop-urgent-${Date.now()}`,
                  propertyName: 'Emergency Property - Unit 101',
                  propertyAddress: '999 Emergency Ave, Los Angeles, CA 90001',
                  clientName: 'Emergency Contact',
                  clientPhone: '+1 (555) 911-0000',
                  taskType: 'maintenance',
                  status: 'not_started',
                  priority: 'urgent',
                  scheduledDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
                  estimatedDuration: 45,
                  description: 'URGENT: Water leak reported. Immediate attention required.',
                  coordinates: {
                    latitude: 34.0522,
                    longitude: -118.2437,
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                
                updatedTasks.unshift(newTask);
                console.log('🚨 New urgent task assigned:', newTask.propertyName);
                
                // Send urgent task notification
                notificationService.sendUrgentTaskNotification(staffId, newTask);
              } else if (updateType > 0.4) {
                // Update task priority or schedule
                const randomIndex = Math.floor(Math.random() * updatedTasks.length);
                const task = updatedTasks[randomIndex];
                
                updatedTasks[randomIndex] = {
                  ...task,
                  priority: task.priority === 'medium' ? 'high' : 'medium',
                  scheduledDate: new Date(task.scheduledDate.getTime() + 60 * 60 * 1000), // +1 hour
                  updatedAt: new Date(),
                };
                
                console.log('📅 Task rescheduled:', task.propertyName);
                
                // Send update notification
                notificationService.sendTaskUpdateNotification(
                  staffId,
                  updatedTasks[randomIndex],
                  'rescheduled'
                );
              }
              
              setLastUpdate(new Date());
              return updatedTasks;
            });
          }
        }, 30000); // Update every 30 seconds

        // Cleanup function
        return () => {
          clearInterval(simulateUpdates);
        };

        /* 
        In production, use this Firestore real-time listener:
        
        const tasksRef = collection(db, 'tasks');
        const q = query(
          tasksRef,
          where('staffId', '==', staffId),
          orderBy('scheduledDate', 'asc')
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const updatedTasks: Task[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              updatedTasks.push({
                id: doc.id,
                ...data,
                scheduledDate: data.scheduledDate?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                completedAt: data.completedAt?.toDate(),
              } as Task);
            });

            setTasks(updatedTasks);
            setLoading(false);
            setError(null);
            setLastUpdate(new Date());
            
            console.log('📋 Real-time tasks updated:', updatedTasks.length);
          },
          (error) => {
            console.error('Error in real-time task listener:', error);
            setError('Failed to load tasks');
            setLoading(false);
          }
        );
        */

      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        setError('Failed to setup real-time updates');
        setLoading(false);
      }
    };

    const cleanup = setupRealtimeListener();

    return () => {
      if (cleanup) cleanup();
      if (unsubscribe) unsubscribe();
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

      // In production, update Firestore:
      /*
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'completed' && { completedAt: serverTimestamp() }),
      });
      */

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLastUpdate(new Date());
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
      
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In demo mode, just update the timestamp
      setLastUpdate(new Date());
      setLoading(false);
      
      console.log('🔄 Tasks refreshed manually');
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
