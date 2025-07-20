/**
 * Notification Click Helper
 * Provides immediate feedback when notifications are clicked
 */

import { Alert } from 'react-native';

interface NotificationClickData {
  id: string;
  title: string;
  message: string;
  type: string;
  jobId?: string;
  timestamp?: Date;
}

export const showNotificationClickFeedback = (
  notification: NotificationClickData,
  onViewDetails?: (jobId: string) => void
) => {
  const timestamp = notification.timestamp ? 
    notification.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : 'Now';

  const getNotificationEmoji = (type: string) => {
    switch (type) {
      case 'job_assigned':
      case 'job_assignment':
        return '💼';
      case 'job_updated':
        return '🔄';
      case 'system':
        return '⚙️';
      case 'reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const emoji = getNotificationEmoji(notification.type);
  const title = `${emoji} ${notification.title}`;
  const message = `${notification.message}\n\nReceived at ${timestamp}`;

  if (notification.jobId && onViewDetails) {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Dismiss',
          style: 'cancel',
        },
        {
          text: 'View Details',
          onPress: () => onViewDetails(notification.jobId!),
        },
      ],
      { cancelable: true }
    );
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }
};

export const showJobAssignmentAlert = (jobTitle: string, propertyName: string) => {
  Alert.alert(
    '💼 New Job Assignment',
    `You have been assigned a new job:\n\n${jobTitle}\nProperty: ${propertyName}\n\nThe job details have been added to your job list.`,
    [
      {
        text: 'Got it!',
        style: 'default',
      },
    ],
    { cancelable: true }
  );
};

export const showQuickNotificationFeedback = (message: string) => {
  Alert.alert(
    '🔔 Notification',
    message,
    [
      {
        text: 'OK',
        style: 'default',
      },
    ],
    { cancelable: true }
  );
};
