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
