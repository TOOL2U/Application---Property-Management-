/**
 * Job Checklist Service
 * Manages smart job checklists with real-time synchronization
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobData } from '@/types/jobData';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category: 'safety' | 'preparation' | 'execution' | 'documentation' | 'completion' | 'inspection' | 'cleanup';
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  estimatedMinutes?: number;
  order: number;
}

export interface JobChecklist {
  id: string;
  jobId: string;
  staffId: string;
  items: ChecklistItem[];
  totalItems: number;
  completedItems: number;
  progress: number;
  estimatedTotalMinutes: number;
  generatedBy: 'template';
  templateType?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class JobChecklistService {
  async getJobChecklist(jobId: string): Promise<JobChecklist | null> {
    try {
      const checklistRef = doc(db, 'job_checklists', jobId);
      const checklistDoc = await getDoc(checklistRef);
      
      if (!checklistDoc.exists()) {
        return null;
      }
      
      const data = checklistDoc.data();
      return this.convertFirestoreToChecklist(data);
    } catch (error) {
      console.error('Error getting job checklist:', error);
      throw error;
    }
  }

  async generateSmartChecklist(job: JobData, staffId: string): Promise<JobChecklist> {
    const template = this.getTemplateForJobType(job.jobType);
    
    const checklistItems: ChecklistItem[] = template.items.map((templateItem: any, index: number) => ({
      ...templateItem,
      id: `${job.id}_item_${index + 1}`,
      completed: false,
      order: index + 1
    }));

    const checklist: JobChecklist = {
      id: job.id,
      jobId: job.id,
      staffId,
      items: checklistItems,
      totalItems: checklistItems.length,
      completedItems: 0,
      progress: 0,
      estimatedTotalMinutes: template.estimatedMinutes,
      generatedBy: 'template',
      templateType: template.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveChecklist(checklist);
    return checklist;
  }

  async updateChecklistItem(jobId: string, itemId: string, updates: Partial<ChecklistItem>): Promise<void> {
    const checklist = await this.getJobChecklist(jobId);
    if (!checklist) throw new Error('Checklist not found');

    const itemIndex = checklist.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) throw new Error('Checklist item not found');

    checklist.items[itemIndex] = {
      ...checklist.items[itemIndex],
      ...updates,
      ...(updates.completed !== undefined && {
        completedAt: updates.completed ? new Date() : undefined,
        completedBy: updates.completed ? checklist.staffId : undefined
      })
    };

    const completedCount = checklist.items.filter(item => item.completed).length;
    checklist.completedItems = completedCount;
    checklist.progress = Math.round((completedCount / checklist.totalItems) * 100);
    checklist.updatedAt = new Date();

    if (completedCount === checklist.totalItems && !checklist.completedAt) {
      checklist.completedAt = new Date();
    }

    await this.saveChecklist(checklist);
  }

  subscribeToChecklist(jobId: string, callback: (checklist: JobChecklist | null) => void): () => void {
    const checklistRef = doc(db, 'job_checklists', jobId);
    
    return onSnapshot(
      checklistRef,
      (doc) => {
        if (doc.exists()) {
          const checklist = this.convertFirestoreToChecklist(doc.data());
          callback(checklist);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to checklist changes:', error);
        callback(null);
      }
    );
  }

  private async saveChecklist(checklist: JobChecklist): Promise<void> {
    const checklistRef = doc(db, 'job_checklists', checklist.jobId);
    const firestoreData = this.convertChecklistToFirestore(checklist);
    await setDoc(checklistRef, firestoreData, { merge: true });
  }

  private convertFirestoreToChecklist(data: any): JobChecklist {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      items: data.items?.map((item: any) => ({
        ...item,
        completedAt: item.completedAt?.toDate()
      })) || []
    };
  }

  private convertChecklistToFirestore(checklist: JobChecklist): any {
    return {
      ...checklist,
      createdAt: Timestamp.fromDate(checklist.createdAt),
      updatedAt: serverTimestamp(),
      completedAt: checklist.completedAt ? Timestamp.fromDate(checklist.completedAt) : null,
      items: checklist.items.map(item => ({
        ...item,
        completedAt: item.completedAt ? Timestamp.fromDate(item.completedAt) : null
      }))
    };
  }

  private getTemplateForJobType(jobType: string): any {
    const templates: Record<string, any> = {
      maintenance: {
        id: 'maintenance',
        estimatedMinutes: 90,
        items: [
          { label: 'Conduct safety assessment', category: 'safety', required: true, estimatedMinutes: 5 },
          { label: 'Gather required tools', category: 'preparation', required: true, estimatedMinutes: 10 },
          { label: 'Perform maintenance work', category: 'execution', required: true, estimatedMinutes: 45 },
          { label: 'Take photos', category: 'documentation', required: true, estimatedMinutes: 5 },
          { label: 'Clean up work area', category: 'completion', required: true, estimatedMinutes: 10 }
        ]
      },
      cleaning: {
        id: 'cleaning',
        estimatedMinutes: 120,
        items: [
          { label: 'Check safety and ventilation', category: 'safety', required: true, estimatedMinutes: 5 },
          { label: 'Gather cleaning supplies', category: 'preparation', required: true, estimatedMinutes: 10 },
          { label: 'Clean all surfaces', category: 'execution', required: true, estimatedMinutes: 60 },
          { label: 'Document completed work', category: 'documentation', required: true, estimatedMinutes: 10 },
          { label: 'Final inspection', category: 'completion', required: true, estimatedMinutes: 15 }
        ]
      }
    };
    
    return templates[jobType] || templates.maintenance;
  }
}

export const jobChecklistService = new JobChecklistService();
