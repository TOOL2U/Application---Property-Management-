/**
 * Background Audit Manager
 * Handles automatic triggering of staff audits on app startup
 * Runs silently in the background - invisible to staff users
 */

import { staffAuditService } from './staffAuditService';
import { aiLoggingService } from './aiLoggingService';

class BackgroundAuditManager {
  private isRunning = false;
  private lastAuditCheck: Date | null = null;

  /**
   * Initialize background audit system
   * Call this on app startup, preferably after user authentication
   */
  async initialize(currentUserId: string): Promise<void> {
    try {
      console.log('🔄 Initializing background audit system...');
      
      // Only run for authenticated staff members
      if (!currentUserId) {
        console.log('⚠️ No user authenticated, skipping audit initialization');
        return;
      }

      // Check if audit should run (non-blocking)
      this.scheduleAuditCheck();
      
      console.log('✅ Background audit system initialized');
    } catch (error) {
      console.error('❌ Error initializing background audit system:', error);
    }
  }

  /**
   * Schedule audit check to run in background
   * Non-blocking operation
   */
  private scheduleAuditCheck(): void {
    // Run after a delay to avoid blocking app startup
    setTimeout(() => {
      this.checkAndRunAudits();
    }, 30000); // 30 second delay after app startup
  }

  /**
   * Check if audits should run and execute them
   * Runs completely in background
   */
  private async checkAndRunAudits(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Audit process already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      this.lastAuditCheck = new Date();

      console.log('🔍 Checking if weekly audits should run...');

      // Check if audit should run this week
      const shouldRun = await staffAuditService.shouldRunWeeklyAudit();
      
      if (!shouldRun) {
        console.log('✅ Audits are up to date for this week');
        return;
      }

      console.log('🚀 Starting background audit process...');

      // Log the audit start
      await this.logAuditStart();

      // Run audits for all staff (this runs in background)
      await staffAuditService.runWeeklyAuditForAllStaff();

      // Log the audit completion
      await this.logAuditCompletion();

      console.log('✅ Background audit process completed successfully');

    } catch (error) {
      console.error('❌ Error in background audit process:', error);
      await this.logAuditError(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Force run audits (for testing or manual triggers)
   */
  async forceRunAudits(): Promise<void> {
    console.log('🔄 Force running background audits...');
    await this.checkAndRunAudits();
  }

  /**
   * Get audit system status
   */
  getStatus(): {
    isRunning: boolean;
    lastCheck: Date | null;
  } {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastAuditCheck,
    };
  }

  /**
   * Log audit process start
   */
  private async logAuditStart(): Promise<void> {
    try {
      await aiLoggingService.logAIInteraction({
        jobId: 'system',
        staffId: 'system',
        question: 'Background audit process started',
        response: `Weekly staff performance audit process initiated at ${new Date().toISOString()}`,
        aiFunction: 'guidance',
      });
    } catch (error) {
      console.error('❌ Error logging audit start:', error);
    }
  }

  /**
   * Log audit process completion
   */
  private async logAuditCompletion(): Promise<void> {
    try {
      await aiLoggingService.logAIInteraction({
        jobId: 'system',
        staffId: 'system',
        question: 'Background audit process completed',
        response: `Weekly staff performance audit process completed successfully at ${new Date().toISOString()}`,
        aiFunction: 'guidance',
      });
    } catch (error) {
      console.error('❌ Error logging audit completion:', error);
    }
  }

  /**
   * Log audit process errors
   */
  private async logAuditError(error: any): Promise<void> {
    try {
      await aiLoggingService.logAIInteraction({
        jobId: 'system',
        staffId: 'system',
        question: 'Background audit process error',
        response: `Audit process failed: ${error.message || error.toString()}`,
        aiFunction: 'guidance',
      });
    } catch (logError) {
      console.error('❌ Error logging audit error:', logError);
    }
  }

  /**
   * Check if current user should trigger audits
   * Only certain roles/users should trigger background audits
   */
  private shouldTriggerAudits(userRole?: string): boolean {
    // Only trigger audits for staff members (not guests, not admins)
    // This ensures audits run when staff are active, but not unnecessarily
    return userRole === 'staff' || userRole === 'field_staff';
  }

  /**
   * Manual audit trigger for specific staff member
   * This can be used for immediate audit needs
   */
  async auditSpecificStaff(staffId: string): Promise<void> {
    try {
      console.log(`🔍 Running manual audit for staff: ${staffId}`);
      
      const report = await staffAuditService.generateWeeklyAudit(staffId);
      
      if (report) {
        console.log(`✅ Manual audit completed for staff: ${staffId}`);
        
        // Log the manual audit
        await aiLoggingService.logAIInteraction({
          jobId: 'manual_audit',
          staffId: staffId,
          question: 'Manual staff audit triggered',
          response: `Manual audit completed with trust score: ${report.trustScore}, quality score: ${report.qualityScore}`,
          aiFunction: 'guidance',
        });
      } else {
        console.log(`⚠️ No audit data available for staff: ${staffId}`);
      }
    } catch (error) {
      console.error(`❌ Error in manual audit for staff ${staffId}:`, error);
    }
  }
}

// Export singleton instance
export const backgroundAuditManager = new BackgroundAuditManager();
export default backgroundAuditManager;
