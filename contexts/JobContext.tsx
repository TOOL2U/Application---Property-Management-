/**
 * JobContext - Real-time job management according to technical specification
 * Implements real-time Firebase listener for job assignments
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Unsubscribe,
  getFirestore
} from 'firebase/firestore';
import { getFirebaseApp, getFirebaseFirestore } from '@/lib/firebase';
import { JobData, JobNotificationData, JobResponse, JobStatusUpdate } from '@/types/jobData';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface JobContextType {
  // Job Data
  jobs: JobData[];
  pendingJobs: JobData[];
  assignedJobs: JobData[];
  inProgressJobs: JobData[];
  completedJobs: JobData[];
  
  // Loading States
  loading: boolean;
  error: string | null;
  
  // Notifications
  notifications: JobNotificationData[];
  unreadNotificationCount: number;
  
  // Actions
  respondToJob: (response: JobResponse) => Promise<boolean>;
  updateJobStatus: (update: JobStatusUpdate) => Promise<boolean>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;
  refreshJobs: () => Promise<void>;
  
  // Real-time status
  lastUpdate: Date | null;
  isConnected: boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProfile, isAuthenticated } = usePINAuth();
  
  // Get the proper Firestore instance
  // Async Firestore getter
  const getDb = async () => {
    try {
      return await getFirebaseFirestore();
    } catch (error) {
      console.error('❌ JobContext: Failed to get Firestore instance:', error);
      setError('Firebase connection error');
      setIsConnected(false);
      throw error;
    }
  };
  
  // State
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [notifications, setNotifications] = useState<JobNotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Unsubscribe functions
  const [unsubscribeJobs, setUnsubscribeJobs] = useState<Unsubscribe | null>(null);
  const [unsubscribeNotifications, setUnsubscribeNotifications] = useState<Unsubscribe | null>(null);

  // Computed values
  const pendingJobs = jobs.filter(job => job.status === 'pending');
  const assignedJobs = jobs.filter(job => job.status === 'assigned');
  const inProgressJobs = jobs.filter(job => job.status === 'in_progress');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const unreadNotificationCount = notifications.filter(n => n.status !== 'read').length;

  // Real-time job listener - Following technical specification
  useEffect(() => {
    let jobsUnsubscribe: Unsubscribe | null = null;
    let notificationsUnsubscribe: Unsubscribe | null = null;

    const setupListeners = async () => {
      if (!isAuthenticated || !currentProfile?.id) {
        // Clean up if not authenticated
        if (unsubscribeJobs) {
          unsubscribeJobs();
          setUnsubscribeJobs(null);
        }
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          setUnsubscribeNotifications(null);
        }
        setJobs([]);
        setNotifications([]);
        setLoading(false);
        setIsConnected(false);
        return;
      }

      console.log('📡 JobContext: Setting up real-time listeners for staff:', currentProfile.id);
      setLoading(true);

      const db = await getDb();

      // Set up job listener
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('assignedStaffId', '==', currentProfile.id),
        orderBy('createdAt', 'desc')
      );

      jobsUnsubscribe = onSnapshot(
        jobsQuery,
        (snapshot) => {
          const jobList: JobData[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            jobList.push({
              id: doc.id,
              ...data,
              // Convert Firebase timestamps to proper format
              createdAt: data.createdAt?.toDate?.() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
              lastNotificationAt: data.lastNotificationAt?.toDate?.() || data.lastNotificationAt,
            } as JobData);
          });
          
          console.log('🔄 JobContext: Jobs updated -', jobList.length, 'jobs for staff:', currentProfile.id);
          setJobs(jobList);
          setError(null);
          setLoading(false);
          setIsConnected(true);
          setLastUpdate(new Date());
        },
        (error) => {
          console.error('❌ JobContext: Jobs listener error:', error);
          setError('Failed to load jobs');
          setLoading(false);
          setIsConnected(false);
        }
      );

      // Set up notifications listener
      const notificationsQuery = query(
        collection(db, 'staff_notifications'),
        where('staffId', '==', currentProfile.id),
        orderBy('createdAt', 'desc')
      );

      notificationsUnsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const notificationList: JobNotificationData[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            notificationList.push({
              ...(data as Omit<JobNotificationData, 'id'>),
              id: doc.id,
              // Convert Firebase timestamps
              createdAt: data.createdAt?.toDate?.() || data.createdAt,
              expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
              readAt: data.readAt?.toDate?.() || data.readAt,
            } as JobNotificationData);
          });
          
          console.log('🔔 JobContext: Notifications updated -', notificationList.length, 'notifications');
          setNotifications(notificationList);
        },
        (error) => {
          console.error('❌ JobContext: Notifications listener error:', error);
        }
      );

      setUnsubscribeJobs(() => jobsUnsubscribe!);
      setUnsubscribeNotifications(() => notificationsUnsubscribe!);
    };

    setupListeners();

    // Cleanup function
    return () => {
      if (jobsUnsubscribe) jobsUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
    };
  }, [isAuthenticated, currentProfile?.id]);

  // Respond to job assignment (accept/decline)
  const respondToJob = async (response: JobResponse): Promise<boolean> => {
    try {
      console.log('🎯 JobContext: Responding to job:', response.jobId, 'accepted:', response.accepted);
      
  const db = await getDb();
  const jobRef = doc(db, 'jobs', response.jobId);
      const newStatus = response.accepted ? 'accepted' : 'declined';
      
      await updateDoc(jobRef, {
        status: newStatus,
        responseAt: response.responseAt,
        responseNotes: response.notes || '',
        estimatedArrival: response.estimatedArrival || '',
        updatedAt: serverTimestamp(),
        // Add to status history
        statusHistory: jobs.find(j => j.id === response.jobId)?.statusHistory || [] as any
      });

      console.log('✅ JobContext: Job response updated successfully');
      return true;
    } catch (error) {
      console.error('❌ JobContext: Error responding to job:', error);
      setError('Failed to respond to job');
      return false;
    }
  };

  // Update job status (start, complete, etc.)
  const updateJobStatus = async (update: JobStatusUpdate): Promise<boolean> => {
    try {
      console.log('🔄 JobContext: Updating job status:', update.jobId, 'to', update.status);
      
  const db = await getDb();
  const jobRef = doc(db, 'jobs', update.jobId);
      const updateData: any = {
        status: update.status,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: update.updatedBy,
      };

      // Add status-specific fields
      if (update.status === 'in_progress') {
        updateData.startedAt = serverTimestamp();
      } else if (update.status === 'completed') {
        updateData.completedAt = serverTimestamp();
        updateData.completionNotes = update.notes || '';
      }

      // Add location if provided
      if (update.location) {
        updateData.lastLocation = update.location;
      }

      await updateDoc(jobRef, updateData);

      console.log('✅ JobContext: Job status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ JobContext: Error updating job status:', error);
      setError('Failed to update job status');
      return false;
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
  const db = await getDb();
  const notificationRef = doc(db, 'staff_notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'read',
        readAt: serverTimestamp(),
      });

      console.log('✅ JobContext: Notification marked as read');
      return true;
    } catch (error) {
      console.error('❌ JobContext: Error marking notification as read:', error);
      return false;
    }
  };

  // Manual refresh
  const refreshJobs = async (): Promise<void> => {
    console.log('🔄 JobContext: Manual refresh requested');
    // The real-time listener will handle updates automatically
    setLastUpdate(new Date());
  };

  const contextValue: JobContextType = {
    // Data
    jobs,
    pendingJobs,
    assignedJobs,
    inProgressJobs,
    completedJobs,
    
    // States
    loading,
    error,
    
    // Notifications
    notifications,
    unreadNotificationCount,
    
    // Actions
    respondToJob,
    updateJobStatus,
    markNotificationAsRead,
    refreshJobs,
    
    // Status
    lastUpdate,
    isConnected,
  };

  return <JobContext.Provider value={contextValue}>{children}</JobContext.Provider>;
};
