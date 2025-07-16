/**
 * Notification Context
 * Manages real-time job notifications and push notifications
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { realTimeJobNotificationService } from '@/services/realTimeJobNotificationService';
import { pushNotificationService } from '@/services/pushNotificationService';
import type { JobNotificationData, NotificationCallbacks } from '@/services/realTimeJobNotificationService';

export interface NotificationState {
  currentJobNotification: JobNotificationData | null;
  showModal: boolean;
  showBanner: boolean;
  notificationHistory: JobNotificationData[];
  isListening: boolean;
  pushNotificationsEnabled: boolean;
}

export interface NotificationContextType extends NotificationState {
  // Modal actions
  showJobNotificationModal: (job: JobNotificationData) => void;
  hideJobNotificationModal: () => void;
  
  // Banner actions
  showJobNotificationBanner: (job: JobNotificationData) => void;
  hideJobNotificationBanner: () => void;
  
  // Job actions
  acceptJob: (jobId: string) => void;
  declineJob: (jobId: string) => void;
  viewJobDetails: (jobId: string) => void;
  
  // Notification management
  startListening: () => void;
  stopListening: () => void;
  clearNotificationHistory: () => void;
  
  // Push notifications
  initializePushNotifications: () => Promise<boolean>;
  requestPushPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasRole } = useStaffAuth();
  const appState = useRef(AppState.currentState);

  const [state, setState] = useState<NotificationState>({
    currentJobNotification: null,
    showModal: false,
    showBanner: false,
    notificationHistory: [],
    isListening: false,
    pushNotificationsEnabled: false,
  });

  // Check if user is staff member
  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);

  useEffect(() => {
    if (isAuthenticated && user?.id && isStaffUser) {
      startListening();
      initializePushNotifications();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isAuthenticated, user?.id, isStaffUser]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isAuthenticated && user?.id && isStaffUser && !state.isListening) {
          startListening();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        // Keep listening for real-time updates but rely more on push notifications
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, user?.id, isStaffUser, state.isListening]);

  const showJobNotificationModal = (job: JobNotificationData) => {
    setState(prev => ({
      ...prev,
      currentJobNotification: job,
      showModal: true,
      showBanner: false,
      notificationHistory: [job, ...prev.notificationHistory.slice(0, 9)], // Keep last 10
    }));
  };

  const hideJobNotificationModal = () => {
    setState(prev => ({
      ...prev,
      showModal: false,
      currentJobNotification: null,
    }));
  };

  const showJobNotificationBanner = (job: JobNotificationData) => {
    setState(prev => ({
      ...prev,
      currentJobNotification: job,
      showBanner: true,
      showModal: false,
      notificationHistory: [job, ...prev.notificationHistory.slice(0, 9)], // Keep last 10
    }));
  };

  const hideJobNotificationBanner = () => {
    setState(prev => ({
      ...prev,
      showBanner: false,
      currentJobNotification: null,
    }));
  };

  const acceptJob = (jobId: string) => {
    console.log('✅ Job accepted from notification:', jobId);
    hideJobNotificationModal();
    hideJobNotificationBanner();
    
    // You can add navigation logic here if needed
    // router.push(`/jobs/${jobId}`);
  };

  const declineJob = (jobId: string) => {
    console.log('❌ Job declined from notification:', jobId);
    hideJobNotificationModal();
    hideJobNotificationBanner();
  };

  const viewJobDetails = (jobId: string) => {
    console.log('👁️ View job details from notification:', jobId);
    hideJobNotificationBanner();
    
    // You can add navigation logic here if needed
    // router.push(`/jobs/${jobId}`);
  };

  const startListening = () => {
    if (!user?.id || !isStaffUser || state.isListening) return;

    console.log('🔔 Starting notification listener for staff:', user.id);

    const callbacks: NotificationCallbacks = {
      onNewJobAssigned: (job: JobNotificationData) => {
        console.log('🆕 New job notification received:', job.title);
        
        // Show modal for urgent jobs, banner for others
        if (job.priority === 'urgent') {
          showJobNotificationModal(job);
        } else {
          showJobNotificationBanner(job);
        }
      },
      onJobUpdated: (job: JobNotificationData) => {
        console.log('📝 Job update notification:', job.title);
        // Could show a less intrusive notification for updates
      },
      onJobCancelled: (jobId: string) => {
        console.log('❌ Job cancelled notification:', jobId);
        // Could show a cancellation notification
      },
    };

    realTimeJobNotificationService.startListening(user.id, callbacks);
    
    setState(prev => ({
      ...prev,
      isListening: true,
    }));
  };

  const stopListening = () => {
    if (!user?.id) return;

    console.log('🔕 Stopping notification listener');
    realTimeJobNotificationService.stopListening(user.id);
    
    setState(prev => ({
      ...prev,
      isListening: false,
    }));
  };

  const clearNotificationHistory = () => {
    setState(prev => ({
      ...prev,
      notificationHistory: [],
    }));
  };

  const initializePushNotifications = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await pushNotificationService.initialize(user.id);
      
      setState(prev => ({
        ...prev,
        pushNotificationsEnabled: success,
      }));

      return success;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  };

  const requestPushPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      
      setState(prev => ({
        ...prev,
        pushNotificationsEnabled: granted,
      }));

      if (granted && user?.id) {
        await initializePushNotifications();
      }

      return granted;
    } catch (error) {
      console.error('❌ Failed to request push permissions:', error);
      return false;
    }
  };

  const contextValue: NotificationContextType = {
    ...state,
    showJobNotificationModal,
    hideJobNotificationModal,
    showJobNotificationBanner,
    hideJobNotificationBanner,
    acceptJob,
    declineJob,
    viewJobDetails,
    startListening,
    stopListening,
    clearNotificationHistory,
    initializePushNotifications,
    requestPushPermissions,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
