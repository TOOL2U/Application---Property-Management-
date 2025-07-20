/**
 * Job Notification Banner Component
 * Shows in-app notification when new jobs are assigned
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useJobContext } from '@/contexts/JobContext';
import { shouldShowNotification } from '@/utils/notificationDedup';
import NotificationClickPopup from '@/components/notifications/NotificationClickPopup';
import { showNotificationClickFeedback } from '@/utils/notificationClickHelpers';

interface JobNotificationBannerProps {
  jobId?: string;
  message?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const JobNotificationBanner: React.FC<JobNotificationBannerProps> = ({
  jobId,
  message,
  onDismiss,
  autoHide = true,
  duration = 5000,
}) => {
  const router = useRouter();
  const { markNotificationAsRead } = useJobContext();
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (jobId && message) {
      // Check if we should show this notification (deduplication)
      if (shouldShowNotification(jobId, 'staff-id', 'banner')) {
        setVisible(true);
        // Slide in animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto hide after duration
        if (autoHide) {
          setTimeout(() => {
            handleDismiss();
          }, duration);
        }
      }
    }
  }, [jobId, message]);

  const handleDismiss = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (jobId) {
      // Mark as read
      markNotificationAsRead?.(jobId);
      
      // Show immediate feedback popup
      showNotificationClickFeedback(
        {
          id: jobId,
          title: "New Job Assignment",
          message: message || "You have a new job assignment. Check your jobs list for details.",
          type: "job_assignment",
          jobId: jobId,
          timestamp: new Date(),
        },
        (jobId) => {
          router.push(`/jobs/${jobId}`);
        }
      );
      
      handleDismiss();
    }
  };

  const handleViewDetails = (notificationId: string) => {
    router.push(`/jobs/${notificationId}`);
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  if (!visible || !message) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.banner} onPress={handlePress}>
          <View style={styles.iconContainer}>
            <Ionicons name="briefcase" size={24} color="#4A90E2" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>New Job Assignment</Text>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>

      {/* Notification Click Popup */}
      <NotificationClickPopup
        visible={showPopup}
        notification={jobId ? {
          id: jobId,
          title: "New Job Assignment",
          message: message || "You have a new job assignment",
          type: "job_assignment",
          priority: "medium",
          timestamp: new Date(),
          jobId: jobId,
        } : null}
        onClose={handleClosePopup}
        onViewDetails={handleViewDetails}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default JobNotificationBanner;