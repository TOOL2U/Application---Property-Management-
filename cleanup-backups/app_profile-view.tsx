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

export default function ProfileViewScreen() {
  const { currentProfile, logout, isLoading } = usePINAuth();
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('available');
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);

  const handleStatusChange = (status: UserStatus) => {
    setCurrentStatus(status);
    // Here you would typically save the status to your backend
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

  const confirmLogout = async () => {
    setShowLogoutOverlay(true);
    try {
      console.log('🚪 ProfileView: Starting logout process...');
      await logout();
      router.replace('/(auth)/select-profile');
    } catch (error) {
      console.error('❌ ProfileView: Logout error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setShowLogoutOverlay(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(modal)/edit-profile');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#C6FF00" />
          <Text style={{ color: '#FFFFFF', marginTop: 16 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18 }}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusOption = statusOptions.find(option => option.id === currentStatus) || statusOptions[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
          Profile
        </Text>
        <TouchableOpacity onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={24} color="#C6FF00" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Header */}
        <Animatable.View animation="fadeInUp" duration={600} style={{ padding: 20 }}>
          <LinearGradient
            colors={['#1E2A3A', '#0F1419']}
            style={{
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
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
              marginBottom: 8,
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
        </Animatable.View>

        {/* Status Selection */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: 16,
            }}>
              Set Your Status
            </Text>
            
            {statusOptions.map((status, index) => (
              <TouchableOpacity
                key={status.id}
                onPress={() => handleStatusChange(status.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: currentStatus === status.id ? '#1E2A3A' : 'transparent',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: currentStatus === status.id ? status.color : '#1E2A3A',
                }}
              >
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: status.color,
                  marginRight: 12,
                }} />
                <Ionicons 
                  name={status.icon as any} 
                  size={20} 
                  color={status.color} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                  fontWeight: currentStatus === status.id ? '600' : '400',
                  flex: 1,
                }}>
                  {status.label}
                </Text>
                {currentStatus === status.id && (
                  <Ionicons name="checkmark" size={20} color={status.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        {/* Profile Info */}
        <Animatable.View animation="fadeInUp" duration={1000} delay={400}>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: 16,
            }}>
              Profile Information
            </Text>
            
            <View style={{
              backgroundColor: '#1E2A3A',
              borderRadius: 12,
              padding: 16,
            }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#8E9AAE', fontSize: 14, marginBottom: 4 }}>
                  Email Address
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                  {currentProfile.email}
                </Text>
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#8E9AAE', fontSize: 14, marginBottom: 4 }}>
                  Staff ID
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                  {currentProfile.id}
                </Text>
              </View>
              
              <View>
                <Text style={{ color: '#8E9AAE', fontSize: 14, marginBottom: 4 }}>
                  Role
                </Text>
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 16,
                  textTransform: 'capitalize',
                }}>
                  {currentProfile.role}
                </Text>
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Actions */}
        <Animatable.View animation="fadeInUp" duration={1200} delay={600}>
          <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={{
                backgroundColor: '#C6FF00',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{
                color: '#0B0F1A',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                borderWidth: 1,
                borderColor: '#FF4444',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#FF4444',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>

      <LogoutOverlay visible={showLogoutOverlay} />
    </SafeAreaView>
  );
}
