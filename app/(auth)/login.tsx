/**
 * Login Screen - Entry point for staff authentication
 * Uses shared Firebase credentials and routes to staff profile selection
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { Users, Shield, ArrowRight } from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInShared, isAuthenticated, isStaffSelected, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already authenticated and staff selected, go to dashboard
    if (isAuthenticated && isStaffSelected) {
      router.replace('/(tabs)');
    }
    // If authenticated but no staff selected, go to profile selection
    else if (isAuthenticated && !isStaffSelected) {
      router.replace('/(auth)/select-staff-profile');
    }
  }, [isAuthenticated, isStaffSelected]);

  const handleSharedLogin = async () => {
    try {
      setLoading(true);

      await signInShared();

      // Navigation will be handled by useEffect based on auth state
      router.replace('/(auth)/select-staff-profile');
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Failed to sign in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0a0a' }}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'transparent', 'rgba(59, 130, 246, 0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1 justify-center px-6">
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          className="items-center mb-12"
        >
          <View className="w-24 h-24 rounded-3xl bg-purple-500/20 items-center justify-center mb-6">
            <Users size={48} color="#8b5cf6" />
          </View>

          <Text className="text-white text-3xl font-bold text-center mb-3 tracking-tight">
            Sia Moon Property
          </Text>
          <Text className="text-white text-2xl font-bold text-center mb-2 tracking-tight">
            Staff Portal
          </Text>
          <Text className="text-gray-400 text-center text-base">
            Secure staff access with PIN protection
          </Text>
        </Animatable.View>

        {/* Login Button */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={200}
          className="mb-8"
        >
          <TouchableOpacity
            onPress={handleSharedLogin}
            disabled={loading}
            className="overflow-hidden rounded-2xl border border-purple-500/30"
            style={{
              shadowColor: '#8b5cf6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={loading ? ['#6b7280', '#4b5563'] : ['#8b5cf6', '#7c3aed']}
              className="py-6 px-8"
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <Animatable.View animation="rotate" iterationCount="infinite">
                    <Ionicons name="refresh" size={24} color="white" />
                  </Animatable.View>
                ) : (
                  <Shield size={24} color="white" />
                )}
                <Text className="text-white text-lg font-semibold ml-3">
                  {loading ? 'Signing In...' : 'Access Staff Portal'}
                </Text>
                {!loading && <ArrowRight size={20} color="white" className="ml-2" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Info Cards */}
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={400}
          className="space-y-4"
        >
          <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Shield size={16} color="#3b82f6" />
              <Text className="text-blue-400 font-medium ml-2">Secure Access</Text>
            </View>
            <Text className="text-gray-300 text-sm leading-5">
              All staff use a shared login, then select their profile with a personal PIN code.
            </Text>
          </View>

          <View className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Users size={16} color="#8b5cf6" />
              <Text className="text-purple-400 font-medium ml-2">Staff Profiles</Text>
            </View>
            <Text className="text-gray-300 text-sm leading-5">
              Choose your profile and enter your 4-digit PIN to access your personalized dashboard.
            </Text>
          </View>
        </Animatable.View>

        {/* Error Display */}
        {error && (
          <Animatable.View
            animation="fadeIn"
            className="mt-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-4"
          >
            <Text className="text-red-400 text-center font-medium">
              {error}
            </Text>
          </Animatable.View>
        )}
      </SafeAreaView>
    </View>
  );
}
