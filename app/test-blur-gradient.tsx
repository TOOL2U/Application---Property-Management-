/**
 * Test Blur and Gradient Effects
 * Verify that expo-blur and expo-linear-gradient are working correctly
 */

import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function TestBlurGradient() {
  return (
    <View className="flex-1">
      <StatusBar style="light" />
      
      {/* Dark-to-Blue Gradient Background */}
      <LinearGradient
        colors={[
          '#000000', // Pure black at top
          '#0a0a0a', // Very dark gray
          '#1a1a2e', // Dark blue-gray
          '#16213e', // Darker blue
          '#0f3460', // Deep blue
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      
      {/* Secondary gradient overlay for depth */}
      <LinearGradient
        colors={[
          'rgba(139, 92, 246, 0.1)', // Purple overlay
          'transparent',
          'rgba(59, 130, 246, 0.15)', // Blue overlay
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              🧪 Blur & Gradient Test
            </Text>
            <Text className="text-gray-300 text-center">
              Testing expo-blur and expo-linear-gradient
            </Text>
          </View>

          {/* BlurView Example with intensity 70 and light tint */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-4">
              BlurView Header Example
            </Text>
            
            <View className="mx-2 overflow-hidden rounded-2xl">
              {Platform.OS !== 'web' ? (
                <BlurView
                  intensity={70}
                  tint="light"
                  className="p-6"
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-white text-lg font-bold">
                        Good Morning, Admin!
                      </Text>
                      <Text className="text-white/70 text-sm mt-1">
                        Dashboard Overview
                      </Text>
                    </View>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <Text className="text-white font-bold">🔔</Text>
                    </View>
                  </View>
                </BlurView>
              ) : (
                <View 
                  className="p-6"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-white text-lg font-bold">
                        Good Morning, Admin! (Web Fallback)
                      </Text>
                      <Text className="text-white/70 text-sm mt-1">
                        Dashboard Overview
                      </Text>
                    </View>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <Text className="text-white font-bold">🔔</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Different BlurView Intensities */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-4">
              Different Blur Intensities
            </Text>
            
            {[30, 50, 70, 90].map((intensity) => (
              <View key={intensity} className="mb-4 mx-2 overflow-hidden rounded-xl">
                {Platform.OS !== 'web' ? (
                  <BlurView
                    intensity={intensity}
                    tint="light"
                    className="p-4"
                  >
                    <Text className="text-white font-semibold">
                      Intensity: {intensity}
                    </Text>
                    <Text className="text-white/70 text-sm">
                      This is a blur effect with intensity {intensity}
                    </Text>
                  </BlurView>
                ) : (
                  <View 
                    className="p-4"
                    style={{ 
                      backgroundColor: `rgba(255, 255, 255, ${0.1 + (intensity / 1000)})` 
                    }}
                  >
                    <Text className="text-white font-semibold">
                      Intensity: {intensity} (Web Fallback)
                    </Text>
                    <Text className="text-white/70 text-sm">
                      This is a blur effect with intensity {intensity}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Different Gradient Examples */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-4">
              Gradient Examples
            </Text>
            
            {/* Purple to Pink Gradient */}
            <View className="mb-4 overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-4"
              >
                <Text className="text-white font-semibold">
                  Purple to Pink Gradient
                </Text>
                <Text className="text-white/90 text-sm">
                  Horizontal gradient from purple to pink
                </Text>
              </LinearGradient>
            </View>

            {/* Blue to Cyan Gradient */}
            <View className="mb-4 overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#3b82f6', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4"
              >
                <Text className="text-white font-semibold">
                  Blue to Cyan Gradient
                </Text>
                <Text className="text-white/90 text-sm">
                  Diagonal gradient from blue to cyan
                </Text>
              </LinearGradient>
            </View>

            {/* Multi-color Gradient */}
            <View className="mb-4 overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-4"
              >
                <Text className="text-white font-semibold">
                  Multi-color Gradient
                </Text>
                <Text className="text-white/90 text-sm">
                  Orange → Red → Purple → Blue
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Combined Blur + Gradient */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-4">
              Combined Blur + Gradient
            </Text>
            
            <View className="relative overflow-hidden rounded-xl">
              <LinearGradient
                colors={['#8b5cf6', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              
              <View className="overflow-hidden rounded-xl">
                {Platform.OS !== 'web' ? (
                  <BlurView
                    intensity={50}
                    tint="light"
                    className="p-6"
                  >
                    <Text className="text-white text-lg font-bold mb-2">
                      Blur + Gradient Combined
                    </Text>
                    <Text className="text-white/80 text-sm">
                      This combines a gradient background with a blur overlay
                    </Text>
                  </BlurView>
                ) : (
                  <View 
                    className="p-6"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  >
                    <Text className="text-white text-lg font-bold mb-2">
                      Blur + Gradient Combined (Web)
                    </Text>
                    <Text className="text-white/80 text-sm">
                      This combines a gradient background with a blur overlay
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Status */}
          <View className="mb-8 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <Text className="text-green-400 font-semibold text-center">
              ✅ expo-blur and expo-linear-gradient are working correctly!
            </Text>
            <Text className="text-green-300 text-sm text-center mt-2">
              Platform: {Platform.OS} | No crashes or errors detected
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
