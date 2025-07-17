/**
 * Cloudinary Test Component
 * Tests Cloudinary integration and logo display
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/ui/Logo';
import { cloudinaryService } from '@/services/cloudinaryService';
import { AppLogo } from '@/constants/AppLogo';
import { AITheme } from '@/constants/AITheme';
import { CheckCircle, AlertCircle, Cloud, Image as ImageIcon } from 'lucide-react-native';

export default function CloudinaryTestScreen() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    testCloudinaryConnection();
  }, []);

  const testCloudinaryConnection = async () => {
    try {
      setIsLoading(true);
      setTestResults(['🔍 Testing Cloudinary connection...']);

      // Test 1: Basic connection
      const connectionTest = await cloudinaryService.testConnection();
      if (connectionTest) {
        setTestResults(prev => [...prev, '✅ Cloudinary connection successful']);
        setConnectionStatus('success');
      } else {
        setTestResults(prev => [...prev, '❌ Cloudinary connection failed']);
        setConnectionStatus('failed');
      }

      // Test 2: Logo URL generation
      const logoUrl = AppLogo.original;
      setTestResults(prev => [...prev, `📋 Logo URL: ${logoUrl}`]);

      // Test 3: Different logo sizes
      const logoSizes = cloudinaryService.getLogos();
      setTestResults(prev => [...prev, `📏 Generated ${Object.keys(logoSizes).length} logo variants`]);

      // Test 4: Configuration check
      const config = cloudinaryService.getConfig();
      setTestResults(prev => [...prev, `⚙️ Cloud Name: ${config.cloudName}`]);
      setTestResults(prev => [...prev, `⚙️ API Key: ${config.apiKey ? 'Configured' : 'Missing'}`]);

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setConnectionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testUpload = async () => {
    try {
      setIsLoading(true);
      Alert.alert('Upload Test', 'Testing image upload to Cloudinary...');

      // Create a simple test image (1x1 pixel)
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const result = await cloudinaryService.uploadImage(testImage, {
        folder: 'test',
        tags: ['mobile_app_test'],
      });

      if (result.success) {
        Alert.alert('Success', `Image uploaded successfully!\nURL: ${result.url}`);
        if (result.publicId) {
          // Clean up test image
          await cloudinaryService.deleteImage(result.publicId);
        }
      } else {
        Alert.alert('Failed', `Upload failed: ${result.error}`);
      }

    } catch (error) {
      Alert.alert('Error', `Upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const LogoTestCard = ({ 
    title, 
    size, 
    description 
  }: { 
    title: string; 
    size: Parameters<typeof Logo>[0]['size']; 
    description: string;
  }) => (
    <View className="bg-gray-800 rounded-lg p-4 mb-4">
      <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
      <Text className="text-gray-400 text-sm mb-3">{description}</Text>
      <View className="items-center bg-gray-900 rounded-lg p-4">
        <Logo size={size} />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient
        colors={AITheme.gradients.primary as [string, string]}
        className="absolute inset-0"
      />
      
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Cloud size={24} color="white" className="mr-2" />
            <Text className="text-white text-2xl font-bold">Cloudinary Test</Text>
          </View>
          <Text className="text-gray-300">Testing Cloudinary integration and logo display</Text>
        </View>

        {/* Connection Status */}
        <View className="bg-gray-800 rounded-lg p-4 mb-6">
          <View className="flex-row items-center mb-3">
            {connectionStatus === 'testing' && <ActivityIndicator size="small" color={AITheme.colors.brand.primary} />}
            {connectionStatus === 'success' && <CheckCircle size={20} color={AITheme.colors.status.success} />}
            {connectionStatus === 'failed' && <AlertCircle size={20} color={AITheme.colors.status.error} />}
            <Text className="text-white text-lg font-semibold ml-2">
              Connection Status: {connectionStatus}
            </Text>
          </View>
          
          {testResults.map((result, index) => (
            <Text key={index} className="text-gray-300 text-sm mb-1">
              {result}
            </Text>
          ))}
        </View>

        {/* Logo Tests */}
        <Text className="text-white text-xl font-bold mb-4">Logo Display Tests</Text>
        
        <LogoTestCard
          title="Small Logo"
          size="small"
          description="40x40 pixels - for inline use"
        />
        
        <LogoTestCard
          title="Medium Logo"
          size="medium"
          description="80x80 pixels - default size"
        />
        
        <LogoTestCard
          title="Large Logo"
          size="large"
          description="160x160 pixels - for prominent display"
        />
        
        <LogoTestCard
          title="Header Logo"
          size="header"
          description="150x40 pixels - optimized for navigation"
        />
        
        <LogoTestCard
          title="App Icon"
          size="appIcon"
          description="120x120 pixels - for splash screens"
        />
        
        <LogoTestCard
          title="Notification Icon"
          size="notification"
          description="32x32 pixels - for notifications"
        />

        {/* Action Buttons */}
        <View className="mt-6 space-y-4">
          <TouchableOpacity
            onPress={testCloudinaryConnection}
            disabled={isLoading}
            className="bg-blue-600 rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-semibold">
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={testUpload}
            disabled={isLoading}
            className="bg-green-600 rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-semibold">
              {isLoading ? 'Uploading...' : 'Test Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo URLs */}
        <View className="bg-gray-800 rounded-lg p-4 mt-6 mb-8">
          <Text className="text-white text-lg font-semibold mb-3">Generated Logo URLs</Text>
          <View className="space-y-2">
            <View>
              <Text className="text-gray-400 text-sm">Original:</Text>
              <Text className="text-gray-300 text-xs">{AppLogo.original}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">App Icon:</Text>
              <Text className="text-gray-300 text-xs">{AppLogo.appIcon}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">Header:</Text>
              <Text className="text-gray-300 text-xs">{AppLogo.header}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
