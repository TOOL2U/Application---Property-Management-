import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'task_assigned' | 'task_updated' | 'task_cancelled' | 'urgent_task' | 'reminder';
  taskId: string;
  title: string;
  body: string;
  data?: any;
}

export function useNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      // Skip push notifications for web platform during development
      if (Platform.OS === 'web') {
        console.log('⚠️ Skipping push token registration for web platform');
        return null;
      }

      // Skip push notifications for non-mobile platforms
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('⚠️ Push notifications not supported on platform:', Platform.OS);
        return null;
      }

      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions with error handling
      let finalStatus: string;
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;

        // Request permissions if not granted
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (permissionError) {
        console.error('Error requesting notification permissions:', permissionError);
        setError('Failed to request push notification permissions');
        return null;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        setError('Push notification permissions not granted');
        return null;
      }

      // Get push token with proper error handling
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
                         Constants.easConfig?.projectId ??
                         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

        if (!projectId) {
          console.log('No project ID found, using demo token');
          return 'demo-push-token-' + Math.random().toString(36).substr(2, 9);
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('Expo push token:', token.data);

        // Store token locally
        await AsyncStorage.setItem('expoPushToken', token.data);

        return token.data;
      } catch (tokenError) {
        console.error('Error getting Expo push token:', tokenError);
        setError('Failed to get push token');
        return null;
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setError('Failed to register for push notifications');
      return null;
    }
  };

  // Update user's push token in Firestore
  const updateUserPushToken = async (token: string, userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: token,
        deviceInfo: {
          platform: Platform.OS,
          deviceId: Constants.deviceId || 'unknown',
          appVersion: Constants.expoConfig?.version || '1.0.0',
        },
        lastTokenUpdate: serverTimestamp(),
      });
      console.log('Push token updated in Firestore');
    } catch (error) {
      console.error('Error updating push token:', error);
      // For demo, continue without Firestore update
    }
  };

  // Send local notification (for testing)
  const sendLocalNotification = async (notificationData: NotificationData) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            type: notificationData.type,
            taskId: notificationData.taskId,
            ...notificationData.data,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  // Handle notification received while app is running
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);
    
    // You can add custom logic here based on notification type
    const notificationType = notification.request.content.data?.type;
    
    switch (notificationType) {
      case 'task_assigned':
        // Handle new task assignment
        console.log('New task assigned:', notification.request.content.data?.taskId);
        break;
      case 'task_updated':
        // Handle task update
        console.log('Task updated:', notification.request.content.data?.taskId);
        break;
      case 'urgent_task':
        // Handle urgent task
        console.log('Urgent task:', notification.request.content.data?.taskId);
        break;
    }
  };

  // Handle notification tap/interaction
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification tapped:', response);
    
    const notificationData = response.notification.request.content.data;
    
    // Navigate to specific screen based on notification type
    if (notificationData?.type === 'task_assigned' || notificationData?.type === 'task_updated') {
      // You can use navigation here to go to specific task
      console.log('Navigate to task:', notificationData.taskId);
    }
  };

  // Initialize notifications
  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        // Register for push notifications
        const token = await registerForPushNotifications();
        
        if (isMounted && token) {
          setExpoPushToken(token);
          
          // Update user's push token in Firestore if userId is available
          if (userId) {
            await updateUserPushToken(token, userId);
          }
        }

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(
          handleNotificationReceived
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );

      } catch (error) {
        console.error('Error initializing notifications:', error);
        if (isMounted) {
          setError('Failed to initialize notifications');
        }
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);

  // Clear notification badge
  const clearBadge = async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  };

  // Cancel all notifications
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    error,
    sendLocalNotification,
    clearBadge,
    cancelAllNotifications,
    registerForPushNotifications,
  };
}
