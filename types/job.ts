/**
 * Job Management Types
 * Defines all types related to job management, assignments, and completion
 */

export type JobStatus = 
  | 'pending'      // Job created, waiting for staff assignment
  | 'assigned'     // Job assigned to staff, waiting for acceptance
  | 'accepted'     // Staff accepted the job
  | 'in_progress'  // Staff started working on the job
  | 'completed'    // Job completed by staff
  | 'verified'     // Job verified by manager/admin
  | 'cancelled'    // Job cancelled
  | 'rejected';    // Job rejected by staff

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export type JobType = 
  | 'cleaning'
  | 'maintenance'
  | 'inspection'
  | 'repair'
  | 'installation'
  | 'emergency'
  | 'general';

export interface JobLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  accessCodes?: {
    gate?: string;
    door?: string;
    alarm?: string;
  };
  specialInstructions?: string;
}

export interface JobContact {
  name: string;
  phone: string;
  email?: string;
  role: 'tenant' | 'property_manager' | 'owner' | 'emergency';
  preferredContactMethod: 'phone' | 'email' | 'text';
}

export interface JobPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  uploadedAt: Date;
  uploadedBy: string;
  type: 'before' | 'during' | 'after' | 'issue' | 'completion';
  description?: string;
  fileSize: number;
  mimeType: string;
}

export interface JobRequirement {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  photos?: string[]; // Photo IDs
  notes?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  
  // Assignment details
  assignedTo?: string; // Staff user ID
  assignedBy: string;  // Admin/Manager user ID
  assignedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  
  // Scheduling
  scheduledDate: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;   // in minutes
  
  // Location and property
  propertyId: string;
  location: JobLocation;
  
  // Contacts
  contacts: JobContact[];
  
  // Job requirements and completion
  requirements: JobRequirement[];
  photos: JobPhoto[];
  completionNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Additional fields
  specialInstructions?: string;
  tools?: string[];
  materials?: string[];
  estimatedCost?: number;
  actualCost?: number;
  
  // Tracking
  rejectionReason?: string;
  rejectedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  
  // Real-time tracking
  staffLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  // Notifications
  notificationsEnabled: boolean;
  reminderSent: boolean;
}

export interface JobAssignment {
  jobId: string;
  staffId: string;
  assignedBy: string;
  assignedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  response?: {
    timestamp: Date;
    reason?: string;
  };
}

export interface JobFilter {
  status?: JobStatus[];
  priority?: JobPriority[];
  type?: JobType[];
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  propertyId?: string;
}

export interface JobStats {
  total: number;
  pending: number;
  assigned: number;
  accepted: number;
  inProgress: number;
  completed: number;
  verified: number;
  cancelled: number;
  rejected: number;
}

export interface DailyJobSummary {
  date: Date;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  averageDuration: number;
  totalHours: number;
}

// API Response types
export interface JobResponse {
  success: boolean;
  job?: Job;
  error?: string;
  message?: string;
}

export interface JobListResponse {
  success: boolean;
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

export interface JobStatsResponse {
  success: boolean;
  stats: JobStats;
  dailySummary: DailyJobSummary[];
  error?: string;
}

// Form types for job creation/editing
export interface CreateJobRequest {
  title: string;
  description: string;
  type: JobType;
  priority: JobPriority;
  propertyId: string;
  assignedTo?: string;
  scheduledDate: Date;
  estimatedDuration: number;
  location: Omit<JobLocation, 'coordinates'>;
  contacts: Omit<JobContact, 'id'>[];
  requirements: Omit<JobRequirement, 'id' | 'isCompleted' | 'completedAt' | 'completedBy'>[];
  specialInstructions?: string;
  tools?: string[];
  materials?: string[];
  estimatedCost?: number;
}

export interface UpdateJobRequest {
  id: string;
  title?: string;
  description?: string;
  type?: JobType;
  priority?: JobPriority;
  status?: JobStatus;
  assignedTo?: string;
  scheduledDate?: Date;
  estimatedDuration?: number;
  location?: Partial<JobLocation>;
  contacts?: JobContact[];
  requirements?: JobRequirement[];
  specialInstructions?: string;
  tools?: string[];
  materials?: string[];
  estimatedCost?: number;
  actualCost?: number;
  completionNotes?: string;
}

export interface AcceptJobRequest {
  jobId: string;
  staffId: string;
  acceptedAt: Date;
  estimatedArrival?: Date;
  notes?: string;
}

export interface CompleteJobRequest {
  jobId: string;
  staffId: string;
  completedAt: Date;
  actualDuration: number;
  completionNotes: string;
  photos: string[]; // Photo IDs
  requirements: {
    id: string;
    isCompleted: boolean;
    notes?: string;
    photos?: string[];
  }[];
  actualCost?: number;
  materialsUsed?: string[];
}

export interface RejectJobRequest {
  jobId: string;
  staffId: string;
  rejectedAt: Date;
  reason: string;
}

// Real-time update types
export interface JobUpdate {
  jobId: string;
  field: keyof Job;
  value: any;
  updatedBy: string;
  timestamp: Date;
}

export interface LocationUpdate {
  jobId: string;
  staffId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

export default Job;
