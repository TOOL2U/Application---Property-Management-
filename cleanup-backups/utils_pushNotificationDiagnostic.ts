/**
 * Push Notification Diagnostic Tool
 * Run this to check why notifications aren't working
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const runPushNotificationDiagnostic = async () => {
  console.log('🔍 === PUSH NOTIFICATION DIAGNOSTIC ===');
  
  // 1. Check platform
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Is Physical Device:', Device.isDevice);
  
  // 2. Check if using Expo Go
  const isExpoGo = !Device.isDevice || 
    (Platform.OS === 'android' && (__DEV__ || !Device.isDevice)) ||
    (Platform.OS === 'ios' && (__DEV__ || !Device.isDevice));
  
  console.log('🎯 Using Expo Go:', isExpoGo);
  
  if (isExpoGo) {
    console.log('⚠️  CRITICAL: Expo Go detected!');
    console.log('📋 Push notifications require a development build for SDK 53+');
    console.log('💡 Solution: Create a development build with `eas build --profile development`');
    return false;
  }
  
  // 3. Check permissions
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('🔐 Current permission status:', existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log('🔐 Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('🔐 Permission request result:', status);
      
      if (status !== 'granted') {
        console.log('❌ Notification permissions denied');
        return false;
      }
    }
    
    console.log('✅ Notification permissions granted');
    
  } catch (error) {
    console.log('❌ Permission check failed:', error);
    return false;
  }
  
  // 4. Try to get push token
  try {
    console.log('📱 Attempting to get push token...');
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'cc931fa3';
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    console.log('✅ Push token obtained successfully!');
    console.log('🔑 Token preview:', tokenData.data.substring(0, 30) + '...');
    return true;
    
  } catch (error) {
    console.log('❌ Failed to get push token:', error);
    console.log('💡 This usually means:');
    console.log('   1. Using Expo Go (needs development build)');
    console.log('   2. Network connectivity issues');
    console.log('   3. Invalid project ID');
    return false;
  }
};

export const testLocalNotification = async () => {
  try {
    console.log('🧪 Testing local notification...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification! 📱",
        body: 'If you see this, local notifications work!',
        data: { test: true },
      },
      trigger: null, // Immediate notification
    });
    
    console.log('✅ Local notification scheduled');
    return true;
    
  } catch (error) {
    console.log('❌ Local notification failed:', error);
    return false;
  }
};

export const checkNotificationHandler = () => {
  console.log('🔧 Checking notification handler...');
  
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    
    console.log('✅ Notification handler set successfully');
    return true;
    
  } catch (error) {
    console.log('❌ Failed to set notification handler:', error);
    return false;
  }
};

export const generateDiagnosticReport = async () => {
  console.log('\n🏥 === GENERATING DIAGNOSTIC REPORT ===\n');
  
  const results = {
    platform: Platform.OS,
    isDevice: Device.isDevice,
    isExpoGo: false,
    permissions: false,
    pushToken: false,
    localNotification: false,
    notificationHandler: false,
  };
  
  // Check if using Expo Go
  results.isExpoGo = !Device.isDevice || 
    (Platform.OS === 'android' && __DEV__) ||
    (Platform.OS === 'ios' && __DEV__);
  
  // Check permissions
  try {
    const { status } = await Notifications.getPermissionsAsync();
    results.permissions = status === 'granted';
  } catch (error) {
    results.permissions = false;
  }
  
  // Test push token
  results.pushToken = await runPushNotificationDiagnostic();
  
  // Test local notification
  results.localNotification = await testLocalNotification();
  
  // Test notification handler
  results.notificationHandler = checkNotificationHandler();
  
  console.log('\n📊 === DIAGNOSTIC RESULTS ===');
  console.log('Platform:', results.platform);
  console.log('Physical Device:', results.isDevice);
  console.log('Using Expo Go:', results.isExpoGo);
  console.log('Permissions:', results.permissions ? '✅' : '❌');
  console.log('Push Token:', results.pushToken ? '✅' : '❌');
  console.log('Local Notifications:', results.localNotification ? '✅' : '❌');
  console.log('Notification Handler:', results.notificationHandler ? '✅' : '❌');
  
  if (results.isExpoGo) {
    console.log('\n🚨 === ACTION REQUIRED ===');
    console.log('You are using Expo Go, but push notifications require a development build.');
    console.log('Please run: eas build --profile development');
    console.log('More info: https://docs.expo.dev/develop/development-builds/introduction/');
  }
  
  return results;
};

export default {
  runPushNotificationDiagnostic,
  testLocalNotification,
  checkNotificationHandler,
  generateDiagnosticReport,
};
