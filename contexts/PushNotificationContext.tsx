/**
 * Push Notification Context
 * Manages push notification state and integrates with authentication
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePINAuth } from './PINAuthContext';
import { pushNotificationService, NotificationData, NotificationPayload } from '@/services/pushNotificationService';
import { firebaseUidService } from '@/services/firebaseUidService';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert } from 'react-native';

interface PushNotificationContextType {
  // Permission status
  permissionStatus: Notifications.PermissionStatus | null;
  isInitialized: boolean;
  isPermissionDenied: boolean;
  
  // Push token
  pushToken: string | null;
  
  // Methods
  requestPermissions: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  
  // Status checks
  areNotificationsEnabled: () => Promise<boolean>;
  checkPermissionStatus: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const { currentProfile, isAuthenticated } = usePINAuth();
  
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Debug logging for authentication state
  useEffect(() => {
    console.log('🔍 PushNotificationContext: Auth state changed', {
      isAuthenticated,
      hasProfile: !!currentProfile,
      profileId: currentProfile?.id,
    });
  }, [isAuthenticated, currentProfile]);

  // Initialize push notifications when user authenticates
  useEffect(() => {
    console.log('🔍 PushNotificationContext: Effect triggered', {
      isAuthenticated,
      hasProfile: !!currentProfile?.id,
      profileId: currentProfile?.id,
    });
    
    if (isAuthenticated && currentProfile?.id) {
      console.log('✅ PushNotificationContext: Conditions met, calling initializePushNotifications');
      initializePushNotifications();
    } else if (!isAuthenticated) {
      console.log('🧹 PushNotificationContext: Not authenticated, cleaning up');
      cleanupPushNotifications();
    } else {
      console.log('⏳ PushNotificationContext: Waiting for authentication or profile');
    }
  }, [isAuthenticated, currentProfile?.id]);

  // Set up notification listeners when initialized
  useEffect(() => {
    if (isInitialized) {
      const foregroundSubscription = Notifications.addNotificationReceivedListener(handleNotificationReceived);
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

      return () => {
        Notifications.removeNotificationSubscription(foregroundSubscription);
        Notifications.removeNotificationSubscription(responseSubscription);
      };
    }
  }, [isInitialized]);

  const initializePushNotifications = async () => {
    try {
      if (!currentProfile?.id || !isAuthenticated) {
        console.log('⚠️ PushNotificationContext: No authenticated profile, skipping initialization');
        return;
      }

      console.log('📲 PushNotificationContext: Initializing for staff:', currentProfile.id);

      // Get Firebase UID for the current staff member
      const firebaseUid = await firebaseUidService.getFirebaseUid(currentProfile.id);
      
      if (!firebaseUid) {
        console.error('❌ PushNotificationContext: No Firebase UID found for staff:', currentProfile.id);
        setIsInitialized(false);
        return;
      }

      console.log('📲 PushNotificationContext: Using Firebase UID for token registration:', firebaseUid);

      const success = await pushNotificationService.initialize(firebaseUid);      if (success) {
        setIsInitialized(true);
        setIsPermissionDenied(false);
        
        // Get current token
        const token = pushNotificationService.getCurrentPushToken();
        setPushToken(token);
        
        // Get permission status
        const status = pushNotificationService.getPermissionStatus();
        setPermissionStatus(status);
        
        console.log('✅ PushNotificationContext: Initialized successfully');
      } else {
        console.warn('⚠️ PushNotificationContext: Initialization failed');
        setIsInitialized(false);
        
        // Check if it's a permission issue
        const enabled = await pushNotificationService.areNotificationsEnabled();
        setIsPermissionDenied(!enabled);
      }

    } catch (error) {
      console.error('❌ PushNotificationContext: Initialization error:', error);
      setIsInitialized(false);
    }
  };

  const cleanupPushNotifications = async () => {
    try {
      console.log('🧹 PushNotificationContext: Cleaning up...');
      
      if (currentProfile?.id) {
        // Get Firebase UID for cleanup
        const firebaseUid = await firebaseUidService.getFirebaseUid(currentProfile.id);
        if (firebaseUid) {
          await pushNotificationService.enhancedCleanup(firebaseUid);
        }
      }
      
      setIsInitialized(false);
      setPushToken(null);
      setPermissionStatus(null);
      setIsPermissionDenied(false);
      
      console.log('✅ PushNotificationContext: Cleanup complete');

    } catch (error) {
      console.error('❌ PushNotificationContext: Cleanup error:', error);
    }
  };

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await pushNotificationService.requestPermissions();
      
      if (granted) {
        setIsPermissionDenied(false);
        
        // Try to initialize if we have a profile
        if (currentProfile?.id) {
          await initializePushNotifications();
        }
        
        return true;
      } else {
        setIsPermissionDenied(true);
        return false;
      }

    } catch (error) {
      console.error('❌ PushNotificationContext: Permission request error:', error);
      return false;
    }
  }, [currentProfile?.id]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      if (!isInitialized) {
        console.warn('⚠️ PushNotificationContext: Not initialized, cannot refresh token');
        return;
      }

      const newToken = await pushNotificationService.refreshPushToken();
      setPushToken(newToken);
      
      console.log('✅ PushNotificationContext: Token refreshed');

    } catch (error) {
      console.error('❌ PushNotificationContext: Token refresh error:', error);
    }
  }, [isInitialized]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      await pushNotificationService.sendTestNotification();
      console.log('✅ PushNotificationContext: Test notification sent');

    } catch (error) {
      console.error('❌ PushNotificationContext: Test notification error:', error);
    }
  }, []);

  const areNotificationsEnabled = useCallback(async (): Promise<boolean> => {
    try {
      return await pushNotificationService.areNotificationsEnabled();
    } catch (error) {
      console.error('❌ PushNotificationContext: Permission check error:', error);
      return false;
    }
  }, []);

  const checkPermissionStatus = useCallback(async (): Promise<void> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      setIsPermissionDenied(status !== 'granted');
    } catch (error) {
      console.error('❌ PushNotificationContext: Permission status check error:', error);
    }
  }, []);

  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('📱 PushNotificationContext: Notification received:', notification);
    
    const data = notification.request.content.data as NotificationData;
    
    // Handle different notification types
    switch (data?.type) {
      case 'emergency':
        // Show urgent alert for emergency notifications
        Alert.alert(
          '🚨 Emergency Alert',
          notification.request.content.body || 'Emergency notification received',
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'Respond', onPress: () => handleNotificationAction(data) }
          ]
        );
        break;
      
      case 'job_assignment':
        // You could show a custom in-app notification here
        console.log('📋 Job assignment notification received:', data?.jobId);
        break;
      
      default:
        console.log('📱 General notification received');
    }
  }, []);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('📱 PushNotificationContext: Notification tapped:', response);
    
    const data = response.notification.request.content.data as NotificationData;
    const actionIdentifier = response.actionIdentifier;
    
    // Handle action buttons
    if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      handleNotificationAction(data, actionIdentifier);
    } else {
      // Handle default tap
      handleNotificationTap(data);
    }
  }, []);

  const handleNotificationAction = useCallback((data: NotificationData, actionIdentifier?: string) => {
    console.log('🎯 PushNotificationContext: Handling notification action:', actionIdentifier, data);
    
    switch (actionIdentifier) {
      case 'accept':
        if (data?.jobId) {
          // Navigate to job acceptance
          router.push(`/jobs/${data.jobId}/accept`);
        }
        break;
      
      case 'decline':
        if (data?.jobId) {
          // Navigate to job decline
          router.push(`/jobs/${data.jobId}/decline`);
        }
        break;
      
      case 'respond':
        if (data?.type === 'emergency') {
          // Handle emergency response - navigate to main tabs for now
          router.push('/(tabs)/jobs');
        } else if (data?.jobId) {
          router.push(`/(tabs)/jobs` as any);
        }
        break;
      
      case 'call_support':
        // Handle support call
        Alert.alert(
          'Call Support',
          'Would you like to call support now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call', onPress: () => {
              // Implement call functionality
              console.log('📞 Calling support...');
            }}
          ]
        );
        break;
      
      default:
        handleNotificationTap(data);
    }
  }, []);

  const handleNotificationTap = useCallback((data: NotificationData) => {
    console.log('🎯 PushNotificationContext: Handling notification tap:', data);
    
    // Handle deep linking based on notification data
    if (data?.deepLink) {
      router.push(data.deepLink as any);
    } else if (data?.type === 'job_assignment' && data?.jobId) {
      router.push('/(tabs)/jobs' as any);
    } else if (data?.type === 'emergency') {
      router.push('/(tabs)/jobs' as any);
    } else {
      // Navigate to notifications/dashboard
      router.push('/(tabs)/' as any);
    }
  }, []);

  const value: PushNotificationContextType = {
    permissionStatus,
    isInitialized,
    isPermissionDenied,
    pushToken,
    requestPermissions,
    refreshToken,
    sendTestNotification,
    areNotificationsEnabled,
    checkPermissionStatus,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

export default PushNotificationContext;
