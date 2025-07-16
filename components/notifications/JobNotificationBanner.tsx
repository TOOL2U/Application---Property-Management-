/**
 * Job Notification Banner
 * Shows a slide-down banner notification for new job assignments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  ChevronDown,
} from 'lucide-react-native';
import type { JobNotificationData } from '@/services/realTimeJobNotificationService';

const { width } = Dimensions.get('window');

interface JobNotificationBannerProps {
  visible: boolean;
  job: JobNotificationData | null;
  onAccept: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  onDismiss: () => void;
  autoHideDelay?: number; // Auto-hide after X milliseconds
}

export default function JobNotificationBanner({
  visible,
  job,
  onAccept,
  onViewDetails,
  onDismiss,
  autoHideDelay = 8000, // 8 seconds default
}: JobNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(-200));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (visible && job) {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto-hide after delay
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: -200,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, job, autoHideDelay]);

  const handleDismiss = () => {
    Animated.spring(slideAnim, {
      toValue: -200,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onDismiss();
      setIsExpanded(false);
    });
  };

  const handleAccept = () => {
    if (job) {
      onAccept(job.jobId);
      handleDismiss();
    }
  };

  const handleViewDetails = () => {
    if (job) {
      onViewDetails(job.jobId);
      handleDismiss();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (!job) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.95)', 'rgba(22, 33, 62, 0.95)']}
        style={styles.bannerGradient}
      >
        {/* Main Banner Content */}
        <TouchableOpacity 
          style={styles.bannerContent} 
          onPress={toggleExpanded}
          activeOpacity={0.8}
        >
          <View style={styles.bannerHeader}>
            <View style={styles.iconSection}>
              <Bell size={20} color="#8b5cf6" />
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(job.priority) }]} />
            </View>
            
            <View style={styles.contentSection}>
              <Text style={styles.title} numberOfLines={1}>
                New Job: {job.title}
              </Text>
              <View style={styles.subtitle}>
                <MapPin size={14} color="#9ca3af" />
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {job.propertyName}
                </Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.quickAcceptButton}
                onPress={handleAccept}
              >
                <CheckCircle size={18} color="#22c55e" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.expandButton}
                onPress={toggleExpanded}
              >
                <Animated.View
                  style={{
                    transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                  }}
                >
                  <ChevronDown size={18} color="#9ca3af" />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.jobDetails}>
              <View style={styles.scheduleRow}>
                <Clock size={16} color="#8b5cf6" />
                <Text style={styles.scheduleText}>
                  Scheduled: {formatDate(job.scheduledDate)}
                </Text>
              </View>
              
              {job.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {job.description}
                </Text>
              )}
            </View>

            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewDetails}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptActionButton]}
                onPress={handleAccept}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.acceptButtonGradient}
                >
                  <CheckCircle size={16} color="#ffffff" />
                  <Text style={styles.acceptActionButtonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dismiss Button */}
        <TouchableOpacity 
          style={styles.dismissButton} 
          onPress={handleDismiss}
        >
          <XCircle size={16} color="#9ca3af" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  bannerGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bannerContent: {
    padding: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSection: {
    position: 'relative',
    marginRight: 12,
  },
  priorityDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  contentSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAcceptButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  expandButton: {
    padding: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobDetails: {
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  acceptActionButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    width: '100%',
  },
  acceptActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
