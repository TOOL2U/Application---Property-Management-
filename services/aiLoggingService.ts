/**
 * AI Logging Service
 * Saves job-specific AI responses to Firestore for history and analytics
 */

import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface AILogEntry {
  id?: string;
  jobId: string;
  staffId: string;
  question: string;
  response: string;
  aiFunction: 'guidance' | 'chat' | 'photos' | 'safety' | 'timing';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  responseTime?: number; // milliseconds
  useful?: boolean; // Staff feedback on response quality
}

export interface AIJobSummary {
  jobId: string;
  totalQuestions: number;
  mostUsedFunction: string;
  averageResponseTime: number;
  helpfulResponses: number;
  totalTimeSpent: number; // minutes in AI assistant
  completionStatus: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

class AILoggingService {
  private readonly AI_LOGS_COLLECTION = 'ai_logs';
  private readonly AI_SUMMARIES_COLLECTION = 'ai_job_summaries';

  /**
   * Log an AI interaction
   */
  async logAIInteraction(entry: Omit<AILogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = await getDb();
      const logsRef = collection(db, this.AI_LOGS_COLLECTION);
      
      const logEntry: AILogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      await addDoc(logsRef, {
        ...logEntry,
        timestamp: Timestamp.fromDate(logEntry.timestamp),
      });

      // Update job summary
      await this.updateJobSummary(entry.jobId, entry.staffId, entry.aiFunction, entry.responseTime);

      console.log('✅ AI interaction logged successfully');
    } catch (error) {
      console.error('❌ Error logging AI interaction:', error);
    }
  }

  /**
   * Get AI interaction history for a job
   */
  async getJobAIHistory(jobId: string): Promise<AILogEntry[]> {
    try {
      const db = await getDb();
      const logsRef = collection(db, this.AI_LOGS_COLLECTION);
      const q = query(
        logsRef,
        where('jobId', '==', jobId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const history: AILogEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AILogEntry);
      });

      return history;
    } catch (error) {
      console.error('❌ Error getting AI history:', error);
      return [];
    }
  }

  /**
   * Get AI usage analytics for a staff member
   */
  async getStaffAIAnalytics(staffId: string, days: number = 30): Promise<{
    totalInteractions: number;
    favoriteFunction: string;
    averageResponseTime: number;
    jobsWithAI: number;
    helpfulnessRating: number;
  }> {
    try {
      const db = await getDb();
      const logsRef = collection(db, this.AI_LOGS_COLLECTION);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        logsRef,
        where('staffId', '==', staffId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const interactions: AILogEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        interactions.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AILogEntry);
      });

      // Calculate analytics
      const functionCounts: Record<string, number> = {};
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let helpfulCount = 0;
      let totalRated = 0;
      const uniqueJobs = new Set<string>();

      interactions.forEach(interaction => {
        functionCounts[interaction.aiFunction] = (functionCounts[interaction.aiFunction] || 0) + 1;
        uniqueJobs.add(interaction.jobId);
        
        if (interaction.responseTime) {
          totalResponseTime += interaction.responseTime;
          responseTimeCount++;
        }
        
        if (interaction.useful !== undefined) {
          totalRated++;
          if (interaction.useful) {
            helpfulCount++;
          }
        }
      });

      const favoriteFunction = Object.entries(functionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'guidance';

      return {
        totalInteractions: interactions.length,
        favoriteFunction,
        averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
        jobsWithAI: uniqueJobs.size,
        helpfulnessRating: totalRated > 0 ? (helpfulCount / totalRated) * 100 : 0,
      };
    } catch (error) {
      console.error('❌ Error getting AI analytics:', error);
      return {
        totalInteractions: 0,
        favoriteFunction: 'guidance',
        averageResponseTime: 0,
        jobsWithAI: 0,
        helpfulnessRating: 0,
      };
    }
  }

  /**
   * Rate the usefulness of an AI response
   */
  async rateAIResponse(logId: string, useful: boolean): Promise<void> {
    try {
      const db = await getDb();
      const logRef = doc(db, this.AI_LOGS_COLLECTION, logId);
      
      await updateDoc(logRef, {
        useful,
        ratedAt: Timestamp.fromDate(new Date()),
      });

      console.log('✅ AI response rated successfully');
    } catch (error) {
      console.error('❌ Error rating AI response:', error);
    }
  }

  /**
   * Update job summary with AI usage
   */
  private async updateJobSummary(
    jobId: string, 
    staffId: string, 
    aiFunction: string, 
    responseTime?: number
  ): Promise<void> {
    try {
      const db = await getDb();
      const summariesRef = collection(db, this.AI_SUMMARIES_COLLECTION);
      
      // Try to find existing summary
      const q = query(summariesRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new summary
        const newSummary: AIJobSummary = {
          jobId,
          totalQuestions: 1,
          mostUsedFunction: aiFunction,
          averageResponseTime: responseTime || 0,
          helpfulResponses: 0,
          totalTimeSpent: 0,
          completionStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(summariesRef, {
          ...newSummary,
          createdAt: Timestamp.fromDate(newSummary.createdAt),
          updatedAt: Timestamp.fromDate(newSummary.updatedAt),
        });
      } else {
        // Update existing summary
        const summaryDoc = querySnapshot.docs[0];
        const currentData = summaryDoc.data() as AIJobSummary;
        
        const newTotalQuestions = currentData.totalQuestions + 1;
        const newAverageResponseTime = responseTime 
          ? ((currentData.averageResponseTime * currentData.totalQuestions) + responseTime) / newTotalQuestions
          : currentData.averageResponseTime;

        await updateDoc(summaryDoc.ref, {
          totalQuestions: newTotalQuestions,
          averageResponseTime: newAverageResponseTime,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
    } catch (error) {
      console.error('❌ Error updating job summary:', error);
    }
  }

  /**
   * Mark job AI session as completed
   */
  async markJobCompleted(jobId: string): Promise<void> {
    try {
      const db = await getDb();
      const summariesRef = collection(db, this.AI_SUMMARIES_COLLECTION);
      const q = query(summariesRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const summaryDoc = querySnapshot.docs[0];
        await updateDoc(summaryDoc.ref, {
          completionStatus: 'completed',
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
    } catch (error) {
      console.error('❌ Error marking job completed:', error);
    }
  }
}

export const aiLoggingService = new AILoggingService();
