/**
 * Job Data Structures - Aligned with Webapp Technical Specification
 * Based on the JobData interface from the technical specification
 */

export interface JobData {
  // Core Identifiers
  id: string;
  
  // Booking Integration
  bookingId?: string;
  bookingRef?: {
    id: string;
    guestName: string;
    propertyName: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
  };
  
  // Property Data
  propertyId?: string;
  propertyRef?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    }
  };
  
  // Job Details
  jobType: 'cleaning' | 'maintenance' | 'checkin_prep' | 'checkout_process' | 'inspection' | 'setup' | 'concierge' | 'security' | 'custom';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Scheduling
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number; // minutes
  deadline?: string;
  
  // Staff Assignment - CRITICAL FIELDS
  assignedStaffId: string;
  userId: string; // Required by database policy for proper notification routing
  assignedStaffRef?: {
    id: string;
    name: string;
    role: string;
    skills: string[];
  };
  
  // Assignment Details
  assignedAt?: string;
  assignedBy?: {
    id: string;
    name: string;
  };
  
  // Job Status
  status: 'pending' | 'assigned' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    notes: string;
  }>;
  
  // Requirements
  requiredSkills?: string[];
  specialInstructions?: string;
  
  // Location & Access
  location?: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    accessInstructions?: string;
    parkingInstructions?: string;
  };
  
  // Timestamps
  createdAt: string | Date | any; // Firebase Timestamp
  updatedAt: string | Date | any; // Firebase Timestamp
  
  // Mobile Sync Fields
  syncVersion?: number;
  mobileOptimized?: {
    essentialData: {
      title: string;
      address: string;
      scheduledTime: string;
      priority: string;
    }
  };
  
  // Notification System
  notificationSent?: boolean;
  notificationId?: string;
  mobileNotificationPending?: boolean;
  lastNotificationAt?: string | Date | any; // Firebase Timestamp
}

export interface JobNotificationData {
  id?: string; // Document ID from Firestore
  jobId: string;
  staffId: string;
  userId: string; // Required by database policy
  staffName: string;
  staffEmail: string;
  jobTitle: string;
  jobType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  propertyName: string;
  propertyAddress: string;
  scheduledDate: string;
  scheduledStartTime?: string;
  estimatedDuration: number;
  specialInstructions?: string;
  type: 'job_assigned' | 'job_updated' | 'job_cancelled';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  readAt: null | Date | any; // Firebase Timestamp
  actionRequired: boolean;
  createdAt: Date | any; // Firebase Timestamp
  expiresAt: Date | any; // Firebase Timestamp
}

// Job response actions
export interface JobResponse {
  jobId: string;
  accepted: boolean;
  responseAt: string;
  notes?: string;
  estimatedArrival?: string;
}

// Job status update
export interface JobStatusUpdate {
  jobId: string;
  status: JobData['status'];
  notes?: string;
  updatedBy: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// For backward compatibility with existing Job type
export interface Job {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: Date;
  location: {
    address: string;
  };
  // Add other fields as needed for backward compatibility
}
