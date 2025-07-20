/**
 * Simple Notification Fix
 * Quick fix to prevent duplicate notifications for job assignments
 */

// Global tracking of recent notifications to prevent duplicates
const recentNotifications = new Map<string, number>();
const DUPLICATE_THRESHOLD = 3000; // 3 seconds

/**
 * Check if a notification should be shown to prevent duplicates
 */
export function shouldShowNotification(
  jobId: string, 
  staffId: string, 
  type: 'banner' | 'push' | 'modal' = 'banner'
): boolean {
  const key = `${staffId}:${jobId}:${type}`;
  const now = Date.now();
  const lastShown = recentNotifications.get(key) || 0;
  
  if (now - lastShown < DUPLICATE_THRESHOLD) {
    console.log(`🔕 Duplicate ${type} notification blocked for job ${jobId}`);
    return false;
  }
  
  recentNotifications.set(key, now);
  
  // Clean up old entries periodically
  if (recentNotifications.size > 100) {
    const cutoff = now - 60000; // 1 minute
    for (const [entryKey, timestamp] of recentNotifications.entries()) {
      if (timestamp < cutoff) {
        recentNotifications.delete(entryKey);
      }
    }
  }
  
  return true;
}
