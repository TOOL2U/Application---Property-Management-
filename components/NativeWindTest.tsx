import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Test component to verify NativeWind is working properly
 * This component uses Tailwind CSS classes that should be processed by NativeWind
 */
export default function NativeWindTest() {
  return (
    <View className="flex-1 bg-dark-bg p-4">
      <View className="bg-dark-surface rounded-2xl p-6 mb-4 border border-dark-border">
        <Text className="text-white text-2xl font-bold mb-2">
          NativeWind Test
        </Text>
        <Text className="text-gray-300 text-base mb-4">
          If you can see this styled properly, NativeWind is working!
        </Text>
        
        <TouchableOpacity className="bg-primary-500 rounded-xl p-4 mb-3 active:bg-primary-600">
          <Text className="text-white text-center font-semibold">
            Primary Button
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-neon-pink rounded-xl p-4 mb-3 active:opacity-80">
          <Text className="text-white text-center font-semibold">
            Neon Pink Button
          </Text>
        </TouchableOpacity>
        
        <View className="flex-row space-x-2">
          <View className="flex-1 bg-neon-purple/20 rounded-lg p-3">
            <Text className="text-neon-purple text-sm font-medium">
              Purple Card
            </Text>
          </View>
          <View className="flex-1 bg-neon-green/20 rounded-lg p-3">
            <Text className="text-neon-green text-sm font-medium">
              Green Card
            </Text>
          </View>
        </View>
      </View>
      
      <View className="bg-gradient-to-r from-primary-500 to-neon-pink rounded-2xl p-6">
        <Text className="text-white text-lg font-bold">
          Gradient Background
        </Text>
        <Text className="text-white/80 text-sm mt-1">
          Custom gradient using Tailwind classes
        </Text>
      </View>
    </View>
  );
}
