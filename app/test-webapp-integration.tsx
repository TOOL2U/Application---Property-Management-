/**
 * Web App Integration Test Screen
 * Tests the connection and functionality with the villa management web app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { webAppApiService } from '@/services/webappApiService';
import { firebaseUidService } from '@/services/firebaseUidService';
import { integratedJobService } from '@/services/integratedJobService';
import { shadowStyles } from '@/utils/shadowUtils';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function WebAppIntegrationTestScreen() {
  const { currentProfile } = usePINAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    // Initialize test results
    setTestResults([
      { name: 'Firebase UID Mapping', status: 'pending', message: 'Not tested' },
      { name: 'Web App API Connection', status: 'pending', message: 'Not tested' },
      { name: 'Jobs API', status: 'pending', message: 'Not tested' },
      { name: 'Notifications API', status: 'pending', message: 'Not tested' },
      { name: 'Integrated Job Service', status: 'pending', message: 'Not tested' },
    ]);
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, duration } : test
    ));
  };

  const runAllTests = async () => {
    if (isRunningTests) return;
    
    setIsRunningTests(true);
    setConnectionStatus('unknown');

    try {
      // Test 1: Firebase UID Mapping
      await testFirebaseUidMapping();
      
      // Test 2: Web App API Connection
      await testWebAppConnection();
      
      // Test 3: Jobs API
      await testJobsApi();
      
      // Test 4: Notifications API
      await testNotificationsApi();
      
      // Test 5: Integrated Job Service
      await testIntegratedJobService();

      // Check overall connection status
      const hasErrors = testResults.some(test => test.status === 'error');
      setConnectionStatus(hasErrors ? 'disconnected' : 'connected');

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsRunningTests(false);
    }
  };

  const testFirebaseUidMapping = async () => {
    const startTime = Date.now();
    try {
      updateTestResult('Firebase UID Mapping', 'pending', 'Testing...');

      // Initialize test mappings
      await firebaseUidService.initializeTestMappings();

      // Test getting UID for current profile
      if (currentProfile) {
        const uid = await firebaseUidService.getFirebaseUid(currentProfile.id);
        if (uid) {
          const duration = Date.now() - startTime;
          updateTestResult('Firebase UID Mapping', 'success', `UID found: ${uid.substring(0, 8)}...`, duration);
        } else {
          updateTestResult('Firebase UID Mapping', 'error', 'No UID found for current profile');
        }
      } else {
        // Test with test account
        const testUid = await firebaseUidService.getFirebaseUid('staff@siamoon.com');
        if (testUid === 'gTtR5gSKOtUEweLwchSnVreylMy1') {
          const duration = Date.now() - startTime;
          updateTestResult('Firebase UID Mapping', 'success', 'Test account mapping successful', duration);
        } else {
          updateTestResult('Firebase UID Mapping', 'error', 'Test account mapping failed');
        }
      }
    } catch (error) {
      updateTestResult('Firebase UID Mapping', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testWebAppConnection = async () => {
    const startTime = Date.now();
    try {
      updateTestResult('Web App API Connection', 'pending', 'Testing...');

      const isConnected = await webAppApiService.testConnection();
      const duration = Date.now() - startTime;

      if (isConnected) {
        updateTestResult('Web App API Connection', 'success', 'Connection established', duration);
      } else {
        updateTestResult('Web App API Connection', 'error', 'Connection failed');
      }
    } catch (error) {
      updateTestResult('Web App API Connection', 'error', error instanceof Error ? error.message : 'Connection error');
    }
  };

  const testJobsApi = async () => {
    const startTime = Date.now();
    try {
      updateTestResult('Jobs API', 'pending', 'Testing...');

      // Use test staff UID
      const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      const response = await webAppApiService.getStaffJobs(testUid, { limit: 5 });
      
      const duration = Date.now() - startTime;

      if (response.success) {
        updateTestResult('Jobs API', 'success', `API responded with ${response.data.jobs.length} jobs`, duration);
      } else {
        updateTestResult('Jobs API', 'error', 'API responded with error');
      }
    } catch (error) {
      updateTestResult('Jobs API', 'error', error instanceof Error ? error.message : 'API error');
    }
  };

  const testNotificationsApi = async () => {
    const startTime = Date.now();
    try {
      updateTestResult('Notifications API', 'pending', 'Testing...');

      // Use test staff UID
      const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      const response = await webAppApiService.getStaffNotifications(testUid, { limit: 5 });
      
      const duration = Date.now() - startTime;

      if (response.success) {
        updateTestResult('Notifications API', 'success', `API responded with ${response.count} notifications`, duration);
      } else {
        updateTestResult('Notifications API', 'error', 'API responded with error');
      }
    } catch (error) {
      updateTestResult('Notifications API', 'error', error instanceof Error ? error.message : 'API error');
    }
  };

  const testIntegratedJobService = async () => {
    const startTime = Date.now();
    try {
      updateTestResult('Integrated Job Service', 'pending', 'Testing...');

      const staffId = currentProfile?.id || 'test_staff';
      const result = await integratedJobService.getStaffJobs(staffId, { limit: 10 });
      
      const duration = Date.now() - startTime;

      if (result.success) {
        updateTestResult(
          'Integrated Job Service', 
          'success', 
          `${result.totalCount} total jobs (${result.sources.local} local, ${result.sources.webapp} web app)`, 
          duration
        );
      } else {
        updateTestResult('Integrated Job Service', 'error', 'Integration service failed');
      }
    } catch (error) {
      updateTestResult('Integrated Job Service', 'error', error instanceof Error ? error.message : 'Integration error');
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#22C55E" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#9CA3AF" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#22C55E';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#9CA3AF';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: '#F1F1F1',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 8,
            }}>
              Web App Integration
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
            }}>
              Test connection with villa management system
            </Text>
          </View>

          {/* Connection Status */}
          <View style={{
            backgroundColor: '#1C1F2A',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#374151',
            ...shadowStyles.medium,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons 
                name={connectionStatus === 'connected' ? 'wifi-outline' : connectionStatus === 'disconnected' ? 'wifi-outline' : 'help-circle-outline'} 
                size={24} 
                color={connectionStatus === 'connected' ? '#22C55E' : connectionStatus === 'disconnected' ? '#EF4444' : '#9CA3AF'} 
              />
              <Text style={{
                color: '#F1F1F1',
                fontSize: 18,
                fontWeight: '600',
                marginLeft: 12,
              }}>
                Connection Status
              </Text>
            </View>
            <Text style={{
              color: getStatusColor(connectionStatus === 'connected' ? 'success' : connectionStatus === 'disconnected' ? 'error' : 'pending'),
              fontSize: 16,
            }}>
              {connectionStatus === 'connected' ? 'Connected to Web App' : 
               connectionStatus === 'disconnected' ? 'Disconnected from Web App' : 
               'Connection status unknown'}
            </Text>
          </View>

          {/* Test Controls */}
          <TouchableOpacity
            onPress={runAllTests}
            disabled={isRunningTests}
            style={{
              backgroundColor: isRunningTests ? '#374151' : '#C6FF00',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 24,
              ...shadowStyles.medium,
            }}
          >
            {isRunningTests ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#9CA3AF', fontSize: 16, fontWeight: '600' }}>
                  Running Tests...
                </Text>
              </View>
            ) : (
              <Text style={{ color: '#0B0F1A', fontSize: 16, fontWeight: '600' }}>
                Run All Tests
              </Text>
            )}
          </TouchableOpacity>

          {/* Test Results */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              color: '#F1F1F1',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
            }}>
              Test Results
            </Text>

            {testResults.map((test, index) => (
              <View
                key={test.name}
                style={{
                  backgroundColor: '#1C1F2A',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#374151',
                  ...shadowStyles.small,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{
                    color: '#F1F1F1',
                    fontSize: 16,
                    fontWeight: '500',
                    flex: 1,
                  }}>
                    {test.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {test.duration && (
                      <Text style={{
                        color: '#9CA3AF',
                        fontSize: 12,
                        marginRight: 8,
                      }}>
                        {test.duration}ms
                      </Text>
                    )}
                    {getStatusIcon(test.status)}
                  </View>
                </View>
                <Text style={{
                  color: getStatusColor(test.status),
                  fontSize: 14,
                }}>
                  {test.message}
                </Text>
              </View>
            ))}
          </View>

          {/* Integration Info */}
          <View style={{
            backgroundColor: '#1C1F2A',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: '#374151',
            ...shadowStyles.medium,
          }}>
            <Text style={{
              color: '#F1F1F1',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
            }}>
              Integration Details
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 4 }}>
                Test Staff Account:
              </Text>
              <Text style={{ color: '#C6FF00', fontSize: 14, fontFamily: 'monospace' }}>
                staff@siamoon.com
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 4 }}>
                Firebase UID:
              </Text>
              <Text style={{ color: '#C6FF00', fontSize: 14, fontFamily: 'monospace' }}>
                gTtR5gSKOtUEweLwchSnVreylMy1
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 4 }}>
                API Base URL:
              </Text>
              <Text style={{ color: '#C6FF00', fontSize: 14, fontFamily: 'monospace' }}>
                http://localhost:3000
              </Text>
            </View>

            <View>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 4 }}>
                Current Profile:
              </Text>
              <Text style={{ color: '#F1F1F1', fontSize: 14 }}>
                {currentProfile ? currentProfile.name : 'Not logged in'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
