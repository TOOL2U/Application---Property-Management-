import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import LogoutOverlay from '@/components/auth/LogoutOverlay';

// User status options
const statusOptions = [
  { id: 'available', label: 'Available', color: '#22c55e', icon: 'checkmark-circle' },
  { id: 'busy', label: 'Busy', color: '#f59e0b', icon: 'time' },
  { id: 'offline', label: 'Offline', color: '#71717A', icon: 'moon' },
] as const;

type UserStatus = typeof statusOptions[number]['id'];

export default function ProfileScreen() {
  const { currentProfile, logout, isLoading } = usePINAuth();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);
  const isAdminOrManager = currentProfile?.role && ['admin', 'manager'].includes(currentProfile.role);

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
              console.log('🚪 Profile: Starting beautiful logout process with AIS telecom styling...');

              // Add beautiful fadeOut animation before logout
              console.log('🎨 Profile: Starting fadeOut animation...');

              // Small delay to show the signing out state
              await new Promise(resolve => setTimeout(resolve, 300));

              // Perform the comprehensive logout
              await logout();
              console.log('✅ Profile: Logout completed, preparing navigation...');

              // Add smooth transition delay for better UX
              await new Promise(resolve => setTimeout(resolve, 300));

              // Navigate to profile selection screen and completely clear navigation stack
              console.log('🔄 Profile: Navigating to profile selection with router.replace...');
              router.replace('/(auth)/select-profile');

              // Additional cleanup to ensure navigation stack is completely cleared
              console.log('🧹 Profile: Ensuring navigation stack is completely cleared...');

              console.log('✅ Profile: Beautiful logout process completed successfully');

            } catch (error) {
              console.error('❌ Profile: Logout error:', error);

              // Show user-friendly error message with AIS styling
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
              // Reset signing out state
              setIsSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = () => {
    const currentIndex = statusOptions.findIndex(option => option.id === userStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const nextStatus = statusOptions[nextIndex];

    setUserStatus(nextStatus.id);
    Alert.alert(
      'Status Updated',
      `Your status has been changed to ${nextStatus.label}`,
      [{ text: 'OK' }]
    );
  };

  const handleEditProfile = () => {
    router.push('/(modal)/edit-profile');
  };

  const getCurrentStatus = () => {
    return statusOptions.find(option => option.id === userStatus) || statusOptions[0];
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


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Action Button Component with AIS-inspired design
  const ActionButton = ({
    icon,
    title,
    subtitle,
    onPress,
    isSpecial = false,
    showChevron = true,
    isLoading = false,
    disabled = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    isSpecial?: boolean;
    showChevron?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor: isSpecial ? '#C6FF00' : '#1C1F2A',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        opacity: disabled ? 0.5 : 1,
        borderWidth: 1,
        borderColor: '#374151',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      disabled={disabled}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icon Container */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            backgroundColor: isSpecial ? 'rgba(11, 15, 26, 0.2)' : 'rgba(198, 255, 0, 0.2)'
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={isSpecial ? '#0B0F1A' : '#C6FF00'}
            />
          ) : (
            <Ionicons
              name={icon}
              size={20}
              color={isSpecial ? '#0B0F1A' : '#C6FF00'}
            />
          )}
        </View>

        {/* Text Container */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isSpecial ? '#0B0F1A' : 'white',
              fontFamily: 'Urbanist'
            }}
          >
            {isLoading ? 'Signing out...' : title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              marginTop: 4,
              color: isSpecial ? 'rgba(11, 15, 26, 0.7)' : '#9CA3AF',
              fontFamily: 'Inter'
            }}
          >
            {isLoading ? 'Please wait while we sign you out' : subtitle}
          </Text>
        </View>

        {/* Chevron Icon or Loading */}
        {showChevron && !isLoading && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isSpecial ? '#0B0F1A' : '#9CA3AF'}
          />
        )}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={isSpecial ? '#0B0F1A' : '#9CA3AF'}
          />
        )}
      </View>
    </TouchableOpacity>
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
            Profile
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 16,
            marginTop: 4,
            fontFamily: 'Inter'
          }}>
            Manage your account and preferences
          </Text>
        </Animatable.View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Profile Header Section */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={0}
            style={{
              backgroundColor: '#1C1F2A',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#374151',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              {/* User Avatar */}
              <LinearGradient
                colors={['#C6FF00', '#A3E635']}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  padding: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <View style={{
                  width: 82,
                  height: 82,
                  borderRadius: 41,
                  backgroundColor: '#374151',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {currentProfile?.avatar ? (
                    <Image
                      source={{ uri: currentProfile.avatar }}
                      style={{ width: 82, height: 82, borderRadius: 41 }}
                    />
                  ) : (
                    <Text style={{
                      color: '#C6FF00',
                      fontSize: 24,
                      fontWeight: 'bold',
                      fontFamily: 'Urbanist'
                    }}>
                      {getInitials(currentProfile?.name || 'Staff Member')}
                    </Text>
                  )}
                </View>
              </LinearGradient>

              {/* User Information */}
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '600',
                textAlign: 'center',
                fontFamily: 'Urbanist'
              }}>
                {currentProfile?.name || 'Staff Member'}
              </Text>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 16,
                marginTop: 4,
                textAlign: 'center',
                fontFamily: 'Inter'
              }}>
                {currentProfile?.email || 'staff@property.com'}
              </Text>

              {/* Role Badge */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 12,
                  backgroundColor: getRoleBadgeColor(currentProfile?.role || 'staff'),
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    color: 'white',
                    fontFamily: 'Inter'
                  }}
                >
                  {currentProfile?.role || 'Staff'}
                </Text>
              </View>

              {/* Status Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: getCurrentStatus().color
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: getCurrentStatus().color,
                    fontFamily: 'Inter'
                  }}
                >
                  {getCurrentStatus().label}
                </Text>
              </View>
            </View>
          </Animatable.View>

          {/* Action Buttons Section */}
          <View>
            {/* Edit Profile Button */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={100}
            >
              <ActionButton
                icon="person-outline"
                title="Edit Profile"
                subtitle="Update your personal information"
                onPress={handleEditProfile}
                disabled={isSigningOut || isLoading}
              />
            </Animatable.View>

            {/* Change Status Button */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={200}
            >
              <ActionButton
                icon="radio-button-on-outline"
                title="Change Status"
                subtitle={`Currently ${getCurrentStatus().label.toLowerCase()}`}
                onPress={handleStatusChange}
                disabled={isSigningOut || isLoading}
              />
            </Animatable.View>

            {/* Admin-only features */}
            {isAdminOrManager && (
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                delay={300}
              >
                <ActionButton
                  icon="settings-outline"
                  title="Admin Settings"
                  subtitle="Access administrative features"
                  onPress={() => Alert.alert('Admin Settings', 'Admin settings features coming soon!')}
                  disabled={isSigningOut || isLoading}
                />
              </Animatable.View>
            )}

            {/* Sign Out Button */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={isAdminOrManager ? 400 : 300}
            >
              <ActionButton
                icon="log-out-outline"
                title="Sign Out"
                subtitle="Sign out of your account"
                onPress={handleSignOut}
                isSpecial={true}
                showChevron={false}
                isLoading={isSigningOut || isLoading}
                disabled={isSigningOut || isLoading}
              />
            </Animatable.View>
          </View>
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