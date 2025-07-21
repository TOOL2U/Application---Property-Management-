/**
 * Photo Verification Service
 * Handles job photo requirements and validation workflow
 */

import { Job } from '@/types/job';
import { aiLoggingService } from './aiLoggingService';

export interface PhotoRequirement {
  id: string;
  description: string;
  isRequired: boolean;
  completed: boolean;
  photoUri?: string;
  timestamp?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PhotoVerificationResult {
  isValid: boolean;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

export interface JobPhotoChecklist {
  jobId: string;
  requirements: PhotoRequirement[];
  overallProgress: number;
  requiredPhotosCount: number;
  completedPhotosCount: number;
  canCompleteJob: boolean;
}

class PhotoVerificationService {
  /**
   * Generate photo requirements for a specific job type
   */
  async generatePhotoRequirements(job: Job): Promise<PhotoRequirement[]> {
    try {
      const baseRequirements = this.getBasePhotoRequirements();
      const jobSpecificRequirements = this.getJobSpecificRequirements(job.type);
      
      // Combine and customize based on job details
      const allRequirements = [...baseRequirements, ...jobSpecificRequirements];
      
      // Add location-specific requirements if applicable
      if (job.location?.specialInstructions) {
        allRequirements.push({
          id: `special-${Date.now()}`,
          description: 'Photo showing special instruction compliance',
          isRequired: false,
          completed: false,
        });
      }

      return allRequirements;
    } catch (error) {
      console.error('❌ Error generating photo requirements:', error);
      return this.getBasePhotoRequirements();
    }
  }

  /**
   * Generate enhanced photo checklist (fallback to standard requirements)
   */
  async generateAIPhotoChecklist(job: Job, staffId: string): Promise<PhotoRequirement[]> {
    try {
      // Fallback to standard requirements since AI service is no longer available
      const standardRequirements = await this.generatePhotoRequirements(job);
      
      // Log that photo checklist was generated
      await aiLoggingService.logAIInteraction({
        jobId: job.id,
        staffId,
        question: `Photo requirements for ${job.type} job`,
        response: `Generated ${standardRequirements.length} photo requirements`,
        aiFunction: 'photos',
      });

      return standardRequirements;
    } catch (error) {
      console.error('❌ Error generating photo checklist:', error);
      return this.generatePhotoRequirements(job);
    }
  }

  /**
   * Validate photo completeness for job completion
   */
  validateJobPhotos(requirements: PhotoRequirement[]): {
    canComplete: boolean;
    missingRequired: PhotoRequirement[];
    completionPercentage: number;
  } {
    const requiredPhotos = requirements.filter(req => req.isRequired);
    const completedRequired = requiredPhotos.filter(req => req.completed);
    const totalCompleted = requirements.filter(req => req.completed).length;

    return {
      canComplete: completedRequired.length === requiredPhotos.length,
      missingRequired: requiredPhotos.filter(req => !req.completed),
      completionPercentage: Math.round((totalCompleted / requirements.length) * 100),
    };
  }

  /**
   * Update photo requirement with uploaded photo
   */
  updatePhotoRequirement(
    requirements: PhotoRequirement[],
    requirementId: string,
    photoUri: string,
    location?: { latitude: number; longitude: number }
  ): PhotoRequirement[] {
    return requirements.map(req => 
      req.id === requirementId 
        ? {
            ...req,
            completed: true,
            photoUri,
            timestamp: new Date(),
            location,
          }
        : req
    );
  }

  /**
   * Get job photo checklist with progress
   */
  getJobPhotoChecklist(job: Job, requirements: PhotoRequirement[]): JobPhotoChecklist {
    const requiredCount = requirements.filter(req => req.isRequired).length;
    const completedCount = requirements.filter(req => req.completed).length;
    const validation = this.validateJobPhotos(requirements);

    return {
      jobId: job.id,
      requirements,
      overallProgress: validation.completionPercentage,
      requiredPhotosCount: requiredCount,
      completedPhotosCount: completedCount,
      canCompleteJob: validation.canComplete,
    };
  }

  /**
   * Analyze photo quality (placeholder for future AI integration)
   */
  async analyzePhotoQuality(photoUri: string, requirement: PhotoRequirement): Promise<PhotoVerificationResult> {
    // Placeholder for AI photo analysis
    // In future iterations, this could use computer vision to validate:
    // - Photo clarity and lighting
    // - Correct subject matter
    // - Compliance with requirements
    
    return {
      isValid: true,
      confidence: 0.85,
      issues: [],
      suggestions: [
        'Photo looks good!',
        'Consider taking from different angle for better visibility'
      ],
    };
  }

  /**
   * Get base photo requirements for all jobs
   */
  private getBasePhotoRequirements(): PhotoRequirement[] {
    return [
      {
        id: 'before-work',
        description: 'Before starting work - overview photo',
        isRequired: true,
        completed: false,
      },
      {
        id: 'work-in-progress',
        description: 'Work in progress documentation',
        isRequired: false,
        completed: false,
      },
      {
        id: 'completed-work',
        description: 'Completed work - final result',
        isRequired: true,
        completed: false,
      },
      {
        id: 'clean-workspace',
        description: 'Clean and tidy workspace after completion',
        isRequired: true,
        completed: false,
      },
    ];
  }

  /**
   * Get job-specific photo requirements
   */
  private getJobSpecificRequirements(jobType: string): PhotoRequirement[] {
    const requirements: Record<string, PhotoRequirement[]> = {
      maintenance: [
        {
          id: 'tools-equipment',
          description: 'Tools and equipment used',
          isRequired: false,
          completed: false,
        },
        {
          id: 'problem-area',
          description: 'Close-up of problem area before repair',
          isRequired: true,
          completed: false,
        },
      ],
      cleaning: [
        {
          id: 'cleaning-supplies',
          description: 'Cleaning supplies and equipment',
          isRequired: false,
          completed: false,
        },
        {
          id: 'before-cleaning',
          description: 'Area before cleaning',
          isRequired: true,
          completed: false,
        },
        {
          id: 'after-cleaning',
          description: 'Area after cleaning',
          isRequired: true,
          completed: false,
        },
      ],
      inspection: [
        {
          id: 'inspection-checklist',
          description: 'Completed inspection checklist',
          isRequired: true,
          completed: false,
        },
        {
          id: 'any-issues-found',
          description: 'Photo of any issues or concerns discovered',
          isRequired: false,
          completed: false,
        },
      ],
      plumbing: [
        {
          id: 'plumbing-before',
          description: 'Plumbing issue before work',
          isRequired: true,
          completed: false,
        },
        {
          id: 'parts-used',
          description: 'Parts or materials used',
          isRequired: false,
          completed: false,
        },
        {
          id: 'water-test',
          description: 'Water flow/pressure test after repair',
          isRequired: true,
          completed: false,
        },
      ],
      electrical: [
        {
          id: 'electrical-before',
          description: 'Electrical issue before work',
          isRequired: true,
          completed: false,
        },
        {
          id: 'safety-measures',
          description: 'Safety measures taken (breakers, etc.)',
          isRequired: true,
          completed: false,
        },
        {
          id: 'electrical-test',
          description: 'Testing electrical function after work',
          isRequired: true,
          completed: false,
        },
      ],
    };

    return requirements[jobType] || [];
  }

  /**
   * Export photo checklist for sharing or reporting
   */
  exportPhotoSummary(checklist: JobPhotoChecklist): {
    summary: string;
    photoCount: number;
    missingPhotos: string[];
    completionStatus: 'complete' | 'incomplete' | 'partial';
  } {
    const missing = checklist.requirements
      .filter(req => req.isRequired && !req.completed)
      .map(req => req.description);

    let status: 'complete' | 'incomplete' | 'partial' = 'incomplete';
    if (checklist.canCompleteJob) {
      status = 'complete';
    } else if (checklist.completedPhotosCount > 0) {
      status = 'partial';
    }

    return {
      summary: `Photo verification: ${checklist.completedPhotosCount}/${checklist.requirements.length} photos completed (${checklist.overallProgress}%)`,
      photoCount: checklist.completedPhotosCount,
      missingPhotos: missing,
      completionStatus: status,
    };
  }
}

export const photoVerificationService = new PhotoVerificationService();
