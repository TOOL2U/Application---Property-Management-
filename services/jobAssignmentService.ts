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
import { db } from '@/lib/firebase';
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

      const jobsCollection = collection(db, 'job_assignments');
      let q = query(
        jobsCollection,
        where('staffId', '==', staffId),
        orderBy('scheduledFor', 'desc')
      );

      if (statusFilter && statusFilter.length > 0) {
        q = query(q, where('status', 'in', statusFilter));
      }

      const querySnapshot = await getDocs(q);
      const jobs: JobAssignment[] = [];

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as JobAssignment);
      });

      return {
        success: true,
        jobs,
        total: jobs.length,
        page: 1,
        limit: jobs.length
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

    const jobsCollection = collection(db, 'job_assignments');
    let q = query(
      jobsCollection,
      where('staffId', '==', staffId),
      orderBy('scheduledFor', 'desc')
    );

    if (statusFilter && statusFilter.length > 0) {
      q = query(q, where('status', 'in', statusFilter));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobs: JobAssignment[] = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as JobAssignment);
      });
      
      console.log('🔄 Real-time update: received', jobs.length, 'jobs for staff', staffId);
      callback(jobs);
    }, (error) => {
      console.error('❌ Error in real-time listener:', error);
    });

    // Store unsubscriber
    const listenerId = `staff_jobs_${staffId}`;
    this.unsubscribers.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Set up real-time listener for a specific job
   */
  subscribeToJob(jobId: string, callback: (job: JobAssignment | null) => void): () => void {
    console.log('🔄 Setting up real-time listener for job:', jobId);

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

    return unsubscribe;
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
