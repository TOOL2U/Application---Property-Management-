/**
 * Background Notification Test Component
 * Use this to test that notifications work when app is in background/closed
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useEnhancedJobNotifications } from '@/hooks/useEnhancedJobNotifications';
import { usePushNotifications } from '@/contexts/PushNotificationContext';

export const BackgroundNotificationTest: React.FC = () => {
  const { testBackgroundNotification, isNotificationReady } = useEnhancedJobNotifications();
  const { permissionStatus } = usePushNotifications();

  const handleTestNotification = async () => {
    if (!isNotificationReady) {
      Alert.alert('Not Ready', 'Push notifications are not initialized yet');
      return;
    }

    if (permissionStatus !== 'granted') {
      Alert.alert('No Permission', 'Please grant notification permissions first');
      return;
    }

    Alert.alert(
      'Background Notification Test',
      'This will send a test notification. Close the app now to test background delivery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: async () => {
            const success = await testBackgroundNotification();
            
            if (success) {
              Alert.alert(
                'Test Sent! 📱',
                'A test notification has been sent. Close the app to see if it appears in the background.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('Test Failed', 'Failed to send test notification');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        🧪 Background Notification Test
      </Text>
      
      <Text className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Test that job notifications work when the app is closed or in background.
      </Text>

      <View className="space-y-2 mb-4">
        <Text className="text-xs text-gray-500">
          Status: {isNotificationReady ? '✅ Ready' : '⏳ Initializing...'}
        </Text>
        <Text className="text-xs text-gray-500">
          Permission: {permissionStatus === 'granted' ? '✅ Granted' : `❌ ${permissionStatus}`}
        </Text>
      </View>

      <Pressable
        onPress={handleTestNotification}
        disabled={!isNotificationReady || permissionStatus !== 'granted'}
        className={`p-3 rounded-lg ${
          isNotificationReady && permissionStatus === 'granted'
            ? 'bg-blue-500 active:bg-blue-600'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <Text className={`text-center font-medium ${
          isNotificationReady && permissionStatus === 'granted'
            ? 'text-white'
            : 'text-gray-500'
        }`}>
          Send Test Notification
        </Text>
      </Pressable>

      <Text className="text-xs text-gray-400 mt-2 text-center">
        After tapping "Send Test", close the app to verify background delivery
      </Text>
    </View>
  );
};

export default BackgroundNotificationTest;
