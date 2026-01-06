# 📋 MOBILE APP CODEBASE AUDIT REPORT

**Generated:** January 6, 2026  
**Audit Type:** Pre-Production Cleanup Analysis  
**Status:** ⚠️ AWAITING APPROVAL - NO DELETIONS PERFORMED

---

## 🎯 Executive Summary

This comprehensive audit identifies **unused, redundant, and obsolete files** in the mobile application codebase. The goal is to prepare a safe cleanup plan to improve maintainability and reduce technical debt before production deployment.

### Quick Stats
- **Total Documentation Files:** 102 `.md` files
- **Total Test/Debug Scripts:** 40+ test files
- **Backup Files Found:** 9 files in `/backup` folder
- **Duplicate Screens:** 6 screen variations
- **Unused Components:** To be analyzed below

---

## 📄 A) FILE CLEANUP AUDIT REPORT

### 1. DOCUMENTATION FILES (.md)

#### 1.1 POTENTIALLY UNUSED - Implementation Complete Documents

These are historical records of completed work. Safe to archive/remove after verification.

```
/AI_AUDIT_SYSTEM_INTEGRATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Completion record from past feature
- Historical documentation
- Information likely consolidated elsewhere

Risk Level: LOW
Safe to remove? YES (After archiving)
```

```
/AI_AUDIT_SYSTEM_TEST_RESULTS.md
Status: POTENTIALLY UNUSED
Reason:
- Test results from completed feature
- Historical record, not active reference

Risk Level: LOW
Safe to remove? YES (After archiving)
```

```
/AI_COMPONENTS_ORGANIZATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Organization task completion record
- One-time refactoring documentation

Risk Level: LOW
Safe to remove? YES
```

```
/AI_SYSTEM_CLEANUP_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Past cleanup record
- Ironically should be cleaned up

Risk Level: LOW
Safe to remove? YES
```

```
/AI_SYSTEM_RESTRUCTURING_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Historical restructuring documentation
- Completed task record

Risk Level: LOW
Safe to remove? YES
```

```
/AI_UI_CLEANUP_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- UI cleanup completion record
- No longer actively referenced

Risk Level: LOW
Safe to remove? YES
```

```
/AUTHENTICATION_CONTEXT_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/AUTO_REFRESH_UX_IMPROVEMENT_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/BACKGROUND_AI_AUDIT_INTEGRATION_GUIDE.md
Status: NEEDS CONFIRMATION
Reason:
- Might be reference guide for webapp team
- Unclear if actively used

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/BACKGROUND_NOTIFICATION_CONFIRMATION.md
Status: POTENTIALLY UNUSED
Reason:
- Confirmation of completed feature
- Historical record

Risk Level: LOW
Safe to remove? YES
```

```
/BRAND_IMPLEMENTATION.md
Status: NEEDS CONFIRMATION
Reason:
- May be active reference for brand guidelines
- Could be important for design consistency

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/BRAND_KIT_COMPREHENSIVE_REPORT.md
Status: REQUIRED
Reason:
- Brand guidelines reference
- Active documentation for designers/developers

Risk Level: HIGH
Safe to remove? NO
```

```
/BRAND_KIT_IMPLEMENTATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Implementation completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/BRAND_TRANSFORMATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Transformation completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/CLEANER_LOGIN_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- No longer needed

Risk Level: LOW
Safe to remove? YES
```

```
/CLEANER_LOGIN_TROUBLESHOOTING.md
Status: POTENTIALLY UNUSED
Reason:
- Troubleshooting for resolved issue
- Historical debugging notes

Risk Level: LOW
Safe to remove? YES
```

```
/CLEANUP_REPORT.md
Status: POTENTIALLY UNUSED
Reason:
- Past cleanup report
- Should be replaced by this audit

Risk Level: LOW
Safe to remove? YES
```

```
/COLLECTION_SEPARATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Database restructuring completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/CRITICAL_FIELD_NAME_QUESTION.md
Status: POTENTIALLY UNUSED
Reason:
- Question resolved
- Historical note

Risk Level: LOW
Safe to remove? YES
```

```
/DESIGN_SYSTEM_GUIDE.md
Status: REQUIRED
Reason:
- Active design system reference
- Critical for UI consistency
- Actively imported/referenced

Risk Level: HIGH
Safe to remove? NO
```

```
/EAS_BUILD_IN_PROGRESS.md
Status: POTENTIALLY UNUSED
Reason:
- Build status note
- Likely outdated

Risk Level: LOW
Safe to remove? YES
```

```
/ENHANCED_FIELD_ASSISTANT_DESIGN.md
Status: NEEDS CONFIRMATION
Reason:
- Design specification
- May be reference for future features

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/ENHANCED_HOME_SCREEN_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/ENHANCED_JOB_WORKFLOW_IMPLEMENTATION.md
Status: NEEDS CONFIRMATION
Reason:
- Implementation guide
- May be reference for maintenance

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/ENHANCED_MOBILE_IMPLEMENTATION_GUIDE.md
Status: NEEDS CONFIRMATION
Reason:
- Implementation guide
- Might be webapp team reference

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/ENHANCED_MOBILE_IMPLEMENTATION.md
Status: NEEDS CONFIRMATION
Reason:
- Duplicate of above?
- Check for differences

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/FIELD_ASSISTANT_GUIDE.md
Status: NEEDS CONFIRMATION
Reason:
- Feature guide
- May be active reference

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/FINAL_IMPLEMENTATION_SUMMARY.md
Status: NEEDS CONFIRMATION
Reason:
- Project summary document
- May be valuable historical record

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/FIREBASE_*.md (Multiple Firebase-related docs)
Status: POTENTIALLY UNUSED
Reason:
- 15+ Firebase fix/completion records
- Historical debugging documentation
- Examples:
  * FIREBASE_AUDIT_SESSION_FIX_COMPLETE.md
  * FIREBASE_AUTH_OPTIMIZATION_COMPLETE.md
  * FIREBASE_AUTH_TIMEOUT_FIX_COMPLETE.md
  * FIREBASE_DB_ERROR_FIXED.md
  * FIREBASE_FOA_CHAT_FIX_COMPLETE.md
  * FIREBASE_INDEX_FIX_COMPLETE.md
  * FIREBASE_INTEGRATION_STATUS.md
  * FIREBASE_SECURITY_INTEGRATION_COMPLETE.md
  * FIREBASE_STORAGE_*.md (multiple)

Risk Level: LOW
Safe to remove? YES (Keep FIREBASE_INTEGRATION_STATUS.md as reference)
```

```
/FIRESTORE_DATE_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/GPS_LOCATION_TRACKING_IMPLEMENTATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/HOME_SCREEN_*.md (Multiple home screen docs)
Status: POTENTIALLY UNUSED
Reason:
- Historical implementation records
- Examples:
  * HOME_SCREEN_NAVIGATION_FIX_COMPLETE.md
  * HOME_SCREEN_UPCOMING_CHECKINS_COMPLETE.md

Risk Level: LOW
Safe to remove? YES
```

```
/JOB_*.md (40+ Job-related docs)
Status: MIXED
Reason:
- Many completion records (POTENTIALLY UNUSED)
- Some might be active references (NEEDS CONFIRMATION)
- Examples of UNUSED:
  * JOB_ACCEPTANCE_MODAL_ERROR_FIX_COMPLETE.md
  * JOB_ASSIGNMENT_FIELD_FIX_COMPLETE.md
  * JOB_COMPLETION_ERROR_FIXES_COMPLETE.md
  * JOB_COMPLETION_FIXES_COMPLETE.md
  * JOB_COMPLETION_WIZARD_BRAND_UPDATE_COMPLETE.md
  * JOB_COMPLETION_WIZARD_IMPLEMENTATION_COMPLETE.md
  * JOB_DETAILS_BRAND_UPDATE_COMPLETE.md
  * JOB_DETAILS_ERROR_FIX_COMPLETE.md
  * JOB_PROPERTY_DATA_FIX_COMPLETE.md
- Examples to KEEP:
  * JOB_REQUIREMENTS_IMPLEMENTATION_GUIDE.md (reference?)

Risk Level: LOW for completion records, MEDIUM for guides
Safe to remove? YES for completion records, NEEDS CONFIRMATION for guides
```

```
/MOBILE_APP_*.md (Multiple mobile app docs)
Status: MIXED
Reason:
- MOBILE_APP_PRODUCTION_READINESS_REPORT.md - REQUIRED
- MOBILE_APP_SECURITY_UPDATE_REQUIRED.md - NEEDS CONFIRMATION
- MOBILE_APP_INTEGRATION.md - POTENTIALLY UNUSED
- MOBILE_APP_INTEGRATION_FIX_REPORT.md - POTENTIALLY UNUSED
- MOBILE_APP_JOB_DISPLAY_ARCHITECTURE.md - NEEDS CONFIRMATION
- MOBILE_APP_SUCCESS_SUMMARY.md - POTENTIALLY UNUSED
- MOBILE_APP_WEBAPP_INTEGRATION.md - NEEDS CONFIRMATION

Risk Level: MIXED
Safe to remove? MIXED
```

```
/MOBILE_INTEGRATION_*.md
Status: POTENTIALLY UNUSED
Reason:
- Integration completion/fix records
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/MOBILE_REQUIREMENTS_INTEGRATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/MOBILE_SETUP_COMPLETE_SUMMARY.md
Status: POTENTIALLY UNUSED
Reason:
- Setup completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/MOBILE_STAFF_SETUP_*.md
Status: POTENTIALLY UNUSED
Reason:
- Setup completion records
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/MOBILE_TEAM_COLLECTION_CONFIRMATION.md
Status: POTENTIALLY UNUSED
Reason:
- Team communication record
- Historical note

Risk Level: LOW
Safe to remove? YES
```

```
/NOTIFICATION_*.md (Multiple notification docs)
Status: MIXED
Reason:
- Many completion records (POTENTIALLY UNUSED)
- NOTIFICATION_SYSTEM_WEBAPP_REPORT.md might be webapp reference (NEEDS CONFIRMATION)

Risk Level: LOW for most, MEDIUM for system reports
Safe to remove? YES for completion records, NEEDS CONFIRMATION for reports
```

```
/OPTIMIZATION_REPORT.md
Status: NEEDS CONFIRMATION
Reason:
- Optimization findings
- May have ongoing relevance

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/PENDING_JOBS_GLOW_IMPLEMENTATION.md
Status: POTENTIALLY UNUSED
Reason:
- Feature implementation record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/PHOTO_UPLOAD_ERROR_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/PRODUCTION_READINESS_AUDIT_COMPLETE.md
Status: NEEDS CONFIRMATION
Reason:
- Production audit findings
- May be important reference

Risk Level: HIGH
Safe to remove? NEEDS CONFIRMATION
```

```
/PROPERTY_INTEGRATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Integration completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/PUSH_NOTIFICATION_*.md
Status: POTENTIALLY UNUSED
Reason:
- Multiple push notification fix/implementation records
- Historical debugging documentation

Risk Level: LOW
Safe to remove? YES
```

```
/QUICK_START_DESIGN.md
Status: NEEDS CONFIRMATION
Reason:
- Design specification
- May be active reference

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/README.md
Status: REQUIRED
Reason:
- Project documentation
- Critical for onboarding

Risk Level: HIGH
Safe to remove? NO
```

```
/README_DESIGN_SHOWCASE.md
Status: NEEDS CONFIRMATION
Reason:
- Design showcase
- May be marketing/portfolio material

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/REALTIME_SYNC_IMPLEMENTATION_GUIDE.md
Status: NEEDS CONFIRMATION
Reason:
- Implementation guide
- May be reference for maintenance

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/SMART_CHECKLIST_FOA_CHAT_IMPLEMENTATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/STAFF_JOB_WORKFLOW_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Workflow completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/START_JOB_AUDIT_INTEGRATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/STORAGE_BUCKET_URL_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/SYNTAX_ERROR_FIX_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Bug fix completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/UNIVERSAL_REFRESH_IMPLEMENTATION_COMPLETE.md
Status: POTENTIALLY UNUSED
Reason:
- Feature completion record
- Historical documentation

Risk Level: LOW
Safe to remove? YES
```

```
/WEBAPP_*.md (Multiple webapp docs)
Status: NEEDS CONFIRMATION
Reason:
- Documentation for webapp team
- May be actively referenced by other team
- Examples:
  * WEBAPP_AI_AUDIT_IMPLEMENTATION_GUIDE.md
  * WEBAPP_AUDIT_REPORTS_ACCESS_GUIDE.md
  * WEBAPP_DELIVERY_PACKAGE_SUMMARY.md
  * WEBAPP_DEV_TEAM_BRIEF.md
  * WEBAPP_FIREBASE_ACCESS_GUIDE.md
  * WEBAPP_JOB_ASSIGNMENT_GUIDE.md
  * WEBAPP_TEAM_IMPLEMENTATION_MESSAGE.md

Risk Level: HIGH (affects other team)
Safe to remove? NEEDS CONFIRMATION (consult with webapp team)
```

### DOCUMENTATION SUMMARY

**Total .md Files:** ~102 files

**Classification:**
- ✅ **REQUIRED:** 3 files (README.md, DESIGN_SYSTEM_GUIDE.md, BRAND_KIT_COMPREHENSIVE_REPORT.md)
- ⚠️ **NEEDS CONFIRMATION:** 20-25 files (guides, reports, webapp docs)
- 🗑️ **POTENTIALLY UNUSED:** 75+ files (completion records, fix logs)

**Recommended Action:**
1. **Keep as-is:** 3 REQUIRED files
2. **Archive to `/docs/archive/` folder:** 75+ completion records
3. **Review with team:** 20-25 NEEDS CONFIRMATION files
4. **Consult webapp team:** 7 WEBAPP_* files

---

### 2. TEST & DEBUG SCRIPTS

#### 2.1 ROOT-LEVEL TEST SCRIPTS

```
/test-audit-fix.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script, likely one-time use
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-audit-simple.ts
Status: POTENTIALLY UNUSED
Reason:
- Debug script, likely one-time use
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-audit-system.ts
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-audit-basic.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-auth-fix.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script for resolved issue
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-collection-separation.js
Status: POTENTIALLY UNUSED
Reason:
- One-time migration script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-firebase-init.js
Status: POTENTIALLY UNUSED
Reason:
- Firebase initialization test
- Debugging tool, not production code

Risk Level: LOW
Safe to remove? YES
```

```
/test-firebase-integration.js
Status: POTENTIALLY UNUSED
Reason:
- Integration test script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-firebase-storage-debug.js
Status: POTENTIALLY UNUSED
Reason:
- Storage debugging script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-foa-chat-implementation.js
Status: POTENTIALLY UNUSED
Reason:
- Feature test script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-job-completion-firestore.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-job-completion-fixes.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-job-completion-photo-fix.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-job-requirements-integration.ts
Status: POTENTIALLY UNUSED
Reason:
- Integration test
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-jobs-debug-new.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-jobs-debug.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-mobile-app-debug.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-mobile-app-flow.js
Status: POTENTIALLY UNUSED
Reason:
- Flow test script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-property-integration.js
Status: POTENTIALLY UNUSED
Reason:
- Integration test
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-quality-checklist.js
Status: POTENTIALLY UNUSED
Reason:
- Checklist test
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-staff-analysis.js
Status: POTENTIALLY UNUSED
Reason:
- Staff data analysis script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-staff-creation.js
Status: POTENTIALLY UNUSED
Reason:
- Staff creation test
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-staff-job-service.js
Status: POTENTIALLY UNUSED
Reason:
- Service test script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/test-start-job-audit-integration.js
Status: POTENTIALLY UNUSED
Reason:
- Integration test
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/check-ante-cliff.js
Status: POTENTIALLY UNUSED
Reason:
- Data check script (specific to one property?)
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/check-cleaner-jobs.js
Status: POTENTIALLY UNUSED
Reason:
- Data check script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/check-cleaner-profile.js
Status: POTENTIALLY UNUSED
Reason:
- Data check script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/firebase-auth-test.js
Status: POTENTIALLY UNUSED
Reason:
- Auth test script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/firebase-config-check.js
Status: POTENTIALLY UNUSED
Reason:
- Config check script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/mobile-app-debug.js
Status: POTENTIALLY UNUSED
Reason:
- Debug script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

```
/update-ante-cliff-complete.js
Status: POTENTIALLY UNUSED
Reason:
- One-time update script
- Not in package.json scripts

Risk Level: LOW
Safe to remove? YES
```

#### 2.2 /scripts/ FOLDER SCRIPTS

```
/scripts/create-test-notification.js
Status: NEEDS CONFIRMATION
Reason:
- Test utility
- Might be used for debugging production issues

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/check-firestore-notifications.js
Status: NEEDS CONFIRMATION
Reason:
- Diagnostic utility
- Might be used for debugging

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/simple-notification-test.js
Status: POTENTIALLY UNUSED
Reason:
- Test script
- Likely debug tool

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/check-properties-client.js
Status: NEEDS CONFIRMATION
Reason:
- Property check utility
- Might be used for data validation

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/quick-notification-test.js
Status: POTENTIALLY UNUSED
Reason:
- Quick test script
- Likely debug tool

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/test-notification-popup.js
Status: POTENTIALLY UNUSED
Reason:
- UI test script
- Debug tool

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/test-notification-system.js
Status: POTENTIALLY UNUSED
Reason:
- System test script
- Debug tool

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/health-check.js
Status: NEEDS CONFIRMATION
Reason:
- Health check utility
- Might be used for monitoring

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/check-firebase-notifications.js
Status: NEEDS CONFIRMATION
Reason:
- Firebase diagnostic
- Might be used for debugging

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/admin-create-notification.mjs
Status: NEEDS CONFIRMATION
Reason:
- Admin utility
- Might be used for testing/debugging

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/update-ante-cliff-location.js
Status: POTENTIALLY UNUSED
Reason:
- One-time update script for specific property
- Historical utility

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/add-emulator-users.md
Status: NEEDS CONFIRMATION
Reason:
- Emulator setup guide
- Might be needed for local development

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/add-test-notifications.mjs
Status: NEEDS CONFIRMATION
Reason:
- Test data generator
- Might be used for testing

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/manage-notifications.js
Status: NEEDS CONFIRMATION
Reason:
- Notification management utility
- Might be actively used

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/check-properties.js
Status: NEEDS CONFIRMATION
Reason:
- Property check utility
- Might be used for data validation

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/link-jobs-to-ante-cliff.js
Status: POTENTIALLY UNUSED
Reason:
- One-time migration script for specific property
- Historical utility

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/add-pin-fields.js
Status: POTENTIALLY UNUSED
Reason:
- Database migration script
- One-time utility

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/notification-status-report.js
Status: NEEDS CONFIRMATION
Reason:
- Diagnostic utility
- Might be used for monitoring

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/add-test-notifications.js
Status: POTENTIALLY UNUSED
Reason:
- Duplicate of .mjs version?
- Test data generator

Risk Level: LOW
Safe to remove? YES (if duplicate)
```

```
/scripts/setup-shared-auth.js
Status: POTENTIALLY UNUSED
Reason:
- Setup script (one-time)
- Auth configuration

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/scripts/migrate-staff-accounts.js
Status: POTENTIALLY UNUSED
Reason:
- Migration script (one-time)
- Historical utility

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/test-notification-click.js
Status: POTENTIALLY UNUSED
Reason:
- Test script
- Debug tool

Risk Level: LOW
Safe to remove? YES
```

```
/scripts/seedFirebaseData.ts
Status: NEEDS CONFIRMATION
Reason:
- Database seeding utility
- Might be used for testing/development

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

### TEST SCRIPTS SUMMARY

**Total Test/Debug Scripts:** 50+ files

**Classification:**
- 🗑️ **POTENTIALLY UNUSED:** 35+ files (one-time scripts, debug tools)
- ⚠️ **NEEDS CONFIRMATION:** 15+ files (utilities, diagnostic tools)

**Recommended Action:**
1. Move one-time scripts to `/scripts/archive/migration/`
2. Move debug scripts to `/scripts/archive/debug/`
3. Review utility scripts with team
4. Keep active diagnostic tools in `/scripts/utils/`

---

### 3. BACKUP FILES

```
/backup/profile-backup.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of old profile screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES (after verifying current works)
```

```
/backup/index-brand.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of home screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/profile-view-fixed.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of profile screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/profile-brand.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of profile screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/profile-view.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of profile screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/profile-view-clean.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of profile screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/jobs-backup.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of jobs screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/index-backup.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of home screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

```
/backup/jobs-brand.tsx
Status: POTENTIALLY UNUSED
Reason:
- Backup of jobs screen
- Superseded by current version

Risk Level: LOW
Safe to remove? YES
```

### BACKUP FILES SUMMARY

**Total Backup Files:** 9 files

**Classification:**
- 🗑️ **POTENTIALLY UNUSED:** 9 files (all backups)

**Recommended Action:**
1. Verify current screens are working correctly
2. Delete entire `/backup/` folder
3. Rely on Git history for version control instead

---

### 4. DUPLICATE/REDUNDANT APP SCREENS

#### 4.1 PROFILE SCREENS

```
/app/profile-view-fixed.tsx
Status: POTENTIALLY UNUSED
Reason:
- Multiple profile implementations exist
- Current production: /app/(tabs)/profile-brand.tsx
- This appears to be old version

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/app/profile-view.tsx
Status: POTENTIALLY UNUSED
Reason:
- Multiple profile implementations exist
- Superseded by profile-brand.tsx

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/app/profile-view-clean.tsx
Status: POTENTIALLY UNUSED
Reason:
- Multiple profile implementations exist
- Superseded by profile-brand.tsx

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

**Analysis:** Current active profile screen is `/app/(tabs)/profile-brand.tsx`. The root-level profile screens appear to be old iterations.

#### 4.2 HOME SCREENS

```
/app/(tabs)/index.tsx
Status: POTENTIALLY UNUSED
Reason:
- Non-branded version of home screen
- Current production: /app/(tabs)/index-brand.tsx
- Appears to be legacy/backup

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

**Analysis:** `index-brand.tsx` is the actively used home screen based on brand implementation. `index.tsx` might be legacy.

#### 4.3 JOBS SCREENS

```
/app/(tabs)/jobs.tsx
Status: POTENTIALLY UNUSED
Reason:
- Non-branded version of jobs screen
- Current production: /app/(tabs)/jobs-brand.tsx
- Appears to be legacy

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

**Analysis:** `jobs-brand.tsx` is the actively used jobs screen. `jobs.tsx` might be legacy.

#### 4.4 SETTINGS SCREENS

```
/app/(tabs)/settings.tsx
Status: POTENTIALLY UNUSED
Reason:
- Non-branded version of settings screen
- Current production: /app/(tabs)/settings-brand.tsx
- Appears to be legacy

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

#### 4.5 NOTIFICATIONS SCREENS

```
/app/(tabs)/notifications.tsx
Status: POTENTIALLY UNUSED
Reason:
- Non-branded version of notifications screen
- Current production: /app/(tabs)/notifications-brand.tsx
- Appears to be legacy

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

#### 4.6 SELECT PROFILE SCREENS

```
/app/(auth)/select-profile.tsx
Status: POTENTIALLY UNUSED
Reason:
- Non-branded version
- Current production: /app/(auth)/select-profile-brand.tsx
- Appears to be legacy

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

#### 4.7 STAFF SELECT PROFILE

```
/app/(auth)/select-staff-profile.tsx
Status: NEEDS CONFIRMATION
Reason:
- Might be different from select-profile-brand.tsx
- Need to check if actively used
- Could be admin vs staff distinction

Risk Level: HIGH
Safe to remove? NEEDS CONFIRMATION
```

### DUPLICATE SCREENS SUMMARY

**Pattern Detected:** Brand transformation created `-brand.tsx` versions of screens, leaving non-branded versions potentially orphaned.

**Total Duplicate Screens:** 6 pairs (12 files)

**Classification:**
- ⚠️ **NEEDS CONFIRMATION:** All 12 files (verify active usage)

**Recommended Action:**
1. Check `app/_layout.tsx` routing configuration
2. Verify which screens are actually referenced
3. Test app flow to confirm branded versions are used
4. Remove non-branded versions after confirmation

---

### 5. ROOT-LEVEL COMPONENT FILES

```
/enhanced-job-detail-with-chat.tsx
Status: POTENTIALLY UNUSED
Reason:
- Component file in root (should be in /components/)
- Not imported in any searched files
- Might be experimental/prototype

Risk Level: MEDIUM
Safe to remove? NEEDS CONFIRMATION
```

```
/TEST_ENHANCED_MODAL_INTEGRATION.tsx
Status: POTENTIALLY UNUSED
Reason:
- Test component in root
- Not production code
- Should be in /components/tests/ or deleted

Risk Level: LOW
Safe to remove? YES
```

### ROOT COMPONENT FILES SUMMARY

**Total Root Components:** 2 files

**Classification:**
- 🗑️ **POTENTIALLY UNUSED:** 2 files

**Recommended Action:**
1. Move test components to proper location or delete
2. Verify enhanced-job-detail-with-chat.tsx usage
3. Delete if not imported anywhere

---

### 6. MISCELLANEOUS FILES

```
/Tess-prep
Status: UNKNOWN
Reason:
- Unknown file/folder
- No extension
- Might be temporary

Risk Level: LOW
Safe to remove? NEEDS CONFIRMATION
```

```
/pglite-debug.log
Status: POTENTIALLY UNUSED
Reason:
- Debug log file
- Should be in .gitignore

Risk Level: LOW
Safe to remove? YES
```

```
/.npmrc.crswap
Status: POTENTIALLY UNUSED
Reason:
- Swap file (editor crash recovery)
- Should not be committed

Risk Level: LOW
Safe to remove? YES
```

### MISCELLANEOUS SUMMARY

**Total Misc Files:** 3 files

**Classification:**
- 🗑️ **POTENTIALLY UNUSED:** 3 files

**Recommended Action:**
1. Add to .gitignore: `*.log`, `*.crswap`
2. Delete temporary files
3. Investigate Tess-prep

---

## 📊 AUDIT STATISTICS

### By Category

| Category | Total | Required | Needs Review | Can Delete |
|----------|-------|----------|--------------|------------|
| Documentation (.md) | 102 | 3 | 25 | 74 |
| Test Scripts | 50+ | 0 | 15 | 35+ |
| Backup Files | 9 | 0 | 0 | 9 |
| Duplicate Screens | 12 | 0 | 12 | 0* |
| Root Components | 2 | 0 | 1 | 1 |
| Miscellaneous | 3 | 0 | 1 | 2 |
| **TOTAL** | **178+** | **3** | **54** | **121+** |

*After confirmation

### By Risk Level

| Risk Level | Count | Action |
|------------|-------|--------|
| 🔴 HIGH | 3 | Keep, critical for production |
| 🟡 MEDIUM | 54 | Review with team |
| 🟢 LOW | 121+ | Safe to archive/delete |

---

## 📁 B) PROPOSED FOLDER STRUCTURE

### Current Structure Issues

1. **Root clutter:** 100+ documentation files in root
2. **Mixed concerns:** Test scripts scattered in root and /scripts/
3. **No archival structure:** Completed work mixes with active docs
4. **Backup confusion:** Backup files exist when Git provides version control

### Recommended Structure

```
/
├── .docs/                          # NEW: Documentation folder
│   ├── README.md                   # Project overview (keep in root as symlink)
│   ├── active/                     # NEW: Active reference docs
│   │   ├── DESIGN_SYSTEM_GUIDE.md
│   │   ├── BRAND_KIT_COMPREHENSIVE_REPORT.md
│   │   ├── MOBILE_APP_PRODUCTION_READINESS_REPORT.md
│   │   └── implementation-guides/  # NEW: Active implementation guides
│   ├── archive/                    # NEW: Historical documentation
│   │   ├── features/               # NEW: Feature completion records
│   │   ├── fixes/                  # NEW: Bug fix records
│   │   └── migrations/             # NEW: Migration records
│   └── webapp-team/                # NEW: Documentation for webapp team
│       └── (WEBAPP_*.md files)
│
├── /scripts/                       # Scripts folder (reorganize)
│   ├── utils/                      # NEW: Active utility scripts
│   │   ├── health-check.js
│   │   ├── manage-notifications.js
│   │   └── check-properties.js
│   ├── dev/                        # NEW: Development scripts
│   │   ├── seed-data/
│   │   └── test-notifications/
│   └── archive/                    # NEW: Historical scripts
│       ├── migrations/             # One-time migration scripts
│       └── debug/                  # Debug/troubleshooting scripts
│
├── /app/                           # Application screens (cleanup)
│   ├── (tabs)/                     # Tab screens
│   │   ├── index-brand.tsx         # KEEP: Active home
│   │   ├── jobs-brand.tsx          # KEEP: Active jobs
│   │   ├── profile-brand.tsx       # KEEP: Active profile
│   │   ├── settings-brand.tsx      # KEEP: Active settings
│   │   ├── notifications-brand.tsx # KEEP: Active notifications
│   │   ├── index.tsx               # REVIEW: Remove if unused
│   │   ├── jobs.tsx                # REVIEW: Remove if unused
│   │   ├── profile.tsx             # REVIEW: Remove if unused
│   │   ├── settings.tsx            # REVIEW: Remove if unused
│   │   └── notifications.tsx       # REVIEW: Remove if unused
│   ├── (auth)/                     # Auth screens
│   │   ├── select-profile-brand.tsx # KEEP: Active
│   │   ├── select-profile.tsx       # REVIEW: Remove if unused
│   │   └── select-staff-profile.tsx # REVIEW: Check usage
│   ├── jobs/
│   │   └── [id].tsx                # KEEP: Job details
│   ├── (modal)/
│   ├── index.tsx                   # KEEP: Root route
│   ├── _layout.tsx                 # KEEP: Root layout
│   ├── profile-view-fixed.tsx      # REVIEW: Remove if unused
│   ├── profile-view.tsx            # REVIEW: Remove if unused
│   └── profile-view-clean.tsx      # REVIEW: Remove if unused
│
├── /components/                    # Components (well organized)
│   ├── ui/                         # UI components
│   ├── jobs/                       # Job components
│   ├── auth/                       # Auth components
│   ├── notifications/              # Notification components
│   ├── shared/                     # Shared components
│   ├── dashboard/                  # Dashboard components
│   ├── admin/                      # Admin components
│   ├── audit/                      # Audit components
│   ├── maps/                       # Map components
│   ├── navigation/                 # Navigation components
│   ├── settings/                   # Settings components
│   ├── sync/                       # Sync components
│   └── tests/                      # Test components
│
├── /services/                      # Services (audit needed separately)
├── /contexts/                      # Context providers
├── /hooks/                         # Custom hooks
├── /types/                         # TypeScript types
├── /utils/                         # Utility functions
├── /constants/                     # Constants
├── /lib/                           # Library configurations
├── /assets/                        # Static assets
├── /locales/                       # Translations
│
├── /backup/                        # REMOVE: Use Git history instead
│
└── (root files)                    # Configuration only
    ├── package.json
    ├── tsconfig.json
    ├── app.json
    ├── babel.config.js
    ├── metro.config.js
    ├── tailwind.config.js
    ├── eas.json
    ├── firebase.json
    ├── firestore.rules
    ├── storage.rules
    ├── .gitignore
    ├── .env.local
    └── README.md                   # Symlink to .docs/README.md
```

### Key Improvements

1. **.docs/ folder:** All documentation organized by purpose
2. **Archive structure:** Historical docs separated from active
3. **Scripts reorganization:** Utilities vs. archive
4. **Cleaner root:** Only config files in root
5. **No backup folder:** Rely on Git for version control
6. **Clearer app/ structure:** Remove duplicate screens

---

## 🛑 C) SAFE TO DELETE CANDIDATE LIST

### Priority 1: Definitely Safe (After Archiving)

**Completion Record Documentation** (75 files)
```
# Move to .docs/archive/features/ or .docs/archive/fixes/

AI_AUDIT_SYSTEM_INTEGRATION_COMPLETE.md
AI_AUDIT_SYSTEM_TEST_RESULTS.md
AI_COMPONENTS_ORGANIZATION_COMPLETE.md
AI_SYSTEM_CLEANUP_COMPLETE.md
AI_SYSTEM_RESTRUCTURING_COMPLETE.md
AI_UI_CLEANUP_COMPLETE.md
AUTHENTICATION_CONTEXT_FIX_COMPLETE.md
AUTO_REFRESH_UX_IMPROVEMENT_COMPLETE.md
BACKGROUND_NOTIFICATION_CONFIRMATION.md
BRAND_KIT_IMPLEMENTATION_COMPLETE.md
BRAND_TRANSFORMATION_COMPLETE.md
CLEANER_LOGIN_FIX_COMPLETE.md
CLEANER_LOGIN_TROUBLESHOOTING.md
CLEANUP_REPORT.md
COLLECTION_SEPARATION_COMPLETE.md
CRITICAL_FIELD_NAME_QUESTION.md
EAS_BUILD_IN_PROGRESS.md
ENHANCED_HOME_SCREEN_COMPLETE.md
FIREBASE_AUDIT_SESSION_FIX_COMPLETE.md
FIREBASE_AUTH_OPTIMIZATION_COMPLETE.md
FIREBASE_AUTH_TIMEOUT_FIX_COMPLETE.md
FIREBASE_DB_ERROR_FIXED.md
FIREBASE_FOA_CHAT_FIX_COMPLETE.md
FIREBASE_INDEX_FIX_COMPLETE.md
FIREBASE_SECURITY_INTEGRATION_COMPLETE.md
FIREBASE_STORAGE_BUCKET_FIX_COMPLETE.md
FIREBASE_STORAGE_CORS_FIX.md
FIREBASE_STORAGE_CORS_REQUIRED.md
FIREBASE_STORAGE_DEPLOYMENT_SUCCESS.md
FIREBASE_STORAGE_RULES_DEPLOYMENT.md
FIREBASE_STORAGE_SETUP_REQUIRED.md
FIRESTORE_DATE_FIX_COMPLETE.md
GPS_LOCATION_TRACKING_IMPLEMENTATION_COMPLETE.md
HOME_SCREEN_NAVIGATION_FIX_COMPLETE.md
HOME_SCREEN_UPCOMING_CHECKINS_COMPLETE.md
JOB_ACCEPTANCE_MODAL_ERROR_FIX_COMPLETE.md
JOB_ASSIGNMENT_FIELD_FIX_COMPLETE.md
JOB_COMPLETION_ERROR_FIXES_COMPLETE.md
JOB_COMPLETION_FIXES_COMPLETE.md
JOB_COMPLETION_WIZARD_BRAND_UPDATE_COMPLETE.md
JOB_COMPLETION_WIZARD_IMPLEMENTATION_COMPLETE.md
JOB_DETAILS_BRAND_UPDATE_COMPLETE.md
JOB_DETAILS_ERROR_FIX_COMPLETE.md
JOB_PROPERTY_DATA_FIX_COMPLETE.md
JOBS_TAB_PENDING_GLOW_IMPLEMENTATION.md
MOBILE_APP_INTEGRATION_FIX_REPORT.md
MOBILE_APP_SUCCESS_SUMMARY.md
MOBILE_INTEGRATION_FIX.md
MOBILE_INTEGRATION_STATUS.md
MOBILE_REQUIREMENTS_INTEGRATION_COMPLETE.md
MOBILE_SETUP_COMPLETE_SUMMARY.md
MOBILE_STAFF_SETUP_COMPLETE.md
MOBILE_STAFF_SETUP_SUMMARY.md
MOBILE_TEAM_COLLECTION_CONFIRMATION.md
NOTIFICATION_CLICK_FIX_COMPLETE.md
NOTIFICATION_CLICK_POPUP_IMPLEMENTATION.md
NOTIFICATION_DEDUPLICATION_FIX.md
PENDING_JOBS_GLOW_IMPLEMENTATION.md
PHOTO_UPLOAD_ERROR_FIX_COMPLETE.md
PROPERTY_INTEGRATION_COMPLETE.md
PUSH_NOTIFICATION_FIX_REQUIRED.md
PUSH_NOTIFICATION_IMPLEMENTATION_COMPLETE.md
PUSH_NOTIFICATION_TOKEN_FIX_REPORT.md
SMART_CHECKLIST_FOA_CHAT_IMPLEMENTATION_COMPLETE.md
STAFF_JOB_WORKFLOW_COMPLETE.md
START_JOB_AUDIT_INTEGRATION_COMPLETE.md
STORAGE_BUCKET_URL_FIX_COMPLETE.md
SYNTAX_ERROR_FIX_COMPLETE.md
UNIVERSAL_REFRESH_IMPLEMENTATION_COMPLETE.md

# Plus others following *_COMPLETE.md or *_FIX_COMPLETE.md pattern
```

**One-Time Test/Debug Scripts** (35+ files)
```
# Move to scripts/archive/debug/ or scripts/archive/migration/

test-audit-fix.js
test-audit-simple.ts
test-audit-system.ts
test-audit-basic.js
test-auth-fix.js
test-collection-separation.js
test-firebase-init.js
test-firebase-integration.js
test-firebase-storage-debug.js
test-foa-chat-implementation.js
test-job-completion-firestore.js
test-job-completion-fixes.js
test-job-completion-photo-fix.js
test-job-requirements-integration.ts
test-jobs-debug-new.js
test-jobs-debug.js
test-mobile-app-debug.js
test-mobile-app-flow.js
test-property-integration.js
test-quality-checklist.js
test-staff-analysis.js
test-staff-creation.js
test-staff-job-service.js
test-start-job-audit-integration.js
check-ante-cliff.js
check-cleaner-jobs.js
check-cleaner-profile.js
firebase-auth-test.js
firebase-config-check.js
mobile-app-debug.js
update-ante-cliff-complete.js

# /scripts/ folder
scripts/simple-notification-test.js
scripts/quick-notification-test.js
scripts/test-notification-popup.js
scripts/test-notification-system.js
scripts/update-ante-cliff-location.js
scripts/add-pin-fields.js
scripts/link-jobs-to-ante-cliff.js
scripts/migrate-staff-accounts.js
scripts/test-notification-click.js
scripts/add-test-notifications.js (if duplicate of .mjs)
```

**Backup Files** (9 files)
```
# DELETE: Entire /backup/ folder - use Git history instead

backup/profile-backup.tsx
backup/index-brand.tsx
backup/profile-view-fixed.tsx
backup/profile-brand.tsx
backup/profile-view.tsx
backup/profile-view-clean.tsx
backup/jobs-backup.tsx
backup/index-backup.tsx
backup/jobs-brand.tsx
```

**Miscellaneous** (3 files)
```
# DELETE: Temporary/log files

pglite-debug.log
.npmrc.crswap
Tess-prep (after verification)
```

**Root Components** (1-2 files)
```
# After verification, delete or move:

TEST_ENHANCED_MODAL_INTEGRATION.tsx
enhanced-job-detail-with-chat.tsx (if unused)
```

### Priority 2: Review Required

**Implementation Guides & References** (20-25 files)
```
# Need team review to determine if actively used:

BACKGROUND_AI_AUDIT_INTEGRATION_GUIDE.md
BRAND_IMPLEMENTATION.md
ENHANCED_FIELD_ASSISTANT_DESIGN.md
ENHANCED_JOB_WORKFLOW_IMPLEMENTATION.md
ENHANCED_MOBILE_IMPLEMENTATION_GUIDE.md
ENHANCED_MOBILE_IMPLEMENTATION.md
FIELD_ASSISTANT_GUIDE.md
FINAL_IMPLEMENTATION_SUMMARY.md
JOB_REQUIREMENTS_IMPLEMENTATION_GUIDE.md
MOBILE_APP_JOB_DISPLAY_ARCHITECTURE.md
MOBILE_APP_SECURITY_UPDATE_REQUIRED.md
MOBILE_APP_WEBAPP_INTEGRATION.md
OPTIMIZATION_REPORT.md
PRODUCTION_READINESS_AUDIT_COMPLETE.md
QUICK_START_DESIGN.md
README_DESIGN_SHOWCASE.md
REALTIME_SYNC_IMPLEMENTATION_GUIDE.md

# WEBAPP_* files (consult webapp team first)
WEBAPP_AI_AUDIT_IMPLEMENTATION_GUIDE.md
WEBAPP_AUDIT_REPORTS_ACCESS_GUIDE.md
WEBAPP_DELIVERY_PACKAGE_SUMMARY.md
WEBAPP_DEV_TEAM_BRIEF.md
WEBAPP_FIREBASE_ACCESS_GUIDE.md
WEBAPP_JOB_ASSIGNMENT_GUIDE.md
WEBAPP_TEAM_IMPLEMENTATION_MESSAGE.md
```

**Utility Scripts** (15 files)
```
# Review if actively used:

scripts/create-test-notification.js
scripts/check-firestore-notifications.js
scripts/check-properties-client.js
scripts/health-check.js
scripts/check-firebase-notifications.js
scripts/admin-create-notification.mjs
scripts/add-emulator-users.md
scripts/add-test-notifications.mjs
scripts/manage-notifications.js
scripts/check-properties.js
scripts/notification-status-report.js
scripts/setup-shared-auth.js
scripts/seedFirebaseData.ts
```

**Duplicate Screens** (12 files)
```
# Verify which are active, remove others:

app/(tabs)/index.tsx (vs index-brand.tsx)
app/(tabs)/jobs.tsx (vs jobs-brand.tsx)
app/(tabs)/profile.tsx (vs profile-brand.tsx)
app/(tabs)/settings.tsx (vs settings-brand.tsx)
app/(tabs)/notifications.tsx (vs notifications-brand.tsx)
app/(auth)/select-profile.tsx (vs select-profile-brand.tsx)
app/(auth)/select-staff-profile.tsx (verify distinct purpose)

app/profile-view-fixed.tsx
app/profile-view.tsx
app/profile-view-clean.tsx
```

### Priority 3: Keep

**Critical Documentation** (3 files)
```
README.md
DESIGN_SYSTEM_GUIDE.md
BRAND_KIT_COMPREHENSIVE_REPORT.md
```

**Active Implementation References** (as determined by team review)

---

## 📝 SUMMARY & RECOMMENDATIONS

### Cleanup Plan

#### Phase 1: Immediate Actions (Low Risk)
1. **Create archive structure:**
   ```bash
   mkdir -p .docs/archive/features
   mkdir -p .docs/archive/fixes
   mkdir -p .docs/archive/migrations
   mkdir -p scripts/archive/debug
   mkdir -p scripts/archive/migration
   ```

2. **Move completion records (75 files):**
   ```bash
   mv *_COMPLETE.md .docs/archive/features/
   mv *_FIX_COMPLETE.md .docs/archive/fixes/
   ```

3. **Delete backup folder:**
   ```bash
   rm -rf backup/
   ```

4. **Delete temporary files:**
   ```bash
   rm pglite-debug.log
   rm .npmrc.crswap
   rm TEST_ENHANCED_MODAL_INTEGRATION.tsx
   ```

5. **Move test scripts:**
   ```bash
   mv test-*.js scripts/archive/debug/
   mv test-*.ts scripts/archive/debug/
   mv check-*.js scripts/archive/debug/
   mv *-debug.js scripts/archive/debug/
   mv update-ante-cliff-complete.js scripts/archive/migration/
   ```

#### Phase 2: Team Review (Medium Risk)
1. **Review duplicate screens:**
   - Test app to verify which screens are active
   - Check routing in `app/_layout.tsx` and `app/(tabs)/_layout.tsx`
   - Remove non-branded versions if unused

2. **Review implementation guides:**
   - Determine which are active references
   - Move obsolete guides to archive
   - Keep active guides in `.docs/active/`

3. **Review utility scripts:**
   - Identify scripts used in CI/CD or development
   - Move to `scripts/utils/` if active
   - Archive if obsolete

4. **Consult webapp team:**
   - Share list of WEBAPP_* files
   - Confirm usage before moving/deleting
   - Consider moving to `.docs/webapp-team/`

#### Phase 3: Implementation (After Approval)
1. Execute Phase 1 cleanup
2. Implement Phase 2 after team review
3. Update .gitignore:
   ```
   *.log
   *.crswap
   .docs/archive/
   scripts/archive/
   ```
4. Create symlink for README:
   ```bash
   mv README.md .docs/README.md
   ln -s .docs/README.md README.md
   ```

### Expected Outcomes

**Before Cleanup:**
- Root directory: 180+ files
- Unclear structure
- Mix of active/historical docs
- Difficult to find current documentation

**After Cleanup:**
- Root directory: ~15 configuration files
- Clear documentation structure
- Archived historical records
- Easy to find active documentation
- Better organized scripts

### Estimated Impact

**Files to Archive/Delete:** 120+ files  
**Files to Review:** 50+ files  
**Files to Keep:** 3-10 critical docs + active codebase  
**Time Saved:** Easier navigation, faster onboarding  
**Risk Reduction:** Less confusion, clearer codebase structure  

---

## ⚠️ IMPORTANT REMINDERS

1. **NO DELETIONS YET** - This is an audit only
2. **Await approval** before any cleanup actions
3. **Archive first** - Don't delete completion records, move to archive
4. **Test after** - Verify app works after removing duplicate screens
5. **Team consensus** - Review WEBAPP_* and guide docs with team
6. **Git safety** - All changes should be in a dedicated cleanup branch

---

## ✅ NEXT STEPS

1. **Review this audit** with team
2. **Approve Priority 1 actions** (low risk cleanup)
3. **Assign team members** to review Priority 2 items
4. **Create cleanup branch** for implementing approved changes
5. **Test thoroughly** after each phase
6. **Update documentation** about new structure

---

**END OF AUDIT REPORT**

*Generated by: AI Code Audit System*  
*Date: January 6, 2026*  
*Status: Awaiting Human Approval*
