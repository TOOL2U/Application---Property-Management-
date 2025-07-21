#!/usr/bin/env node

/**
 * Safe Unused File Cleanup Script
 * Removes unused files identified by the analysis
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Safe Unused File Cleanup');
console.log('============================\n');

// List of unused files identified by analysis (safe to delete)
const unusedFiles = [
  'TEST_ENHANCED_MODAL_INTEGRATION.tsx',
  'api/job-assignment/assign.ts',
  'api/job-assignment/update-status.ts',
  'app/(auth)/_layout.tsx',
  'app/(auth)/create-pin.tsx',
  'app/(auth)/enter-pin.tsx',
  'app/(auth)/login.tsx',
  'app/(auth)/select-profile.tsx',
  'app/(auth)/select-staff-profile.tsx',
  'app/(modal)/_layout.tsx',
  'app/(modal)/edit-profile.tsx',
  'app/(modal)/scan.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/ai-assistant.tsx',
  'app/(tabs)/foa-chat.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/jobs.tsx',
  'app/(tabs)/notifications.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/settings.tsx',
  'app/+not-found.tsx',
  'app/_layout.tsx',
  'app/admin/_layout.tsx',
  'app/admin/dashboard.tsx',
  'app/admin/login.tsx',
  'app/index.tsx',
  'app/jobs/[id].tsx',
  'app/profile-view.tsx',
  'app/scan.tsx',
  'components/ErrorBoundary.tsx',
  'components/JobNotificationBanner.tsx',
  'components/LocationButton.tsx',
  'components/MapPreview.tsx',
  'components/ScreenWrapper.tsx',
  'components/TaskCard.tsx',
  'components/TaskCompletionModal.tsx',
  'components/admin/TaskAssignmentModal.tsx',
  'components/audit/AppAuditIntegration.tsx',
  'components/auth/LogoutOverlay.tsx',
  'components/auth/PINModal.tsx',
  'components/auth/StaffLoginScreen.tsx',
  'components/dashboard/EnhancedStaffDashboard.tsx',
  'components/dashboard/EnhancedStaffJobsDashboard.tsx',
  'components/dashboard/RealtimeJobsWidget.tsx',
  'components/dashboard/StaffDashboard.tsx',
  'components/dashboard/StaffJobsDashboard.tsx',
  'components/jobs/ActiveJobsView.backup.tsx',
  'components/jobs/ActiveJobsView.tsx',
  'components/jobs/DebugEnhancedJobAcceptanceModal.tsx',
  'components/jobs/EmbeddedJobChat.tsx',
  'components/jobs/EnhancedActiveJobsView.tsx',
  'components/jobs/EnhancedJobAcceptanceModal.tsx',
  'components/jobs/EnhancedJobAcceptanceModalCompat.tsx',
  'components/jobs/EnhancedStaffJobsView.tsx',
  'components/jobs/FOAChecklist.tsx',
  'components/jobs/GPSCheckInBanner.tsx',
  'components/jobs/JobAcceptanceModal.tsx',
  'components/jobs/JobPhotoChecklistModal.tsx',
  'components/jobs/JobPhotoChecklistModal_new.tsx',
  'components/jobs/JobProgressTracker.tsx',
  'components/jobs/JobStartConfirmation.tsx',
  'components/jobs/JobStartWorkflow.tsx',
  'components/jobs/JobsDebugComponent.tsx',
  'components/jobs/PhotoUpload_new.tsx',
  'components/jobs/RealtimeJobsList.tsx',
  'components/jobs/SmartJobChecklist.tsx',
  'components/jobs/SmartJobReminderBanner.tsx',
  'components/jobs/StaffJobsView.tsx',
  'components/maps/RealTimeJobMap.tsx',
  'components/navigation/RoleBasedNavigationInfo.tsx',
  'components/notifications/BackgroundNotificationTest.tsx',
  'components/notifications/JobReminderResponseBanner.tsx',
  'components/notifications/NotificationClickPopup.tsx',
  'components/notifications/NotificationComparisonTest.tsx',
  'components/notifications/NotificationOverlay.tsx',
  'components/notifications/PushNotificationStatus.tsx',
  'components/notifications/PushNotificationTestScreen.tsx',
  'components/notifications/ScreenWrapper.tsx',
  'components/settings/LanguagePicker.tsx',
  'components/shared/ErrorBoundary.tsx',
  'components/shared/SharedJobCard.tsx',
  'components/shared/StateComponents.tsx',
  'components/sync/SyncStatusIndicator.tsx',
  'components/tests/GPSLocationTrackingTestIntegration.tsx',
  'components/tests/SmartJobRemindersTestIntegration.tsx',
  'components/ui/BlurHeader.tsx',
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/FilterChips.tsx',
  'components/ui/GlassmorphismCard.tsx',
  'components/ui/Input.tsx',
  'components/ui/JobCard.tsx',
  'components/ui/JobNotificationModal.tsx',
  'components/ui/NeonButton.tsx',
  'components/ui/NeumorphicComponents.tsx',
  'components/ui/SiaMoonComponents.tsx',
  'components/ui/SiaMoonUI.tsx',
  'components/ui/StatusBadge.tsx',
  'components/ui/ThemeToggle.tsx',
  'constants/Colors.ts',
  'constants/PaperTheme.ts',
  'contexts/AdminAuthContext.tsx',
  'contexts/AppNotificationContext.tsx',
  'contexts/AuthContext.tsx',
  'contexts/NotificationContext.tsx',
  'contexts/PushNotificationContext.tsx',
  'contexts/ThemeContext.tsx',
  'enhanced-job-detail-with-chat.tsx',
  'env.d.ts',
  'example-job-detail-with-checklist.tsx',
  'hooks/useAuth.ts',
  'hooks/useEnhancedJobNotifications.ts',
  'hooks/useFrameworkReady.ts',
  'hooks/useJobLocationTracking.ts',
  'hooks/useJobNotifications.ts',
  'hooks/useLocation.ts',
  'hooks/useNotifications.ts',
  'hooks/useRealtimeJobs.ts',
  'hooks/useRealtimeTasks.ts',
  'hooks/useSmartJobReminders.ts',
  'hooks/useStaffAuth.ts',
  'hooks/useStaffJobs.ts',
  'hooks/useTaskCompletion.ts',
  'hooks/useTaskLocation.ts',
  'hooks/useTasks.ts',
  'hooks/useTheme.ts',
  'hooks/useTranslation.ts',
  'lib/authPersistence.ts',
  'lib/firebase-auth-optimized.ts',
  'lib/firebaseAdmin.ts',
  'mobile-app-debug.js',
  'scripts/analyze-unused-code.js',
  'scripts/test-notification-click.js',
  'scripts/test-notification-popup.js',
  'services/adminService.ts',
  'services/embeddedFOAChatService.ts',
  'services/enhancedMobileJobService.ts',
  'services/i18nService.ts',
  'services/integratedJobService.ts',
  'services/jobLocationTrackingService.ts',
  'services/jobService.ts',
  'services/missedCheckInEscalationService.ts',
  'services/notificationDeduplicationService.ts',
  'services/notificationDisplayService.ts',
  'services/photoVerificationService.ts',
  'services/propertyService.ts',
  'services/realTimeJobNotificationService.ts',
  'services/smartJobNotificationService.ts',
  'services/smartJobReminderService.ts',
  'services/staffJobService.ts',
  'services/unifiedJobNotificationService.ts',
  'test-audit-simple.ts',
  'test-audit-system.ts',
  'test-foa-chat-implementation.js',
  'test-foa-checklist-implementation.js',
  'utils/componentTemplates.ts',
  'utils/designSystem.ts',
  'utils/expoPushSender.ts',
  'utils/jobAssignmentValidation.ts',
  'utils/jobUtils.ts',
  'utils/mobileFirebaseVerification.ts',
  'utils/notificationDedup.ts',
  'utils/pushNotificationDiagnostic.ts',
  'utils/roleUtils.ts',
  'utils/secureStorage.ts',
  'utils/shadowUtils.ts'
];

// Files to keep (critical for app functionality)
const criticalFiles = [
  'app/fieldops.tsx', // Current active screen
  'lib/firebase.ts', // Firebase configuration
  'services/apiService.ts', // API service
  'services/authService.ts', // Authentication
  'services/pushNotificationService.ts', // Active notification service
  'utils/storage.ts' // Storage utilities
];

// Statistics
let deletedCount = 0;
let skippedCount = 0;
let errorCount = 0;
const deletedFiles = [];
const skippedFiles = [];
const errorFiles = [];

/**
 * Check if file is safe to delete
 */
function isSafeToDelete(filePath) {
  // Don't delete critical files
  if (criticalFiles.includes(filePath)) {
    return false;
  }
  
  // Don't delete if file doesn't exist
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  return true;
}

/**
 * Create backup of file before deletion
 */
function createBackup(filePath) {
  try {
    const backupDir = 'cleanup-backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, filePath.replace(/[\/\\]/g, '_'));
    fs.copyFileSync(filePath, backupPath);
    return true;
  } catch (error) {
    console.error(`Failed to backup ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Safely delete a file
 */
function safeDeleteFile(filePath) {
  try {
    if (!isSafeToDelete(filePath)) {
      console.log(`⚠️  Skipping critical file: ${filePath}`);
      skippedFiles.push(filePath);
      skippedCount++;
      return;
    }
    
    // Create backup first
    if (!createBackup(filePath)) {
      console.log(`❌ Failed to backup ${filePath}, skipping deletion`);
      errorFiles.push(filePath);
      errorCount++;
      return;
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    console.log(`✅ Deleted: ${filePath}`);
    deletedFiles.push(filePath);
    deletedCount++;
    
  } catch (error) {
    console.log(`❌ Error deleting ${filePath}: ${error.message}`);
    errorFiles.push(filePath);
    errorCount++;
  }
}

/**
 * Main cleanup function
 */
function performCleanup() {
  console.log(`🔍 Processing ${unusedFiles.length} unused files...\n`);
  
  // Process each unused file
  for (const filePath of unusedFiles) {
    safeDeleteFile(filePath);
  }
  
  // Generate report
  console.log('\n📊 CLEANUP REPORT');
  console.log('==================');
  console.log(`✅ Files deleted: ${deletedCount}`);
  console.log(`⚠️  Files skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Total processed: ${unusedFiles.length}`);
  
  if (deletedCount > 0) {
    console.log('\n🎉 CLEANUP SUCCESSFUL!');
    console.log(`   Removed ${deletedCount} unused files`);
    console.log('   Backups created in ./cleanup-backups/');
    
    // Calculate space saved (rough estimate)
    const avgFileSize = 2; // KB
    const spaceSaved = deletedCount * avgFileSize;
    console.log(`   Estimated space saved: ~${spaceSaved}KB`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Test your app to ensure nothing is broken');
    console.log('   2. Run: npm run build (or expo build)');
    console.log('   3. If everything works, delete ./cleanup-backups/');
    console.log('   4. Commit the cleanup changes');
  }
  
  if (skippedCount > 0) {
    console.log('\n⚠️  SKIPPED FILES (Critical):');
    skippedFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  if (errorCount > 0) {
    console.log('\n❌ ERRORS:');
    errorFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  console.log('\n🔄 To restore files if needed:');
  console.log('   cp cleanup-backups/* ./');
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete 166 unused files!');
console.log('   Backups will be created in ./cleanup-backups/');
console.log('   Critical files will be automatically skipped.');
console.log('\nProceed with cleanup? (y/N)');

// For automated execution, skip prompt
const args = process.argv.slice(2);
if (args.includes('--auto') || args.includes('-y')) {
  console.log('🚀 Auto mode enabled, proceeding with cleanup...\n');
  performCleanup();
} else {
  // Manual confirmation required
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('🚀 Starting cleanup...\n');
      performCleanup();
    } else {
      console.log('❌ Cleanup cancelled.');
    }
    rl.close();
  });
}
