/**
 * Smart Job Reminders Integration Test
 * Complete implementation test for FOA-powered job reminders
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Clock, Brain, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react-native';
import SmartJobReminderBanner from '@/components/jobs/SmartJobReminderBanner';
import JobReminderResponseBanner from '@/components/notifications/JobReminderResponseBanner';
import { useSmartJobReminders } from '@/hooks/useSmartJobReminders';
import { JobData } from '@/types/jobData';

// Mock job data for testing
const mockJob: JobData = {
  id: 'test-job-reminder-123',
  title: 'Villa Cleaning - Ocean View Resort',
  description: 'Complete cleaning service including pool area and guest rooms',
  jobType: 'cleaning',
  priority: 'high',
  status: 'assigned',
  scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  scheduledStartTime: '14:00',
  estimatedDuration: 120,
  assignedStaffId: 'current-staff-id',
  userId: 'current-staff-id',
  propertyRef: {
    id: 'property-123',
    name: 'Ocean View Resort - Villa 1',
    address: '123 Ocean Drive, Paradise Island',
    coordinates: {
      latitude: 25.7617,
      longitude: -80.1918,
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function SmartJobRemindersTestIntegration() {
  const {
    isInitialized,
    error,
    scheduledReminders,
    scheduleReminder,
    testReminder,
    cancelJobReminders,
  } = useSmartJobReminders({ testMode: false });

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleScheduleReminder = async () => {
    try {
      const success = await scheduleReminder(mockJob);
      if (success) {
        addTestResult('✅ 1-hour reminder scheduled successfully');
        Alert.alert(
          'Success!',
          'Reminder scheduled for 1 hour before job start. You\'ll receive FOA preparation tips.',
          [{ text: 'OK' }]
        );
      } else {
        addTestResult('❌ Failed to schedule reminder');
        Alert.alert('Error', error || 'Failed to schedule reminder');
      }
    } catch (err) {
      addTestResult('❌ Exception scheduling reminder');
      Alert.alert('Error', 'Exception occurred while scheduling reminder');
    }
  };

  const handleTestReminder = async () => {
    try {
      const success = await testReminder(mockJob);
      if (success) {
        addTestResult('🧪 Test reminder scheduled for 2 minutes');
        Alert.alert(
          'Test Reminder Scheduled!',
          'Check your notifications in 2 minutes. The notification will include FOA preparation tips.',
          [{ text: 'OK' }]
        );
      } else {
        addTestResult('❌ Failed to schedule test reminder');
        Alert.alert('Error', error || 'Failed to schedule test reminder');
      }
    } catch (err) {
      addTestResult('❌ Exception scheduling test reminder');
      Alert.alert('Error', 'Exception occurred while scheduling test reminder');
    }
  };

  const handleCancelReminders = async () => {
    try {
      await cancelJobReminders(mockJob.id);
      addTestResult('🗑️ Cancelled all reminders for job');
      Alert.alert('Success', 'All reminders for this job have been cancelled');
    } catch (err) {
      addTestResult('❌ Failed to cancel reminders');
      Alert.alert('Error', 'Failed to cancel reminders');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Brain size={32} color="#6366f1" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Smart Job Reminders</Text>
            <Text style={styles.subtitle}>FOA-Powered Job Preparation</Text>
          </View>
          <View style={styles.statusIndicator}>
            {isInitialized ? (
              <CheckCircle size={24} color="#10b981" />
            ) : (
              <AlertTriangle size={24} color="#f59e0b" />
            )}
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Service Status</Text>
          <Text style={[styles.statusText, { color: isInitialized ? '#10b981' : '#ef4444' }]}>
            {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
          </Text>
          {error && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}
          <Text style={styles.reminderCount}>
            Active Reminders: {scheduledReminders.length}
          </Text>
        </View>

        {/* Smart Reminder Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Reminder Banner</Text>
          <SmartJobReminderBanner
            job={mockJob}
            onScheduleReminder={() => addTestResult('📱 Reminder banner - Schedule pressed')}
            onTestReminder={() => addTestResult('🧪 Reminder banner - Test pressed')}
          />
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.primaryButton]}
            onPress={handleScheduleReminder}
            disabled={!isInitialized}
          >
            <Clock size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Schedule 1-Hour Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.secondaryButton]}
            onPress={handleTestReminder}
            disabled={!isInitialized}
          >
            <PlayCircle size={18} color="#6366f1" />
            <Text style={[styles.buttonText, { color: '#6366f1' }]}>Test Reminder (2 min)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.warningButton]}
            onPress={handleCancelReminders}
            disabled={!isInitialized}
          >
            <AlertTriangle size={18} color="#f59e0b" />
            <Text style={[styles.buttonText, { color: '#f59e0b' }]}>Cancel All Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Implementation Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Implementation Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>1-hour pre-job notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>FOA AI preparation tips</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Safety reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Property context awareness</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Firestore reminder persistence</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Test mode (2-minute delay)</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Notification tap handling</Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.featureText}>Auto job assignment listening</Text>
            </View>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearTestResults}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testResults}>
            {testResults.length === 0 ? (
              <Text style={styles.noResults}>No test results yet</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.testResult}>
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>

        {/* Usage Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Instructions</Text>
          <View style={styles.instructions}>
            <Text style={styles.instructionStep}>
              1. Tap "Schedule 1-Hour Reminder" to schedule a normal reminder
            </Text>
            <Text style={styles.instructionStep}>
              2. Tap "Test Reminder (2 min)" to test with immediate notification
            </Text>
            <Text style={styles.instructionStep}>
              3. Wait for notification to appear in notification tray
            </Text>
            <Text style={styles.instructionStep}>
              4. Tap the notification to see the response banner
            </Text>
            <Text style={styles.instructionStep}>
              5. Verify FOA preparation tips are included
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Job Reminder Response Banner */}
      <JobReminderResponseBanner
        onNavigateToJob={(jobId) => {
          addTestResult(`🧭 Navigate to job: ${jobId}`);
          Alert.alert('Navigation', `Would navigate to job: ${jobId}`);
        }}
        onOpenFOAChat={(jobId, message) => {
          addTestResult(`💬 Open FOA chat: ${jobId}`);
          Alert.alert('FOA Chat', `Would open chat with: "${message}"`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicator: {
    marginLeft: 12,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 4,
  },
  reminderCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  warningButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  testResults: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  noResults: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  testResult: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  clearButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  instructions: {
    gap: 8,
  },
  instructionStep: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
