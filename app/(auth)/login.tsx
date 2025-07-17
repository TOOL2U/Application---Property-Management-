/**
 * Login Screen - Entry point for staff authentication
 * Uses shared Firebase credentials and routes to staff profile selection
 * AIS Telecom-inspired design with neon green dark theme
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInShared, isAuthenticated, isStaffSelected, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already authenticated and staff selected, go to dashboard
    if (isAuthenticated && isStaffSelected) {
  router.replace('/');
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
    <SafeAreaView className="flex-1 bg-dark-bg px-4 pt-8">
      <StatusBar style="light" />

      <View className="flex-1 justify-center">
        {/* App Branding Section */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          className="items-center mb-12"
        >
          {/* App Logo/Icon */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: 'rgba(198, 255, 0, 0.2)' }}
          >
            <Ionicons name="business" size={48} color="#C6FF00" />
          </View>

          {/* App Title */}
          <Text className="text-text-primary text-3xl font-bold text-center mb-2">
            Sia Moon Property
          </Text>
          <Text className="text-text-primary text-xl font-semibold text-center mb-3">
            Staff Portal
          </Text>
          <Text className="text-text-secondary text-center text-base">
            Secure staff access with profile selection
          </Text>
        </Animatable.View>

        {/* Login Button */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          className="mb-8"
        >
          <TouchableOpacity
            onPress={handleSharedLogin}
            disabled={loading}
            className="bg-brand-primary rounded-xl p-4 shadow-lg"
            activeOpacity={0.7}
            style={{
              shadowColor: '#C6FF00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <Animatable.View animation="rotate" iterationCount="infinite">
                  <Ionicons name="refresh" size={24} color="#0B0F1A" />
                </Animatable.View>
              ) : (
                <Ionicons name="shield-checkmark" size={24} color="#0B0F1A" />
              )}
              <Text className="text-dark-bg text-lg font-bold ml-3">
                {loading ? 'Signing In...' : 'Access Staff Portal'}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={20} color="#0B0F1A" style={{ marginLeft: 8 }} />
              )}
            </View>
          </TouchableOpacity>
        </Animatable.View>

        {/* Info Cards */}
        <View className="space-y-4">
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={100}
            className="bg-dark-surface rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={16} color="#C6FF00" />
              <Text className="text-brand-primary font-semibold ml-2">Secure Access</Text>
            </View>
            <Text className="text-text-secondary text-sm leading-5">
              All staff use a shared login, then select their profile with a personal PIN code.
            </Text>
          </Animatable.View>

          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={200}
            className="bg-dark-surface rounded-xl p-4"
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="people" size={16} color="#C6FF00" />
              <Text className="text-brand-primary font-semibold ml-2">Staff Profiles</Text>
            </View>
            <Text className="text-text-secondary text-sm leading-5">
              Choose your profile and enter your 4-digit PIN to access your personalized dashboard.
            </Text>
          </Animatable.View>
        </View>

        {/* Error Display */}
        {error && (
          <Animatable.View
            animation="fadeIn"
            className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4"
          >
            <Text className="text-red-400 text-center font-medium">
              {error}
            </Text>
          </Animatable.View>
        )}
      </View>
    </SafeAreaView>
  );
}
