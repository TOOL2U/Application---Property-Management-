import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import * as Animatable from 'react-native-animatable';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const { currentProfile, logout } = usePINAuth();
  const router = useRouter();

  // Role-based access
  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);
  const isAdminOrManager = currentProfile?.role && ['admin', 'manager'].includes(currentProfile.role);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will return you to the staff profile selection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              console.log('🚪 Settings: Starting beautiful logout process...');

              // Add smooth transition delay for better UX
              await new Promise(resolve => setTimeout(resolve, 300));

              // Perform the comprehensive logout
              await logout();
              console.log('✅ Settings: Logout completed, navigating to profile selection...');

              // Add smooth transition delay
              await new Promise(resolve => setTimeout(resolve, 300));

              // Navigate to profile selection screen and completely clear navigation stack
              router.replace('/(auth)/select-profile');
              console.log('✅ Settings: Navigation to profile selection completed');

            } catch (error) {
              console.error('❌ Settings: Logout error:', error);

              // Show user-friendly error message
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Logout Complete',
                `You have been successfully signed out.\n\n${errorMessage ? `Note: ${errorMessage}` : ''}`,
                [{
                  text: 'Continue',
                  onPress: () => {
                    // Ensure navigation happens even if there were errors
                    router.replace('/(auth)/select-profile');
                  }
                }]
              );
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@siamoon.com'),
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+1234567890'),
        },
      ]
    );
  };

  const settingsData: SettingItem[] = [
    // Account Section
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline',
      type: 'navigation',
      onPress: () => router.push('/(tabs)/profile'),
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Receive job updates and alerts',
      icon: 'notifications-outline',
      type: 'toggle',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: 'biometric',
      title: 'Biometric Login',
      subtitle: 'Use fingerprint or face ID',
      icon: 'finger-print-outline',
      type: 'toggle',
      value: biometric,
      onToggle: setBiometric,
    },

    // App Settings
    {
      id: 'autoSync',
      title: 'Auto Sync',
      subtitle: 'Automatically sync data when online',
      icon: 'sync-outline',
      type: 'toggle',
      value: autoSync,
      onToggle: setAutoSync,
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English (US)',
      icon: 'language-outline',
      type: 'navigation',
      onPress: () => Alert.alert('Language', 'Language settings coming soon!'),
    },

    // Admin Only Settings
    ...(isAdminOrManager ? [
      {
        id: 'admin-panel',
        title: 'Admin Panel',
        subtitle: 'Access administrative features',
        icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
        type: 'navigation' as const,
        onPress: () => Alert.alert('Admin Panel', 'Admin panel features coming soon!'),
      },
      {
        id: 'manage-staff',
        title: 'Manage Staff',
        subtitle: 'Staff accounts and permissions',
        icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
        type: 'navigation' as const,
        onPress: () => Alert.alert('Staff Management', 'Staff management coming soon!'),
      },
    ] : []),

    // Support & Info
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      icon: 'help-circle-outline',
      type: 'action',
      onPress: handleContactSupport,
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-circle-outline',
      type: 'navigation',
      onPress: () => Alert.alert('About', 'Sia Moon Property Management\nVersion 1.0.0\n\nBuilt with React Native & Expo'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'View our privacy policy',
      icon: 'document-text-outline',
      type: 'action',
      onPress: () => Linking.openURL('https://siamoon.com/privacy'),
    },

    // Danger Zone
    {
      id: 'signout',
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: 'log-out-outline',
      type: 'action',
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444'; // red
      case 'manager': return '#f59e0b'; // orange
      case 'staff': return '#3b82f6'; // blue
      case 'cleaner': return '#10b981'; // green
      case 'maintenance': return '#8b5cf6'; // purple
      default: return '#71717A'; // gray
    }
  };

  const renderSettingItem = (item: SettingItem, index: number) => (
    <Animatable.View
      key={item.id}
      animation="fadeInUp"
      delay={index * 50}
      style={{ marginBottom: 12 }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: '#1C1F2A',
          borderRadius: 16,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#374151',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
        activeOpacity={0.8}
      >
        <View 
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            backgroundColor: item.destructive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(198, 255, 0, 0.2)'
          }}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={item.destructive ? '#ef4444' : '#C6FF00'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: item.destructive ? '#ef4444' : 'white',
            fontFamily: 'Urbanist'
          }}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginTop: 4,
              fontFamily: 'Inter'
            }}>
              {item.subtitle}
            </Text>
          )}
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#374151', true: 'rgba(198, 255, 0, 0.3)' }}
            thumbColor={item.value ? '#C6FF00' : '#9CA3AF'}
            ios_backgroundColor="#374151"
          />
        )}

        {item.type === 'navigation' && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#9CA3AF"
          />
        )}
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={600}
          style={{ marginBottom: 24 }}
        >
          <Text style={{
            color: 'white',
            fontSize: 32,
            fontWeight: 'bold',
            fontFamily: 'Urbanist'
          }}>
            Settings
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 16,
            marginTop: 4,
            fontFamily: 'Inter'
          }}>
            Manage your account and app preferences
          </Text>
        </Animatable.View>

        {/* User Info Card */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          style={{
            backgroundColor: '#1C1F2A',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#374151',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={['#C6FF00', '#A3E635']}
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                padding: 2,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#374151',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {currentProfile?.avatar ? (
                  <Image
                    source={{ uri: currentProfile.avatar }}
                    style={{ width: 64, height: 64, borderRadius: 32 }}
                  />
                ) : (
                  <Text style={{
                    color: '#C6FF00',
                    fontSize: 20,
                    fontWeight: 'bold',
                    fontFamily: 'Urbanist'
                  }}>
                    {getInitials(currentProfile?.name || 'User')}
                  </Text>
                )}
              </View>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '600',
                fontFamily: 'Urbanist'
              }}>
                {currentProfile?.name || 'User'}
              </Text>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                fontFamily: 'Inter'
              }}>
                {currentProfile?.email}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View 
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: '#22c55e'
                  }}
                />
                <Text style={{
                  color: '#22c55e',
                  fontSize: 12,
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  fontFamily: 'Inter'
                }}>
                  {currentProfile?.role || 'Staff'}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Settings List */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {settingsData.map((item, index) => renderSettingItem(item, index))}
        </ScrollView>
      </SafeAreaView>

      {/* Beautiful Logout Overlay with AIS Telecom Styling */}
      <LogoutOverlay
        visible={isSigningOut}
        message="Signing out..."
      />
    </View>
  );
}
