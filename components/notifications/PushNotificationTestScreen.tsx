/**
 * Push Notification Test Screen
 * Use this to diagnose why notifications aren't working
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { generateDiagnosticReport, testLocalNotification } from '@/utils/pushNotificationDiagnostic';

export const PushNotificationTestScreen: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running push notification diagnostic...');
      const results = await generateDiagnosticReport();
      setDiagnosticResults(results);
      
      if (results.isExpoGo) {
        Alert.alert(
          'Expo Go Detected! ⚠️',
          'Push notifications require a development build for SDK 53+. Please run:\n\neas build --profile development',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      Alert.alert('Diagnostic Failed', 'Check console for details');
    } finally {
      setLoading(false);
    }
  };

  const testLocal = async () => {
    try {
      const success = await testLocalNotification();
      Alert.alert(
        success ? 'Test Sent! 📱' : 'Test Failed ❌',
        success 
          ? 'A test notification should appear shortly'
          : 'Local notification test failed - check console'
      );
    } catch (error) {
      Alert.alert('Test Failed', 'Check console for error details');
    }
  };

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        📱 Push Notification Diagnostic
      </Text>

      <Pressable
        onPress={runDiagnostic}
        disabled={loading}
        className={`p-4 rounded-lg mb-4 ${
          loading ? 'bg-gray-300' : 'bg-blue-500 active:bg-blue-600'
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? '🔍 Running Diagnostic...' : '🔍 Run Full Diagnostic'}
        </Text>
      </Pressable>

      <Pressable
        onPress={testLocal}
        className="p-4 rounded-lg mb-6 bg-green-500 active:bg-green-600"
      >
        <Text className="text-white text-center font-semibold">
          🧪 Test Local Notification
        </Text>
      </Pressable>

      {diagnosticResults && (
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Diagnostic Results
          </Text>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Platform:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {diagnosticResults.platform}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Physical Device:</Text>
              <Text className="text-gray-900 dark:text-white">
                {getStatusIcon(diagnosticResults.isDevice)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Using Expo Go:</Text>
              <Text className="text-gray-900 dark:text-white">
                {diagnosticResults.isExpoGo ? '⚠️ YES' : '✅ NO'}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Permissions:</Text>
              <Text className="text-gray-900 dark:text-white">
                {getStatusIcon(diagnosticResults.permissions)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Push Token:</Text>
              <Text className="text-gray-900 dark:text-white">
                {getStatusIcon(diagnosticResults.pushToken)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700 dark:text-gray-300">Local Notifications:</Text>
              <Text className="text-gray-900 dark:text-white">
                {getStatusIcon(diagnosticResults.localNotification)}
              </Text>
            </View>
          </View>

          {diagnosticResults.isExpoGo && (
            <View className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <Text className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                🚨 Action Required
              </Text>
              <Text className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                You're using Expo Go, but push notifications require a development build for SDK 53+.
              </Text>
              <Text className="text-sm font-mono text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800 p-2 rounded">
                eas build --profile development
              </Text>
            </View>
          )}

          {!diagnosticResults.isExpoGo && !diagnosticResults.pushToken && (
            <View className="mt-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
              <Text className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                ❌ Push Token Failed
              </Text>
              <Text className="text-sm text-red-700 dark:text-red-300">
                Could not obtain push token. Check console for details.
              </Text>
            </View>
          )}

          {diagnosticResults.pushToken && (
            <View className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
              <Text className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Push Notifications Ready!
              </Text>
              <Text className="text-sm text-green-700 dark:text-green-300">
                Your app should be able to receive push notifications.
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
        <Text className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 Troubleshooting Tips
        </Text>
        <Text className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          • For Expo Go: Use development build instead
        </Text>
        <Text className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          • For physical devices: Ensure network connectivity
        </Text>
        <Text className="text-sm text-blue-700 dark:text-blue-300">
          • Check Expo project ID in environment variables
        </Text>
      </View>
    </ScrollView>
  );
};

export default PushNotificationTestScreen;
