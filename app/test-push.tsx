import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { pushNotificationService } from '@/services/pushNotificationService';

export default function TestPushNotifications() {
  const [status, setStatus] = useState<string>('Not initialized');
  const [logs, setLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const testPushNotificationInit = async () => {
    setIsInitializing(true);
    setLogs([]);
    addLog('🔄 Starting push notification initialization test...');
    addLog(`📱 Platform: ${Platform.OS}`);
    
    try {
      // Test the initialization
      const result = await pushNotificationService.initialize('test-staff-id');
      
      if (result) {
        setStatus('✅ Initialized successfully');
        addLog('✅ Push notification initialization successful!');
        
        // Check if we got a token
        if (pushNotificationService.expoPushToken) {
          addLog(`🎫 Expo push token: ${pushNotificationService.expoPushToken.substring(0, 50)}...`);
        } else {
          addLog('⚠️ No Expo push token obtained (this is OK for web)');
        }
        
        // Check service worker registration (web only)
        if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            addLog(`🔧 Service workers registered: ${registrations.length}`);
            
            registrations.forEach((reg, index) => {
              addLog(`   SW ${index + 1}: ${reg.scope} - ${reg.active ? 'Active' : 'Inactive'}`);
            });
          } catch (swError) {
            addLog(`❌ Error checking service workers: ${swError}`);
          }
        }
        
      } else {
        setStatus('❌ Initialization failed');
        addLog('❌ Push notification initialization failed');
      }
    } catch (error) {
      setStatus('❌ Error occurred');
      addLog(`❌ Error during initialization: ${error}`);
      
      // Log the specific error details
      if (error instanceof Error) {
        addLog(`   Error name: ${error.name}`);
        addLog(`   Error message: ${error.message}`);
        if (error.stack) {
          addLog(`   Error stack: ${error.stack.substring(0, 200)}...`);
        }
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const testNotificationPermission = async () => {
    addLog('🔔 Testing notification permission...');
    
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        addLog(`📋 Notification permission: ${permission}`);
        
        if (permission === 'granted') {
          // Test a simple notification
          try {
            new Notification('Test Notification', {
              body: 'This is a test notification from Sia Moon Property Management',
              icon: '/assets/icon.png',
            });
            addLog('✅ Test notification sent successfully');
          } catch (notifError) {
            addLog(`❌ Error sending test notification: ${notifError}`);
          }
        }
      } else {
        addLog('❌ Notifications not supported in this browser');
      }
    } else {
      addLog('📱 Notification permission testing is for web platform only');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('Not initialized');
  };

  useEffect(() => {
    addLog('🚀 Push notification test page loaded');
    addLog(`🌐 Running on: ${Platform.OS}`);
    
    // Check initial state
    if (Platform.OS === 'web') {
      addLog('🔍 Checking web environment...');
      addLog(`   Service Worker support: ${'serviceWorker' in navigator ? 'Yes' : 'No'}`);
      addLog(`   Push Manager support: ${'PushManager' in window ? 'Yes' : 'No'}`);
      addLog(`   Notification support: ${'Notification' in window ? 'Yes' : 'No'}`);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notification Test</Text>
        <Text style={styles.subtitle}>Sia Moon Property Management</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testPushNotificationInit}
          disabled={isInitializing}
        >
          <Text style={styles.buttonText}>
            {isInitializing ? '🔄 Initializing...' : '🔔 Test Push Notification Init'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testNotificationPermission}
        >
          <Text style={styles.buttonText}>🔔 Test Notification Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        {logs.length === 0 ? (
          <Text style={styles.noLogs}>No logs yet...</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#111111',
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#e5e7eb',
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
  },
  secondaryButton: {
    backgroundColor: '#059669',
  },
  clearButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 15,
    minHeight: 200,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 10,
  },
  noLogs: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  logText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 16,
  },
});
