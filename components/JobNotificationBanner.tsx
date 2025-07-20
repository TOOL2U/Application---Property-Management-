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
      // Mark as read and navigate to job details
      markNotificationAsRead?.(jobId);
      router.push(`/jobs/${jobId}`);
      handleDismiss();
    }
  };

  if (!visible || !message) {
    return null;
  }

  return (
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