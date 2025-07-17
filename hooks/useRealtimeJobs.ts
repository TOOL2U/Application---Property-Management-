import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Job } from '@/types/job';

interface UseRealtimeJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for real-time synchronization of jobs assigned to the current user
 * 
 * This hook uses Firebase Firestore's onSnapshot to maintain real-time updates
 * of jobs where assignedStaffId matches the current user and status is 'pending'
 * 
 * @returns Object containing jobs array, loading state, and error state
 * 
 * @example
 * ```jsx
 * const { jobs, loading, error } = useRealtimeJobs();
 * 
 * if (loading) return <ActivityIndicator />;
 * if (error) return <Text>Error: {error.message}</Text>;
 * 
 * return (
 *   <View>
 *     {jobs.map(job => (
 *       <JobCard key={job.id} job={job} />
 *     ))}
 *   </View>
 * );
 * ```
 */
export function useRealtimeJobs(): UseRealtimeJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    // Reset states when user changes
    setJobs([]);
    setLoading(true);
    setError(null);

    // Don't run query if no user is authenticated
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log('🔔 Setting up real-time jobs listener for user:', user.id);

    let unsubscribe: Unsubscribe;

    try {
      // Create Firestore query for jobs assigned to current user with pending status
      const jobsRef = collection(db, 'jobs');
      const jobsQuery = query(
        jobsRef,
        where('assignedStaffId', '==', user.id),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc') // Order by creation date, newest first
      );

      // Set up real-time listener
      unsubscribe = onSnapshot(
        jobsQuery,
        (snapshot) => {
          console.log('📡 Real-time jobs update received:', snapshot.size, 'pending jobs');

          try {
            // Transform Firestore documents to Job objects
            const jobsData: Job[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              
              // Transform Firestore document to Job object
              const job: Job = {
                id: doc.id,
                title: data.title || 'Untitled Job',
                description: data.description || '',
                type: data.type || 'general',
                status: data.status || 'pending',
                priority: data.priority || 'medium',
                assignedTo: data.assignedStaffId || user.id,
                assignedBy: data.assignedBy || 'system',
                assignedAt: data.assignedAt?.toDate() || new Date(),
                scheduledDate: data.scheduledDate?.toDate() || new Date(),
                estimatedDuration: data.estimatedDuration || 60,
                propertyId: data.propertyId || '',
                location: {
                  address: data.location?.address || '',
                  city: data.location?.city || '',
                  state: data.location?.state || '',
                  zipCode: data.location?.zipCode || '',
                  specialInstructions: data.location?.specialInstructions || ''
                },
                contacts: data.contacts || [],
                requirements: data.requirements || [],
                photos: data.photos || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                createdBy: data.createdBy || 'system',
                notificationsEnabled: data.notificationsEnabled ?? true,
                reminderSent: data.reminderSent ?? false,
              };

              jobsData.push(job);
            });

            // Update state with new jobs data
            setJobs(jobsData);
            setLoading(false);
            setError(null);

            // Log document changes for debugging
            snapshot.docChanges().forEach((change) => {
              const jobData = change.doc.data();
              switch (change.type) {
                case 'added':
                  console.log('🆕 New job added:', change.doc.id, jobData.title);
                  break;
                case 'modified':
                  console.log('📝 Job modified:', change.doc.id, jobData.title);
                  break;
                case 'removed':
                  console.log('🗑️ Job removed:', change.doc.id, jobData.title);
                  break;
              }
            });

          } catch (transformError) {
            console.error('❌ Error transforming job documents:', transformError);
            setError(transformError instanceof Error ? transformError : new Error('Failed to transform job data'));
            setLoading(false);
          }
        },
        (firestoreError) => {
          console.error('❌ Firestore real-time listener error:', firestoreError);
          setError(firestoreError instanceof Error ? firestoreError : new Error('Firestore query failed'));
          setLoading(false);
        }
      );

    } catch (setupError) {
      console.error('❌ Error setting up real-time jobs listener:', setupError);
      setError(setupError instanceof Error ? setupError : new Error('Failed to setup real-time listener'));
      setLoading(false);
    }

    // Cleanup function to unsubscribe from the listener
    return () => {
      if (unsubscribe) {
        console.log('🔇 Unsubscribing from real-time jobs listener');
        unsubscribe();
      }
    };

  }, [user?.id]); // Re-run effect when user ID changes

  return {
    jobs,
    loading,
    error
  };
}

export default useRealtimeJobs;
