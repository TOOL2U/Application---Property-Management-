/**
 * Job Reminder Response Banner
 * Shows when user taps a job reminder notification
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Clock,
  MapPin,
  Brain,
  CheckCircle,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import { useJobReminderNotifications } from '@/hooks/useSmartJobReminders';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface JobReminderResponseBannerProps {
  onNavigateToJob?: (jobId: string) => void;
  onOpenFOAChat?: (jobId: string, message: string) => void;
}

export default function JobReminderResponseBanner({
  onNavigateToJob,
  onOpenFOAChat,
}: JobReminderResponseBannerProps) {
  const { lastNotificationResponse, clearLastResponse } = useJobReminderNotifications();
  const navigation = useNavigation();
  
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));

  // Show banner when notification response is received
  useEffect(() => {
    if (lastNotificationResponse) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [lastNotificationResponse]);

  // Handle dismiss
  const handleDismiss = () => {
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setVisible(false);
      clearLastResponse();
    });
  };

  // Navigate to job
  const handleNavigateToJob = () => {
    if (lastNotificationResponse?.jobId) {
      handleDismiss();
      
      // Use provided callback or navigate directly
      if (onNavigateToJob) {
        onNavigateToJob(lastNotificationResponse.jobId);
      } else {
        // Default navigation - adjust route as needed
        // navigation.navigate('/(tabs)/jobs', { jobId: lastNotificationResponse.jobId });
        console.log('Navigate to job:', lastNotificationResponse.jobId);
      }
    }
  };

  // Open FOA chat with preparation message
  const handleOpenFOAChat = () => {
    if (lastNotificationResponse?.jobId && lastNotificationResponse?.foaMessage) {
      handleDismiss();
      
      if (onOpenFOAChat) {
        onOpenFOAChat(lastNotificationResponse.jobId, lastNotificationResponse.foaMessage);
      } else {
        // Default navigation to FOA chat
        // navigation.navigate('/(tabs)/foa-chat', { jobId: lastNotificationResponse.jobId });
        console.log('Open FOA chat for job:', lastNotificationResponse.jobId);
      }
    }
  };

  if (!visible || !lastNotificationResponse) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={handleDismiss}
        />
        
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            style={styles.banner}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Clock size={24} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Job Starting Soon!</Text>
                <Text style={styles.subtitle}>
                  Your FOA assistant has preparation tips ready
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleDismiss}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* FOA Message */}
            {lastNotificationResponse.foaMessage && (
              <View style={styles.foaMessageContainer}>
                <View style={styles.foaIcon}>
                  <Brain size={16} color="#6366f1" />
                </View>
                <Text style={styles.foaMessage}>
                  {lastNotificationResponse.foaMessage}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleNavigateToJob}
              >
                <MapPin size={18} color="#6366f1" />
                <Text style={styles.primaryActionText}>View Job</Text>
                <ArrowRight size={16} color="#6366f1" />
              </TouchableOpacity>

              {lastNotificationResponse.foaMessage && (
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={handleOpenFOAChat}
                >
                  <Brain size={18} color="#ffffff" />
                  <Text style={styles.secondaryActionText}>Chat with FOA</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Time indicator */}
            <View style={styles.timeIndicator}>
              <Text style={styles.timeText}>
                📱 Reminder sent at {lastNotificationResponse.timestamp?.toLocaleTimeString()}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerContainer: {
    margin: 16,
    marginBottom: 60, // Account for tab bar
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  banner: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  foaMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  foaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  foaMessage: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  timeIndicator: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
