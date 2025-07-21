/**
 * Staff Profile Selection Screen - AIS Telecom Style
 * Beautiful card-based design with neon green accents and dark theme
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { StaffProfile } from '@/services/localStaffService';

const { width: screenWidth } = Dimensions.get('window');

export default function SelectProfileScreen() {
  const router = useRouter();
  const {
    staffProfiles,
    getStaffProfiles,
    isLoading,
    hasProfilePIN,
    refreshStaffProfiles
  } = usePINAuth();

  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('📱 SelectProfile: Component mounted, loading profiles...');
    loadProfiles();
  }, []);

  useEffect(() => {
    console.log('📱 SelectProfile: staffProfiles state changed:', {
      count: staffProfiles.length,
      profiles: staffProfiles.map(p => ({ id: p.id, name: p.name, email: p.email }))
    });
  }, [staffProfiles]);

  const loadProfiles = async () => {
    console.log('📱 SelectProfile: loadProfiles called');
    await getStaffProfiles();
    console.log('📱 SelectProfile: getStaffProfiles completed');
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshStaffProfiles();
      console.log('✅ Profile Selection: Staff profiles refreshed');
    } catch (error) {
      console.error('❌ Profile Selection: Failed to refresh profiles:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileSelect = async (profile: StaffProfile) => {
    try {
      setLoadingProfileId(profile.id);

      // Check if profile has a PIN
      const hasPIN = await hasProfilePIN(profile.id);

      // Navigate to appropriate screen
      if (hasPIN) {
        // Navigate to PIN entry screen
        router.push({
          pathname: '/(auth)/enter-pin',
          params: { profileId: profile.id }
        });
      } else {
        // Navigate to create PIN screen
        router.push({
          pathname: '/(auth)/create-pin',
          params: { profileId: profile.id }
        });
      }
    } catch (error) {
      console.error('Error selecting profile:', error);
    } finally {
      setLoadingProfileId(null);
    }
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

  if (isLoading && staffProfiles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F1A] px-4 pt-8">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#C6FF00" />
          <Text className="text-white text-base mt-4">Loading staff accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <View style={{ flex: 1 }} />
          <Animatable.View
            animation="fadeInDown"
            duration={600}
            style={{ alignItems: 'center' }}
          >
            <Text style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 8,
              fontFamily: 'Urbanist'
            }}>
              Select Profile
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              textAlign: 'center',
              fontFamily: 'Inter'
            }}>
              Choose your staff profile to continue
            </Text>
          </Animatable.View>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: isRefreshing ? '#374151' : '#1C1F2A',
              borderWidth: 1,
              borderColor: isRefreshing ? '#6B7280' : '#C6FF00',
            }}
          >
            <Ionicons
              name={isRefreshing ? "sync" : "refresh"}
              size={20}
              color={isRefreshing ? '#9CA3AF' : '#C6FF00'}
            />
          </TouchableOpacity>
        </View>

        {/* Staff Profiles List */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {staffProfiles.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={64} color="#71717A" />
              <Text style={{ color: 'white', fontSize: 18, marginTop: 16, textAlign: 'center', fontFamily: 'Inter' }}>
                No staff accounts available
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Inter', paddingHorizontal: 32 }}>
                No active staff accounts found in the system. Please contact your administrator.
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 24,
                  backgroundColor: '#C6FF00',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
                onPress={loadProfiles}
              >
                <Text style={{ color: '#0B0F1A', fontWeight: '600', fontFamily: 'Inter' }}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            staffProfiles.map((profile, index) => (
              <Animatable.View
                key={profile.id}
                animation="fadeInUp"
                duration={600}
                delay={index * 100}
                style={{ marginBottom: 16 }}
              >
                <TouchableOpacity
                  onPress={() => handleProfileSelect(profile)}
                  disabled={loadingProfileId === profile.id}
                  style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#374151',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Avatar with Gradient Border */}
                    <View style={{ marginRight: 16 }}>
                      <LinearGradient
                        colors={['#C6FF00', '#A3E635']}
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 34,
                          padding: 2,
                          alignItems: 'center',
                          justifyContent: 'center',
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
                          {profile.avatar ? (
                            <Image
                              source={{ uri: profile.avatar }}
                              style={{ width: 64, height: 64, borderRadius: 32 }}
                            />
                          ) : (
                            <Text style={{
                              color: '#C6FF00',
                              fontSize: 20,
                              fontWeight: 'bold',
                              fontFamily: 'Urbanist'
                            }}>
                              {getInitials(profile.name)}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Profile Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: '600',
                        marginBottom: 4,
                        fontFamily: 'Urbanist'
                      }}>
                        {profile.name}
                      </Text>
                      <Text style={{
                        color: '#9CA3AF',
                        fontSize: 14,
                        marginBottom: 8,
                        fontFamily: 'Inter'
                      }}>
                        {profile.email}
                      </Text>

                      {/* Role Badge */}
                      <View style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: getRoleBadgeColor(profile.role),
                      }}>
                        <Text style={{
                          color: 'white',
                          fontSize: 12,
                          fontWeight: '500',
                          textTransform: 'capitalize',
                          fontFamily: 'Inter'
                        }}>
                          {profile.role}
                        </Text>
                      </View>
                    </View>

                    {/* Loading or Arrow */}
                    <View style={{ marginLeft: 16 }}>
                      {loadingProfileId === profile.id ? (
                        <ActivityIndicator size="small" color="#C6FF00" />
                      ) : (
                        <Ionicons name="chevron-forward" size={24} color="#C6FF00" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
        </ScrollView>

        {/* App Info Footer */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={staffProfiles.length * 100 + 200}
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTopWidth: 1,
            borderTopColor: '#374151',
            alignItems: 'center',
            marginBottom: 32
          }}
        >
          <Text style={{
            color: '#6B7280',
            fontSize: 14,
            textAlign: 'center',
            fontFamily: 'Inter'
          }}>
            Property Management System v1.0
          </Text>
        </Animatable.View>
      </SafeAreaView>
    </View>
  );
}
