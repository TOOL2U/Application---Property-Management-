import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFieldOpsAI } from './useFieldOpsAI';
import { JobData } from '../types/jobData';
import { Job } from '../types/job';

export interface FOAChecklistStep {
  id: string;
  step: string;
  status: 'pending' | 'complete';
  timestamp?: any;
  notes?: string;
  isRequired?: boolean;
  category?: 'safety' | 'preparation' | 'execution' | 'documentation' | 'completion';
  estimatedDuration?: number; // minutes
}

export interface FOAChecklist {
  id: string;
  jobId: string;
  generatedAt: any;
  generatedBy: 'foa' | 'template' | 'manual';
  steps: FOAChecklistStep[];
  completionPercentage: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTotalTime?: number;
  actualTimeSpent?: number;
  lastUpdated: any;
}

interface UseFOAChecklistReturn {
  checklist: FOAChecklist | null;
  loading: boolean;
  error: string | null;
  generateChecklist: (job: JobData, forceRegenerate?: boolean) => Promise<boolean>;
  updateStepStatus: (stepId: string, status: 'pending' | 'complete', notes?: string) => Promise<boolean>;
  refreshChecklist: () => void;
  isEditable: boolean;
  progress: {
    percentage: number;
    completed: number;
    total: number;
    remaining: number;
  };
}

// Convert JobData to Job format for AI compatibility
const convertJobDataToJob = (jobData: JobData): Job => {
  return {
    id: jobData.id,
    title: jobData.title,
    description: jobData.description || '',
    type: (jobData.jobType as any) || 'general',
    status: (jobData.status as any) || 'pending',
    priority: jobData.priority,
    location: {
      address: typeof jobData.location === 'string' ? jobData.location : (jobData.propertyRef?.address || ''),
      city: '',
      state: '',
      zipCode: '',
      coordinates: jobData.propertyRef?.coordinates,
    },
    contacts: [],
    requirements: [],
    photos: [],
    notes: '',
    assignedTo: jobData.assignedStaffId,
    assignedBy: jobData.userId || '',
    assignedAt: jobData.assignedAt,
    createdBy: jobData.userId || '',
    createdAt: jobData.createdAt,
    updatedAt: jobData.updatedAt,
    dueDate: jobData.deadline,
    scheduledDate: jobData.scheduledDate,
    estimatedTime: jobData.estimatedDuration ? `${jobData.estimatedDuration} minutes` : undefined,
    estimatedDuration: jobData.estimatedDuration || 60,
  } as unknown as Job;
};

export const useFOAChecklist = (jobId: string, jobData?: JobData): UseFOAChecklistReturn => {
  const [checklist, setChecklist] = useState<FOAChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadJobGuidance } = useFieldOpsAI();

  // Determine if checklist is editable based on job status
  const isEditable = jobData?.status === 'in_progress' || jobData?.status === 'accepted';

  // Calculate progress
  const progress = {
    percentage: checklist ? Math.round((checklist.completedSteps / checklist.totalSteps) * 100) : 0,
    completed: checklist?.completedSteps || 0,
    total: checklist?.totalSteps || 0,
    remaining: checklist ? checklist.totalSteps - checklist.completedSteps : 0,
  };

  // Load checklist from Firestore with real-time updates
  useEffect(() => {
    if (!jobId) return;

    setLoading(true);
    const checklistRef = doc(db, 'job_checklists', jobId);

    const unsubscribe = onSnapshot(
      checklistRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setChecklist({
            id: doc.id,
            ...data,
            // Convert Firebase timestamps
            generatedAt: data.generatedAt?.toDate?.() || data.generatedAt,
            lastUpdated: data.lastUpdated?.toDate?.() || data.lastUpdated,
            steps: data.steps?.map((step: any) => ({
              ...step,
              timestamp: step.timestamp?.toDate?.() || step.timestamp,
            })) || [],
          } as FOAChecklist);
        } else {
          setChecklist(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error loading FOA checklist:', error);
        setError('Failed to load checklist');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  // Generate new checklist using FOA AI
  const generateChecklist = useCallback(async (job: JobData, forceRegenerate: boolean = false): Promise<boolean> => {
    if (!job) return false;

    setLoading(true);
    setError(null);

    try {
      // Check if checklist already exists
      if (!forceRegenerate && checklist) {
        setLoading(false);
        return true;
      }

      console.log('🧠 Generating FOA checklist for job:', job.id);

      // Convert JobData to Job format and generate checklist using FOA
      const convertedJob = convertJobDataToJob(job);
      const foaResponse = await loadJobGuidance(convertedJob, true);

      if (!foaResponse || !foaResponse.checklist) {
        throw new Error('Failed to generate checklist from FOA');
      }

      // Transform FOA checklist into our format
      const steps: FOAChecklistStep[] = foaResponse.checklist.map((item, index) => ({
        id: `step_${index + 1}`,
        step: item.task,
        status: 'pending' as const,
        isRequired: item.isRequired || false,
        category: 'execution', // Default category since AIChecklistItem doesn't have category
        estimatedDuration: item.estimatedMinutes || 15,
        notes: item.description || '',
      }));

      const newChecklist: FOAChecklist = {
        id: job.id,
        jobId: job.id,
        generatedAt: Timestamp.now(),
        generatedBy: 'foa',
        steps,
        completionPercentage: 0,
        totalSteps: steps.length,
        completedSteps: 0,
        estimatedTotalTime: steps.reduce((total, step) => total + (step.estimatedDuration || 15), 0),
        lastUpdated: Timestamp.now(),
      };

      // Save to Firestore
      const checklistRef = doc(db, 'job_checklists', job.id);
      await setDoc(checklistRef, newChecklist);

      console.log('✅ FOA checklist generated and saved successfully');
      return true;

    } catch (error) {
      console.error('❌ Error generating FOA checklist:', error);
      setError('Failed to generate checklist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [checklist, loadJobGuidance]);

  // Update step status
  const updateStepStatus = useCallback(async (stepId: string, status: 'pending' | 'complete', notes?: string): Promise<boolean> => {
    if (!checklist || !isEditable) return false;

    try {
      // Update step in local state first for immediate UI feedback
      const updatedSteps = checklist.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status,
            timestamp: status === 'complete' ? new Date() : undefined,
            notes: notes || step.notes,
          };
        }
        return step;
      });

      const completedCount = updatedSteps.filter(step => step.status === 'complete').length;
      const completionPercentage = Math.round((completedCount / updatedSteps.length) * 100);

      const updatedChecklist = {
        ...checklist,
        steps: updatedSteps,
        completedSteps: completedCount,
        completionPercentage,
        lastUpdated: Timestamp.now(),
      };

      // Update Firestore
      const checklistRef = doc(db, 'job_checklists', checklist.jobId);
      await updateDoc(checklistRef, updatedChecklist);

      console.log('✅ Step status updated:', stepId, status);
      return true;

    } catch (error) {
      console.error('❌ Error updating step status:', error);
      setError('Failed to update step');
      return false;
    }
  }, [checklist, isEditable]);

  // Refresh checklist
  const refreshChecklist = useCallback(() => {
    if (!jobId) return;
    setLoading(true);
    // The real-time listener will automatically update the state
  }, [jobId]);

  return {
    checklist,
    loading,
    error,
    generateChecklist,
    updateStepStatus,
    refreshChecklist,
    isEditable,
    progress,
  };
};
