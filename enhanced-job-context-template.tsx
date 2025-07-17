/**
 * Enhanced JobContext with Firebase Debugging
 * Template for mobile team to implement proper job queries
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase'; // Adjust import path

// Job interface - adjust based on your data structure
interface Job {
  id: string;
  title: string;
  description: string;
  userId: string;           // This should match authenticated user's UID
  assignedStaffId?: string; // Optional staff assignment
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
}

interface JobContextType {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  user: User | null;
  debugInfo: {
    totalQueries: number;
    lastQueryTime: Date | null;
    lastQueryCount: number;
    queryErrors: string[];
  };
  // Actions
  refreshJobs: () => Promise<void>;
  clearError: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

interface JobProviderProps {
  children: ReactNode;
  enableDebugLogging?: boolean;
}

export const JobProvider: React.FC<JobProviderProps> = ({ 
  children, 
  enableDebugLogging = __DEV__ // Enable in development by default
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    totalQueries: 0,
    lastQueryTime: null as Date | null,
    lastQueryCount: 0,
    queryErrors: [] as string[]
  });

  // Debug logging function
  const debugLog = (message: string, data?: any) => {
    if (enableDebugLogging) {
      console.log(`🔍 JobContext: ${message}`, data || '');
    }
  };

  // Authentication state listener
  useEffect(() => {
    debugLog('Setting up authentication listener...');
    
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        debugLog('User authenticated', {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName
        });
        setUser(authUser);
      } else {
        debugLog('User not authenticated');
        setUser(null);
        setJobs([]); // Clear jobs when user signs out
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Job queries setup
  useEffect(() => {
    if (!user) {
      debugLog('No user - skipping job queries');
      setLoading(false);
      return;
    }

    debugLog('Setting up job queries for user', { userId: user.uid });
    setLoading(true);
    setError(null);

    // Create the job query
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', user.uid), // This is the critical line - must match your data
      orderBy('createdAt', 'desc')
    );

    debugLog('Job query parameters', {
      collection: 'jobs',
      whereField: 'userId',
      whereValue: user.uid,
      orderBy: 'createdAt'
    });

    // Test the query first with getDocs (for debugging)
    const testQuery = async () => {
      try {
        debugLog('Testing query with getDocs...');
        const testSnapshot = await getDocs(jobsQuery);
        
        debugLog('Initial query test result', {
          size: testSnapshot.size,
          isEmpty: testSnapshot.empty
        });

        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          totalQueries: prev.totalQueries + 1,
          lastQueryTime: new Date(),
          lastQueryCount: testSnapshot.size
        }));

        // Log first few jobs for debugging
        if (testSnapshot.size > 0) {
          let count = 0;
          testSnapshot.forEach((doc) => {
            if (count < 3) { // Log first 3 jobs
              const data = doc.data();
              debugLog(`Sample job ${count + 1}`, {
                id: doc.id,
                title: data.title,
                userId: data.userId,
                assignedStaffId: data.assignedStaffId,
                status: data.status,
                createdAt: data.createdAt?.toDate?.()
              });
              count++;
            }
          });
        } else {
          debugLog('No jobs found - checking possible issues...');
          
          // Debug: Check if jobs exist with different query
          try {
            const allJobsQuery = query(collection(db, 'jobs'));
            const allJobsSnapshot = await getDocs(allJobsQuery);
            debugLog('Total jobs in collection', { count: allJobsSnapshot.size });
            
            if (allJobsSnapshot.size > 0) {
              debugLog('Sample job from collection to check structure...');
              const sampleDoc = allJobsSnapshot.docs[0];
              const sampleData = sampleDoc.data();
              debugLog('Sample job structure', {
                id: sampleDoc.id,
                userId: sampleData.userId,
                hasUserId: 'userId' in sampleData,
                assignedStaffId: sampleData.assignedStaffId,
                hasAssignedStaffId: 'assignedStaffId' in sampleData,
                allFields: Object.keys(sampleData)
              });
            }
          } catch (debugError) {
            debugLog('Debug query failed', debugError);
          }
        }
      } catch (queryError) {
        const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
        debugLog('Query test failed', errorMessage);
        
        setDebugInfo(prev => ({
          ...prev,
          queryErrors: [...prev.queryErrors, errorMessage]
        }));
      }
    };

    // Run the test query
    testQuery();

    // Set up real-time listener
    debugLog('Setting up real-time listener...');
    
    const unsubscribeJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        debugLog('Real-time update received', {
          size: snapshot.size,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
          fromCache: snapshot.metadata.fromCache
        });

        const jobsData: Job[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Validate job data structure
          if (!data.userId) {
            debugLog('Warning: Job missing userId', { jobId: doc.id, data });
          }
          
          const job: Job = {
            id: doc.id,
            title: data.title || 'Untitled Job',
            description: data.description || '',
            userId: data.userId,
            assignedStaffId: data.assignedStaffId,
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            location: data.location,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            dueDate: data.dueDate,
            completedAt: data.completedAt
          };
          
          jobsData.push(job);
        });

        // Log document changes for debugging
        snapshot.docChanges().forEach((change) => {
          const changeData = change.doc.data();
          debugLog(`Document ${change.type}`, {
            id: change.doc.id,
            title: changeData.title,
            type: change.type
          });
        });

        setJobs(jobsData);
        setLoading(false);
        setError(null);

        debugLog('Jobs state updated', {
          jobCount: jobsData.length,
          jobIds: jobsData.map(j => j.id)
        });
      },
      (firestoreError) => {
        const errorMessage = firestoreError instanceof Error ? firestoreError.message : 'Unknown Firestore error';
        debugLog('Real-time listener error', {
          error: errorMessage,
          code: (firestoreError as any)?.code,
          details: firestoreError
        });
        
        setError(errorMessage);
        setLoading(false);
        
        setDebugInfo(prev => ({
          ...prev,
          queryErrors: [...prev.queryErrors, errorMessage]
        }));
      }
    );

    return () => {
      debugLog('Cleaning up job listener');
      unsubscribeJobs();
    };
  }, [user]);

  // Manual refresh function
  const refreshJobs = async () => {
    if (!user) {
      debugLog('Cannot refresh - no authenticated user');
      return;
    }

    debugLog('Manual job refresh requested');
    setLoading(true);
    setError(null);

    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(jobsQuery);
      
      const jobsData: Job[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        jobsData.push({
          id: doc.id,
          ...data
        } as Job);
      });

      setJobs(jobsData);
      debugLog('Manual refresh completed', { jobCount: jobsData.length });

    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Unknown refresh error';
      setError(errorMessage);
      debugLog('Manual refresh failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: JobContextType = {
    jobs,
    loading,
    error,
    user,
    debugInfo,
    refreshJobs,
    clearError
  };

  return (
    <JobContext.Provider value={contextValue}>
      {children}
    </JobContext.Provider>
  );
};

// Hook to use the JobContext
export const useJobs = (): JobContextType => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};

// Debug component to show job context state
export const JobDebugInfo: React.FC = () => {
  const { jobs, loading, error, user, debugInfo } = useJobs();

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <div><strong>Job Context Debug</strong></div>
      <div>User: {user?.uid || 'Not authenticated'}</div>
      <div>Jobs: {jobs.length}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Error: {error || 'None'}</div>
      <div>Queries: {debugInfo.totalQueries}</div>
      <div>Last Count: {debugInfo.lastQueryCount}</div>
      <div>Errors: {debugInfo.queryErrors.length}</div>
    </div>
  );
};

export default JobProvider;
