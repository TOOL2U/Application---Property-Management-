import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface JobDetails {
  id: string;
  title: string;
  propertyName: string;
  propertyAddress: string;
  serviceType: 'cleaning' | 'gardening' | 'maintenance' | 'pool' | 'security' | 'inspection';
  scheduledDate: string;
  scheduledTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientName: string;
  clientPhone?: string;
  notes?: string;
  estimatedDuration: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface JobHistoryItem {
  id: string;
  jobId: string;
  action: 'accepted' | 'declined' | 'completed';
  timestamp: string;
  jobDetails: JobDetails;
}

export function useJobNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<JobDetails | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([]);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Temporarily disable push notifications for web to avoid VAPID errors
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync().then(token => {
        setExpoPushToken(token || null);
      }).catch(error => {
        console.error('Error getting push token:', error);
      });
    }

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      handleIncomingNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // Replace with your actual project ID
        })).data;
        console.log('Expo push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const handleIncomingNotification = (notification: any) => {
    const { data } = notification.request.content;
    
    if (data?.type === 'job_assignment') {
      const jobDetails: JobDetails = {
        id: data.jobId || 'mock-job-1',
        title: data.title || 'Pool Maintenance Service',
        propertyName: data.propertyName || 'Sunset Villa Resort',
        propertyAddress: data.propertyAddress || '123 Ocean Drive, Miami Beach, FL',
        serviceType: data.serviceType || 'pool',
        scheduledDate: data.scheduledDate || new Date().toISOString(),
        scheduledTime: data.scheduledTime || '10:00 AM',
        priority: data.priority || 'high',
        clientName: data.clientName || 'John Smith',
        clientPhone: data.clientPhone || '+1 (555) 123-4567',
        notes: data.notes || 'Please check pool chemical levels and clean filters.',
        estimatedDuration: data.estimatedDuration || '2 hours',
        location: {
          latitude: data.latitude || 25.7617,
          longitude: data.longitude || -80.1918,
        },
      };

      setPendingJob(jobDetails);
      setShowJobModal(true);
    }
  };

  const handleNotificationResponse = (response: any) => {
    const { data } = response.notification.request.content;
    
    if (data?.type === 'job_assignment') {
      // Handle notification tap - could navigate to specific screen
      console.log('User tapped job notification:', data.jobId);
    }
  };

  const acceptJob = (jobId: string) => {
    if (pendingJob) {
      const historyItem: JobHistoryItem = {
        id: Date.now().toString(),
        jobId,
        action: 'accepted',
        timestamp: new Date().toISOString(),
        jobDetails: pendingJob,
      };

      setJobHistory(prev => [historyItem, ...prev]);
      console.log(`Job ${jobId} accepted at:`, historyItem.timestamp);
      
      // Here you would typically make an API call to update job status
      // updateJobStatus(jobId, 'accepted');
    }

    setPendingJob(null);
    setShowJobModal(false);
  };

  const declineJob = (jobId: string) => {
    if (pendingJob) {
      const historyItem: JobHistoryItem = {
        id: Date.now().toString(),
        jobId,
        action: 'declined',
        timestamp: new Date().toISOString(),
        jobDetails: pendingJob,
      };

      setJobHistory(prev => [historyItem, ...prev]);
      console.log(`Job ${jobId} declined at:`, historyItem.timestamp);
      
      // Here you would typically make an API call to update job status
      // updateJobStatus(jobId, 'declined');
    }

    setPendingJob(null);
    setShowJobModal(false);
  };

  const simulateJobNotification = async () => {
    if (!expoPushToken) {
      console.log('No push token available');
      return;
    }

    // Simulate receiving a job notification
    const mockJobData = {
      type: 'job_assignment',
      jobId: `job-${Date.now()}`,
      title: 'Emergency Pool Cleaning',
      propertyName: 'Ocean View Resort',
      propertyAddress: '456 Beachfront Ave, Miami Beach, FL',
      serviceType: 'pool',
      scheduledDate: new Date().toISOString(),
      scheduledTime: '2:00 PM',
      priority: 'urgent',
      clientName: 'Resort Manager',
      clientPhone: '+1 (555) 987-6543',
      notes: 'Pool has algae buildup, needs immediate attention.',
      estimatedDuration: '3 hours',
      latitude: 25.7617,
      longitude: -80.1918,
    };

    // Create local notification for testing
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Job Assignment',
        body: `${mockJobData.title} at ${mockJobData.propertyName}`,
        data: mockJobData,
        sound: true,
      },
      trigger: { seconds: 1 },
    });
  };

  return {
    expoPushToken,
    pendingJob,
    showJobModal,
    jobHistory,
    acceptJob,
    declineJob,
    setShowJobModal,
    simulateJobNotification,
  };
}
