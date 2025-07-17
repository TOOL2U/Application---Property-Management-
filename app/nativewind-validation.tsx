import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, Smartphone, Monitor } from 'lucide-react-native';

/**
 * NativeWind Validation Test Component
 * 
 * This component provides comprehensive testing of NativeWind functionality
 * across web and mobile platforms to ensure proper configuration.
 */
export default function NativeWindValidationPage() {
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  const screenWidth = Dimensions.get('window').width;

  const markTestResult = (testName: string, passed: boolean) => {
    setTestResults(prev => ({ ...prev, [testName]: passed }));
  };

  const TestSection = ({ 
    title, 
    testName, 
    children 
  }: { 
    title: string; 
    testName: string; 
    children: React.ReactNode; 
  }) => (
    <View className="bg-dark-surface rounded-lg p-4 mb-4 border border-dark-border">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-lg font-semibold">{title}</Text>
        <View className="flex-row items-center">
          {testResults[testName] === true && (
            <CheckCircle size={20} color="#22c55e" />
          )}
          {testResults[testName] === false && (
            <XCircle size={20} color="#ef4444" />
          )}
          <TouchableOpacity
            className="ml-2 bg-primary-500 px-3 py-1 rounded-full"
            onPress={() => markTestResult(testName, !testResults[testName])}
          >
            <Text className="text-white text-xs font-medium">
              {testResults[testName] ? 'Pass' : 'Test'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {children}
    </View>
  );

  const getPassedTests = () => {
    return Object.values(testResults).filter(result => result === true).length;
  };

  const getTotalTests = () => {
    return Object.keys(testResults).length;
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-dark-border">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4 p-2 rounded-lg bg-dark-surface active:bg-dark-border"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          NativeWind Validation
        </Text>
      </View>

      {/* Platform Info */}
      <View className="bg-primary-500/20 border border-primary-500/30 rounded-lg m-4 p-4">
        <View className="flex-row items-center mb-2">
          {Platform.OS === 'web' ? (
            <Monitor size={20} color="#8b5cf6" />
          ) : (
            <Smartphone size={20} color="#8b5cf6" />
          )}
          <Text className="text-primary-400 text-sm font-medium ml-2">
            Platform: {Platform.OS === 'web' ? 'Web Browser' : `Mobile (${Platform.OS})`}
          </Text>
        </View>
        <Text className="text-primary-300 text-xs">
          Screen: {screenWidth.toFixed(0)}px wide • React Native {Platform.constants?.reactNativeVersion?.major}.{Platform.constants?.reactNativeVersion?.minor}
        </Text>
      </View>

      {/* Test Results Summary */}
      <View className="bg-dark-surface rounded-lg mx-4 mb-4 p-4">
        <Text className="text-white text-base font-semibold mb-2">
          Test Results: {getPassedTests()}/{getTotalTests()} Passed
        </Text>
        <View className="bg-dark-card rounded-full h-2">
          <View 
            className="bg-green-500 h-2 rounded-full"
            style={{ 
              width: getTotalTests() > 0 ? `${(getPassedTests() / getTotalTests()) * 100}%` : '0%' 
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Test 1: Basic Color Test */}
        <TestSection title="1. Basic Color Test" testName="basicColor">
          <Text className="text-red-500 text-lg font-bold mb-2">
            Hello NativeWind
          </Text>
          <Text className="text-gray-400 text-sm mb-2">
            ✓ This text should be red (#ef4444)
          </Text>
          <Text className="text-blue-500 text-sm">
            ✓ This text should be blue (#3b82f6)
          </Text>
        </TestSection>

        {/* Test 2: Custom Colors from tailwind.config.js */}
        <TestSection title="2. Custom Colors" testName="customColors">
          <View className="space-y-2">
            <Text className="text-primary-500 font-semibold">
              Primary Color (#8b5cf6)
            </Text>
            <Text className="text-neon-purple font-semibold">
              Neon Purple (#8b5cf6)
            </Text>
            <Text className="text-neon-pink font-semibold">
              Neon Pink (#ec4899)
            </Text>
            <Text className="text-neon-green font-semibold">
              Neon Green (#22c55e)
            </Text>
          </View>
        </TestSection>

        {/* Test 3: Background Colors */}
        <TestSection title="3. Background Colors" testName="backgroundColors">
          <View className="space-y-3">
            <View className="bg-primary-500 p-4 rounded-lg">
              <Text className="text-white font-medium">Primary Background</Text>
            </View>
            <View className="bg-dark-surface p-4 rounded-lg border border-dark-border">
              <Text className="text-white font-medium">Dark Surface Background</Text>
            </View>
            <View className="bg-neon-pink/20 border border-neon-pink/30 p-4 rounded-lg">
              <Text className="text-neon-pink font-medium">Neon Pink with Opacity</Text>
            </View>
          </View>
        </TestSection>

        {/* Test 4: Layout & Flexbox */}
        <TestSection title="4. Layout & Flexbox" testName="layout">
          <View className="bg-dark-card rounded-lg p-4 mb-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-medium">Left</Text>
              <Text className="text-primary-400 font-medium">Center</Text>
              <Text className="text-neon-green font-medium">Right</Text>
            </View>
            <View className="flex-1 justify-center items-center bg-primary-500/10 rounded-lg py-6">
              <Text className="text-primary-400 font-medium">Centered Content</Text>
            </View>
          </View>
        </TestSection>

        {/* Test 5: Spacing & Sizing */}
        <TestSection title="5. Spacing & Sizing" testName="spacing">
          <View className="space-y-3">
            <View className="p-2 bg-red-500/20 rounded">
              <Text className="text-red-400 text-sm">Padding: p-2</Text>
            </View>
            <View className="p-4 bg-blue-500/20 rounded">
              <Text className="text-blue-400 text-sm">Padding: p-4</Text>
            </View>
            <View className="p-6 bg-green-500/20 rounded">
              <Text className="text-green-400 text-sm">Padding: p-6</Text>
            </View>
          </View>
        </TestSection>

        {/* Test 6: Typography */}
        <TestSection title="6. Typography" testName="typography">
          <View className="space-y-2">
            <Text className="text-white text-xs font-light">Extra Small Light</Text>
            <Text className="text-white text-sm font-normal">Small Normal</Text>
            <Text className="text-white text-base font-medium">Base Medium</Text>
            <Text className="text-white text-lg font-semibold">Large Semibold</Text>
            <Text className="text-white text-xl font-bold">Extra Large Bold</Text>
          </View>
        </TestSection>

        {/* Test 7: Borders & Rounded Corners */}
        <TestSection title="7. Borders & Rounded" testName="borders">
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-dark-card border border-gray-600 rounded p-3">
              <Text className="text-gray-300 text-xs">Border Gray</Text>
            </View>
            <View className="bg-dark-card border border-primary-500 rounded-lg p-3">
              <Text className="text-primary-400 text-xs">Border Primary</Text>
            </View>
            <View className="bg-dark-card border border-neon-pink rounded-xl p-3">
              <Text className="text-neon-pink text-xs">Border Neon</Text>
            </View>
            <View className="bg-dark-card border border-green-500 rounded-full px-4 py-2">
              <Text className="text-green-400 text-xs">Rounded Full</Text>
            </View>
          </View>
        </TestSection>

        {/* Test 8: Interactive States */}
        <TestSection title="8. Interactive States" testName="interactive">
          <View className="space-y-3">
            <TouchableOpacity className="bg-primary-500 active:bg-primary-600 rounded-lg p-4">
              <Text className="text-white text-center font-medium">
                Active State Button
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-transparent border-2 border-neon-green active:bg-neon-green/10 rounded-lg p-4">
              <Text className="text-neon-green text-center font-medium">
                Outlined Button
              </Text>
            </TouchableOpacity>
          </View>
        </TestSection>

        {/* Test 9: Responsive Design */}
        <TestSection title="9. Responsive Design" testName="responsive">
          <View className="flex-row flex-wrap gap-2">
            <View 
              className="bg-primary-500/20 rounded-lg p-3 flex-1 min-w-[100px]"
              style={{ minWidth: 100 }}
            >
              <Text className="text-primary-400 text-xs text-center">Flex 1</Text>
            </View>
            <View 
              className="bg-neon-pink/20 rounded-lg p-3 flex-1 min-w-[100px]"
              style={{ minWidth: 100 }}
            >
              <Text className="text-neon-pink text-xs text-center">Flex 1</Text>
            </View>
            <View 
              className="bg-neon-green/20 rounded-lg p-3 flex-1 min-w-[100px]"
              style={{ minWidth: 100 }}
            >
              <Text className="text-neon-green text-xs text-center">Flex 1</Text>
            </View>
          </View>
        </TestSection>

        {/* Test 10: Complex Combinations */}
        <TestSection title="10. Complex Combinations" testName="complex">
          <View className="bg-gradient-to-r from-primary-500 to-neon-pink rounded-2xl p-6 mb-3">
            <Text className="text-white text-lg font-bold mb-2">
              Gradient Background
            </Text>
            <Text className="text-white/80 text-sm">
              Complex styling with multiple NativeWind classes
            </Text>
          </View>
          <View className="bg-dark-surface/50 backdrop-blur-sm border border-dark-border/50 rounded-xl p-4">
            <Text className="text-white font-semibold mb-2">
              Glassmorphism Effect
            </Text>
            <Text className="text-gray-400 text-sm">
              Semi-transparent background with border
            </Text>
          </View>
        </TestSection>

        {/* Configuration Check */}
        <View className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <Text className="text-yellow-400 text-sm font-medium mb-2">
            📋 Configuration Checklist
          </Text>
          <Text className="text-yellow-300 text-xs leading-5">
            If any tests fail, verify:
            {'\n'}• babel.config.js has 'nativewind/babel' in plugins
            {'\n'}• tailwind.config.js includes nativewind/preset
            {'\n'}• global.css is imported in app/_layout.tsx
            {'\n'}• metro.config.js uses withNativeWind wrapper
            {'\n'}• Development server restarted with --clear flag
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
