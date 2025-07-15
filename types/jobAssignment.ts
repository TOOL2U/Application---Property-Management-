/**
 * Job Assignment Integration Types
 * Data models for webapp-mobile job assignment synchronization
 */

import { Timestamp } from 'firebase/firestore';

// Base job assignment interface
export interface JobAssignment {
  id: string;
  staffId: string;
  propertyId: string;
  bookingId?: string;
  
  // Job details
  title: string;
  description: string;
  type: JobType;
  priority: JobPriority;
  estimatedDuration: number; // in minutes
  
  // Location information
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accessInstructions?: string;
    accessCode?: string;
  };
  
  // Assignment details
  assignedBy: string; // Admin/Manager user ID
  assignedAt: Timestamp;
  scheduledFor: Timestamp;
  dueDate?: Timestamp;
  
  // Status tracking
  status: JobAssignmentStatus;
  accepted?: boolean;
  acceptedAt?: Timestamp;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
  
  // Completion tracking
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  actualDuration?: number;
  completionNotes?: string;
  
  // Requirements and checklist
  requirements: JobRequirement[];
  checklist?: ChecklistItem[];
  
  // Photos and documentation
  photos: JobPhoto[];
  documents?: JobDocument[];
  
  // Booking details (if linked to a booking)
  bookingDetails?: {
    guestName: string;
    checkIn: Timestamp;
    checkOut: Timestamp;
    specialRequests?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
  };
  
  // Notification tracking
  notificationsSent: NotificationLog[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number; // For conflict resolution
}

// Job types
export type JobType = 
  | 'cleaning'
  | 'maintenance'
  | 'inspection'
  | 'setup'
  | 'checkout'
  | 'emergency'
  | 'delivery'
  | 'other';

// Job priorities
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

// Job assignment status
export type JobAssignmentStatus = 
  | 'assigned'     // Assigned but not yet responded to
  | 'accepted'     // Staff accepted the job
  | 'rejected'     // Staff rejected the job
  | 'in_progress'  // Job is being worked on
  | 'completed'    // Job completed successfully
  | 'cancelled'    // Job was cancelled
  | 'overdue'      // Job passed due date without completion
  | 'reassigned';  // Job was reassigned to different staff

// Job requirements
export interface JobRequirement {
  id: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Timestamp;
  notes?: string;
}

// Checklist items
export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
  completedBy?: string;
}

// Job photos (extending existing type)
export interface JobPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'before' | 'during' | 'after' | 'issue' | 'completion';
  description?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  metadata?: {
    size: number;
    mimeType: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

// Job documents
export interface JobDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

// Notification log
export interface NotificationLog {
  id: string;
  type: NotificationType;
  sentAt: Timestamp;
  sentTo: string; // Staff ID
  method: 'push' | 'email' | 'sms';
  status: 'sent' | 'delivered' | 'failed';
  messageId?: string;
  error?: string;
}

// Notification types
export type NotificationType = 
  | 'job_assigned'
  | 'job_reminder'
  | 'job_overdue'
  | 'job_cancelled'
  | 'job_updated'
  | 'job_accepted'
  | 'job_rejected'
  | 'job_completed';

// Job assignment request (from webapp)
export interface JobAssignmentRequest {
  staffId: string;
  propertyId: string;
  bookingId?: string;
  title: string;
  description: string;
  type: JobType;
  priority: JobPriority;
  estimatedDuration: number;
  scheduledFor: Date;
  dueDate?: Date;
  requirements: Omit<JobRequirement, 'id' | 'isCompleted' | 'completedAt'>[];
  location: JobAssignment['location'];
  bookingDetails?: JobAssignment['bookingDetails'];
  assignedBy: string;
}

// Job status update (from mobile app)
export interface JobStatusUpdate {
  jobId: string;
  staffId: string;
  status: JobAssignmentStatus;
  accepted?: boolean;
  rejectionReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  completionNotes?: string;
  requirementUpdates?: {
    requirementId: string;
    isCompleted: boolean;
    notes?: string;
  }[];
  photoIds?: string[];
}

// Real-time job update event
export interface JobUpdateEvent {
  type: 'job_assigned' | 'job_updated' | 'job_status_changed';
  jobId: string;
  staffId: string;
  timestamp: Timestamp;
  data: Partial<JobAssignment>;
  triggeredBy: string; // User ID who triggered the update
  source: 'webapp' | 'mobile' | 'system';
}

// Push notification payload
export interface JobNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    jobId: string;
    staffId: string;
    priority: JobPriority;
    scheduledFor: string; // ISO string
    [key: string]: string;
  };
  android?: {
    priority: 'high' | 'normal';
    notification: {
      sound: string;
      channelId: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound: string;
        badge?: number;
      };
    };
  };
}

// Staff availability and preferences
export interface StaffAvailability {
  staffId: string;
  isAvailable: boolean;
  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
  preferredJobTypes: JobType[];
  maxJobsPerDay: number;
  currentJobCount: number;
  fcmTokens: string[]; // For push notifications
  notificationPreferences: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    reminderMinutes: number;
  };
  lastSeen: Timestamp;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Timestamp;
  };
}

// Job assignment validation result
export interface JobAssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  staffExists: boolean;
  propertyExists: boolean;
  bookingExists?: boolean;
  staffAvailable: boolean;
  conflictingJobs: string[];
}

// Webhook payload for external integrations
export interface JobAssignmentWebhook {
  event: 'job.assigned' | 'job.accepted' | 'job.rejected' | 'job.completed' | 'job.cancelled';
  timestamp: string; // ISO string
  jobAssignment: JobAssignment;
  previousStatus?: JobAssignmentStatus;
  triggeredBy: string;
  source: 'webapp' | 'mobile';
}

// API response types
export interface JobAssignmentResponse {
  success: boolean;
  jobId?: string;
  job?: JobAssignment;
  error?: string;
  validation?: JobAssignmentValidation;
}

export interface JobListResponse {
  success: boolean;
  jobs: JobAssignment[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

export interface JobStatusUpdateResponse {
  success: boolean;
  job?: JobAssignment;
  error?: string;
  conflictResolution?: {
    serverVersion: number;
    clientVersion: number;
    resolved: boolean;
  };
}
