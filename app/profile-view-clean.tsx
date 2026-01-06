import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import { BRAND_COLORS } from '@/constants/BrandTheme';

// User status options
const statusOptions = [
  { id: 'available', label: 'Available', color: '#22c55e', icon: 'checkmark-circle' },
  { id: 'busy', label: 'Busy', color: '#f59e0b', icon: 'time' },
  { id: 'offline', label: 'Offline', color: '#71717A', icon: 'moon' },
] as const;

type UserStatus = typeof statusOptions[number]['id'];

export default function ProfileViewScreen() {
  const { currentProfile, logout, isLoading } = usePINAuth();
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('available');
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const handleStatusChange = (status: UserStatus) => {
    setCurrentStatus(status);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: confirmLogout,
        },
      ]
    );
  };

  const confirmLogout = () => {
    setShowLogoutOverlay(true);
    setTimeout(async () => {
      await logout();
      setShowLogoutOverlay(false);
    }, 2000);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing will be available soon.');
  };

  const currentStatusOption = statusOptions.find(option => option.id === currentStatus) || statusOptions[0];

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.GREY_PRIMARY }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={BRAND_COLORS.YELLOW} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.GREY_PRIMARY }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: BRAND_COLORS.TEXT_PRIMARY, fontSize: 18 }}>No profile data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.GREY_PRIMARY }}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_COLORS.GREY_PRIMARY} />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={BRAND_COLORS.YELLOW} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: BRAND_COLORS.TEXT_PRIMARY,
          marginLeft: 16,
        }}>
          Profile
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color={BRAND_COLORS.YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#1E2A3A', '#0F1419']}
          style={{
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            marginHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#2A3441',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="person" size={40} color="#8E9AAE" />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 4,
          }}>
            {currentProfile.name}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: '#8E9AAE',
            marginBottom: 16,
            textTransform: 'capitalize',
          }}>
            {currentProfile.role}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentStatusOption.color,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}>
            <Ionicons 
              name={currentStatusOption.icon as any} 
              size={16} 
              color="#FFFFFF" 
              style={{ marginRight: 6 }}
            />
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: 14,
            }}>
              {currentStatusOption.label}
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: BRAND_COLORS.TEXT_PRIMARY,
            marginBottom: 16,
          }}>
            Set Your Status
          </Text>
          
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleStatusChange(option.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: currentStatus === option.id ? '#1E2A3A' : BRAND_COLORS.SURFACE_1,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: currentStatus === option.id ? 2 : 0,
                borderColor: currentStatus === option.id ? BRAND_COLORS.YELLOW : 'transparent',
              }}
            >
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: option.color,
                marginRight: 12,
              }} />
              <Ionicons
                name={option.icon as any}
                size={20}
                color={currentStatus === option.id ? BRAND_COLORS.YELLOW : BRAND_COLORS.TEXT_SECONDARY}
                style={{ marginRight: 12 }}
              />
              <Text style={{
                fontSize: 16,
                color: currentStatus === option.id ? BRAND_COLORS.TEXT_PRIMARY : BRAND_COLORS.TEXT_SECONDARY,
                fontWeight: currentStatus === option.id ? '600' : '400',
                flex: 1,
              }}>
                {option.label}
              </Text>
              {currentStatus === option.id && (
                <Ionicons name="checkmark" size={20} color={BRAND_COLORS.YELLOW} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: BRAND_COLORS.TEXT_PRIMARY,
            marginBottom: 16,
          }}>
            Quick Actions
          </Text>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: BRAND_COLORS.SURFACE_1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              marginBottom: 8,
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
            <Text style={{
              fontSize: 16,
              color: BRAND_COLORS.TEXT_SECONDARY,
              marginLeft: 12,
              flex: 1,
            }}>
              Notification Settings
            </Text>
            <Ionicons name="chevron-forward" size={20} color={BRAND_COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: BRAND_COLORS.SURFACE_1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              marginBottom: 8,
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
            <Text style={{
              fontSize: 16,
              color: BRAND_COLORS.TEXT_SECONDARY,
              marginLeft: 12,
              flex: 1,
            }}>
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color={BRAND_COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#2D1B1B',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#DC2626',
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={{
              fontSize: 16,
              color: '#DC2626',
              marginLeft: 12,
              fontWeight: '500',
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogoutOverlay visible={showLogoutOverlay} />
    </SafeAreaView>
  );
}
