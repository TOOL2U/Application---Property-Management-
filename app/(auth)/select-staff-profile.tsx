/**
 * Select Staff Profile Screen
 * Displays all staff profiles for selection after shared Firebase login
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User, Shield, Clock, ChevronRight } from 'lucide-react-native';

import { fetchAllStaffProfiles, StaffProfile, getSavedStaffId, shouldRememberStaff } from '@/services/staffProfileService';
import { PINEntryModal } from '@/components/auth/PINModal';
import { useAuth } from '@/contexts/AuthContext';

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
          router.replace('/(tabs)/');
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
    router.replace('/(tabs)/');
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

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'shield';
      case 'manager':
        return 'briefcase';
      case 'cleaner':
        return 'home';
      case 'maintenance':
        return 'build';
      default:
        return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#ef4444';
      case 'manager':
        return '#8b5cf6';
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
      <View className="flex-1" style={{ backgroundColor: '#0a0a0a' }}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#1a1a2e', '#16213e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <SafeAreaView className="flex-1 justify-center items-center">
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            className="items-center"
          >
            <View className="w-16 h-16 rounded-2xl bg-purple-500/20 items-center justify-center mb-4">
              <User size={32} color="#8b5cf6" />
            </View>
            <Text className="text-white text-lg font-semibold">Loading Staff Profiles...</Text>
            <Text className="text-gray-400 text-sm mt-2">Please wait</Text>
          </Animatable.View>
        </SafeAreaView>
      </View>
    );
  }

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
        colors={['rgba(139, 92, 246, 0.1)', 'transparent', 'rgba(59, 130, 246, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animatable.View
          animation="slideInDown"
          duration={600}
          className="px-6 py-4"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight">
                Select Your Profile
              </Text>
              <Text className="text-gray-400 text-base mt-1">
                Choose your staff profile to continue
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleSignOut}
              className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {error ? (
            <Animatable.View
              animation="fadeIn"
              className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6"
            >
              <Text className="text-red-400 text-center font-medium">
                {error}
              </Text>
              <TouchableOpacity
                onPress={loadStaffProfiles}
                className="mt-4 bg-red-500 py-3 px-6 rounded-xl self-center"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </Animatable.View>
          ) : (
            <View className="gap-4">
              {staffProfiles.map((staff, index) => (
                <Animatable.View
                  key={staff.id}
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 100}
                >
                  <TouchableOpacity
                    onPress={() => handleStaffSelection(staff)}
                    className="overflow-hidden rounded-2xl border border-white/10"
                    style={{
                      shadowColor: '#8b5cf6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                  >
                    {Platform.OS !== 'web' ? (
                      <BlurView intensity={30} tint="dark" className="absolute inset-0" />
                    ) : (
                      <View 
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      />
                    )}
                    
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                      className="p-6"
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View className="flex-row items-center">
                        {/* Profile Photo */}
                        <View className="relative">
                          {staff.photo ? (
                            <Image
                              source={{ uri: staff.photo }}
                              className="w-16 h-16 rounded-2xl"
                              style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
                            />
                          ) : (
                            <View className="w-16 h-16 rounded-2xl bg-purple-500/20 items-center justify-center">
                              <User size={32} color="#8b5cf6" />
                            </View>
                          )}
                          
                          {/* Role Badge */}
                          <View 
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: getRoleColor(staff.role) }}
                          >
                            <Ionicons 
                              name={getRoleIcon(staff.role) as any} 
                              size={12} 
                              color="white" 
                            />
                          </View>
                        </View>

                        {/* Staff Info */}
                        <View className="flex-1 ml-4">
                          <Text className="text-white text-lg font-semibold mb-1">
                            {staff.name}
                          </Text>
                          <Text className="text-purple-300 text-sm capitalize mb-1">
                            {staff.role}
                          </Text>
                          {staff.department && (
                            <Text className="text-gray-400 text-xs">
                              {staff.department}
                            </Text>
                          )}
                        </View>

                        {/* Arrow */}
                        <ChevronRight size={20} color="#8b5cf6" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          )}

          {/* Info Card */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={staffProfiles.length * 100 + 200}
            className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl"
          >
            <View className="flex-row items-center mb-2">
              <Shield size={16} color="#3b82f6" />
              <Text className="text-blue-400 font-medium ml-2">Security Notice</Text>
            </View>
            <Text className="text-gray-300 text-sm leading-5">
              You'll need to enter your 4-digit PIN to access your profile. 
              For security, your PIN is never stored on this device.
            </Text>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>

      {/* PIN Entry Modal */}
      {selectedStaff && (
        <PINEntryModal
          visible={showPINModal}
          staffProfile={selectedStaff}
          onSuccess={handlePINSuccess}
          onCancel={handlePINCancel}
        />
      )}
    </View>
  );
}
