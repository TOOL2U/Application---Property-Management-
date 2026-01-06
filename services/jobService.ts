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
import { getDb } from '../lib/firebase';
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

// Import Firebase Storage functions directly for better error handling
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';

class JobService {
  private readonly JOBS_COLLECTION = 'jobs';
  private readonly COMPLETED_JOBS_COLLECTION = 'completed_jobs';
  private readonly JOB_PHOTOS_COLLECTION = 'job_photos';
  private readonly JOB_ASSIGNMENTS_COLLECTION = 'job_assignments';
  private readonly LOCATION_UPDATES_COLLECTION = 'location_updates';

  /**
   * Check if Firebase is ready with retry mechanism
   */
  private async waitForFirebaseInit(maxWaitMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const db = await getDb();
        if (db && typeof db.collection !== 'undefined') {
          return true;
        }
      } catch (error) {
        // Continue waiting
      }

      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * Get jobs assigned to a specific staff member
   */
  async getStaffJobs(staffId: string, filters?: JobFilter): Promise<JobListResponse> {
    try {
      console.log('🔍 JobService: Getting jobs for staff:', staffId);

      // Get initialized Firestore instance
      const db = await getDb();
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

      // Get initialized Firestore instance
      const db = await getDb();
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

      // Get initialized Firestore instance
      const db = await getDb();
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

      // Check if Firebase is properly initialized
      const isFirebaseReady = await this.waitForFirebaseInit(2000);
      if (!isFirebaseReady) {
        console.warn('⚠️ JobService: Firebase Firestore is not ready for accepting job');
        return {
          success: false,
          error: 'Firebase Firestore is not ready. Please try again.',
        };
      }

      const db = await getDb();
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

      const db = await getDb();
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
   * Upload photos for a job
   */
  async uploadJobPhotos(jobId: string, photos: string[]): Promise<JobResponse> {
    try {
      console.log('📸 JobService: Uploading photos for job:', jobId);

      const db = await getDb();
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

      // Get initialized Firestore instance
      const db = await getDb();
      
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
      console.log('🏁 JobService: Completing job and moving to completed collection:', request.jobId);

      const db = await getDb();
      const batch = writeBatch(db);
      
      // Step 1: Get the current job data
      const jobRef = doc(db, this.JOBS_COLLECTION, request.jobId);
      const jobDoc = await getDoc(jobRef);

      if (!jobDoc.exists()) {
        return {
          success: false,
          error: 'Job not found',
        };
      }

      const jobData = jobDoc.data();

      // Step 2: Update requirements with completion data
      let updatedRequirements = jobData.requirements || [];
      if (request.requirements && request.requirements.length > 0 && jobData.requirements && jobData.requirements.length > 0) {
        updatedRequirements = jobData.requirements.map((req: any) => {
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
      }

      // Step 3: Create completed job document with all data
      const completedJobData = {
        ...jobData,
        // Completion metadata
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: request.staffId,
        actualDuration: request.actualDuration,
        completionNotes: request.completionNotes,
        actualCost: request.actualCost || null,
        
        // Updated requirements
        requirements: updatedRequirements,
        
        // Photo URLs (from completion)
        photos: request.photos || [],
        
        // Timestamps
        updatedAt: serverTimestamp(),
        movedToCompletedAt: serverTimestamp(),
        
        // Original job metadata for reference
        originalJobId: request.jobId,
        originalCreatedAt: jobData.createdAt,
      };

      // Step 4: Add to completed_jobs collection
      const completedJobRef = doc(db, this.COMPLETED_JOBS_COLLECTION, request.jobId);
      batch.set(completedJobRef, completedJobData);

      // Step 5: Remove from active jobs collection
      batch.delete(jobRef);

      // Step 6: Commit the transaction
      await batch.commit();

      console.log('✅ JobService: Job completed and moved to completed_jobs collection successfully');
      return {
        success: true,
        message: 'Job completed and moved to completed collection successfully',
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
   * Get completed jobs from the completed_jobs collection
   * For webapp management access
   */
  async getCompletedJobs(filters?: {
    staffId?: string;
    startDate?: Date;
    endDate?: Date;
    propertyId?: string;
    limit?: number;
  }): Promise<JobListResponse> {
    try {
      console.log('📊 JobService: Getting completed jobs from completed_jobs collection');

      const db = await getDb();
      const completedJobsRef = collection(db, this.COMPLETED_JOBS_COLLECTION);
      
      // Build query with filters
      let q = query(completedJobsRef, orderBy('completedAt', 'desc'));
      
      if (filters?.staffId) {
        q = query(q, where('completedBy', '==', filters.staffId));
      }
      
      if (filters?.propertyId) {
        q = query(q, where('propertyId', '==', filters.propertyId));
      }
      
      if (filters?.startDate) {
        q = query(q, where('completedAt', '>=', filters.startDate));
      }
      
      if (filters?.endDate) {
        q = query(q, where('completedAt', '<=', filters.endDate));
      }
      
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const completedJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];

      console.log(`✅ JobService: Retrieved ${completedJobs.length} completed jobs`);
      return {
        success: true,
        jobs: completedJobs,
        total: completedJobs.length,
        page: 1,
        limit: filters?.limit || completedJobs.length,
      };
    } catch (error) {
      console.error('❌ JobService: Error getting completed jobs:', error);
      return {
        success: false,
        jobs: [],
        total: 0,
        page: 1,
        limit: 0,
        error: error instanceof Error ? error.message : 'Failed to get completed jobs',
      };
    }
  }

  /**
   * Get a single completed job by ID
   * For webapp management access
   */
  async getCompletedJobById(jobId: string): Promise<JobResponse> {
    try {
      console.log('📋 JobService: Getting completed job by ID:', jobId);

      const db = await getDb();
      const completedJobRef = doc(db, this.COMPLETED_JOBS_COLLECTION, jobId);
      const completedJobDoc = await getDoc(completedJobRef);

      if (!completedJobDoc.exists()) {
        return {
          success: false,
          error: 'Completed job not found',
        };
      }

      const completedJob = {
        id: completedJobDoc.id,
        ...completedJobDoc.data()
      } as Job;

      console.log('✅ JobService: Retrieved completed job successfully');
      return {
        success: true,
        job: completedJob,
      };
    } catch (error) {
      console.error('❌ JobService: Error getting completed job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get completed job',
      };
    }
  }

  /**
   * Reject a job assignment
   */
  async rejectJob(request: RejectJobRequest): Promise<JobResponse> {
    try {
      console.log('❌ JobService: Rejecting job:', request.jobId);

      const db = await getDb();
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
   * Apply property requirements template to job data
   * Call this before creating a job to add property requirements
   */
  async applyPropertyRequirementsToJob(jobData: any, propertyId: string): Promise<any> {
    try {
      console.log('� JobService: Applying property requirements to job:', propertyId);

      // Get property requirements template
      const { propertyService } = await import('./propertyService');
      const requirementsTemplate = await propertyService.getPropertyRequirementsTemplate(propertyId);
      
      // Convert template to job requirements format
      const requirements = requirementsTemplate.map(item => ({
        id: item.id,
        description: item.description,
        isCompleted: false,
        isRequired: item.isRequired,
        category: item.category,
        photos: [],
        notes: '',
        estimatedTime: item.estimatedTime,
        templateNotes: item.notes,
        completedAt: null,
        completedBy: null,
      }));

      console.log(`✅ JobService: Applied ${requirements.length} requirements from property template`);

      // Return job data with requirements
      return {
        ...jobData,
        requirements,
        propertyId,
      };
    } catch (error) {
      console.error('❌ JobService: Error applying property requirements:', error);
      // Return original job data if there's an error
      return {
        ...jobData,
        requirements: [],
        propertyId,
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
      console.log('📸 JobService: Image URI:', imageUri);
      console.log('📸 JobService: Photo type:', type);

      // Validate inputs
      if (!jobId || !imageUri) {
        throw new Error('Missing required parameters: jobId or imageUri');
      }

      // Get Firebase Storage instance directly
      let storageInstance;
      try {
        console.log('🔄 Getting Firebase Storage instance...');
        const app = getApp();
        storageInstance = getStorage(app);
        console.log('✅ Firebase Storage instance obtained successfully');
      } catch (storageError) {
        console.error('❌ Failed to get Firebase Storage instance:', storageError);
        const errorMessage = storageError instanceof Error ? storageError.message : 'Unknown error';
        throw new Error(`Firebase Storage is not available: ${errorMessage}`);
      }

      // Create unique filename
      const timestamp = Date.now();
      const filename = `job_${jobId}_${type}_${timestamp}.jpg`;
      
      console.log('📁 JobService: Creating storage reference for:', filename);
      console.log('🗄️ JobService: Storage instance type:', typeof storageInstance);
      console.log('🪣 JobService: Storage bucket:', storageInstance.app.options.storageBucket);
      const storagePath = `job_photos/${jobId}/${filename}`;
      console.log('📂 JobService: Full storage path:', storagePath);
      const photoRef = ref(storageInstance, storagePath);

      console.log('🌐 JobService: Fetching image from URI...');
      // Convert image URI to blob
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📊 JobService: Image blob created, size:', blob.size);
      console.log('📊 JobService: Image blob type:', blob.type);

      console.log('⬆️ JobService: Uploading to Firebase Storage...');
      // Upload to Firebase Storage with metadata
      const metadata = {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          jobId: jobId,
          uploadType: type,
        }
      };
      
      console.log('📦 JobService: Upload metadata:', metadata);
      const uploadResult = await uploadBytes(photoRef, blob, metadata);
      
      console.log('🔗 JobService: Getting download URL...');
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

      console.log('📝 JobService: Adding photo document to Firestore...');
      // Add photo to Firestore
      const db = await getDb();
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
      
      // Extract Firebase-specific error details
      const firebaseError = error as any;
      console.error('❌ JobService: Error code:', firebaseError?.code);
      console.error('❌ JobService: Server response:', firebaseError?.serverResponse);
      console.error('❌ JobService: Custom data:', firebaseError?.customData);
      console.error('❌ JobService: Full error details:', {
        jobId,
        imageUri,
        type,
        description,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorCode: firebaseError?.code,
        serverResponse: firebaseError?.serverResponse,
        customData: firebaseError?.customData,
        httpError: firebaseError?.httpErrorCode,
        errorName: error instanceof Error ? error.name : 'Unknown',
      });
      
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
      const db = await getDb();
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

    let unsubscribe: (() => void) | null = null;

    // Initialize async and set up listener
    (async () => {
      try {
        const db = await getDb();
        const jobsRef = collection(db, this.JOBS_COLLECTION);
        const q = query(
          jobsRef,
          where('assignedTo', '==', staffId),
          orderBy('scheduledDate', 'desc')
        );

        unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      } catch (error) {
        console.error('❌ JobService: Error setting up real-time listener:', error);
      }
    })();

    return () => {
      console.log('🔇 JobService: Unsubscribing from real-time updates');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

export const jobService = new JobService();
export default jobService;
