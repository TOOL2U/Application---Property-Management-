/**
 * JobNotificationBanner - In-app notification for job assignments
 * Based on technical specification notification flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useJobContext } from '@/contexts/JobContext';
import { JobNotificationData } from '@/types/jobData';
import { shadowStyles } from '@/utils/shadowUtils';

interface JobNotificationBannerProps {
  notification: JobNotificationData;
  onAccept?: () => void;
  onDecline?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function JobNotificationBanner({
  notification,
  onAccept,
  onDecline,
  onDismiss,
  autoHide = false,
  autoHideDelay = 10000, // 10 seconds
}: JobNotificationBannerProps) {
  const { respondToJob, markNotificationAsRead } = useJobContext();
  const [visible, setVisible] = useState(true);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide if enabled
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    try {
      console.log('✅ NotificationBanner: Accepting job:', notification.jobId);
      
      const success = await respondToJob({
        jobId: notification.jobId,
        accepted: true,
        responseAt: new Date().toISOString(),
        notes: 'Accepted from notification',
      });

      if (success) {
        if (notification.id) {
          await markNotificationAsRead(notification.id);
        }
        onAccept?.();
        handleDismiss();
        
        Alert.alert(
          'Job Accepted',
          `You have accepted "${notification.jobTitle}". You can view details in the Jobs tab.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to accept job. Please try again.');
      }
    } catch (error) {
      console.error('❌ NotificationBanner: Error accepting job:', error);
      Alert.alert('Error', 'Failed to accept job. Please try again.');
    }
  };

  const handleDecline = async () => {
    try {
      console.log('❌ NotificationBanner: Declining job:', notification.jobId);
      
      Alert.alert(
        'Decline Job',
        `Are you sure you want to decline "${notification.jobTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: async () => {
              const success = await respondToJob({
                jobId: notification.jobId,
                accepted: false,
                responseAt: new Date().toISOString(),
                notes: 'Declined from notification',
              });

              if (success) {
                if (notification.id) {
                  await markNotificationAsRead(notification.id);
                }
                onDecline?.();
                handleDismiss();
                
                Alert.alert(
                  'Job Declined',
                  'The job has been declined successfully.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Failed to decline job. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ NotificationBanner: Error declining job:', error);
      Alert.alert('Error', 'Failed to decline job. Please try again.');
    }
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60, // Below status bar
        left: 16,
        right: 16,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        direction="alternate"
        duration={2000}
        style={{
          backgroundColor: '#1C1F2A',
          borderRadius: 16,
          padding: 16,
          borderWidth: 2,
          borderColor: getPriorityColor(notification.priority),
          ...shadowStyles.large,
        }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons
              name={getPriorityIcon(notification.priority) as any}
              size={24}
              color={getPriorityColor(notification.priority)}
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#F1F1F1',
                fontSize: 16,
                fontWeight: '600',
                fontFamily: 'Inter_600SemiBold',
              }}>
                New Job Assignment
              </Text>
              <Text style={{
                color: getPriorityColor(notification.priority),
                fontSize: 12,
                fontWeight: '500',
                fontFamily: 'Inter_500Medium',
                textTransform: 'uppercase',
              }}>
                {notification.priority} Priority
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleDismiss}
            style={{
              padding: 4,
              borderRadius: 12,
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
            }}
          >
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Job Details */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            color: '#F1F1F1',
            fontSize: 18,
            fontWeight: '700',
            fontFamily: 'Inter_700Bold',
            marginBottom: 4,
          }}>
            {notification.jobTitle}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              fontFamily: 'Inter_400Regular',
              flex: 1,
            }}>
              {notification.propertyAddress}
            </Text>
          </View>

          {notification.scheduledStartTime && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                fontFamily: 'Inter_400Regular',
              }}>
                {new Date(notification.scheduledDate).toLocaleDateString()} at {notification.scheduledStartTime}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="timer-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              fontFamily: 'Inter_400Regular',
            }}>
              Estimated: {notification.estimatedDuration} minutes
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={handleDecline}
            style={{
              flex: 1,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderWidth: 1,
              borderColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: '#EF4444',
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter_600SemiBold',
            }}>
              Decline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAccept}
            style={{
              flex: 1,
              backgroundColor: '#C6FF00',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: '#0B0F1A',
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter_600SemiBold',
            }}>
              Accept Job
            </Text>
          </TouchableOpacity>
        </View>

        {/* Special Instructions */}
        {notification.specialInstructions && (
          <View style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: 'rgba(198, 255, 0, 0.1)',
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#C6FF00',
          }}>
            <Text style={{
              color: '#C6FF00',
              fontSize: 12,
              fontWeight: '500',
              fontFamily: 'Inter_500Medium',
              marginBottom: 4,
            }}>
              Special Instructions:
            </Text>
            <Text style={{
              color: '#F1F1F1',
              fontSize: 12,
              fontFamily: 'Inter_400Regular',
            }}>
              {notification.specialInstructions}
            </Text>
          </View>
        )}
      </Animatable.View>
    </Animated.View>
  );
}
