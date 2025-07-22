/**
 * Job Session Data Service for AI Audit System
 * Invisibly logs comprehensive job session data for backend AI analysis
 * 
 * ✅ STAFF-INVISIBLE: No UI notifications or indicators
 * ✅ COMPREHENSIVE: Captures all required audit data
 * ✅ STRUCTURED: Organized for AI agent consumption
 */

import { getDb } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';

// Comprehensive job session data structure for AI audit
export interface AuditJobSession {
  // Core session identifiers
  jobId: string;
  staffId: string;
  sessionId: string;
  
  // Time tracking for performance analysis
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // in minutes
  
  // Location data for verification
  startLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  endLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  
  // Job execution data
  status: 'in_progress' | 'completed' | 'cancelled';
  checklistData: ChecklistItem[];
  photos: PhotoMetadata[];
  notes: string[];
  
  // Performance metrics for AI analysis
  checklistCompletionRate: number; // 0-100%
  requiredTasksCompleted: boolean;
  photoCount: number;
  noteCount: number;
  
  // Timestamps for audit trail
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  
  // Job context for AI understanding
  jobDetails: {
    title: string;
    description: string;
    category: string;
    priority: string;
    estimatedDuration?: number;
    specialInstructions?: string;
  };
  
  // Staff context for audit
  staffDetails: {
    staffId: string;
    name: string;
    role: string;
    department?: string;
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  order: number;
}

export interface PhotoMetadata {
  id: string;
  filename: string;
  timestamp: Date;
  description?: string;
  size?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

class JobSessionAuditService {
  /**
   * Create initial job session with audit data structure
   * Called when job starts - invisible to staff
   */
  async createJobSession(data: {
    jobId: string;
    staffId: string;
    startTime: Date;
    startLocation: any;
    jobDetails: any;
    staffDetails: any;
  }): Promise<string> {
    try {
      const sessionId = `session_${data.jobId}_${Date.now()}`;
      
      const auditSession: AuditJobSession = {
        // Core identifiers
        jobId: data.jobId,
        staffId: data.staffId,
        sessionId,
        
        // Time tracking
        startTime: data.startTime,
        
        // Location data
        startLocation: data.startLocation ? {
          ...data.startLocation,
          timestamp: new Date(),
        } : null,
        endLocation: null,
        
        // Job execution
        status: 'in_progress',
        checklistData: [],
        photos: [],
        notes: [],
        
        // Performance metrics
        checklistCompletionRate: 0,
        requiredTasksCompleted: false,
        photoCount: 0,
        noteCount: 0,
        
        // Audit timestamps
        createdAt: data.startTime,
        updatedAt: data.startTime,
        lastActivityAt: data.startTime,
        
        // Context for AI - sanitize undefined values for Firestore
        jobDetails: {
          title: data.jobDetails?.title || 'Untitled Job',
          description: data.jobDetails?.description || '',
          category: data.jobDetails?.category || 'general',
          priority: data.jobDetails?.priority || 'medium',
          ...(data.jobDetails?.estimatedDuration !== undefined && { estimatedDuration: data.jobDetails.estimatedDuration }),
          ...(data.jobDetails?.specialInstructions !== undefined && { specialInstructions: data.jobDetails.specialInstructions }),
        },
        staffDetails: {
          staffId: data.staffDetails?.staffId || data.staffId,
          name: data.staffDetails?.name || 'Unknown Staff',
          role: data.staffDetails?.role || 'staff',
          ...(data.staffDetails?.department !== undefined && { department: data.staffDetails.department }),
        },
      };

      const db = await getDb();
      
      // Store in audit-specific collection for AI agent access
      const sessionRef = doc(db, 'job_sessions', data.jobId);
      await setDoc(sessionRef, {
        ...auditSession,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      // Also create in audit-specific collection for AI processing
      const auditRef = doc(db, 'audit_job_sessions', sessionId);
      await setDoc(auditRef, {
        ...auditSession,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      console.log('🔍 Audit: Job session created for analysis:', sessionId);
      return sessionId;
      
    } catch (error) {
      console.error('❌ Failed to create audit job session:', error);
      throw error;
    }
  }

  /**
   * Update checklist progress - invisible audit logging
   */
  async updateChecklistProgress(data: {
    jobId: string;
    checklistData: ChecklistItem[];
  }): Promise<void> {
    try {
      const db = await getDb();
      
      // Calculate metrics for AI analysis
      const totalItems = data.checklistData.length;
      const completedItems = data.checklistData.filter(item => item.completed).length;
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      const requiredItems = data.checklistData.filter(item => item.required);
      const requiredCompleted = requiredItems.filter(item => item.completed);
      const requiredTasksCompleted = requiredCompleted.length === requiredItems.length;

      // Update main session
      const sessionRef = doc(db, 'job_sessions', data.jobId);
      await updateDoc(sessionRef, {
        checklistData: data.checklistData,
        checklistCompletionRate: completionRate,
        requiredTasksCompleted,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      // Silent audit logging - no staff notification
      console.log('🔍 Audit: Checklist progress updated for AI analysis');
      
    } catch (error) {
      console.error('❌ Failed to update checklist audit data:', error);
    }
  }

  /**
   * Log photo capture - invisible to staff
   */
  async logPhotoCapture(data: {
    jobId: string;
    photoId: string;
    timestamp: Date;
    description?: string;
    location?: any;
  }): Promise<void> {
    try {
      const db = await getDb();
      
      const photoMetadata: PhotoMetadata = {
        id: data.photoId,
        filename: `job_${data.jobId}_${data.photoId}`,
        timestamp: data.timestamp,
        description: data.description,
        location: data.location,
      };

      // Add to session photos array
      const sessionRef = doc(db, 'job_sessions', data.jobId);
      
      // Get current session to update photo count
      await updateDoc(sessionRef, {
        [`photos.${data.photoId}`]: photoMetadata,
        photoCount: Date.now(), // Will be recalculated
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      console.log('🔍 Audit: Photo capture logged for AI analysis');
      
    } catch (error) {
      console.error('❌ Failed to log photo capture for audit:', error);
    }
  }

  /**
   * Log notes and observations - invisible audit data
   */
  async logNotes(data: {
    jobId: string;
    notes: string[];
  }): Promise<void> {
    try {
      const db = await getDb();
      
      const sessionRef = doc(db, 'job_sessions', data.jobId);
      await updateDoc(sessionRef, {
        notes: data.notes,
        noteCount: data.notes.length,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      console.log('🔍 Audit: Notes logged for AI analysis');
      
    } catch (error) {
      console.error('❌ Failed to log notes for audit:', error);
    }
  }

  /**
   * Complete job session with comprehensive audit data
   */
  async completeJobSession(data: {
    jobId: string;
    endTime: Date;
    endLocation: any;
    completionNotes: string;
    finalChecklistData: ChecklistItem[];
    finalPhotos: PhotoMetadata[];
  }): Promise<void> {
    try {
      const db = await getDb();
      
      // Calculate final metrics
      const totalDuration = data.endTime.getTime() - Date.now(); // Will be calculated properly
      const finalCompletionRate = data.finalChecklistData.length > 0 
        ? (data.finalChecklistData.filter(item => item.completed).length / data.finalChecklistData.length) * 100 
        : 0;

      const sessionRef = doc(db, 'job_sessions', data.jobId);
      await updateDoc(sessionRef, {
        status: 'completed',
        endTime: serverTimestamp(),
        endLocation: data.endLocation ? {
          ...data.endLocation,
          timestamp: data.endTime,
        } : null,
        totalDuration: Math.round(totalDuration / 60000), // minutes
        completionNotes: data.completionNotes,
        checklistCompletionRate: finalCompletionRate,
        photoCount: data.finalPhotos.length,
        noteCount: data.completionNotes ? 1 : 0,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      console.log('🔍 Audit: Job session completed - ready for AI analysis');
      
    } catch (error) {
      console.error('❌ Failed to complete audit job session:', error);
    }
  }

  /**
   * Get audit data for AI agent (backend use only)
   * This method is used by the web app AI agent
   */
  async getAuditSessionData(jobId: string): Promise<AuditJobSession | null> {
    try {
      const db = await getDb();
      const sessionRef = doc(db, 'job_sessions', jobId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        return sessionDoc.data() as AuditJobSession;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Failed to get audit session data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const jobSessionAuditService = new JobSessionAuditService();

export default jobSessionAuditService;
