/**
 * App Notification Context
 * Manages general app notifications and display in the notification modal
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePINAuth } from './PINAuthContext';
import { notificationDisplayService, AppNotification } from '@/services/notificationDisplayService';

interface AppNotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isModalVisible: boolean;
  showNotificationModal: () => void;
  hideNotificationModal: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => void;
}

const AppNotificationContext = createContext<AppNotificationContextType | undefined>(undefined);

export const useAppNotifications = () => {
  const context = useContext(AppNotificationContext);
  if (!context) {
    throw new Error('useAppNotifications must be used within an AppNotificationProvider');
  }
  return context;
};

interface AppNotificationProviderProps {
  children: React.ReactNode;
}

export const AppNotificationProvider: React.FC<AppNotificationProviderProps> = ({ children }) => {
  const { currentProfile } = usePINAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to notifications when profile changes or refresh is triggered
  useEffect(() => {
    if (!currentProfile?.id) {
      setNotifications([]);
      return;
    }

    console.log('🔔 AppNotificationContext: Setting up notifications for:', currentProfile.id);
    setIsLoading(true);

    const unsubscribe = notificationDisplayService.subscribeToNotifications(
      currentProfile.id,
      (newNotifications) => {
        setNotifications(newNotifications);
        setIsLoading(false);
        
        console.log('🔔 AppNotificationContext: Updated with', newNotifications.length, 'notifications');
      }
    );

    return () => {
      console.log('🔇 AppNotificationContext: Cleaning up notification subscription');
      unsubscribe();
    };
  }, [currentProfile?.id, refreshTrigger]);

  const showNotificationModal = useCallback(() => {
    console.log('📱 AppNotificationContext: Showing notification modal');
    setIsModalVisible(true);
  }, []);

  const hideNotificationModal = useCallback(() => {
    console.log('📱 AppNotificationContext: Hiding notification modal');
    setIsModalVisible(false);
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationDisplayService.markAsRead(notificationId);
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('❌ AppNotificationContext: Failed to mark as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await notificationDisplayService.markMultipleAsRead(unreadIds);
      
      // Update local state immediately
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      console.log('✅ AppNotificationContext: Marked all notifications as read');
    } catch (error) {
      console.error('❌ AppNotificationContext: Failed to mark all as read:', error);
    }
  }, [notifications]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      if (!currentProfile?.id) {
        console.error('❌ AppNotificationContext: No current profile for delete operation');
        return;
      }

      await notificationDisplayService.deleteAllNotifications(currentProfile.id);
      
      // Update local state immediately
      setNotifications([]);
      
      console.log('✅ AppNotificationContext: All notifications deleted');
    } catch (error) {
      console.error('❌ AppNotificationContext: Failed to delete all notifications:', error);
    }
  }, [currentProfile?.id]);

  const refreshNotifications = useCallback(() => {
    // Force a refresh by incrementing the trigger
    if (currentProfile?.id) {
      console.log('🔄 AppNotificationContext: Manually refreshing notifications');
      setRefreshTrigger(prev => prev + 1);
    }
  }, [currentProfile?.id]);

  const value: AppNotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    isModalVisible,
    showNotificationModal,
    hideNotificationModal,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
    refreshNotifications,
  };

  return (
    <AppNotificationContext.Provider value={value}>
      {children}
    </AppNotificationContext.Provider>
  );
};
