/**
 * Staff Audit Service
 * Background AI-powered staff performance auditing system
 * Runs silently, generates weekly reports for management dashboard
 */

import { openaiService } from './openaiService';
import { aiLoggingService } from './aiLoggingService';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Audit report structure
export interface StaffAuditReport {
  staffId: string;
  staffName: string;
  week: string;
  startDate: string;
  endDate: string;
  totalJobs: number;
  completedJobs: number;
  completedOnTime: number;
  lateJobs: number;
  declinedJobs: number;
  missedJobs: number;
  averageCompletionTime: number; // in hours
  estimatedVsActualTime: number; // percentage
  missingProof: number;
  qualityScore: number; // 1-100
  trustScore: number; // 1-100
  aiComment: string;
  recommendations: string[];
  flaggedIssues: string[];
  createdAt: string;
  reportId: string;
}

// Job performance data for analysis
interface JobPerformanceData {
  jobId: string;
  staffId: string;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  declinedAt?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  status: string;
  photos: number;
  reportQuality: number;
  latitude?: number;
  longitude?: number;
  propertyAddress: string;
  jobType: string;
  priority: string;
}

class StaffAuditService {
  private readonly AUDIT_COLLECTION = 'ai_audits';
  private readonly SUMMARY_COLLECTION = 'audit_summary';

  /**
   * Main audit function - should be called weekly for each staff member
   */
  async generateWeeklyAudit(staffId: string): Promise<StaffAuditReport | null> {
    try {
      console.log(`🔍 Starting weekly audit for staff: ${staffId}`);

      // Get date range for current week
      const { startDate, endDate, weekLabel } = this.getCurrentWeekRange();
      
      // Check if audit already exists for this week
      const existingAudit = await this.getExistingAudit(staffId, weekLabel);
      if (existingAudit) {
        console.log(`✅ Audit already exists for ${staffId} week ${weekLabel}`);
        return existingAudit;
      }

      // Gather staff performance data
      const performanceData = await this.gatherStaffPerformanceData(staffId, startDate, endDate);
      
      if (performanceData.length === 0) {
        console.log(`⚠️ No job data found for staff ${staffId} in week ${weekLabel}`);
        return null;
      }

      // Generate AI analysis
      const auditReport = await this.generateAIAuditReport(staffId, performanceData, weekLabel, startDate, endDate);
      
      // Save to Firestore
      await this.saveAuditReport(auditReport);
      
      // Update summary collection
      await this.updateAuditSummary(auditReport);

      console.log(`✅ Weekly audit completed for staff: ${staffId}`);
      return auditReport;

    } catch (error) {
      console.error(`❌ Error generating audit for staff ${staffId}:`, error);
      return null;
    }
  }

  /**
   * Run audits for all active staff members
   */
  async runWeeklyAuditForAllStaff(): Promise<void> {
    try {
      console.log('🔄 Starting weekly audit process for all staff...');

      // Get all active staff members
      const staffMembers = await this.getAllActiveStaff();
      
      for (const staff of staffMembers) {
        try {
          await this.generateWeeklyAudit(staff.id);
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to audit staff ${staff.id}:`, error);
          // Continue with other staff members
        }
      }

      console.log('✅ Weekly audit process completed for all staff');

    } catch (error) {
      console.error('❌ Error in weekly audit process:', error);
    }
  }

  /**
   * Gather performance data for a staff member within date range
   */
  private async gatherStaffPerformanceData(
    staffId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<JobPerformanceData[]> {
    try {
      // Query jobs collection for staff member's jobs in date range
      const jobsRef = collection(db, 'jobs');
      const q = query(
        jobsRef,
        where('assignedStaffId', '==', staffId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const performanceData: JobPerformanceData[] = [];

      for (const docSnap of querySnapshot.docs) {
        const jobData = docSnap.data();
        
        // Calculate actual duration if job is completed
        let actualDuration = 0;
        if (jobData.startedAt && jobData.completedAt) {
          const startTime = jobData.startedAt.toDate();
          const endTime = jobData.completedAt.toDate();
          actualDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
        }

        // Count photos/proof
        const photoCount = jobData.photos ? jobData.photos.length : 0;
        
        // Estimate report quality (placeholder - could be enhanced)
        const reportQuality = this.calculateReportQuality(jobData);

        performanceData.push({
          jobId: docSnap.id,
          staffId: jobData.assignedStaffId,
          acceptedAt: jobData.acceptedAt?.toDate(),
          startedAt: jobData.startedAt?.toDate(),
          completedAt: jobData.completedAt?.toDate(),
          declinedAt: jobData.declinedAt?.toDate(),
          estimatedDuration: jobData.estimatedDuration || 2, // default 2 hours
          actualDuration,
          status: jobData.status,
          photos: photoCount,
          reportQuality,
          latitude: jobData.property?.latitude,
          longitude: jobData.property?.longitude,
          propertyAddress: jobData.property?.address || 'Unknown',
          jobType: jobData.type || 'General',
          priority: jobData.priority || 'Normal',
        });
      }

      return performanceData;

    } catch (error) {
      console.error('❌ Error gathering performance data:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered audit report
   */
  private async generateAIAuditReport(
    staffId: string,
    performanceData: JobPerformanceData[],
    weekLabel: string,
    startDate: Date,
    endDate: Date
  ): Promise<StaffAuditReport> {
    try {
      // Calculate basic metrics
      const metrics = this.calculatePerformanceMetrics(performanceData);
      
      // Get staff name
      const staffName = await this.getStaffName(staffId);

      // Get AI analysis
      const aiResponse = await openaiService.generateStaffAuditAnalysis({
        staffName,
        performanceData,
        metrics
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Failed to generate AI analysis');
      }

      // Parse AI response for insights
      const aiInsights = this.parseAIResponse(aiResponse.data || '{}');

      // Generate report ID
      const reportId = `audit_${staffId}_${weekLabel.replace(/\s/g, '_')}`;

      return {
        staffId,
        staffName,
        week: weekLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalJobs: performanceData.length,
        completedJobs: metrics.completedJobs,
        completedOnTime: metrics.completedOnTime,
        lateJobs: metrics.lateJobs,
        declinedJobs: metrics.declinedJobs,
        missedJobs: metrics.missedJobs,
        averageCompletionTime: metrics.averageCompletionTime,
        estimatedVsActualTime: metrics.estimatedVsActualTime,
        missingProof: metrics.missingProof,
        qualityScore: aiInsights.qualityScore,
        trustScore: aiInsights.trustScore,
        aiComment: aiInsights.comment,
        recommendations: aiInsights.recommendations,
        flaggedIssues: aiInsights.flaggedIssues,
        createdAt: new Date().toISOString(),
        reportId,
      };

    } catch (error) {
      console.error('❌ Error generating AI audit report:', error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics from job data
   */
  private calculatePerformanceMetrics(performanceData: JobPerformanceData[]) {
    const completed = performanceData.filter(job => job.status === 'completed');
    const declined = performanceData.filter(job => job.status === 'declined');
    const late = completed.filter(job => 
      job.actualDuration && job.estimatedDuration && 
      job.actualDuration > job.estimatedDuration * 1.2 // 20% over estimate = late
    );
    const onTime = completed.filter(job => 
      job.actualDuration && job.estimatedDuration && 
      job.actualDuration <= job.estimatedDuration * 1.2
    );
    const missingProof = completed.filter(job => job.photos === 0);

    const totalActualTime = completed.reduce((sum, job) => sum + (job.actualDuration || 0), 0);
    const totalEstimatedTime = completed.reduce((sum, job) => sum + job.estimatedDuration, 0);
    
    return {
      completedJobs: completed.length,
      declinedJobs: declined.length,
      lateJobs: late.length,
      completedOnTime: onTime.length,
      missedJobs: 0, // Would need additional logic to determine missed jobs
      averageCompletionTime: completed.length > 0 ? totalActualTime / completed.length : 0,
      estimatedVsActualTime: totalEstimatedTime > 0 ? (totalActualTime / totalEstimatedTime) * 100 : 100,
      missingProof: missingProof.length,
    };
  }

  /**
   * Parse AI response and extract insights
   */
  private parseAIResponse(aiResponse: string): {
    trustScore: number;
    qualityScore: number;
    comment: string;
    recommendations: string[];
    flaggedIssues: string[];
  } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        trustScore: Math.max(1, Math.min(100, parsed.trustScore || 75)),
        qualityScore: Math.max(1, Math.min(100, parsed.qualityScore || 75)),
        comment: parsed.comment || 'Performance within acceptable range.',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Continue current performance level'],
        flaggedIssues: Array.isArray(parsed.flaggedIssues) ? parsed.flaggedIssues : [],
      };
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return {
        trustScore: 75,
        qualityScore: 75,
        comment: 'Unable to generate detailed analysis. Manual review recommended.',
        recommendations: ['Schedule performance review'],
        flaggedIssues: ['AI analysis failed'],
      };
    }
  }

  /**
   * Save audit report to Firestore
   */
  private async saveAuditReport(report: StaffAuditReport): Promise<void> {
    try {
      const auditDoc = doc(db, this.AUDIT_COLLECTION, report.staffId, 'reports', report.reportId);
      await setDoc(auditDoc, report);
      
      console.log(`✅ Audit report saved: ${report.reportId}`);
    } catch (error) {
      console.error('❌ Error saving audit report:', error);
      throw error;
    }
  }

  /**
   * Update audit summary collection for dashboard queries
   */
  private async updateAuditSummary(report: StaffAuditReport): Promise<void> {
    try {
      const summaryDoc = doc(db, this.SUMMARY_COLLECTION, report.week);
      
      // Get existing summary or create new one
      const existingSummary = await getDoc(summaryDoc);
      const currentEntries = existingSummary.exists() ? existingSummary.data().entries || [] : [];
      
      // Add or update this staff's entry
      const entryIndex = currentEntries.findIndex((entry: any) => entry.staffId === report.staffId);
      const summaryEntry = {
        staffId: report.staffId,
        staffName: report.staffName,
        trustScore: report.trustScore,
        qualityScore: report.qualityScore,
        totalJobs: report.totalJobs,
        completedJobs: report.completedJobs,
        flaggedIssues: report.flaggedIssues.length,
        reportId: report.reportId,
        lastUpdated: new Date().toISOString(),
      };

      if (entryIndex >= 0) {
        currentEntries[entryIndex] = summaryEntry;
      } else {
        currentEntries.push(summaryEntry);
      }

      await setDoc(summaryDoc, {
        week: report.week,
        totalStaff: currentEntries.length,
        entries: currentEntries,
        lastUpdated: new Date().toISOString(),
      });

      console.log(`✅ Audit summary updated for week: ${report.week}`);
    } catch (error) {
      console.error('❌ Error updating audit summary:', error);
    }
  }

  /**
   * Helper methods
   */
  private getCurrentWeekRange(): { startDate: Date; endDate: Date; weekLabel: string } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Monday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    const weekLabel = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    
    return { startDate, endDate, weekLabel };
  }

  private async getExistingAudit(staffId: string, weekLabel: string): Promise<StaffAuditReport | null> {
    try {
      const reportId = `audit_${staffId}_${weekLabel.replace(/\s/g, '_')}`;
      const auditDoc = doc(db, this.AUDIT_COLLECTION, staffId, 'reports', reportId);
      const docSnap = await getDoc(auditDoc);
      
      return docSnap.exists() ? docSnap.data() as StaffAuditReport : null;
    } catch (error) {
      console.error('❌ Error checking existing audit:', error);
      return null;
    }
  }

  private async getAllActiveStaff(): Promise<Array<{ id: string; name: string }>> {
    try {
      // This would typically query your staff/users collection
      // For now, return empty array - you'll need to implement based on your user structure
      const staffRef = collection(db, 'staff_profiles');
      const querySnapshot = await getDocs(staffRef);
      
      const staff: Array<{ id: string; name: string }> = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'staff' && data.active !== false) {
          staff.push({
            id: doc.id,
            name: data.fullName || data.name || 'Unknown Staff'
          });
        }
      });
      
      return staff;
    } catch (error) {
      console.error('❌ Error getting active staff:', error);
      return [];
    }
  }

  private async getStaffName(staffId: string): Promise<string> {
    try {
      const staffDoc = doc(db, 'staff_profiles', staffId);
      const docSnap = await getDoc(staffDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.fullName || data.name || 'Unknown Staff';
      }
      
      return 'Unknown Staff';
    } catch (error) {
      console.error('❌ Error getting staff name:', error);
      return 'Unknown Staff';
    }
  }

  private calculateReportQuality(jobData: any): number {
    let quality = 50; // Base score
    
    // Add points for photos
    const photoCount = jobData.photos ? jobData.photos.length : 0;
    quality += Math.min(photoCount * 10, 30); // Up to 30 points for photos
    
    // Add points for detailed description
    if (jobData.description && jobData.description.length > 50) {
      quality += 20;
    }
    
    // Deduct points for missing required fields
    if (!jobData.completionNotes) quality -= 10;
    if (!jobData.startedAt) quality -= 10;
    
    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Public method to check if audit should run (called on app startup)
   */
  async shouldRunWeeklyAudit(): Promise<boolean> {
    try {
      const { weekLabel } = this.getCurrentWeekRange();
      
      // Check if we've already run audit for this week
      const summaryDoc = doc(db, this.SUMMARY_COLLECTION, weekLabel);
      const docSnap = await getDoc(summaryDoc);
      
      if (docSnap.exists()) {
        const lastUpdated = new Date(docSnap.data().lastUpdated);
        const now = new Date();
        
        // Run if last update was more than 6 hours ago (allows for re-runs)
        return (now.getTime() - lastUpdated.getTime()) > (6 * 60 * 60 * 1000);
      }
      
      return true; // No audit exists for this week
    } catch (error) {
      console.error('❌ Error checking audit status:', error);
      return false;
    }
  }
}

export const staffAuditService = new StaffAuditService();
export default staffAuditService;
