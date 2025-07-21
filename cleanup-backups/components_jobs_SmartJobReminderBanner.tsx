/**
 * Smart Job Reminder Banner
 * Displays upcoming job reminders with FOA context
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Brain, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useSmartJobReminders } from '@/hooks/useSmartJobReminders';
import { JobData } from '@/types/jobData';

interface SmartJobReminderBannerProps {
  job: JobData;
  visible?: boolean;
  onScheduleReminder?: () => void;
  onTestReminder?: () => void;
}

export default function SmartJobReminderBanner({
  job,
  visible = true,
  onScheduleReminder,
  onTestReminder,
}: SmartJobReminderBannerProps) {
  const {
    isInitialized,
    error,
    scheduleReminder,
    testReminder,
    scheduledReminders,
  } = useSmartJobReminders();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasReminder, setHasReminder] = useState(false);

  // Check if this job has a scheduled reminder
  useEffect(() => {
    const hasScheduledReminder = scheduledReminders.some(
      reminder => reminder.jobId === job.id && !reminder.sent
    );
    setHasReminder(hasScheduledReminder);
  }, [scheduledReminders, job.id]);

  // Fade in animation
  useEffect(() => {
    if (visible && isInitialized) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, isInitialized]);

  // Handle schedule reminder
  const handleScheduleReminder = async () => {
    try {
      const success = await scheduleReminder(job);
      if (success) {
        Alert.alert(
          '⏰ Reminder Scheduled',
          'You\'ll receive a FOA-powered notification 1 hour before this job starts.',
          [{ text: 'OK' }]
        );
        onScheduleReminder?.();
      } else {
        Alert.alert(
          'Error',
          error || 'Failed to schedule reminder. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to schedule reminder. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle test reminder (2 minutes)
  const handleTestReminder = async () => {
    Alert.alert(
      '🧪 Test Reminder',
      'This will send a test notification in 2 minutes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            try {
              const success = await testReminder(job);
              if (success) {
                Alert.alert(
                  '✅ Test Scheduled',
                  'Check your notifications in 2 minutes!',
                  [{ text: 'OK' }]
                );
                onTestReminder?.();
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to schedule test reminder');
            }
          },
        },
      ]
    );
  };

  if (!visible || !isInitialized) {
    return null;
  }

  // Don't show for completed jobs
  if (job.status === 'completed' || job.status === 'cancelled') {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={hasReminder ? ['#10b981', '#059669'] : ['#3b82f6', '#1d4ed8']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {hasReminder ? (
                <CheckCircle size={24} color="#ffffff" />
              ) : (
                <Clock size={24} color="#ffffff" />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {hasReminder ? 'Reminder Active' : 'Smart Job Reminder'}
              </Text>
              <Text style={styles.subtitle}>
                {hasReminder
                  ? 'FOA will remind you 1 hour before this job'
                  : 'Get AI-powered preparation tips before your job starts'}
              </Text>
            </View>
            <View style={styles.foaIcon}>
              <Brain size={20} color="#ffffff" />
            </View>
          </View>

          {!hasReminder && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleScheduleReminder}
              >
                <Clock size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Schedule Reminder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleTestReminder}
              >
                <AlertTriangle size={16} color="#3b82f6" />
                <Text style={styles.secondaryButtonText}>Test (2 min)</Text>
              </TouchableOpacity>
            </View>
          )}

          {hasReminder && (
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderText}>
                📱 You'll receive preparation tips and safety reminders
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 16,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  foaIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  reminderInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  reminderText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
