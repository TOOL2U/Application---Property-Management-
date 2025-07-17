/**
 * Select Staff Profile Screen
 * Displays all staff profiles for selection after shared Firebase login
 * AIS Telecom-inspired design with neon green dark theme
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { usePINAuth } from '@/contexts/PINAuthContext';
import { StaffProfile } from '@/services/localStaffService';

export default function SelectStaffProfileScreen() {
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [showPINModal, setShowPINModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    loadStaffProfiles();
    checkSavedProfile();
  }, []);

  const loadStaffProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profiles = await fetchAllStaffProfiles();
      setStaffProfiles(profiles);
      
      if (profiles.length === 0) {
        setError('No staff profiles found. Please contact your administrator.');
      }
    } catch (error) {
      console.error('❌ Error loading staff profiles:', error);
      setError('Failed to load staff profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkSavedProfile = async () => {
    try {
      const shouldRemember = await shouldRememberStaff();
      if (shouldRemember) {
        const savedStaffId = await getSavedStaffId();
        if (savedStaffId) {
          // Auto-navigate to dashboard for remembered staff
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('❌ Error checking saved profile:', error);
    }
  };

  const handleStaffSelection = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setShowPINModal(true);
  };

  const handlePINSuccess = (staffProfile: StaffProfile) => {
    setShowPINModal(false);
    // Navigate to dashboard - the AuthContext will handle the staff selection
  router.replace('/');
  };

  const handlePINCancel = () => {
    setShowPINModal(false);
    setSelectedStaff(null);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#ef4444';
      case 'manager':
        return '#C6FF00';
      case 'cleaner':
        return '#10b981';
      case 'maintenance':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg px-4 pt-8">
        <StatusBar style="light" />
        <View className="flex-1 justify-center items-center">
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            className="items-center"
          >
            <View className="w-16 h-16 rounded-full bg-brand-primary/20 items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#C6FF00" />
            </View>
            <Text className="text-text-primary text-lg font-semibold">Loading Staff Profiles...</Text>
            <Text className="text-text-secondary text-sm mt-2">Please wait</Text>
          </Animatable.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg px-4 pt-8">
      <StatusBar style="light" />

      {/* Header Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-text-primary text-2xl font-bold">
              Select Profile
            </Text>
            <Text className="text-text-secondary text-base mt-1">
              Choose your staff profile to continue
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            className="w-12 h-12 rounded-xl bg-red-500/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {error ? (
          <Animatable.View
            animation="fadeIn"
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
          >
            <Text className="text-red-400 text-center font-medium">
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadStaffProfiles}
              className="mt-4 bg-red-500 py-3 px-6 rounded-xl self-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : (
          <View>
            {/* Profile Cards */}
            {staffProfiles.map((staff, index) => (
              <Animatable.View
                key={staff.id}
                animation="fadeInUp"
                duration={600}
                delay={index * 100}
              >
                <TouchableOpacity
                  onPress={() => handleStaffSelection(staff)}
                  className="bg-dark-surface rounded-xl p-4 shadow-lg mb-3"
                  activeOpacity={0.7}
                  accessibilityLabel={`Select ${staff.name} profile`}
                  accessibilityHint={`${staff.role} in ${staff.department || 'general'} department`}
                >
                  <View className="flex-row items-center">
                    {/* Profile Avatar */}
                    <View className="relative">
                      {staff.photo ? (
                        <Image
                          source={{ uri: staff.photo }}
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: 'rgba(198, 255, 0, 0.2)' }}
                        />
                      ) : (
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center"
                          style={{ backgroundColor: 'rgba(198, 255, 0, 0.2)' }}
                        >
                          <Ionicons name="person" size={24} color="#C6FF00" />
                        </View>
                      )}

                      {/* Status Indicator */}
                      <View
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-surface items-center justify-center"
                        style={{ backgroundColor: '#22c55e' }}
                      >
                        <View className="w-2 h-2 rounded-full bg-white" />
                      </View>
                    </View>

                    {/* Staff Information */}
                    <View className="flex-1 ml-4">
                      <Text className="text-text-primary text-lg font-semibold">
                        {staff.name}
                      </Text>
                      <Text
                        className="text-sm capitalize mt-1"
                        style={{ color: getRoleColor(staff.role) }}
                      >
                        {staff.role}
                      </Text>
                      {staff.department && (
                        <Text className="text-text-secondary text-xs mt-1">
                          {staff.department}
                        </Text>
                      )}
                    </View>

                    {/* Chevron Arrow */}
                    <Ionicons name="chevron-forward" size={20} color="#71717A" />
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}

            {/* Alternative Login Button */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={staffProfiles.length * 100 + 100}
              className="mt-4"
            >
              <TouchableOpacity
                onPress={handleSignOut}
                className="border-brand-primary border-2 rounded-xl p-4"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="log-in" size={20} color="#C6FF00" />
                  <Text className="text-brand-primary text-base font-semibold ml-3">
                    Use Another Account
                  </Text>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          </View>
        )}

        {/* Info Card */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={staffProfiles.length * 100 + 200}
          className="mt-6 bg-dark-surface rounded-xl p-4"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={16} color="#C6FF00" />
            <Text className="text-brand-primary font-semibold ml-2">Security Notice</Text>
          </View>
          <Text className="text-text-secondary text-sm leading-5">
            You'll need to enter your 4-digit PIN to access your profile.
            For security, your PIN is never stored on this device.
          </Text>
        </Animatable.View>
      </ScrollView>

      {/* PIN Entry Modal */}
      {selectedStaff && (
        <PINEntryModal
          visible={showPINModal}
          staffProfile={selectedStaff}
          onSuccess={handlePINSuccess}
          onCancel={handlePINCancel}
        />
      )}
    </SafeAreaView>
  );
}
