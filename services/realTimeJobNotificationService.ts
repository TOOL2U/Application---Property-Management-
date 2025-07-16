/**
 * Real-time Job Notification Service
 * Watches for new job assignments and triggers notifications
 */

import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  Timestamp,
  DocumentChange 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { jobService } from '@/services/jobService';
import type { Job } from '@/types/job';

export interface JobNotificationData {
  jobId: string;
  title: string;
  description: string;
  propertyName: string;
  priority: string;
  scheduledDate: Date;
  type: string;
}

export interface NotificationCallbacks {
  onNewJobAssigned?: (job: JobNotificationData) => void;
  onJobUpdated?: (job: JobNotificationData) => void;
  onJobCancelled?: (jobId: string) => void;
}

class RealTimeJobNotificationService {
  private unsubscribers: Map<string, () => void> = new Map();
  private lastNotificationTime: Map<string, number> = new Map();
  private isListening = false;

  /**
   * Start listening for real-time job assignments for a specific staff member
   */
  startListening(staffId: string, callbacks: NotificationCallbacks): () => void {
    if (this.isListening) {
      console.log('🔔 Real-time job listener already active for staff:', staffId);
      return () => {};
    }

    console.log('🔔 Starting real-time job notification listener for staff:', staffId);

    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('assignedStaffId', '==', staffId),
      where('status', '==', 'pending'),
      orderBy('assignedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔄 Real-time job update received:', snapshot.size, 'pending jobs');

      snapshot.docChanges().forEach((change) => {
        const jobData = change.doc.data();
        const job: JobNotificationData = {
          jobId: change.doc.id,
          title: jobData.title || 'Untitled Job',
          description: jobData.description || '',
          propertyName: jobData.propertyName || jobData.location?.address || 'Unknown Property',
          priority: jobData.priority || 'medium',
          scheduledDate: jobData.scheduledDate?.toDate() || new Date(),
          type: jobData.type || 'general',
        };

        if (change.type === 'added') {
          this.handleNewJobAssignment(job, callbacks.onNewJobAssigned);
        } else if (change.type === 'modified') {
          this.handleJobUpdate(job, callbacks.onJobUpdated);
        } else if (change.type === 'removed') {
          this.handleJobCancellation(job.jobId, callbacks.onJobCancelled);
        }
      });
    }, (error) => {
      console.error('❌ Error in real-time job listener:', error);
    });

    this.unsubscribers.set(staffId, unsubscribe);
    this.isListening = true;

    return () => {
      this.stopListening(staffId);
    };
  }

  /**
   * Handle new job assignment
   */
  private handleNewJobAssignment(
    job: JobNotificationData, 
    callback?: (job: JobNotificationData) => void
  ): void {
    const now = Date.now();
    const lastNotification = this.lastNotificationTime.get(job.jobId) || 0;
    
    // Prevent duplicate notifications within 5 seconds
    if (now - lastNotification < 5000) {
      console.log('🔕 Skipping duplicate notification for job:', job.jobId);
      return;
    }

    console.log('🆕 New job assigned:', job.title, 'for property:', job.propertyName);
    
    this.lastNotificationTime.set(job.jobId, now);
    
    if (callback) {
      callback(job);
    }
  }

  /**
   * Handle job update
   */
  private handleJobUpdate(
    job: JobNotificationData, 
    callback?: (job: JobNotificationData) => void
  ): void {
    console.log('📝 Job updated:', job.title);
    
    if (callback) {
      callback(job);
    }
  }

  /**
   * Handle job cancellation
   */
  private handleJobCancellation(
    jobId: string, 
    callback?: (jobId: string) => void
  ): void {
    console.log('❌ Job cancelled:', jobId);
    
    if (callback) {
      callback(jobId);
    }
  }

  /**
   * Stop listening for a specific staff member
   */
  stopListening(staffId: string): void {
    const unsubscribe = this.unsubscribers.get(staffId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(staffId);
      console.log('🔕 Stopped real-time job listener for staff:', staffId);
    }
    
    if (this.unsubscribers.size === 0) {
      this.isListening = false;
    }
  }

  /**
   * Stop all listeners
   */
  stopAllListeners(): void {
    console.log('🔕 Stopping all real-time job listeners');
    
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    
    this.unsubscribers.clear();
    this.lastNotificationTime.clear();
    this.isListening = false;
  }

  /**
   * Check if currently listening for a staff member
   */
  isListeningForStaff(staffId: string): boolean {
    return this.unsubscribers.has(staffId);
  }

  /**
   * Get active listener count
   */
  getActiveListenerCount(): number {
    return this.unsubscribers.size;
  }
}

// Export singleton instance
export const realTimeJobNotificationService = new RealTimeJobNotificationService();
export default realTimeJobNotificationService;
