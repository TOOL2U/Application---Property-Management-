/**
 * BlurHeader Component
 * Reusable header with BlurView effect, rounded corners, and padding
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Settings } from 'lucide-react-native';
import { AITheme } from '@/constants/AITheme';

interface BlurHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  showSettingsButton?: boolean;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  rightComponent?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const BlurHeader: React.FC<BlurHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showNotificationButton = true,
  showSettingsButton = false,
  onBackPress,
  onNotificationPress,
  onSettingsPress,
  rightComponent,
  intensity = 70,
  tint = 'light',
}) => {
  return (
    <SafeAreaView edges={['top']} className="relative">
      {/* Background Gradient */}
      <LinearGradient
        colors={AITheme.gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      
      {/* Blur Effect Container */}
      <View className="mx-4 mt-2 mb-4 overflow-hidden rounded-2xl">
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={intensity}
            tint={tint}
            className="absolute inset-0"
          />
        ) : (
          // Web fallback with semi-transparent background
          <View 
            className="absolute inset-0"
            style={{
              backgroundColor: tint === 'light' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.3)'
            }}
          />
        )}
        
        {/* Header Content */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between">
            {/* Left Side */}
            <View className="flex-row items-center flex-1">
              {showBackButton && (
                <TouchableOpacity
                  onPress={onBackPress}
                  className="mr-3 p-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <ChevronLeft size={20} color="white" />
                </TouchableOpacity>
              )}
              
              <View className="flex-1">
                <Text className="text-white text-xl font-bold tracking-tight">
                  {title}
                </Text>
                {subtitle && (
                  <Text className="text-white/70 text-sm mt-1">
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>

            {/* Right Side */}
            <View className="flex-row items-center space-x-2">
              {showNotificationButton && (
                <TouchableOpacity
                  onPress={onNotificationPress}
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Bell size={20} color="white" />
                </TouchableOpacity>
              )}
              
              {showSettingsButton && (
                <TouchableOpacity
                  onPress={onSettingsPress}
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Settings size={20} color="white" />
                </TouchableOpacity>
              )}
              
              {rightComponent}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Example usage component for testing
export const BlurHeaderExample: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-900">
      <BlurHeader
        title="Dashboard"
        subtitle="Welcome back, John!"
        intensity={70}
        tint="light"
        showNotificationButton={true}
        showSettingsButton={true}
        onNotificationPress={() => console.log('Notifications pressed')}
        onSettingsPress={() => console.log('Settings pressed')}
      />
      
      <View className="flex-1 p-4">
        <Text className="text-white text-lg">
          Content below the blur header
        </Text>
      </View>
    </View>
  );
};
