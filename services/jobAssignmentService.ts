/**
 * Job Assignment Service
 * Real-time job assignment integration between webapp and mobile app
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  // Fix: Remove unused imports
  // limit, writeBatch,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore, FirebaseAuthService } from '@/lib/firebase';
import { firebaseUidService } from './firebaseUidService';
import type {
  JobAssignment,
  JobAssignmentRequest,
  JobStatusUpdate,
  JobAssignmentResponse,
  JobListResponse,
  JobStatusUpdateResponse,
  JobAssignmentValidation,
  JobUpdateEvent,
  // Fix: Remove unused type imports
  // StaffAvailability, NotificationLog
} from '@/types/jobAssignment';

class JobAssignmentService {
  private unsubscribers: Map<string, () => void> = new Map();

  /**
   * Assign a job from webapp to mobile staff
   */
  async assignJob(request: JobAssignmentRequest): Promise<JobAssignmentResponse> {
    try {
      console.log('🎯 Assigning job to staff:', request.staffId);

      // Validate the assignment
      const validation = await this.validateJobAssignment(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          validation
        };
      }

      // Create job assignment document
      const jobAssignment: Omit<JobAssignment, 'id'> = {
        staffId: request.staffId,
        propertyId: request.propertyId,
        bookingId: request.bookingId,
        title: request.title,
        description: request.description,
        type: request.type,
        priority: request.priority,
        estimatedDuration: request.estimatedDuration,
        location: request.location,
        assignedBy: request.assignedBy,
        assignedAt: serverTimestamp() as Timestamp,
        scheduledFor: Timestamp.fromDate(request.scheduledFor),
        dueDate: request.dueDate ? Timestamp.fromDate(request.dueDate) : undefined,
        status: 'assigned',
        requirements: request.requirements.map((req, index) => ({
          id: `req_${Date.now()}_${index}`,
          ...req,
          isCompleted: false
        })),
        photos: [],
        notificationsSent: [],
        bookingDetails: request.bookingDetails,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        version: 1
      };

      // Add to Firestore
  const db = await getFirebaseFirestore();
  const jobsCollection = collection(db, 'job_assignments');
  const docRef = await addDoc(jobsCollection, jobAssignment);

      const createdJob: JobAssignment = {
        id: docRef.id,
        ...jobAssignment,
        assignedAt: new Date() as any,
        scheduledFor: new Date(request.scheduledFor) as any,
        dueDate: request.dueDate ? new Date(request.dueDate) as any : undefined,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };

      // Send push notification to staff
      await this.sendJobAssignmentNotification(createdJob);

      // Log the assignment event
      await this.logJobEvent({
        type: 'job_assigned',
        jobId: docRef.id,
        staffId: request.staffId,
        timestamp: serverTimestamp() as Timestamp,
        data: { status: 'assigned' },
        triggeredBy: request.assignedBy,
        source: 'webapp'
      });

      console.log('✅ Job assigned successfully:', docRef.id);

      return {
        success: true,
        jobId: docRef.id,
        job: createdJob
      };

    } catch (error) {
      console.error('❌ Error assigning job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update job status from mobile app
   */
  async updateJobStatus(update: JobStatusUpdate): Promise<JobStatusUpdateResponse> {
    try {
      console.log('📱 Updating job status from mobile:', update.jobId, update.status);

  const db = await getFirebaseFirestore();
  const jobRef = doc(db, 'job_assignments', update.jobId);
  const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      const currentJob = { id: jobDoc.id, ...jobDoc.data() } as JobAssignment;

      // Verify staff ownership
      if (currentJob.staffId !== update.staffId) {
        return {
          success: false,
          error: 'Unauthorized: Job not assigned to this staff member'
        };
      }

      // Prepare update data
      const updateData: Partial<JobAssignment> = {
        status: update.status,
        updatedAt: serverTimestamp() as Timestamp,
        version: currentJob.version + 1
      };

      // Handle specific status updates
      switch (update.status) {
        case 'accepted':
          updateData.accepted = true;
          updateData.acceptedAt = serverTimestamp() as Timestamp;
          break;
        
        case 'rejected':
          updateData.accepted = false;
          updateData.rejectedAt = serverTimestamp() as Timestamp;
          updateData.rejectionReason = update.rejectionReason;
          break;
        
        case 'in_progress':
          updateData.startedAt = update.startedAt ? 
            Timestamp.fromDate(update.startedAt) : 
            serverTimestamp() as Timestamp;
          break;
        
        case 'completed':
          updateData.completedAt = update.completedAt ? 
            Timestamp.fromDate(update.completedAt) : 
            serverTimestamp() as Timestamp;
          updateData.actualDuration = update.actualDuration;
          updateData.completionNotes = update.completionNotes;
          
          // Update requirements if provided
          if (update.requirementUpdates) {
            const updatedRequirements = currentJob.requirements.map(req => {
              const reqUpdate = update.requirementUpdates?.find(u => u.requirementId === req.id);
              if (reqUpdate) {
                return {
                  ...req,
                  isCompleted: reqUpdate.isCompleted,
                  completedAt: reqUpdate.isCompleted ? serverTimestamp() as Timestamp : undefined,
                  notes: reqUpdate.notes
                };
              }
              return req;
            });
            updateData.requirements = updatedRequirements;
          }
          break;
      }

      // Update the document
      await updateDoc(jobRef, updateData);

      // Get updated job
      const updatedJobDoc = await getDoc(jobRef);
      const updatedJob = { id: updatedJobDoc.id, ...updatedJobDoc.data() } as JobAssignment;

      // Log the status change event
      await this.logJobEvent({
        type: 'job_status_changed',
        jobId: update.jobId,
        staffId: update.staffId,
        timestamp: serverTimestamp() as Timestamp,
        data: { status: update.status, previousStatus: currentJob.status },
        triggeredBy: update.staffId,
        source: 'mobile'
      });

      // Send notification to webapp/admin about status change
      await this.notifyStatusChange(updatedJob, currentJob.status);

      console.log('✅ Job status updated successfully:', update.jobId, update.status);

      return {
        success: true,
        job: updatedJob
      };

    } catch (error) {
      console.error('❌ Error updating job status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get jobs assigned to a specific staff member
   */
  async getStaffJobs(staffId: string, statusFilter?: string[]): Promise<JobListResponse> {
    try {
      console.log('📋 Getting jobs for staff:', staffId);

      const db = await getFirebaseFirestore();
      const allJobs: JobAssignment[] = [];

      // Get Firebase UID for this staff member
      const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
      console.log('🔍 Firebase UID for staff', staffId, ':', firebaseUid);

      // If we can't get a Firebase UID, try to get it from current auth
      let queryStaffId = firebaseUid || staffId;
      if (!firebaseUid) {
        console.log('⚠️ No Firebase UID found, trying current user Firebase UID...');
        const currentStaffAccount = await FirebaseAuthService.getCurrentStaffAccount();
        if (currentStaffAccount) {
          queryStaffId = currentStaffAccount.firebaseUid || currentStaffAccount.id || staffId;
          console.log('🔍 Using current staff Firebase UID:', queryStaffId);
        }
      }

      // Query job_assignments collection (legacy)
      try {
        const jobAssignmentsCollection = collection(db, 'job_assignments');
        let q1 = query(
          jobAssignmentsCollection,
          where('staffId', '==', queryStaffId),
          orderBy('scheduledFor', 'desc')
        );
        if (statusFilter && statusFilter.length > 0) {
          q1 = query(q1, where('status', 'in', statusFilter));
        }
        const querySnapshot1 = await getDocs(q1);
        querySnapshot1.forEach((doc) => {
          allJobs.push({ id: doc.id, ...doc.data() } as JobAssignment);
        });
        console.log(`📋 Found ${querySnapshot1.size} jobs in job_assignments collection for Firebase UID: ${queryStaffId}`);
      } catch (error) {
        console.log('📋 job_assignments collection query failed (might not exist):', error);
      }

      // Query jobs collection (webapp integration) with Firebase UID
      try {
        const jobsCollection = collection(db, 'jobs');
        let q2 = query(
          jobsCollection,
          where('assignedStaffId', '==', queryStaffId),
          orderBy('createdAt', 'desc')
        );
        if (statusFilter && statusFilter.length > 0) {
          q2 = query(q2, where('status', 'in', statusFilter));
        }
        const querySnapshot2 = await getDocs(q2);
        querySnapshot2.forEach((doc) => {
          const jobData = doc.data();
          // Convert jobs collection format to JobAssignment format
          const jobAssignment: JobAssignment = {
            id: doc.id,
            staffId: jobData.assignedStaffId || queryStaffId,
            propertyId: jobData.propertyId || 'unknown',
            status: jobData.status || 'assigned',
            title: jobData.title || 'Untitled Job',
            description: jobData.description || '',
            type: (jobData.jobType || 'other') as any,
            priority: (jobData.priority || 'medium') as any,
            estimatedDuration: typeof jobData.estimatedDuration === 'string' 
              ? parseInt(jobData.estimatedDuration.replace(/\D/g, '') || '30')
              : typeof jobData.estimatedDuration === 'number' 
                ? jobData.estimatedDuration 
                : 30,
            location: {
              address: jobData.location?.address || 'Unknown Location',
              city: jobData.location?.city || '',
              state: jobData.location?.state || '',
              zipCode: jobData.location?.zipCode || '',
              coordinates: jobData.location?.coordinates,
              accessInstructions: jobData.location?.accessInstructions,
              accessCode: jobData.location?.accessCode
            },
            assignedBy: jobData.assignedBy || 'system',
            assignedAt: jobData.assignedAt || jobData.createdAt,
            scheduledFor: jobData.scheduledDate || jobData.createdAt,
            dueDate: jobData.dueDate,
            accepted: jobData.status === 'accepted' || jobData.status === 'in_progress',
            acceptedAt: jobData.acceptedAt,
            rejectedAt: jobData.rejectedAt,
            rejectionReason: jobData.rejectionReason,
            startedAt: jobData.startedAt,
            completedAt: jobData.completedAt,
            actualDuration: jobData.actualDuration,
            completionNotes: jobData.notes || '',
            requirements: jobData.requirements || [],
            checklist: jobData.checklist || [],
            photos: jobData.photos || [],
            documents: jobData.documents || [],
            bookingDetails: jobData.bookingDetails,
            notificationsSent: jobData.notificationsSent || [],
            createdAt: jobData.createdAt,
            updatedAt: jobData.updatedAt || jobData.createdAt,
            version: jobData.version || 1
          };
          allJobs.push(jobAssignment);
        });
        console.log(`📋 Found ${querySnapshot2.size} jobs in jobs collection for Firebase UID: ${queryStaffId}`);
      } catch (error) {
        console.log('📋 jobs collection query failed:', error);
      }

      console.log(`📋 Total jobs found: ${allJobs.length} for staff ${staffId} (Firebase UID: ${queryStaffId})`);

      return {
        success: true,
        jobs: allJobs,
        total: allJobs.length,
        page: 1,
        limit: allJobs.length
      };

    } catch (error) {
      console.error('❌ Error getting staff jobs:', error);
      return {
        success: false,
        jobs: [],
        total: 0,
        page: 1,
        limit: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Set up real-time listener for staff jobs
   */
  subscribeToStaffJobs(
    staffId: string, 
    callback: (jobs: JobAssignment[]) => void,
    statusFilter?: string[]
  ): () => void {
    console.log('🔄 Setting up real-time listener for staff jobs:', staffId);

    const allUnsubscribers: (() => void)[] = [];
    let combinedJobs: JobAssignment[] = [];
    let queryStaffId = staffId; // Initialize with original staffId

    // Return a no-op unsubscribe immediately; real unsubscribe is set up asynchronously
    (async () => {
      const db = await getFirebaseFirestore();

      // Get Firebase UID for this staff member
      const firebaseUid = await firebaseUidService.getFirebaseUid(staffId);
      console.log('🔍 Firebase UID for real-time listener:', firebaseUid);

      // If we can't get a Firebase UID, try to get it from current auth
      queryStaffId = firebaseUid || staffId;
      if (!firebaseUid) {
        console.log('⚠️ No Firebase UID found for listener, trying current user Firebase UID...');
        const currentStaffAccount = await FirebaseAuthService.getCurrentStaffAccount();
        if (currentStaffAccount) {
          queryStaffId = currentStaffAccount.firebaseUid || currentStaffAccount.id || staffId;
          console.log('🔍 Using current staff Firebase UID for listener:', queryStaffId);
        }
      }

      // Listen to job_assignments collection (legacy)
      try {
        const jobAssignmentsCollection = collection(db, 'job_assignments');
        let q1 = query(
          jobAssignmentsCollection,
          where('staffId', '==', queryStaffId),
          orderBy('scheduledFor', 'desc')
        );
        if (statusFilter && statusFilter.length > 0) {
          q1 = query(q1, where('status', 'in', statusFilter));
        }
        const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
          const legacyJobs: JobAssignment[] = [];
          querySnapshot.forEach((doc) => {
            legacyJobs.push({ id: doc.id, ...doc.data() } as JobAssignment);
          });
          console.log('🔄 Real-time update: received', legacyJobs.length, 'jobs from job_assignments');
          // Merge and call callback - implemented below
          mergeCombinedJobs('legacy', legacyJobs);
        }, (error) => {
          console.error('❌ Error in job_assignments listener:', error);
        });
        allUnsubscribers.push(unsubscribe1);
      } catch (error) {
        console.log('📋 job_assignments listener setup failed:', error);
      }

      // Listen to jobs collection (webapp integration) with Firebase UID
      try {
        const jobsCollection = collection(db, 'jobs');
        let q2 = query(
          jobsCollection,
          where('assignedStaffId', '==', queryStaffId),
          orderBy('createdAt', 'desc')
        );
        if (statusFilter && statusFilter.length > 0) {
          q2 = query(q2, where('status', 'in', statusFilter));
        }
        const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
          const webappJobs: JobAssignment[] = [];
          querySnapshot.forEach((doc) => {
            const jobData = doc.data();
            // Convert jobs collection format to JobAssignment format
            const jobAssignment: JobAssignment = {
              id: doc.id,
              staffId: jobData.assignedStaffId || queryStaffId,
              propertyId: jobData.propertyId || 'unknown',
              status: jobData.status || 'assigned',
              title: jobData.title || 'Untitled Job',
              description: jobData.description || '',
              type: (jobData.jobType || 'other') as any,
              priority: (jobData.priority || 'medium') as any,
              estimatedDuration: typeof jobData.estimatedDuration === 'string' 
                ? parseInt(jobData.estimatedDuration.replace(/\D/g, '') || '30')
                : typeof jobData.estimatedDuration === 'number' 
                  ? jobData.estimatedDuration 
                  : 30,
              location: {
                address: jobData.location?.address || 'Unknown Location',
                city: jobData.location?.city || '',
                state: jobData.location?.state || '',
                zipCode: jobData.location?.zipCode || '',
                coordinates: jobData.location?.coordinates,
                accessInstructions: jobData.location?.accessInstructions,
                accessCode: jobData.location?.accessCode
              },
              assignedBy: jobData.assignedBy || 'system',
              assignedAt: jobData.assignedAt || jobData.createdAt,
              scheduledFor: jobData.scheduledDate || jobData.createdAt,
              dueDate: jobData.dueDate,
              accepted: jobData.status === 'accepted' || jobData.status === 'in_progress',
              acceptedAt: jobData.acceptedAt,
              rejectedAt: jobData.rejectedAt,
              rejectionReason: jobData.rejectionReason,
              startedAt: jobData.startedAt,
              completedAt: jobData.completedAt,
              actualDuration: jobData.actualDuration,
              completionNotes: jobData.notes || '',
              requirements: jobData.requirements || [],
              checklist: jobData.checklist || [],
              photos: jobData.photos || [],
              documents: jobData.documents || [],
              bookingDetails: jobData.bookingDetails,
              notificationsSent: jobData.notificationsSent || [],
              createdAt: jobData.createdAt,
              updatedAt: jobData.updatedAt || jobData.createdAt,
              version: jobData.version || 1
            };
            webappJobs.push(jobAssignment);
          });
          console.log('🔄 Real-time update: received', webappJobs.length, 'jobs from jobs collection for Firebase UID:', queryStaffId);
          // Merge and call callback
          mergeCombinedJobs('webapp', webappJobs);
        }, (error) => {
          console.error('❌ Error in jobs listener:', error);
        });
        allUnsubscribers.push(unsubscribe2);
      } catch (error) {
        console.log('📋 jobs listener setup failed:', error);
      }

      // Store all unsubscribers
      const listenerId = `staff_jobs_${staffId}`;
      this.unsubscribers.set(listenerId, () => {
        allUnsubscribers.forEach(unsub => unsub());
      });
    })();

    // Function to merge jobs from both sources
    const mergeCombinedJobs = (source: 'legacy' | 'webapp', newJobs: JobAssignment[]) => {
      if (source === 'legacy') {
        // Remove old legacy jobs and add new ones
        combinedJobs = combinedJobs.filter(job => !job.id.startsWith('legacy_'));
        combinedJobs.push(...newJobs.map(job => ({ ...job, id: `legacy_${job.id}` })));
      } else {
        // Remove old webapp jobs and add new ones
        combinedJobs = combinedJobs.filter(job => !job.id.startsWith('webapp_') && !job.id.match(/^[a-zA-Z0-9]{20}$/));
        combinedJobs.push(...newJobs);
      }
      
      // Sort by date and call callback
      combinedJobs.sort((a, b) => {
        const aTime = a.scheduledFor?.seconds || a.assignedAt?.seconds || 0;
        const bTime = b.scheduledFor?.seconds || b.assignedAt?.seconds || 0;
        return bTime - aTime;
      });
      
      console.log(`🔄 Merged jobs update: ${combinedJobs.length} total jobs for staff ${staffId} (Firebase UID: ${queryStaffId})`);
      callback(combinedJobs);
    };

    return () => {
      allUnsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Set up real-time listener for a specific job
   */
  subscribeToJob(jobId: string, callback: (job: JobAssignment | null) => void): () => void {
    console.log('🔄 Setting up real-time listener for job:', jobId);

  // Return a no-op unsubscribe immediately; real unsubscribe is set up asynchronously
  (async () => {
      const db = await getFirebaseFirestore();
      const jobRef = doc(db, 'job_assignments', jobId);
      const unsubscribe = onSnapshot(jobRef, (doc) => {
        if (doc.exists()) {
          const job = { id: doc.id, ...doc.data() } as JobAssignment;
          console.log('🔄 Real-time update: job', jobId, 'status:', job.status);
          callback(job);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('❌ Error in job listener:', error);
      });
      // Store unsubscriber
      const listenerId = `job_${jobId}`;
      this.unsubscribers.set(listenerId, unsubscribe);
      // No return here; see above
    })();
    return () => {};
  }

  /**
   * Validate job assignment before creating
   */
  private async validateJobAssignment(request: JobAssignmentRequest): Promise<JobAssignmentValidation> {
    const validation: JobAssignmentValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      staffExists: false,
      propertyExists: false,
      bookingExists: false,
      staffAvailable: false,
      conflictingJobs: []
    };

    try {
      // Check if staff exists
  const db = await getFirebaseFirestore();
  const staffDoc = await getDoc(doc(db, 'staff_accounts', request.staffId));
      validation.staffExists = staffDoc.exists();
      if (!validation.staffExists) {
        validation.errors.push('Staff member not found');
      }

      // Check if property exists (if you have a properties collection)
      // const propertyDoc = await getDoc(doc(db, 'properties', request.propertyId));
      // validation.propertyExists = propertyDoc.exists();
      validation.propertyExists = true; // Assume exists for now

      // Check for conflicting jobs (same staff, overlapping time)
      const conflictQuery = query(
        collection(db, 'job_assignments'),
        where('staffId', '==', request.staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );
      const conflictSnapshot = await getDocs(conflictQuery);
      conflictSnapshot.forEach((doc) => {
        const job = doc.data() as JobAssignment;
        // Simple conflict check - same day
        const jobDate = job.scheduledFor.toDate();
        const requestDate = request.scheduledFor;
        
        if (jobDate.toDateString() === requestDate.toDateString()) {
          validation.conflictingJobs.push(doc.id);
          validation.warnings.push(`Staff has another job scheduled on ${requestDate.toDateString()}`);
        }
      });

      // Staff is considered available if they exist and have no critical conflicts
      validation.staffAvailable = validation.staffExists && validation.conflictingJobs.length === 0;

      // Set overall validity
      validation.isValid = validation.errors.length === 0;

    } catch (error) {
      console.error('❌ Error validating job assignment:', error);
      validation.errors.push('Validation failed due to system error');
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Send push notification for job assignment
   */
  private async sendJobAssignmentNotification(job: JobAssignment): Promise<void> {
    try {
      const { PushNotificationService } = await import('@/services/pushNotificationService');
      await PushNotificationService.sendJobAssignmentNotification(job);
    } catch (error) {
      console.error('❌ Error sending job assignment notification:', error);
    }
  }

  /**
   * Notify about status changes
   */
  private async notifyStatusChange(job: JobAssignment, previousStatus: string): Promise<void> {
    try {
      const { PushNotificationService } = await import('@/services/pushNotificationService');
      await PushNotificationService.sendJobStatusNotification(job, previousStatus, 'admin');
    } catch (error) {
      console.error('❌ Error sending status change notification:', error);
    }
  }

  /**
   * Log job events for audit trail
   */
  private async logJobEvent(event: JobUpdateEvent): Promise<void> {
    try {
  const db = await getFirebaseFirestore();
  const eventsCollection = collection(db, 'job_events');
  await addDoc(eventsCollection, event);
    } catch (error) {
      console.error('❌ Error logging job event:', error);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    console.log('🧹 Cleaning up job assignment listeners');
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribers.clear();
  }
}

// Export singleton instance
export const mobileJobAssignmentService = new JobAssignmentService();
export default mobileJobAssignmentService;
