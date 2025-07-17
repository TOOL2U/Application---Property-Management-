/**
 * Test Push Notifications Fixed
 * Verify that platform guards prevent crashes and errors
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useNotifications } from '@/hooks/useNotifications';

export default function TestNotificationsFixed() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [status, setStatus] = useState('Not initialized');

  const { 
    expoPushToken, 
    permissionStatus, 
    error,
    initializeNotifications 
  } = useNotifications('test-user-id');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testPlatformGuards = () => {
    addLog('🧪 Testing platform guards...');
    addLog(`📱 Current platform: ${Platform.OS}`);
    
    if (Platform.OS === 'web') {
      addLog('✅ Web platform detected - push tokens should be skipped');
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      addLog('✅ Mobile platform detected - push tokens should work');
    } else {
      addLog('⚠️ Unsupported platform - push tokens should be skipped');
    }
  };

  const testPushServiceInit = async () => {
    setIsInitializing(true);
    setLogs([]);
    addLog('🔄 Testing push notification service initialization...');
    
    try {
      const result = await pushNotificationService.initialize('test-staff-id');
      
      if (result) {
        setStatus('✅ Initialized successfully');
        addLog('✅ Push notification service initialized successfully!');
        
        if (Platform.OS !== 'web' && pushNotificationService.expoPushToken) {
          addLog(`🎫 Expo push token: ${pushNotificationService.expoPushToken.substring(0, 50)}...`);
        } else {
          addLog('⚠️ No Expo push token (expected for web platform)');
        }
      } else {
        setStatus('⚠️ Initialization skipped or failed');
        addLog('⚠️ Push notification initialization skipped or failed (this is OK for web)');
      }
    } catch (error) {
      setStatus('❌ Error occurred');
      addLog(`❌ Error during initialization: ${error}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const testHookBehavior = () => {
    addLog('🪝 Testing useNotifications hook...');
    addLog(`📊 Permission status: ${permissionStatus || 'Not requested'}`);
    addLog(`🎫 Expo push token: ${expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'None'}`);
    addLog(`❌ Error: ${error || 'None'}`);
    
    if (Platform.OS === 'web' && !expoPushToken) {
      addLog('✅ Correct behavior: No push token on web platform');
    } else if (Platform.OS !== 'web' && expoPushToken) {
      addLog('✅ Correct behavior: Push token obtained on mobile platform');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('Not initialized');
  };

  return (
    <ScrollView className="flex-1 bg-gray-900 p-4">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">
          🧪 Push Notifications Fixed Test
        </Text>
        <Text className="text-gray-300 text-sm mb-4">
          Platform: {Platform.OS} | Status: {status}
        </Text>
      </View>

      <View className="space-y-3 mb-6">
        <TouchableOpacity
          onPress={testPlatformGuards}
          className="bg-blue-600 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Test Platform Guards
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testPushServiceInit}
          disabled={isInitializing}
          className={`p-3 rounded-lg ${
            isInitializing ? 'bg-gray-600' : 'bg-purple-600'
          }`}
        >
          <Text className="text-white text-center font-semibold">
            {isInitializing ? 'Initializing...' : 'Test Push Service Init'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testHookBehavior}
          className="bg-green-600 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Test Hook Behavior
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearLogs}
          className="bg-red-600 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">
            Clear Logs
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-gray-800 p-4 rounded-lg">
        <Text className="text-white font-semibold mb-2">Test Logs:</Text>
        <ScrollView className="max-h-96">
          {logs.length === 0 ? (
            <Text className="text-gray-400 italic">No logs yet...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} className="text-gray-300 text-xs mb-1 font-mono">
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View className="mt-6 bg-gray-800 p-4 rounded-lg">
        <Text className="text-white font-semibold mb-2">Expected Behavior:</Text>
        <Text className="text-gray-300 text-sm">
          • Web: No push tokens, no "applicationId" errors{'\n'}
          • Mobile: Push tokens work normally{'\n'}
          • All platforms: No crashes or unhandled errors
        </Text>
      </View>
    </ScrollView>
  );
}
