/**
 * Push Notification Status Component
 * Shows notification permission status and allows users to manage settings
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { usePushNotifications } from '@/contexts/PushNotificationContext';
import { Bell, BellOff, Settings, Smartphone, TestTube } from 'lucide-react-native';

interface PushNotificationStatusProps {
  showTestButton?: boolean;
  compact?: boolean;
}

export const PushNotificationStatus: React.FC<PushNotificationStatusProps> = ({ 
  showTestButton = false, 
  compact = false 
}) => {
  const {
    permissionStatus,
    isInitialized,
    isPermissionDenied,
    pushToken,
    requestPermissions,
    sendTestNotification,
    checkPermissionStatus,
  } = usePushNotifications();

  const getStatusColor = () => {
    if (isInitialized && permissionStatus === 'granted') return '#22c55e'; // Green
    if (isPermissionDenied) return '#ef4444'; // Red
    return '#f59e0b'; // Orange
  };

  const getStatusText = () => {
    if (isInitialized && permissionStatus === 'granted') return 'Notifications Enabled';
    if (isPermissionDenied) return 'Notifications Disabled';
    if (!isInitialized) return 'Notifications Not Set Up';
    return 'Checking...';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (isInitialized && permissionStatus === 'granted') {
      return <Bell size={compact ? 16 : 20} color={color} />;
    }
    return <BellOff size={compact ? 16 : 20} color={color} />;
  };

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestPermissions();
      
      if (!granted) {
        Alert.alert(
          'Notifications Required',
          'Push notifications are needed to receive job assignments and important updates. Please enable them in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Sent', 'A test notification has been sent to your device.');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await checkPermissionStatus();
    } catch (error) {
      console.error('❌ Error refreshing status:', error);
    }
  };

  if (compact) {
    return (
      <View className="flex-row items-center">
        {getStatusIcon()}
        <Text className="text-white text-sm ml-2">{getStatusText()}</Text>
        {isPermissionDenied && (
          <TouchableOpacity 
            onPress={handleEnableNotifications}
            className="ml-2 bg-purple-600 px-2 py-1 rounded"
          >
            <Text className="text-white text-xs">Enable</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 m-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {getStatusIcon()}
          <Text className="text-white text-lg font-semibold ml-3">
            Push Notifications
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefreshStatus} className="p-1">
          <Settings size={16} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 text-sm mb-2">
          Status: <Text style={{ color: getStatusColor() }}>{getStatusText()}</Text>
        </Text>
        
        {pushToken && (
          <View className="flex-row items-center">
            <Smartphone size={14} color="#8b5cf6" />
            <Text className="text-gray-400 text-xs ml-2">
              Device registered
            </Text>
          </View>
        )}
      </View>

      {isPermissionDenied && (
        <View className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <Text className="text-red-400 text-sm mb-2">
            ⚠️ Notifications are disabled
          </Text>
          <Text className="text-gray-400 text-xs mb-3">
            You won't receive job assignments or important alerts. Enable notifications to stay updated.
          </Text>
          <TouchableOpacity
            onPress={handleEnableNotifications}
            className="bg-red-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-medium text-center">
              Enable Notifications
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isInitialized && permissionStatus === 'granted' && (
        <View className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
          <Text className="text-green-400 text-sm mb-1">
            ✅ Notifications are working
          </Text>
          <Text className="text-gray-400 text-xs">
            You'll receive job assignments and updates on this device.
          </Text>
        </View>
      )}

      {showTestButton && isInitialized && (
        <TouchableOpacity
          onPress={handleTestNotification}
          className="flex-row items-center justify-center bg-purple-600 px-4 py-2 rounded-lg mt-3"
        >
          <TestTube size={16} color="white" />
          <Text className="text-white text-sm font-medium ml-2">
            Send Test Notification
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PushNotificationStatus;
