import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePINAuth } from "@/contexts/PINAuthContext";

// Enhanced developer navigation item component
const DevNavItem = ({
  icon,
  title,
  route,
  description,
  isEnabled = true,
  onPress,
  index = 0
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  route: string;
  description: string;
  isEnabled?: boolean;
  onPress?: () => void;
  index?: number;
}) => (
  <Animatable.View
    animation="fadeInUp"
    duration={600}
    delay={index * 100}
    className="mb-3"
  >
    <TouchableOpacity
      onPress={onPress}
      disabled={!isEnabled}
      className={`${!isEnabled ? 'opacity-60' : ''}`}
      style={{
        shadowColor: isEnabled ? '#C6FF00' : 'transparent',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="overflow-hidden rounded-2xl border border-white/5">
        {Platform.OS !== 'web' ? (
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
        ) : (
          <View
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          />
        )}

        <LinearGradient
          colors={
            isEnabled
              ? ['rgba(139, 92, 246, 0.15)', 'rgba(59, 130, 246, 0.08)']
              : ['rgba(75, 85, 99, 0.1)', 'rgba(55, 65, 81, 0.05)']
          }
          className="p-4"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row items-center">
            {/* Icon Container */}
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{
                backgroundColor: isEnabled
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(75, 85, 99, 0.2)',
                borderWidth: 1,
                borderColor: isEnabled
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(75, 85, 99, 0.3)',
              }}
            >
              <Ionicons
                name={icon}
                size={24}
                color={isEnabled ? '#8b5cf6' : '#6b7280'}
              />
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text
                className="font-semibold text-base tracking-tight"
                style={{
                  color: isEnabled ? '#ffffff' : '#9ca3af',
                }}
              >
                {title}
              </Text>
              <Text
                className="text-sm mt-1 leading-5"
                style={{
                  color: isEnabled ? '#d1d5db' : '#6b7280',
                }}
              >
                {description}
              </Text>
              <Text
                className="text-xs mt-2 font-mono"
                style={{
                  color: isEnabled ? '#a855f7' : '#6b7280',
                }}
              >
                {route}
              </Text>
            </View>

            {/* Status Indicator */}
            <View className="items-center">
              {isEnabled ? (
                <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center mb-2">
                  <Ionicons name="checkmark" size={16} color="#10b981" />
                </View>
              ) : (
                <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mb-2">
                  <Ionicons name="construct" size={14} color="#f59e0b" />
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isEnabled ? '#8b5cf6' : '#6b7280'}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  </Animatable.View>
);

export default function DevelopersPage() {
  const router = useRouter();
  const { currentProfile } = usePINAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Role-based navigation visibility
  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);
  const isAdminOrManager = currentProfile?.role && ['admin', 'manager'].includes(currentProfile.role);

  const handleNavigation = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      Alert.alert('Navigation Error', `Could not navigate to ${route}. This page may not exist yet.`);
    }
  };

  // Define all navigation items
  const adminNavItems = [
    {
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      title: 'Dashboard',
      route: '/(tabs)/',
      description: 'Main dashboard overview',
      isEnabled: true,
    },
    {
      icon: 'clipboard' as keyof typeof Ionicons.glyphMap,
      title: 'Jobs',
      route: '/(tabs)/jobs',
      description: 'View and manage jobs',
      isEnabled: true,
    },
    {
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      title: 'Bookings',
      route: '/(tabs)/bookings',
      description: 'Manage property bookings',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      title: 'Assign Staff',
      route: '/(tabs)/assign-staff',
      description: 'Assign staff to jobs',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'construct' as keyof typeof Ionicons.glyphMap,
      title: 'Manage Jobs',
      route: '/(tabs)/manage-jobs',
      description: 'Comprehensive job management',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'business' as keyof typeof Ionicons.glyphMap,
      title: 'Properties',
      route: '/(tabs)/properties',
      description: 'Property management',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      title: 'Tenants',
      route: '/(tabs)/tenants',
      description: 'Tenant management',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      title: 'Schedule',
      route: '/(tabs)/schedule',
      description: 'Schedule management',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'build' as keyof typeof Ionicons.glyphMap,
      title: 'Maintenance',
      route: '/(tabs)/maintenance',
      description: 'Maintenance requests',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'card' as keyof typeof Ionicons.glyphMap,
      title: 'Payments',
      route: '/(tabs)/payments',
      description: 'Payment processing',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'map' as keyof typeof Ionicons.glyphMap,
      title: 'Map',
      route: '/(tabs)/map',
      description: 'Property location map',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      title: 'History',
      route: '/(tabs)/history',
      description: 'Transaction history',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      title: 'Profile',
      route: '/(tabs)/profile',
      description: 'User profile settings',
      isEnabled: true,
    },
  ];

  const staffNavItems = [
    {
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      title: 'Dashboard',
      route: '/(tabs)/',
      description: 'Main dashboard overview',
      isEnabled: true,
    },
    {
      icon: 'clipboard' as keyof typeof Ionicons.glyphMap,
      title: 'Active Jobs',
      route: '/(tabs)/jobs',
      description: 'View assigned jobs',
      isEnabled: true,
    },
    {
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      title: 'Profile',
      route: '/(tabs)/profile',
      description: 'User profile settings',
      isEnabled: true,
    },
  ];

  const authNavItems = [
    {
      icon: 'log-in' as keyof typeof Ionicons.glyphMap,
      title: 'Login',
      route: '/(auth)/login',
      description: 'User authentication',
      isEnabled: true,
    },
    {
      icon: 'person-add' as keyof typeof Ionicons.glyphMap,
      title: 'Select Profile',
      route: '/(auth)/select-profile',
      description: 'Profile selection',
      isEnabled: false, // File doesn't exist yet
    },
  ];

  const adminAuthItems = [
    {
      icon: 'shield' as keyof typeof Ionicons.glyphMap,
      title: 'Admin Login',
      route: '/admin/login',
      description: 'Admin authentication',
      isEnabled: false, // File doesn't exist yet
    },
    {
      icon: 'analytics' as keyof typeof Ionicons.glyphMap,
      title: 'Admin Dashboard',
      route: '/admin/dashboard',
      description: 'Admin control panel',
      isEnabled: false, // File doesn't exist yet
    },
  ];

  const currentNavItems = isStaffUser ? staffNavItems : adminNavItems;

  // Filter items based on search query
  const filteredNavItems = currentNavItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuthItems = authNavItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdminAuthItems = adminAuthItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Enhanced Dark Gradient Background */}
        <LinearGradient
          colors={[
            '#0B0F1A', // Primary background
            '#111827', // Secondary surface
            '#1F2937', // Tertiary surface
            '#1C1F2A', // Elevated surface
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <Animatable.View 
          animation="fadeInDown"
          duration={600}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ 
            color: '#F1F1F1', 
            fontSize: 24, 
            fontWeight: 'bold',
            fontFamily: 'Urbanist_700Bold'
          }}>
            Developer Hub
          </Text>
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: 16, 
            marginTop: 4,
            fontFamily: 'Inter_400Regular'
          }}>
            {currentNavItems.length} routes • {isStaffUser ? 'Staff' : 'Admin'} view
          </Text>
        </Animatable.View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Search Bar */}
        <Animatable.View
          animation="fadeInDown"
          duration={600}
          delay={200}
          className="mb-6"
        >
          <View className="relative">
            <View className="overflow-hidden rounded-2xl border border-white/10">
              {Platform.OS !== 'web' ? (
                <BlurView intensity={40} tint="dark" className="absolute inset-0" />
              ) : (
                <View
                  className="absolute inset-0"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                />
              )}
              <View className="flex-row items-center p-4">
                <Ionicons name="search" size={20} color="#8b5cf6" />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder="Search routes..."
                  placeholderTextColor="#6b7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ fontFamily: 'Inter_400Regular' }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* User Info Card */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={300}
          className="mb-6"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={40} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              />
            )}
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              className="p-6"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-2xl bg-purple-500/20 items-center justify-center mr-4">
                  <Ionicons name="person-circle" size={24} color="#8b5cf6" />
                </View>
                <View>
                  <Text className="text-white text-lg font-semibold">
                    {currentProfile?.name || 'Developer'}
                  </Text>
                  <Text className="text-purple-300 text-sm">
                    {currentProfile?.role} • {isStaffUser ? 'Staff Access' : 'Admin Access'}
                  </Text>
                </View>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View className="bg-white/5 rounded-xl p-3">
                  <Text className="text-gray-400 text-xs uppercase tracking-wide">Email</Text>
                  <Text className="text-white text-sm mt-1">{currentProfile?.email}</Text>
                </View>
                <View className="bg-white/5 rounded-xl p-3">
                  <Text className="text-gray-400 text-xs uppercase tracking-wide">Routes</Text>
                  <Text className="text-white text-sm mt-1">{currentNavItems.length} available</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animatable.View>

        {/* Enhanced Quick Stats */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={400}
          className="mb-8"
        >
          <Text
            className="text-white text-xl font-bold mb-6 tracking-tight"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {searchQuery ? 'Search Results' : 'Route Overview'}
          </Text>

          <View className="flex-row gap-3">
            {/* Active Routes */}
            <View className="flex-1">
              <View className="overflow-hidden rounded-2xl border border-green-500/20">
                {Platform.OS !== 'web' ? (
                  <BlurView intensity={30} tint="dark" className="absolute inset-0" />
                ) : (
                  <View
                    className="absolute inset-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  />
                )}
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.08)']}
                  className="p-4 items-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View className="w-12 h-12 rounded-2xl bg-green-500/20 items-center justify-center mb-3">
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                  <Text className="text-white font-bold text-2xl">
                    {searchQuery
                      ? filteredNavItems.filter(item => item.isEnabled).length
                      : currentNavItems.filter(item => item.isEnabled).length
                    }
                  </Text>
                  <Text className="text-green-300 text-sm font-medium">Active</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Pending Routes */}
            <View className="flex-1">
              <View className="overflow-hidden rounded-2xl border border-orange-500/20">
                {Platform.OS !== 'web' ? (
                  <BlurView intensity={30} tint="dark" className="absolute inset-0" />
                ) : (
                  <View
                    className="absolute inset-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  />
                )}
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.15)', 'rgba(217, 119, 6, 0.08)']}
                  className="p-4 items-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View className="w-12 h-12 rounded-2xl bg-orange-500/20 items-center justify-center mb-3">
                    <Ionicons name="construct" size={24} color="#f59e0b" />
                  </View>
                  <Text className="text-white font-bold text-2xl">
                    {searchQuery
                      ? filteredNavItems.filter(item => !item.isEnabled).length
                      : currentNavItems.filter(item => !item.isEnabled).length
                    }
                  </Text>
                  <Text className="text-orange-300 text-sm font-medium">Pending</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Total Routes */}
            <View className="flex-1">
              <View className="overflow-hidden rounded-2xl border border-purple-500/20">
                {Platform.OS !== 'web' ? (
                  <BlurView intensity={30} tint="dark" className="absolute inset-0" />
                ) : (
                  <View
                    className="absolute inset-0"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  />
                )}
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.15)', 'rgba(124, 58, 237, 0.08)']}
                  className="p-4 items-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View className="w-12 h-12 rounded-2xl bg-purple-500/20 items-center justify-center mb-3">
                    <Ionicons name="apps" size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-white font-bold text-2xl">
                    {searchQuery
                      ? filteredNavItems.length + filteredAuthItems.length + filteredAdminAuthItems.length
                      : currentNavItems.length + authNavItems.length + adminAuthItems.length
                    }
                  </Text>
                  <Text className="text-purple-300 text-sm font-medium">Total</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Main Navigation Section */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={500}
          className="mb-8"
        >
          <Text
            className="text-white text-xl font-bold mb-6 tracking-tight"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {isStaffUser ? 'Staff Navigation' : 'Admin Navigation'}
            <Text className="text-purple-400 text-base font-normal">
              {' '}({filteredNavItems.length} routes)
            </Text>
          </Text>

          {filteredNavItems.length === 0 ? (
            <View className="overflow-hidden rounded-2xl border border-white/10">
              {Platform.OS !== 'web' ? (
                <BlurView intensity={30} tint="dark" className="absolute inset-0" />
              ) : (
                <View
                  className="absolute inset-0"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                />
              )}
              <View className="p-8 items-center">
                <View className="w-16 h-16 rounded-2xl bg-gray-500/20 items-center justify-center mb-4">
                  <Ionicons name="search" size={32} color="#6b7280" />
                </View>
                <Text className="text-gray-400 text-center text-lg font-medium">
                  No routes found
                </Text>
                <Text className="text-gray-500 text-center text-sm mt-2">
                  Try adjusting your search query
                </Text>
              </View>
            </View>
          ) : (
            filteredNavItems.map((item, index) => (
              <DevNavItem
                key={index}
                icon={item.icon}
                title={item.title}
                route={item.route}
                description={item.description}
                isEnabled={item.isEnabled}
                onPress={() => handleNavigation(item.route)}
                index={index}
              />
            ))
          )}
        </Animatable.View>

        {/* Authentication Routes */}
        {filteredAuthItems.length > 0 && (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={600}
            className="mb-8"
          >
            <Text
              className="text-white text-xl font-bold mb-6 tracking-tight"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Authentication Routes
              <Text className="text-blue-400 text-base font-normal">
                {' '}({filteredAuthItems.length} routes)
              </Text>
            </Text>
            {filteredAuthItems.map((item, index) => (
              <DevNavItem
                key={index}
                icon={item.icon}
                title={item.title}
                route={item.route}
                description={item.description}
                isEnabled={item.isEnabled}
                onPress={() => handleNavigation(item.route)}
                index={index}
              />
            ))}
          </Animatable.View>
        )}

        {/* Admin Routes */}
        {filteredAdminAuthItems.length > 0 && (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={700}
            className="mb-8"
          >
            <Text
              className="text-white text-xl font-bold mb-6 tracking-tight"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              Admin Routes
              <Text className="text-red-400 text-base font-normal">
                {' '}({filteredAdminAuthItems.length} routes)
              </Text>
            </Text>
            {filteredAdminAuthItems.map((item, index) => (
              <DevNavItem
                key={index}
                icon={item.icon}
                title={item.title}
                route={item.route}
                description={item.description}
                isEnabled={item.isEnabled}
                onPress={() => handleNavigation(item.route)}
                index={index}
              />
            ))}
          </Animatable.View>
        )}

          {/* Bottom spacing for safe scrolling */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
