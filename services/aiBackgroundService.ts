/**
 * AI Background Service
 * Runs AI analysis and monitoring for admin accounts only
 * No UI interaction - purely background intelligence
 */

import { getDb } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { openaiService } from './openaiService';

interface AIInsight {
  id?: string;
  type: 'job_delay' | 'staff_performance' | 'scheduling_optimization' | 'maintenance_prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedStaffId?: string;
  affectedJobId?: string;
  recommendation: string;
  createdAt: Date;
  data?: any;
}

class AIBackgroundService {
  private readonly AI_LOGS_COLLECTION = 'ai_insights';
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Monitor jobs for delays and performance issues
   * Only for admin accounts
   */
  async analyzeJobPerformance(adminUserId: string): Promise<AIInsight[]> {
    if (!this.isAdminUser(adminUserId)) {
      console.warn('🤖 AIBackgroundService: Access denied - not an admin user');
      return [];
    }

    console.log('🤖 AIBackgroundService: Starting job performance analysis...');
    
    try {
      const db = await getDb();
      const insights: AIInsight[] = [];
      
      // Get recent jobs
      const jobsRef = collection(db, 'jobs');
      const recentJobsQuery = query(
        jobsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const jobsSnapshot = await getDocs(recentJobsQuery);
      
      // Analyze for patterns
      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // Check for jobs exceeding 15 minutes past ETA
      const delayedJobs = jobs.filter(job => {
        if (!job.estimatedEndTime || !job.startedAt) return false;
        const estimated = new Date((job.estimatedEndTime as any).seconds * 1000);
        const started = new Date((job.startedAt as any).seconds * 1000);
        const now = new Date();
        const estimatedDuration = estimated.getTime() - started.getTime();
        const actualDuration = now.getTime() - started.getTime();
        return actualDuration > estimatedDuration + (15 * 60 * 1000); // 15 minutes buffer
      });

      if (delayedJobs.length > 0) {
        insights.push({
          type: 'job_delay',
          severity: delayedJobs.length > 3 ? 'high' : 'medium',
          title: `${delayedJobs.length} Jobs Running Over Time`,
          description: `Multiple jobs are exceeding their estimated completion time by more than 15 minutes.`,
          recommendation: 'Review job complexity estimates and consider adjusting future scheduling.',
          createdAt: new Date(),
          data: { delayedJobIds: delayedJobs.map(j => j.id) }
        });
      }

      // Check for staff with multiple missed assignments
      const missedAssignments = await this.analyzeStaffReliability(jobs);
      insights.push(...missedAssignments);

      // Save insights to Firebase
      for (const insight of insights) {
        await this.saveInsight(insight);
      }

      console.log(`🤖 AIBackgroundService: Generated ${insights.length} insights`);
      return insights;

    } catch (error) {
      console.error('❌ AIBackgroundService: Error analyzing job performance:', error);
      return [];
    }
  }

  /**
   * Analyze staff reliability patterns
   */
  private async analyzeStaffReliability(jobs: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const staffPerformance = new Map();

    // Group jobs by staff
    jobs.forEach(job => {
      if (job.assignedStaffId) {
        if (!staffPerformance.has(job.assignedStaffId)) {
          staffPerformance.set(job.assignedStaffId, {
            total: 0,
            completed: 0,
            late: 0,
            missed: 0
          });
        }
        
        const stats = staffPerformance.get(job.assignedStaffId);
        stats.total++;
        
        if (job.status === 'completed') stats.completed++;
        if (job.status === 'cancelled' || job.status === 'failed') stats.missed++;
      }
    });

    // Identify problematic patterns
    staffPerformance.forEach((stats, staffId) => {
      const missedRate = stats.missed / stats.total;
      const completionRate = stats.completed / stats.total;
      
      if (missedRate > 0.3 && stats.total > 3) { // 30% miss rate with at least 3 jobs
        insights.push({
          type: 'staff_performance',
          severity: missedRate > 0.5 ? 'critical' : 'high',
          title: `Staff Performance Alert`,
          description: `Staff member has ${Math.round(missedRate * 100)}% miss rate on recent assignments.`,
          affectedStaffId: staffId,
          recommendation: 'Consider additional training or workload adjustment.',
          createdAt: new Date(),
          data: { stats }
        });
      }
    });

    return insights;
  }

  /**
   * Generate AI-powered scheduling recommendations
   */
  async generateSchedulingRecommendations(adminUserId: string): Promise<AIInsight[]> {
    if (!this.isAdminUser(adminUserId)) {
      return [];
    }

    try {
      const db = await getDb();
      const insights: AIInsight[] = [];

      // Get historical job data for pattern analysis
      const jobsRef = collection(db, 'jobs');
      const historicalQuery = query(
        jobsRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const jobsSnapshot = await getDocs(historicalQuery);
      const jobs = jobsSnapshot.docs.map(doc => doc.data());

      // Use AI to analyze patterns - simplified for background service
      let aiRecommendation = '';
      try {
        // Create a simplified analysis instead of full AI call for now
        const jobTypes = jobs.map(j => j.jobType || 'general').slice(0, 5);
        const avgDuration = jobs.length > 0 ? 'Based on recent job patterns' : 'No data available';
        aiRecommendation = `Scheduling analysis: Recent job types include ${jobTypes.join(', ')}. ${avgDuration}.`;
      } catch (error) {
        aiRecommendation = 'AI analysis temporarily unavailable. Review job patterns manually.';
      }

      insights.push({
        type: 'scheduling_optimization',
        severity: 'low',
        title: 'AI Scheduling Recommendations',
        description: 'AI-generated suggestions for improving job scheduling efficiency.',
        recommendation: aiRecommendation,
        createdAt: new Date()
      });

      return insights;

    } catch (error) {
      console.error('❌ AIBackgroundService: Error generating scheduling recommendations:', error);
      return [];
    }
  }

  /**
   * Save AI insight to Firebase
   */
  private async saveInsight(insight: AIInsight): Promise<void> {
    try {
      const db = await getDb();
      const insightsRef = collection(db, this.AI_LOGS_COLLECTION);
      
      await addDoc(insightsRef, {
        ...insight,
        createdAt: new Date()
      });

      console.log('💾 AIBackgroundService: Saved insight:', insight.title);
    } catch (error) {
      console.error('❌ AIBackgroundService: Error saving insight:', error);
    }
  }

  /**
   * Get AI insights for admin dashboard
   */
  async getInsights(adminUserId: string, maxResults: number = 20): Promise<AIInsight[]> {
    if (!this.isAdminUser(adminUserId)) {
      return [];
    }

    try {
      const db = await getDb();
      const insightsRef = collection(db, this.AI_LOGS_COLLECTION);
      const insightsQuery = query(
        insightsRef,
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(insightsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIInsight[];

    } catch (error) {
      console.error('❌ AIBackgroundService: Error fetching insights:', error);
      return [];
    }
  }

  /**
   * Check if user is admin (simplified - implement your actual auth check)
   */
  private isAdminUser(userId: string): boolean {
    // TODO: Implement actual admin role check
    // For now, this is a placeholder
    return userId !== null && userId !== undefined;
  }

  /**
   * Start background monitoring (call this for admin users only)
   */
  async startBackgroundMonitoring(adminUserId: string): Promise<void> {
    if (!this.isAdminUser(adminUserId) || this.isRunning) {
      return;
    }

    console.log('🤖 AIBackgroundService: Starting background monitoring...');
    this.isRunning = true;

    // Run analysis every 30 minutes
    const interval = setInterval(async () => {
      try {
        await this.analyzeJobPerformance(adminUserId);
        await this.generateSchedulingRecommendations(adminUserId);
      } catch (error) {
        console.error('❌ AIBackgroundService: Error in background monitoring:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Store interval for cleanup
    this.monitoringInterval = interval;
  }

  /**
   * Stop background monitoring
   */
  stopBackgroundMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
  }
}

export const aiBackgroundService = new AIBackgroundService();
