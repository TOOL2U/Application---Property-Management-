import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webhookService } from '@/services/webhookService';
import { Card } from '@/components/ui/Card';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';

export default function TestConnectionScreen() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test: string, success: boolean, data?: any, error?: string) => {
    const result = {
      id: Date.now(),
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    addTestResult('Testing webapp connection...', true);

    try {
      const response = await webhookService.testConnection();
      addTestResult('Webapp Connection Test', response.success, response.data, response.error);
    } catch (error) {
      addTestResult('Webapp Connection Test', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const testFetchBookings = async () => {
    setIsLoading(true);
    addTestResult('Testing fetch approved bookings...', true);

    try {
      const response = await webhookService.fetchApprovedBookings();
      addTestResult('Fetch Approved Bookings', response.success, response.data, response.error);
    } catch (error) {
      addTestResult('Fetch Approved Bookings', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const testFetchAssignments = async () => {
    setIsLoading(true);
    addTestResult('Testing fetch staff assignments...', true);

    try {
      // Test with a dummy staff ID
      const response = await webhookService.fetchStaffAssignments('test-staff-123');
      addTestResult('Fetch Staff Assignments', response.success, response.data, response.error);
    } catch (error) {
      addTestResult('Fetch Staff Assignments', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const testUpdateBooking = async () => {
    setIsLoading(true);
    addTestResult('Testing booking status update...', true);

    try {
      // Test with a dummy booking ID
      const response = await webhookService.updateBookingStatus('test-booking-123', 'confirmed', {
        staffId: 'test-staff-123',
        notes: 'Test booking update from mobile app',
        timeSpent: 30,
      });
      addTestResult('Update Booking Status', response.success, response.data, response.error);
    } catch (error) {
      addTestResult('Update Booking Status', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const testSync = async () => {
    setIsLoading(true);
    addTestResult('Testing webapp sync...', true);

    try {
      const response = await webhookService.syncWithWebApp({
        staffId: 'test-staff-123',
        deviceId: 'test-device-456',
        lastSyncTimestamp: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
      });
      addTestResult('Webapp Sync', response.success, response.data, response.error);
    } catch (error) {
      addTestResult('Webapp Sync', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showResultDetails = (result: any) => {
    const details = [
      `Test: ${result.test}`,
      `Status: ${result.success ? '✅ Success' : '❌ Failed'}`,
      `Time: ${new Date(result.timestamp).toLocaleTimeString()}`,
    ];

    if (result.error) {
      details.push(`Error: ${result.error}`);
    }

    if (result.data) {
      details.push(`Data: ${JSON.stringify(result.data, null, 2)}`);
    }

    Alert.alert('Test Result Details', details.join('\n\n'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Webapp Connection Test</Text>
        <Text style={styles.subtitle}>Test mobile app integration with your webapp</Text>

        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>Connection Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testConnection}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testFetchBookings}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Fetch Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testFetchAssignments}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Fetch Assignments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testUpdateBooking}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Update Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testSync}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Full Sync</Text>
          </TouchableOpacity>

          {testResults.length > 0 && (
            <TouchableOpacity
              style={[styles.testButton, styles.clearButton]}
              onPress={clearResults}
            >
              <Text style={[styles.testButtonText, styles.clearButtonText]}>Clear Results</Text>
            </TouchableOpacity>
          )}
        </Card>

        {testResults.length > 0 && (
          <Card style={styles.resultsCard}>
            <Text style={styles.cardTitle}>Test Results</Text>
            {testResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={[
                  styles.resultItem,
                  result.success ? styles.successResult : styles.errorResult
                ]}
                onPress={() => showResultDetails(result)}
              >
                <Text style={styles.resultText}>
                  {result.success ? '✅' : '❌'} {result.test}
                </Text>
                <Text style={styles.resultTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
                {result.error && (
                  <Text style={styles.resultError} numberOfLines={2}>
                    {result.error}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Expected Results</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Test Connection:</Text> Should succeed when webapp endpoints are ready{'\n'}
            • <Text style={styles.bold}>Fetch Bookings:</Text> Should return approved bookings array{'\n'}
            • <Text style={styles.bold}>Fetch Assignments:</Text> Should return staff assignments{'\n'}
            • <Text style={styles.bold}>Update Booking:</Text> Should accept status update{'\n'}
            • <Text style={styles.bold}>Full Sync:</Text> Should return latest data from webapp
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: NeumorphicTheme.spacing[4],
    paddingBottom: NeumorphicTheme.spacing[8],
  },
  title: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: NeumorphicTheme.spacing[2],
  },
  subtitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: NeumorphicTheme.spacing[6],
  },
  testCard: {
    padding: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[4],
  },
  resultsCard: {
    padding: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[4],
  },
  infoCard: {
    padding: NeumorphicTheme.spacing[4],
    backgroundColor: NeumorphicTheme.colors.background.tertiary,
  },
  cardTitle: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[4],
  },
  testButton: {
    backgroundColor: NeumorphicTheme.colors.brand.primary,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    padding: NeumorphicTheme.spacing[3],
    marginBottom: NeumorphicTheme.spacing[3],
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: NeumorphicTheme.colors.semantic.warning,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
  clearButtonText: {
    color: '#ffffff',
  },
  resultItem: {
    padding: NeumorphicTheme.spacing[3],
    borderRadius: NeumorphicTheme.borderRadius.md,
    marginBottom: NeumorphicTheme.spacing[2],
    borderLeftWidth: 4,
  },
  successResult: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.success}10`,
    borderLeftColor: NeumorphicTheme.colors.semantic.success,
  },
  errorResult: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.error}10`,
    borderLeftColor: NeumorphicTheme.colors.semantic.error,
  },
  resultText: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.text.primary,
  },
  resultTime: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    marginTop: NeumorphicTheme.spacing[1],
  },
  resultError: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.semantic.error,
    marginTop: NeumorphicTheme.spacing[1],
  },
  infoText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
  },
});
