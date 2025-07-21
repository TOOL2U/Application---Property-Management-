/**
 * Notification Click Popup
 * Shows a message popup when notifications are clicked
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  CheckCircle, 
  Bell, 
  X, 
  Briefcase,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface NotificationClickPopupProps {
  visible: boolean;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    timestamp: Date;
    jobId?: string;
  } | null;
  onClose: () => void;
  onViewDetails?: (notificationId: string) => void;
}

export default function NotificationClickPopup({
  visible,
  notification,
  onClose,
  onViewDetails,
}: NotificationClickPopupProps) {
  const [slideAnim] = useState(new Animated.Value(height));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && notification) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, notification]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
      case 'job_assignment':
        return <Briefcase size={24} color="#22c55e" />;
      case 'job_updated':
        return <Info size={24} color="#3b82f6" />;
      case 'system':
        return <AlertTriangle size={24} color="#f59e0b" />;
      case 'reminder':
        return <Clock size={24} color="#8b5cf6" />;
      default:
        return <Bell size={24} color="#6b7280" />;
    }
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

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = () => {
    if (notification && onViewDetails) {
      onViewDetails(notification.id);
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={handleClose}
          />
        </BlurView>
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.timestamp}>
                  {formatTimestamp(notification.timestamp)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Priority Badge */}
            {notification.priority && (
              <View style={[styles.priorityBadge, { 
                backgroundColor: `${getPriorityColor(notification.priority)}20`,
                borderColor: getPriorityColor(notification.priority),
              }]}>
                <Text style={[styles.priorityText, { 
                  color: getPriorityColor(notification.priority) 
                }]}>
                  {notification.priority.toUpperCase()} PRIORITY
                </Text>
              </View>
            )}

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{notification.message}</Text>
            </View>

            {/* Job ID Badge */}
            {notification.jobId && (
              <View style={styles.jobIdBadge}>
                <Text style={styles.jobIdText}>
                  Job #{notification.jobId.substring(0, 8)}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleClose}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>

              {notification.jobId && onViewDetails && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={handleViewDetails}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  jobIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  jobIdText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  viewButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
