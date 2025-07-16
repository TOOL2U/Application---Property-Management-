/**
 * Job Service
 * Handles all job-related operations with Firebase Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  Job,
  JobStatus,
  JobFilter,
  JobResponse,
  JobListResponse,
  AcceptJobRequest,
  CompleteJobRequest,
  RejectJobRequest,
  JobPhoto,
  LocationUpdate,
} from '../types/job';

class JobService {
  private readonly JOBS_COLLECTION = 'jobs';
  private readonly JOB_PHOTOS_COLLECTION = 'job_photos';
  private readonly JOB_ASSIGNMENTS_COLLECTION = 'job_assignments';
  private readonly LOCATION_UPDATES_COLLECTION = 'location_updates';

  /**
   * Get jobs assigned to a specific staff member
   */
  async getStaffJobs(staffId: string, filters?: JobFilter): Promise<JobListResponse> {
    try {
      console.log('🔍 JobService: Getting jobs for staff:', staffId);

      const jobsRef = collection(db, this.JOBS_COLLECTION);
      let q = query(
        jobsRef,
        where('assignedTo', '==', staffId),
        orderBy('scheduledDate', 'desc')
      );

      // Apply filters
      if (filters?.status) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters?.dateRange) {
        q = query(
          q,
          where('scheduledDate', '>=', filters.dateRange.start),
          where('scheduledDate', '<=', filters.dateRange.end)
        );
      }

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate() || new Date(),
          assignedAt: data.assignedAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Job);
      });

      console.log(`✅ JobService: Found ${jobs.length} jobs for staff`);
      return {
        success: true,
        jobs,
        total: jobs.length,
        page: 1,
        limit: jobs.length,
      };
    } catch (error) {
      console.error('❌ JobService: Error getting staff jobs:', error);
      return {
        success: false,
        jobs: [],
        total: 0,
        page: 1,
        limit: 0,
        error: error instanceof Error ? error.message : 'Failed to get jobs',
      };
    }
  }

  /**
   * Get pending jobs for a specific staff member
   */
  async getPendingJobs(staffId: string): Promise<Job[]> {
    try {
      console.log('🔍 JobService: Getting pending jobs for staff:', staffId);

      const jobsRef = collection(db, this.JOBS_COLLECTION);
      const q = query(
        jobsRef,
        where('assignedTo', '==', staffId),
        where('status', '==', 'pending'),
        orderBy('scheduledDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const job: Job = {
          id: doc.id,
          title: data.title || 'Untitled Job',
          description: data.description || '',
          type: data.type || 'general',
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          assignedTo: data.assignedTo,
          assignedBy: data.assignedBy || data.createdBy,
          assignedAt: data.assignedAt?.toDate() || data.createdAt?.toDate() || new Date(),
          scheduledDate: data.scheduledDate?.toDate() || new Date(),
          estimatedDuration: data.estimatedDuration || 60,
          propertyId: data.propertyId || '',
          location: {
            address: data.location?.address || 'Address not provided',
            city: data.location?.city || '',
            state: data.location?.state || '',
            zipCode: data.location?.zipCode || '',
            specialInstructions: data.location?.specialInstructions || data.specialInstructions,
          },
          contacts: data.contacts || [],
          requirements: data.requirements || [],
          photos: data.photos || [],
          completionNotes: data.completionNotes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || data.assignedBy,
          specialInstructions: data.specialInstructions,
          tools: data.tools,
          materials: data.materials,
          estimatedCost: data.estimatedCost,
          actualCost: data.actualCost,
          rejectionReason: data.rejectionReason,
          rejectedAt: data.rejectedAt?.toDate(),
          cancellationReason: data.cancellationReason,
          cancelledAt: data.cancelledAt?.toDate(),
          staffLocation: data.staffLocation,
          notificationsEnabled: data.notificationsEnabled ?? true,
          reminderSent: data.reminderSent ?? false,
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
          actualDuration: data.actualDuration,
        };
        jobs.push(job);
      });

      console.log('✅ JobService: Found', jobs.length, 'pending jobs for staff', staffId);
      return jobs;

    } catch (error) {
      console.error('❌ JobService: Error getting pending jobs:', error);
      throw error;
    }
  }

  /**
   * Get active jobs for a specific staff member (accepted and in_progress)
   */
  async getActiveJobs(staffId: string): Promise<Job[]> {
    try {
      console.log('🔍 JobService: Getting active jobs for staff:', staffId);

      const jobsRef = collection(db, this.JOBS_COLLECTION);
      const q = query(
        jobsRef,
        where('assignedTo', '==', staffId),
        where('status', 'in', ['accepted', 'in_progress']),
        orderBy('scheduledDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const job: Job = this.mapFirestoreDataToJob(doc.id, data);
        jobs.push(job);
      });

      console.log('✅ JobService: Found', jobs.length, 'active jobs for staff', staffId);
      return jobs;

    } catch (error) {
      console.error('❌ JobService: Error getting active jobs:', error);
      throw error;
    }
  }

  /**
   * Helper method to map Firestore data to Job object
   */
  private mapFirestoreDataToJob(id: string, data: any): Job {
    return {
      id,
      title: data.title || 'Untitled Job',
      description: data.description || '',
      type: data.type || 'general',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy || data.createdBy,
      assignedAt: data.assignedAt?.toDate() || data.createdAt?.toDate() || new Date(),
      scheduledDate: data.scheduledDate?.toDate() || new Date(),
      estimatedDuration: data.estimatedDuration || 60,
      propertyId: data.propertyId || '',
      location: {
        address: data.location?.address || 'Address not provided',
        city: data.location?.city || '',
        state: data.location?.state || '',
        zipCode: data.location?.zipCode || '',
        coordinates: data.location?.coordinates,
        accessCodes: data.location?.accessCodes,
        specialInstructions: data.location?.specialInstructions || data.specialInstructions,
      },
      contacts: data.contacts || [],
      requirements: data.requirements || [],
      photos: data.photos || [],
      completionNotes: data.completionNotes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || data.assignedBy,
      specialInstructions: data.specialInstructions,
      tools: data.tools,
      materials: data.materials,
      estimatedCost: data.estimatedCost,
      actualCost: data.actualCost,
      rejectionReason: data.rejectionReason,
      rejectedAt: data.rejectedAt?.toDate(),
      cancellationReason: data.cancellationReason,
      cancelledAt: data.cancelledAt?.toDate(),
      staffLocation: data.staffLocation,
      notificationsEnabled: data.notificationsEnabled ?? true,
      reminderSent: data.reminderSent ?? false,
      acceptedAt: data.acceptedAt?.toDate(),
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      verifiedAt: data.verifiedAt?.toDate(),
      actualDuration: data.actualDuration,
    };
  }

  /**
   * Get today's jobs for a staff member
   */
  async getTodaysJobs(staffId: string): Promise<JobListResponse> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await this.getStaffJobs(staffId, {
        dateRange: {
          start: today,
          end: tomorrow,
        },
      });
    } catch (error) {
      console.error('❌ JobService: Error getting today\'s jobs:', error);
      return {
        success: false,
        jobs: [],
        total: 0,
        page: 1,
        limit: 0,
        error: error instanceof Error ? error.message : 'Failed to get today\'s jobs',
      };
    }
  }

  /**
   * Accept a job assignment
   */
  async acceptJob(request: AcceptJobRequest): Promise<JobResponse> {
    try {
      console.log('✅ JobService: Accepting job:', request.jobId);

      const jobRef = doc(db, this.JOBS_COLLECTION, request.jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const jobData = jobDoc.data();
      
      // Verify the job is assigned to this staff member
      if (jobData.assignedTo !== request.staffId) {
        return {
          success: false,
          error: 'Job not assigned to this staff member',
        };
      }

      // Update job status to accepted
      await updateDoc(jobRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Job accepted successfully');
      return {
        success: true,
        message: 'Job accepted successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error accepting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept job',
      };
    }
  }

  /**
   * Decline a job assignment
   */
  async declineJob(jobId: string, staffId: string, reason?: string): Promise<JobResponse> {
    try {
      console.log('❌ JobService: Declining job:', jobId, 'for staff:', staffId);

      const jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const jobData = jobDoc.data();

      // Verify the job is assigned to this staff member
      if (jobData.assignedTo !== staffId) {
        return {
          success: false,
          error: 'Job not assigned to this staff member',
        };
      }

      // Update job status to rejected
      await updateDoc(jobRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || 'No reason provided',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Job declined successfully');
      return {
        success: true,
        message: 'Job declined successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error declining job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decline job',
      };
    }
  }

  /**
   * Complete a job with photos
   */
  async completeJob(jobId: string, staffId: string, photos: string[], completionNotes?: string): Promise<JobResponse> {
    try {
      console.log('✅ JobService: Completing job:', jobId, 'for staff:', staffId);

      if (!photos || photos.length === 0) {
        return {
          success: false,
          error: 'At least one photo is required to complete the job',
        };
      }

      const jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const jobData = jobDoc.data();

      // Verify the job is assigned to this staff member
      if (jobData.assignedTo !== staffId) {
        return {
          success: false,
          error: 'Job not assigned to this staff member',
        };
      }

      // Verify the job is in an acceptable state for completion
      if (!['accepted', 'in_progress'].includes(jobData.status)) {
        return {
          success: false,
          error: 'Job cannot be completed in its current state',
        };
      }

      // Update job status to completed
      await updateDoc(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        photos: photos,
        completionNotes: completionNotes || '',
        actualDuration: jobData.startedAt ?
          Math.round((Date.now() - jobData.startedAt.toDate().getTime()) / (1000 * 60)) :
          jobData.estimatedDuration,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Job completed successfully');
      return {
        success: true,
        message: 'Job completed successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error completing job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete job',
      };
    }
  }

  /**
   * Upload photos for a job
   */
  async uploadJobPhotos(jobId: string, photos: string[]): Promise<JobResponse> {
    try {
      console.log('📸 JobService: Uploading photos for job:', jobId);

      const jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const existingPhotos = jobDoc.data().photos || [];
      const updatedPhotos = [...existingPhotos, ...photos];

      await updateDoc(jobRef, {
        photos: updatedPhotos,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Photos uploaded successfully');
      return {
        success: true,
        message: 'Photos uploaded successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error uploading photos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload photos',
      };
    }
  }

  /**
   * Start working on a job
   */
  async startJob(jobId: string, staffId: string): Promise<JobResponse> {
    try {
      console.log('🚀 JobService: Starting job:', jobId);

      const jobRef = doc(db, this.JOBS_COLLECTION, jobId);
      await updateDoc(jobRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Job started successfully');
      return {
        success: true,
        message: 'Job started successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error starting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start job',
      };
    }
  }

  /**
   * Complete a job
   */
  async completeJob(request: CompleteJobRequest): Promise<JobResponse> {
    try {
      console.log('🏁 JobService: Completing job:', request.jobId);

      const batch = writeBatch(db);
      const jobRef = doc(db, this.JOBS_COLLECTION, request.jobId);

      // Update job status and completion details
      batch.update(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        actualDuration: request.actualDuration,
        completionNotes: request.completionNotes,
        actualCost: request.actualCost || null,
        updatedAt: serverTimestamp(),
      });

      // Update requirements
      if (request.requirements && request.requirements.length > 0) {
        const jobDoc = await getDoc(jobRef);
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          const updatedRequirements = jobData.requirements?.map((req: any) => {
            const update = request.requirements.find(r => r.id === req.id);
            if (update) {
              return {
                ...req,
                isCompleted: update.isCompleted,
                completedAt: update.isCompleted ? new Date() : null,
                completedBy: update.isCompleted ? request.staffId : null,
                notes: update.notes || req.notes,
                photos: update.photos || req.photos,
              };
            }
            return req;
          });

          batch.update(jobRef, {
            requirements: updatedRequirements,
          });
        }
      }

      await batch.commit();

      console.log('✅ JobService: Job completed successfully');
      return {
        success: true,
        message: 'Job completed successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error completing job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete job',
      };
    }
  }

  /**
   * Reject a job assignment
   */
  async rejectJob(request: RejectJobRequest): Promise<JobResponse> {
    try {
      console.log('❌ JobService: Rejecting job:', request.jobId);

      const jobRef = doc(db, this.JOBS_COLLECTION, request.jobId);
      await updateDoc(jobRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: request.reason,
        assignedTo: null, // Remove assignment
        updatedAt: serverTimestamp(),
      });

      console.log('✅ JobService: Job rejected successfully');
      return {
        success: true,
        message: 'Job rejected successfully',
      };
    } catch (error) {
      console.error('❌ JobService: Error rejecting job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject job',
      };
    }
  }

  /**
   * Upload job photo
   */
  async uploadJobPhoto(
    jobId: string,
    imageUri: string,
    type: JobPhoto['type'],
    description?: string
  ): Promise<{ success: boolean; photo?: JobPhoto; error?: string }> {
    try {
      console.log('📸 JobService: Uploading photo for job:', jobId);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `job_${jobId}_${type}_${timestamp}.jpg`;
      const photoRef = ref(storage, `job_photos/${jobId}/${filename}`);

      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const uploadResult = await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Create photo document
      const photoData: Omit<JobPhoto, 'id'> = {
        url: downloadURL,
        filename,
        uploadedAt: new Date(),
        uploadedBy: '', // Will be set by calling component
        type,
        description: description || '',
        fileSize: blob.size,
        mimeType: blob.type,
      };

      // Add photo to Firestore
      const photoDocRef = await addDoc(collection(db, this.JOB_PHOTOS_COLLECTION), {
        ...photoData,
        jobId,
        uploadedAt: serverTimestamp(),
      });

      const photo: JobPhoto = {
        id: photoDocRef.id,
        ...photoData,
      };

      console.log('✅ JobService: Photo uploaded successfully');
      return {
        success: true,
        photo,
      };
    } catch (error) {
      console.error('❌ JobService: Error uploading photo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload photo',
      };
    }
  }

  /**
   * Update staff location for a job
   */
  async updateStaffLocation(update: LocationUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      const locationRef = collection(db, this.LOCATION_UPDATES_COLLECTION);
      await addDoc(locationRef, {
        ...update,
        timestamp: serverTimestamp(),
      });

      // Also update the job document with latest location
      const jobRef = doc(db, this.JOBS_COLLECTION, update.jobId);
      await updateDoc(jobRef, {
        staffLocation: {
          latitude: update.location.latitude,
          longitude: update.location.longitude,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ JobService: Error updating location:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update location',
      };
    }
  }

  /**
   * Listen to real-time job updates
   */
  subscribeToStaffJobs(
    staffId: string,
    callback: (jobs: Job[]) => void
  ): () => void {
    console.log('👂 JobService: Subscribing to real-time job updates for staff:', staffId);

    const jobsRef = collection(db, this.JOBS_COLLECTION);
    const q = query(
      jobsRef,
      where('assignedTo', '==', staffId),
      orderBy('scheduledDate', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const jobs: Job[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate() || new Date(),
          assignedAt: data.assignedAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Job);
      });

      console.log(`🔄 JobService: Real-time update - ${jobs.length} jobs`);
      callback(jobs);
    });
  }
}

export const jobService = new JobService();
export default jobService;
