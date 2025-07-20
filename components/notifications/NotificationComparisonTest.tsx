/**
 * Quick Test: Local vs Push Notifications
 * This shows the difference between what works in Expo Go vs Development Build
 */

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export const NotificationComparisonTest = () => {
  
  // ✅ This WORKS in Expo Go (Local Notification)
  const testLocalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Local Notification (Works in Expo Go)",
          body: "This notification works because it's local",
          data: { type: 'local' },
        },
        trigger: null, // Immediate
      });
      
      Alert.alert('✅ Success!', 'Local notification sent - this works in Expo Go');
    } catch (error) {
      Alert.alert('❌ Failed', 'Local notification failed');
    }
  };

  // ❌ This FAILS in Expo Go (Push Token)
  const testPushToken = async () => {
    try {
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '6272f8f0-68ec-4141-a6a9-ae547b7400b2';
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      Alert.alert('✅ Success!', `Push token: ${tokenData.data.substring(0, 30)}...`);
    } catch (error) {
      Alert.alert(
        '❌ Push Token Failed', 
        'This fails in Expo Go but will work in development build'
      );
      console.log('Push token error:', error);
    }
  };

  return (
    <View className="p-4 space-y-4">
      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        📱 Notification Test Comparison
      </Text>

      <View className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200">
        <Text className="text-green-800 dark:text-green-200 font-semibold mb-2">
          ✅ Works in Expo Go
        </Text>
        <Text className="text-green-700 dark:text-green-300 text-sm mb-3">
          Local notifications work fine in Expo Go
        </Text>
        <Pressable
          onPress={testLocalNotification}
          className="bg-green-500 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-medium">
            Test Local Notification
          </Text>
        </Pressable>
      </View>

      <View className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200">
        <Text className="text-red-800 dark:text-red-200 font-semibold mb-2">
          ❌ Fails in Expo Go
        </Text>
        <Text className="text-red-700 dark:text-red-300 text-sm mb-3">
          Push tokens (required for job notifications) don't work in Expo Go
        </Text>
        <Pressable
          onPress={testPushToken}
          className="bg-red-500 p-3 rounded-lg"
        >
          <Text className="text-white text-center font-medium">
            Test Push Token (Will Fail)
          </Text>
        </Pressable>
      </View>

      <View className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200">
        <Text className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
          🚀 After Development Build
        </Text>
        <Text className="text-blue-700 dark:text-blue-300 text-sm">
          Both local and push notifications will work perfectly. Job assignments will trigger real push notifications even when the app is closed.
        </Text>
      </View>
    </View>
  );
};

export default NotificationComparisonTest;
