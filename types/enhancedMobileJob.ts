/**
 * Enhanced Mobile Job Types - Multi-Tier Data Structure
 * Optimized for progressive loading and mobile performance
 */

import { Timestamp } from 'firebase/firestore';

// Tier 1: Critical Data (Load First - Immediate Display)
export interface CriticalJobData {
  title: string;                    // "Villa Cleaning - Ante cliffe"
  googleMapsLink: string;           // "https://maps.google.com/?q=7.9985,98.2965"
  accessCodes: string;              // "9876 / 2468"
  emergencyContact: string;         // "+66 85 123 4567"
  scheduledTime: string;            // "14:00"
  jobType: string;                  // "cleaning"
  propertyAddress: string;          // "Ante Cliff Villa, Koh Phangan"
  estimatedDuration: string;        // "2 hours"
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Tier 2: Job Details (Load After Job Acceptance)
export interface JobDetailsData {
  type: string;                     // "cleaning"
  estimatedDuration: string;        // "2 hours"
  suppliesRequired: string[];       // ["All-purpose cleaner", "Vacuum", "Mop", "Pool cleaning kit"]
  checklist: ChecklistItem[];       // Detailed task checklist
  specialInstructions: string;      // "Focus on pool area - check equipment"
  priority: string;                 // "medium"
  requirements: JobRequirement[];   // Specific job requirements
  tools: string[];                  // Required tools
  materials: string[];              // Required materials
}

// Tier 3: Property Context (Load On-Demand)
export interface PropertyContextData {
  layout: string;                   // "4BR/3BA villa with pool"
  guestStatus: string;              // "checked-out"
  lastCleaning: string;             // "3 days ago"
  previousIssues: string[];         // ["Pool pump needed attention last visit"]
  specialNotes: string[];           // ["Automatic gate - closes after 30 seconds", ...]
  safetyNotes?: string[];           // ["Steep driveway when wet", "Pool area can be slippery"]
  amenities: string[];              // ["Pool", "Garden", "Parking", "WiFi"]
  accessInstructions: string;       // Detailed access instructions
  wifiDetails?: {
    network: string;
    password: string;
  };
  utilityInfo?: {
    electricity: string;
    water: string;
    gas?: string;
  };
}

// Tier 4: Completion Tracking (Load When Starting Job)
export interface CompletionData {
  photoRequired: boolean;           // true
  photoRequirements: PhotoRequirement[]; // Specific photo requirements
  reportFields: ReportField[];      // Fields for completion report
  nextSteps: string[];              // ["Report any equipment issues", "Lock all doors", ...]
  completionConfirmation: 'photo' | 'signature' | 'both';
  qualityChecks: QualityCheck[];    // Final quality verification steps
  handoverNotes?: string;           // Notes for next staff member or property manager
}

// Supporting interfaces
export interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  estimatedTime?: number;           // in minutes
  instructions?: string;
  photoRequired?: boolean;
}

export interface JobRequirement {
  id: string;
  description: string;
  type: 'cleaning' | 'maintenance' | 'inspection' | 'setup';
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
}

export interface PhotoRequirement {
  id: string;
  description: string;             // "Before/after pool area"
  type: 'before' | 'during' | 'after' | 'issue' | 'completion';
  isRequired: boolean;
  completed: boolean;
  photoUrl?: string;
  instructions?: string;
}

export interface ReportField {
  id: string;
  fieldName: string;               // "cleaning_completed"
  displayName: string;             // "Cleaning Completed"
  type: 'boolean' | 'text' | 'number' | 'select' | 'multiselect';
  isRequired: boolean;
  value?: any;
  options?: string[];              // For select/multiselect fields
  placeholder?: string;
}

export interface QualityCheck {
  id: string;
  description: string;
  category: 'cleaning' | 'maintenance' | 'safety' | 'security';
  isCompleted: boolean;
  notes?: string;
}

// Main enhanced job structure
export interface EnhancedMobileJob {
  id: string;
  staffId: string;
  propertyId: string;
  
  // Core job data
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  assignedAt: Timestamp;
  acceptedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Multi-tier data structure
  mobileOptimized: {
    critical: CriticalJobData;           // Always loaded
    jobDetails?: JobDetailsData;         // Loaded after acceptance
    propertyContext?: PropertyContextData; // Loaded on-demand
    completion?: CompletionData;         // Loaded when starting job
  };
  
  // Metadata
  version: number;                     // For conflict resolution
  lastSynced: Timestamp;
  offlineChanges?: any[];              // For offline sync
}

// UI State Management
export interface JobUIState {
  // Data loading states
  criticalDataLoaded: boolean;
  jobDetailsLoaded: boolean;
  propertyContextLoaded: boolean;
  completionDataLoaded: boolean;
  
  // Job progress
  isAccepted: boolean;
  isStarted: boolean;
  checklistProgress: { [key: string]: boolean };
  photosCompleted: { [key: string]: string };
  reportProgress: { [key: string]: any };
  
  // UI states
  isExpanded: boolean;
  activeTab: 'details' | 'property' | 'completion';
  showPropertyContext: boolean;
  isSubmittingCompletion: boolean;
  
  // Error handling
  error?: string;
}

// Progressive Loading Response Types
export interface CriticalDataResponse {
  success: boolean;
  data?: CriticalJobData;
  error?: string;
}

export interface JobDetailsResponse {
  success: boolean;
  data?: JobDetailsData;
  error?: string;
}

export interface PropertyContextResponse {
  success: boolean;
  data?: PropertyContextData;
  error?: string;
}

export interface CompletionDataResponse {
  success: boolean;
  data?: CompletionData;
  error?: string;
}

// Action Types for Job Management
export type JobAction = 
  | { type: 'LOAD_CRITICAL_DATA'; payload: CriticalJobData }
  | { type: 'LOAD_JOB_DETAILS'; payload: JobDetailsData }
  | { type: 'LOAD_PROPERTY_CONTEXT'; payload: PropertyContextData }
  | { type: 'LOAD_COMPLETION_DATA'; payload: CompletionData }
  | { type: 'ACCEPT_JOB' }
  | { type: 'START_JOB' }
  | { type: 'UPDATE_CHECKLIST'; payload: { id: string; completed: boolean } }
  | { type: 'UPDATE_PHOTO'; payload: { requirementId: string; photoUrl: string } }
  | { type: 'UPDATE_REPORT'; payload: { fieldId: string; value: any } }
  | { type: 'COMPLETE_JOB' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

export default EnhancedMobileJob;
