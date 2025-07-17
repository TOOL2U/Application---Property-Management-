import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

/**
 * NativeWind Test Page
 * This page demonstrates that NativeWind is working properly with Tailwind CSS classes
 */
export default function NativeWindTestPage() {
  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-dark-border">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4 p-2 rounded-lg bg-dark-surface active:bg-dark-border"
          >
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            NativeWind Test
          </Text>
        </View>

        <View className="p-4 space-y-4">
          {/* Success Message */}
          <View className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
            <Text className="text-green-400 text-lg font-bold mb-2">
              ✅ NativeWind is Working!
            </Text>
            <Text className="text-green-300 text-sm">
              If you can see this styled properly, NativeWind has been successfully installed and configured.
            </Text>
          </View>

          {/* Color Palette */}
          <View className="bg-dark-surface rounded-xl p-4 border border-dark-border">
            <Text className="text-white text-lg font-bold mb-4">
              Custom Color Palette
            </Text>
            
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-primary-500 rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Primary</Text>
              </View>
              <View className="bg-neon-purple rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Neon Purple</Text>
              </View>
              <View className="bg-neon-pink rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Neon Pink</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <View className="bg-neon-blue rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Neon Blue</Text>
              </View>
              <View className="bg-neon-green rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Neon Green</Text>
              </View>
              <View className="bg-neon-orange rounded-lg p-3 flex-1 min-w-[100px]">
                <Text className="text-white text-xs font-medium">Neon Orange</Text>
              </View>
            </View>
          </View>

          {/* Interactive Elements */}
          <View className="bg-dark-surface rounded-xl p-4 border border-dark-border">
            <Text className="text-white text-lg font-bold mb-4">
              Interactive Elements
            </Text>
            
            <TouchableOpacity className="bg-primary-500 rounded-xl p-4 mb-3 active:bg-primary-600">
              <Text className="text-white text-center font-semibold">
                Primary Button
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-transparent border-2 border-neon-pink rounded-xl p-4 mb-3 active:bg-neon-pink/10">
              <Text className="text-neon-pink text-center font-semibold">
                Outlined Button
              </Text>
            </TouchableOpacity>

            <View className="flex-row space-x-2">
              <TouchableOpacity className="flex-1 bg-neon-green/20 border border-neon-green/30 rounded-lg p-3 active:bg-neon-green/30">
                <Text className="text-neon-green text-center text-sm font-medium">
                  Success
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-neon-orange/20 border border-neon-orange/30 rounded-lg p-3 active:bg-neon-orange/30">
                <Text className="text-neon-orange text-center text-sm font-medium">
                  Warning
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-red-500/20 border border-red-500/30 rounded-lg p-3 active:bg-red-500/30">
                <Text className="text-red-400 text-center text-sm font-medium">
                  Error
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Layout Examples */}
          <View className="bg-dark-surface rounded-xl p-4 border border-dark-border">
            <Text className="text-white text-lg font-bold mb-4">
              Layout Examples
            </Text>
            
            <View className="bg-dark-card rounded-lg p-4 mb-4">
              <Text className="text-gray-300 text-sm mb-2">Flexbox Layout:</Text>
              <View className="flex-row justify-between items-center">
                <View className="bg-primary-500/20 rounded-lg p-2">
                  <Text className="text-primary-400 text-xs">Left</Text>
                </View>
                <View className="bg-neon-pink/20 rounded-lg p-2">
                  <Text className="text-neon-pink text-xs">Center</Text>
                </View>
                <View className="bg-neon-green/20 rounded-lg p-2">
                  <Text className="text-neon-green text-xs">Right</Text>
                </View>
              </View>
            </View>

            <View className="bg-dark-card rounded-lg p-4">
              <Text className="text-gray-300 text-sm mb-2">Grid-like Layout:</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <View 
                    key={num}
                    className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 flex-1 min-w-[80px]"
                  >
                    <Text className="text-primary-400 text-center text-xs">
                      Item {num}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Typography */}
          <View className="bg-dark-surface rounded-xl p-4 border border-dark-border">
            <Text className="text-white text-lg font-bold mb-4">
              Typography
            </Text>
            
            <Text className="text-white text-2xl font-bold mb-2">
              Heading 1 - Bold
            </Text>
            <Text className="text-gray-300 text-lg font-semibold mb-2">
              Heading 2 - Semibold
            </Text>
            <Text className="text-gray-400 text-base font-medium mb-2">
              Body Text - Medium
            </Text>
            <Text className="text-gray-500 text-sm font-normal mb-4">
              Small Text - Normal
            </Text>
            
            <Text className="text-primary-400 text-base font-medium">
              Primary colored text with custom colors from tailwind.config.js
            </Text>
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
