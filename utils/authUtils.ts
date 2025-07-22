/**
 * Auth State Fix for PushNotificationContext
 * Prevents premature cleanup and reduces warning noise
 */

import { enhancedAuthService } from '@/services/enhancedAuthService';

/**
 * Enhanced authentication check that waits for proper initialization
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await enhancedAuthService.getCurrentUser();
    return !!user;
  } catch (error) {
    console.warn('⚠️ Auth check failed, assuming not authenticated');
    return false;
  }
};

/**
 * Get Firebase UID with proper waiting
 */
export const getFirebaseUidSafe = async (): Promise<string | null> => {
  try {
    const user = await enhancedAuthService.getCurrentUser();
    return user?.uid || null;
  } catch (error) {
    console.warn('⚠️ Failed to get Firebase UID');
    return null;
  }
};

/**
 * Enhanced auth state listener for React components
 */
export const useEnhancedAuthState = (callback: (isAuthenticated: boolean, uid: string | null) => void) => {
  return enhancedAuthService.onAuthStateChanged((user) => {
    callback(!!user, user?.uid || null);
  });
};

/**
 * Check if we should initialize push notifications
 * Waits for proper auth state instead of immediate cleanup
 */
export const shouldInitializePushNotifications = async (currentProfile: any): Promise<boolean> => {
  if (!currentProfile?.id) {
    return false;
  }

  // Give auth service time to initialize
  const isAuth = await isUserAuthenticated();
  return isAuth;
};

export default {
  isUserAuthenticated,
  getFirebaseUidSafe,
  useEnhancedAuthState,
  shouldInitializePushNotifications
};
