/**
 * Job Assignment Notification Modal
 * Shows in-app notification when a new job is assigned
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Calendar,
  Briefcase,
} from 'lucide-react-native';
import type { JobNotificationData } from '@/services/realTimeJobNotificationService';
import { jobService } from '@/services/jobService';
import { usePINAuth } from "@/contexts/PINAuthContext";

const { width, height } = Dimensions.get('window');

interface JobAssignmentNotificationModalProps {
  visible: boolean;
  job: JobNotificationData | null;
  onAccept: (jobId: string) => void;
  onDecline: (jobId: string) => void;
  onDismiss: () => void;
}

export default function JobAssignmentNotificationModal({
  visible,
  job,
  onAccept,
  onDecline,
  onDismiss,
}: JobAssignmentNotificationModalProps) {
  const { currentProfile } = usePINAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));

  React.useEffect(() => {
    if (visible && job) {
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Slide out animation
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, job]);

  const handleAccept = async () => {
    if (!job || !user?.id) return;

    try {
      setIsProcessing(true);
      const response = await jobService.acceptJob({
        jobId: job.jobId,
        staffId: currentProfile?.id || '',
      });

      if (response.success) {
        onAccept(job.jobId);
        onDismiss();
      } else {
        Alert.alert('Error', response.error || 'Failed to accept job');
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    if (!job) return;

    Alert.prompt(
      'Decline Job',
      'Please provide a reason for declining this job:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              setIsProcessing(true);
              const response = await jobService.declineJob(job.jobId, user!.id, reason);

              if (response.success) {
                onDecline(job.jobId);
                onDismiss();
              } else {
                Alert.alert('Error', response.error || 'Failed to decline job');
              }
            } catch (error) {
              console.error('Error declining job:', error);
              Alert.alert('Error', 'Failed to decline job. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return <Briefcase size={24} color="#8b5cf6" />;
      case 'maintenance': return <AlertTriangle size={24} color="#8b5cf6" />;
      case 'inspection': return <CheckCircle size={24} color="#8b5cf6" />;
      default: return <Briefcase size={24} color="#8b5cf6" />;
    }
  };

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onDismiss}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Bell size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.headerTitle}>New Job Assignment</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onDismiss}
                disabled={isProcessing}
              >
                <XCircle size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Job Details */}
            <View style={styles.jobDetails}>
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleSection}>
                  {getJobTypeIcon(job.type)}
                  <Text style={styles.jobTitle}>{job.title}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.propertySection}>
                <MapPin size={18} color="#8b5cf6" />
                <Text style={styles.propertyName}>{job.propertyName}</Text>
              </View>

              <View style={styles.scheduleSection}>
                <Calendar size={18} color="#8b5cf6" />
                <Text style={styles.scheduleText}>{formatDate(job.scheduledDate)}</Text>
              </View>

              {job.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {job.description}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleDecline}
                disabled={isProcessing}
              >
                <XCircle size={20} color="#ffffff" />
                <Text style={styles.declineButtonText}>
                  {isProcessing ? 'Processing...' : 'Decline'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.acceptButtonGradient}
                >
                  <CheckCircle size={20} color="#ffffff" />
                  <Text style={styles.acceptButtonText}>
                    {isProcessing ? 'Processing...' : 'Accept Now'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Dismiss Option */}
            <TouchableOpacity 
              style={styles.dismissButton} 
              onPress={onDismiss}
              disabled={isProcessing}
            >
              <Text style={styles.dismissButtonText}>View Later</Text>
            </TouchableOpacity>
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
  modalContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  jobDetails: {
    marginBottom: 24,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  propertySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  scheduleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    marginLeft: 12,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});
