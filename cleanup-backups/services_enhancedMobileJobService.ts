/**
 * Enhanced Mobile Job Service
 * Implements 4-tier progressive data loading for optimal mobile performance
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  addDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnhancedMobileJob,
  CriticalJobData,
  JobDetailsData,
  PropertyContextData,
  CompletionData,
  CriticalDataResponse,
  JobDetailsResponse,
  PropertyContextResponse,
  CompletionDataResponse,
  JobUIState
} from '../types/enhancedMobileJob';

class EnhancedMobileJobService {
  private cache = new Map<string, any>();
  private listeners = new Map<string, () => void>();

  // Tier 1: Critical Data (Load First - Immediate Display)
  async loadCriticalJobData(jobId: string): Promise<CriticalDataResponse> {
    try {
      // Check cache first
      const cacheKey = `critical_${jobId}`;
      if (this.cache.has(cacheKey)) {
        return { success: true, data: this.cache.get(cacheKey) };
      }

      const db = await getDb();
      const jobDoc = await getDoc(doc(db, 'jobAssignments', jobId));
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();
      
      // Extract critical data only
      const criticalData: CriticalJobData = {
        title: `${jobData.type || 'Job'} - ${jobData.property?.name || 'Property'}`,
        googleMapsLink: jobData.property?.googleMapsLink || '',
        accessCodes: jobData.property?.accessCodes || 'Contact property manager',
        emergencyContact: jobData.property?.emergencyContact || jobData.property?.contact || '',
        scheduledTime: this.formatScheduledTime(jobData.scheduledFor),
        jobType: jobData.type || 'general',
        propertyAddress: this.formatPropertyAddress(jobData.property),
        estimatedDuration: jobData.estimatedDuration || '1-2 hours',
        priority: jobData.priority || 'medium'
      };

      // Cache the result
      this.cache.set(cacheKey, criticalData);
      
      // Also cache to AsyncStorage for offline access
      await AsyncStorage.setItem(cacheKey, JSON.stringify(criticalData));

      return { success: true, data: criticalData };
    } catch (error) {
      console.error('Error loading critical job data:', error);
      
      // Try to load from offline cache
      try {
        const cacheKey = `critical_${jobId}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const criticalData = JSON.parse(cached);
          return { success: true, data: criticalData };
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load critical data' 
      };
    }
  }

  // Tier 2: Job Details (Load After Job Acceptance)
  async loadJobDetails(jobId: string): Promise<JobDetailsResponse> {
    try {
      const cacheKey = `details_${jobId}`;
      if (this.cache.has(cacheKey)) {
        return { success: true, data: this.cache.get(cacheKey) };
      }

      const db = await getDb();
      const jobDoc = await getDoc(doc(db, 'jobAssignments', jobId));
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();
      
      const jobDetails: JobDetailsData = {
        type: jobData.type || 'general',
        estimatedDuration: jobData.estimatedDuration || '1-2 hours',
        suppliesRequired: jobData.suppliesRequired || this.getDefaultSupplies(jobData.type),
        checklist: jobData.checklist || this.generateDefaultChecklist(jobData.type),
        specialInstructions: jobData.specialInstructions || '',
        priority: jobData.priority || 'medium',
        requirements: jobData.requirements || [],
        tools: jobData.tools || this.getDefaultTools(jobData.type),
        materials: jobData.materials || []
      };

      this.cache.set(cacheKey, jobDetails);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(jobDetails));

      return { success: true, data: jobDetails };
    } catch (error) {
      console.error('Error loading job details:', error);
      
      // Try offline cache
      try {
        const cacheKey = `details_${jobId}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { success: true, data: JSON.parse(cached) };
        }
      } catch (cacheError) {
        console.error('Error loading details from cache:', cacheError);
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load job details' 
      };
    }
  }

  // Tier 3: Property Context (Load On-Demand)
  async loadPropertyContext(jobId: string): Promise<PropertyContextResponse> {
    try {
      const cacheKey = `property_${jobId}`;
      if (this.cache.has(cacheKey)) {
        return { success: true, data: this.cache.get(cacheKey) };
      }

      const db = await getDb();
      const jobDoc = await getDoc(doc(db, 'jobAssignments', jobId));
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();
      const property = jobData.property || {};
      
      const propertyContext: PropertyContextData = {
        layout: property.layout || 'Standard layout',
        guestStatus: property.guestStatus || 'unknown',
        lastCleaning: this.formatLastCleaning(property.lastCleaning),
        previousIssues: property.previousIssues || [],
        specialNotes: property.specialNotes || [],
        safetyNotes: property.safetyNotes || [],
        amenities: property.amenities || [],
        accessInstructions: property.accessInstructions || 'Use provided access codes',
        wifiDetails: property.wifiDetails,
        utilityInfo: property.utilityInfo
      };

      this.cache.set(cacheKey, propertyContext);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(propertyContext));

      return { success: true, data: propertyContext };
    } catch (error) {
      console.error('Error loading property context:', error);
      
      try {
        const cacheKey = `property_${jobId}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { success: true, data: JSON.parse(cached) };
        }
      } catch (cacheError) {
        console.error('Error loading property from cache:', cacheError);
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load property context' 
      };
    }
  }

  // Tier 4: Completion Tracking (Load When Starting Job)
  async loadCompletionData(jobId: string): Promise<CompletionDataResponse> {
    try {
      const cacheKey = `completion_${jobId}`;
      if (this.cache.has(cacheKey)) {
        return { success: true, data: this.cache.get(cacheKey) };
      }

      const db = await getDb();
      const jobDoc = await getDoc(doc(db, 'jobAssignments', jobId));
      
      if (!jobDoc.exists()) {
        throw new Error('Job not found');
      }

      const jobData = jobDoc.data();
      
      const completionData: CompletionData = {
        photoRequired: jobData.photoRequired !== false, // Default to true
        photoRequirements: jobData.photoRequirements || this.getDefaultPhotoRequirements(jobData.type),
        reportFields: jobData.reportFields || this.getDefaultReportFields(jobData.type),
        nextSteps: jobData.nextSteps || this.getDefaultNextSteps(jobData.type),
        completionConfirmation: jobData.completionConfirmation || 'photo',
        qualityChecks: jobData.qualityChecks || this.getDefaultQualityChecks(jobData.type),
        handoverNotes: jobData.handoverNotes
      };

      this.cache.set(cacheKey, completionData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(completionData));

      return { success: true, data: completionData };
    } catch (error) {
      console.error('Error loading completion data:', error);
      
      try {
        const cacheKey = `completion_${jobId}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { success: true, data: JSON.parse(cached) };
        }
      } catch (cacheError) {
        console.error('Error loading completion from cache:', cacheError);
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load completion data' 
      };
    }
  }

  // Progressive Job Loading - Combines all tiers
  async loadJobProgressively(jobId: string, staffId: string) {
    // Always start with critical data
    const criticalResponse = await this.loadCriticalJobData(jobId);
    
    return {
      critical: criticalResponse,
      // These will be loaded on-demand
      loadJobDetails: () => this.loadJobDetails(jobId),
      loadPropertyContext: () => this.loadPropertyContext(jobId),
      loadCompletionData: () => this.loadCompletionData(jobId)
    };
  }

  // Job Actions
  async acceptJob(jobId: string, staffId: string): Promise<boolean> {
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'jobAssignments', jobId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: staffId
      });

      // Proactively load job details after acceptance
      this.loadJobDetails(jobId);

      return true;
    } catch (error) {
      console.error('Error accepting job:', error);
      return false;
    }
  }

  async startJob(jobId: string, staffId: string): Promise<boolean> {
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'jobAssignments', jobId), {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        startedBy: staffId
      });

      // Load completion data when starting
      this.loadCompletionData(jobId);

      return true;
    } catch (error) {
      console.error('Error starting job:', error);
      return false;
    }
  }

  async completeJob(jobId: string, staffId: string, completionData: any): Promise<boolean> {
    try {
      const db = await getDb();
      await updateDoc(doc(db, 'jobAssignments', jobId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: staffId,
        completionData: completionData
      });

      // Clear cache for this job
      this.clearJobCache(jobId);

      return true;
    } catch (error) {
      console.error('Error completing job:', error);
      return false;
    }
  }

  // Utility Methods
  private formatScheduledTime(scheduledFor: any): string {
    if (!scheduledFor) return 'ASAP';
    
    if (scheduledFor.toDate) {
      const date = scheduledFor.toDate();
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return 'ASAP';
  }

  private formatPropertyAddress(property: any): string {
    if (!property) return 'Address not available';
    
    const parts = [];
    if (property.name) parts.push(property.name);
    if (property.location) parts.push(property.location);
    if (property.address) parts.push(property.address);
    
    return parts.join(', ') || 'Address not available';
  }

  private formatLastCleaning(lastCleaning: any): string {
    if (!lastCleaning) return 'No recent cleaning data';
    
    if (lastCleaning.toDate) {
      const date = lastCleaning.toDate();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    }
    
    return 'No recent cleaning data';
  }

  private getDefaultSupplies(jobType: string): string[] {
    const suppliesMap: { [key: string]: string[] } = {
      cleaning: ['All-purpose cleaner', 'Vacuum', 'Mop', 'Microfiber cloths', 'Glass cleaner'],
      maintenance: ['Basic tool kit', 'Replacement parts', 'Safety equipment'],
      inspection: ['Checklist', 'Camera', 'Flashlight', 'Measuring tape'],
      default: ['Basic supplies']
    };
    
    return suppliesMap[jobType] || suppliesMap.default;
  }

  private generateDefaultChecklist(jobType: string) {
    const checklistMap: { [key: string]: any[] } = {
      cleaning: [
        { id: '1', description: 'Vacuum all areas', isRequired: true, isCompleted: false },
        { id: '2', description: 'Clean bathrooms', isRequired: true, isCompleted: false },
        { id: '3', description: 'Kitchen cleaning', isRequired: true, isCompleted: false },
        { id: '4', description: 'Change bed linens', isRequired: true, isCompleted: false }
      ],
      maintenance: [
        { id: '1', description: 'Check all systems', isRequired: true, isCompleted: false },
        { id: '2', description: 'Test equipment', isRequired: true, isCompleted: false }
      ],
      default: [
        { id: '1', description: 'Complete assigned tasks', isRequired: true, isCompleted: false }
      ]
    };
    
    return checklistMap[jobType] || checklistMap.default;
  }

  private getDefaultTools(jobType: string): string[] {
    const toolsMap: { [key: string]: string[] } = {
      cleaning: ['Vacuum cleaner', 'Mop', 'Bucket', 'Cleaning cloths'],
      maintenance: ['Screwdriver set', 'Wrench set', 'Multimeter', 'Flashlight'],
      default: ['Basic tools']
    };
    
    return toolsMap[jobType] || toolsMap.default;
  }

  private getDefaultPhotoRequirements(jobType: string) {
    return [
      { id: '1', description: 'Before starting work', type: 'before', isRequired: true, completed: false },
      { id: '2', description: 'Work completed', type: 'after', isRequired: true, completed: false }
    ];
  }

  private getDefaultReportFields(jobType: string) {
    return [
      { id: '1', fieldName: 'completion_status', displayName: 'Completion Status', type: 'select', isRequired: true, options: ['Completed', 'Partially Completed', 'Issues Found'] },
      { id: '2', fieldName: 'notes', displayName: 'Additional Notes', type: 'text', isRequired: false, placeholder: 'Any additional observations...' }
    ];
  }

  private getDefaultNextSteps(jobType: string): string[] {
    return [
      'Secure all access points',
      'Report any issues found',
      'Submit completion photos',
      'Update job status'
    ];
  }

  private getDefaultQualityChecks(jobType: string) {
    return [
      { id: '1', description: 'All tasks completed to standard', category: jobType, isCompleted: false },
      { id: '2', description: 'Area left clean and secure', category: 'security', isCompleted: false }
    ];
  }

  private clearJobCache(jobId: string) {
    const cacheKeys = [`critical_${jobId}`, `details_${jobId}`, `property_${jobId}`, `completion_${jobId}`];
    cacheKeys.forEach(key => {
      this.cache.delete(key);
      AsyncStorage.removeItem(key);
    });
  }

  // Real-time listeners for job updates
  async subscribeToJobUpdates(staffId: string, callback: (jobs: any[]) => void) {
    try {
      const db = await getDb();
      const q = query(
        collection(db, 'jobAssignments'),
        where('assignedTo', '==', staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(jobs);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up job subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }
}

export default new EnhancedMobileJobService();
