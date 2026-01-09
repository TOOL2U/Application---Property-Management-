/**
 * JobContext - Real-time job management according to technical specification
 * Implements real-time Firebase listener for job assignments
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Unsubscribe,
  getFirestore
} from 'firebase/firestore';
import { getFirebaseApp, getFirebaseFirestore, initializeFirebase } from '@/lib/firebase';
import { JobData, JobNotificationData, JobResponse, JobStatusUpdate } from '@/types/jobData';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { firebaseUidService } from '@/services/firebaseUidService';

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
      // Ensure Firebase is initialized before getting Firestore
      await initializeFirebase();
      return await getFirebaseFirestore();
    } catch (error) {
      console.error('❌ JobContext: Firebase initialization failed:', error);
      setError('Firebase connection error');
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

      try {
        // Get Firebase UID for the current staff member
        const firebaseUid = await firebaseUidService.getFirebaseUid(currentProfile.id);
        
        if (!firebaseUid) {
          console.error('❌ JobContext: No Firebase UID found for staff:', currentProfile.id);
          setError('Unable to get Firebase UID for staff member');
          setLoading(false);
          setIsConnected(false);
          return;
        }

        console.log('🔍 JobContext: Using Firebase UID for queries:', firebaseUid);
        
        const db = await getDb();

        // Set up job listeners for BOTH collections (mobile app 'jobs' + webapp 'operational_jobs')
        // Query 1: Mobile app jobs collection - assigned to this staff member
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('assignedStaffId', '==', firebaseUid),
          orderBy('createdAt', 'desc')
        );
        
        // Query 2: Webapp operational_jobs collection - assigned to this staff member
        const operationalJobsQuery = query(
          collection(db, 'operational_jobs'),
          where('assignedStaffId', '==', firebaseUid),
          orderBy('createdAt', 'desc')
        );
        
        // Query 3: Unassigned operational_jobs for cleaners (pending/offered status, no assignment yet)
        const unassignedOperationalJobsQuery = query(
          collection(db, 'operational_jobs'),
          where('requiredRole', '==', 'cleaner'),
          where('status', 'in', ['pending', 'offered']),
          orderBy('createdAt', 'desc')
        );

        // Combined job list from all queries
        let assignedJobs: JobData[] = [];
        let assignedOperationalJobs: JobData[] = [];
        let unassignedJobs: JobData[] = [];
        
        // Listener 1: Mobile app jobs (assigned)
        const unsubscribe1 = onSnapshot(
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
                // Convert booking/schedule dates
                checkInDate: data.checkInDate?.toDate?.() || data.checkInDate,
                checkOutDate: data.checkOutDate?.toDate?.() || data.checkOutDate,
                scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor,
                scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
                startedAt: data.startedAt?.toDate?.() || data.startedAt,
                completedAt: data.completedAt?.toDate?.() || data.completedAt,
                rejectedAt: data.rejectedAt?.toDate?.() || data.rejectedAt,
              } as unknown as JobData);
            });
            
            console.log('🔄 JobContext: Mobile app assigned jobs updated -', jobList.length, 'jobs');
            assignedJobs = jobList;
            // Merge all job lists
            const allJobs = [...assignedJobs, ...assignedOperationalJobs, ...unassignedJobs];
            setJobs(allJobs);
            setError(null);
            setLoading(false);
            setIsConnected(true);
            setLastUpdate(new Date());
          },
          (error) => {
            console.error('❌ JobContext: Mobile jobs listener error:', error);
            setError('Failed to load jobs');
            setLoading(false);
            setIsConnected(false);
          }
        );
        
        // Listener 2: Webapp operational_jobs (assigned)
        const unsubscribe2 = onSnapshot(
          operationalJobsQuery,
          (snapshot) => {
            const operationalJobList: JobData[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              operationalJobList.push({
                id: doc.id,
                ...data,
                // Convert Firebase timestamps to proper format
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
                lastNotificationAt: data.lastNotificationAt?.toDate?.() || data.lastNotificationAt,
                // Convert booking/schedule dates
                checkInDate: data.checkInDate?.toDate?.() || data.checkInDate,
                checkOutDate: data.checkOutDate?.toDate?.() || data.checkOutDate,
                scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor,
                scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
                startedAt: data.startedAt?.toDate?.() || data.startedAt,
                completedAt: data.completedAt?.toDate?.() || data.completedAt,
                rejectedAt: data.rejectedAt?.toDate?.() || data.rejectedAt,
              } as unknown as JobData);
            });
            
            console.log('🔄 JobContext: Webapp assigned operational jobs updated -', operationalJobList.length, 'jobs');
            assignedOperationalJobs = operationalJobList;
            // Merge all job lists
            const allJobs = [...assignedJobs, ...assignedOperationalJobs, ...unassignedJobs];
            setJobs(allJobs);
            setError(null);
            setLoading(false);
            setIsConnected(true);
            setLastUpdate(new Date());
          },
          (error) => {
            console.error('❌ JobContext: Operational jobs listener error:', error);
            // Don't set error state - mobile jobs might still work
          }
        );
        
        // Listener 3: Unassigned operational_jobs (pending/offered for cleaners)
        const unsubscribe3 = onSnapshot(
          unassignedOperationalJobsQuery,
          (snapshot) => {
            const pendingJobList: JobData[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              // Only include if not already assigned to someone else
              if (!data.assignedStaffId || data.assignedStaffId === null) {
                pendingJobList.push({
                  id: doc.id,
                  ...data,
                  // Convert Firebase timestamps to proper format
                  createdAt: data.createdAt?.toDate?.() || data.createdAt,
                  updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
                  lastNotificationAt: data.lastNotificationAt?.toDate?.() || data.lastNotificationAt,
                  // Convert booking/schedule dates
                  checkInDate: data.checkInDate?.toDate?.() || data.checkInDate,
                  checkOutDate: data.checkOutDate?.toDate?.() || data.checkOutDate,
                  scheduledFor: data.scheduledFor?.toDate?.() || data.scheduledFor,
                  scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
                  startedAt: data.startedAt?.toDate?.() || data.startedAt,
                  completedAt: data.completedAt?.toDate?.() || data.completedAt,
                  rejectedAt: data.rejectedAt?.toDate?.() || data.rejectedAt,
                } as unknown as JobData);
              }
            });
            
            console.log('🔄 JobContext: Unassigned operational jobs updated -', pendingJobList.length, 'pending jobs available');
            unassignedJobs = pendingJobList;
            // Merge all job lists
            const allJobs = [...assignedJobs, ...assignedOperationalJobs, ...unassignedJobs];
            setJobs(allJobs);
            setError(null);
            setLoading(false);
            setIsConnected(true);
            setLastUpdate(new Date());
          },
          (error) => {
            console.error('❌ JobContext: Unassigned jobs listener error:', error);
            // Don't set error state - assigned jobs might still work
          }
        );

        // Combined unsubscribe function
        jobsUnsubscribe = () => {
          unsubscribe1();
          unsubscribe2();
          unsubscribe3();
        };

        // Set up notifications listener (using Firebase UID for notifications)
        const notificationsQuery = query(
          collection(db, 'staff_notifications'),
          where('userId', '==', firebaseUid),
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
        
      } catch (error) {
        console.error('❌ JobContext: Error setting up listeners:', error);
        setError('Failed to initialize job listeners');
        setLoading(false);
        setIsConnected(false);
      }
    };

    setupListeners();

    // Cleanup function
    return () => {
      if (jobsUnsubscribe) jobsUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
    };
  }, [isAuthenticated, currentProfile?.id]);

  // Respond to job assignment (accept/decline) - wrapped in useCallback
  const respondToJob = useCallback(async (response: JobResponse): Promise<boolean> => {
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
  }, [jobs]);

  // Update job status (start, complete, etc.)
  // Supports BOTH 'jobs' and 'operational_jobs' collections - wrapped in useCallback
  const updateJobStatus = useCallback(async (update: JobStatusUpdate): Promise<boolean> => {
    try {
      console.log('🔄 JobContext: Updating job status:', update.jobId, 'to', update.status);
      
      const db = await getDb();
      
      // Try to find job in both collections
      let jobRef = doc(db, 'jobs', update.jobId);
      let jobDoc = await getDoc(jobRef);
      let collection = 'jobs';

      // If not found in 'jobs', try 'operational_jobs'
      if (!jobDoc.exists()) {
        jobRef = doc(db, 'operational_jobs', update.jobId);
        jobDoc = await getDoc(jobRef);
        collection = 'operational_jobs';
      }

      if (!jobDoc.exists()) {
        console.error('❌ JobContext: Job not found in any collection:', update.jobId);
        setError('Job not found');
        return false;
      }

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

      console.log(`✅ JobContext: Job status updated successfully in ${collection} collection`);
      return true;
    } catch (error) {
      console.error('❌ JobContext: Error updating job status:', error);
      setError('Failed to update job status');
      return false;
    }
  }, [jobs]); // Depends on jobs array for status history

  // Mark notification as read - wrapped in useCallback
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
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
  }, []); // No dependencies

  // Manual refresh - wrapped in useCallback to prevent infinite loops
  const refreshJobs = useCallback(async (): Promise<void> => {
    console.log('🔄 JobContext: Manual refresh requested');
    // The real-time listener will handle updates automatically
    setLastUpdate(new Date());
  }, []); // No dependencies - always stable

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
