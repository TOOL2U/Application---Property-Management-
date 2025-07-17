import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useRouter } from 'expo-router';
import { NeumorphicTheme } from '../../constants/NeumorphicTheme';

const { width: screenWidth } = Dimensions.get('window');

// Feature items for the dashboard grid
const DASHBOARD_FEATURES = [
  { 
    id: 'properties', 
    title: 'Properties', 
    icon: 'home-outline', 
    route: '/properties',
    color: NeumorphicTheme.colors.brand.primary 
  },
  { 
    id: 'bookings', 
    title: 'Bookings', 
    icon: 'calendar-outline', 
    route: '/bookings',
    color: NeumorphicTheme.colors.semantic.info 
  },
  { 
    id: 'tasks', 
    title: 'Tasks', 
    icon: 'checkbox-outline', 
    route: '/tasks',
    color: NeumorphicTheme.colors.semantic.warning 
  },
  { 
    id: 'maintenance', 
    title: 'Maintenance', 
    icon: 'construct-outline', 
    route: '/maintenance',
    color: NeumorphicTheme.colors.semantic.error 
  },
  { 
    id: 'guests', 
    title: 'Guests', 
    icon: 'people-outline', 
    route: '/guests',
    color: NeumorphicTheme.colors.semantic.success 
  },
  { 
    id: 'reports', 
    title: 'Reports', 
    icon: 'stats-chart-outline', 
    route: '/reports',
    color: NeumorphicTheme.colors.brand.primary 
  },
  { 
    id: 'settings', 
    title: 'Settings', 
    icon: 'settings-outline', 
    route: '/settings',
    color: NeumorphicTheme.colors.semantic.info 
  },
  { 
    id: 'more', 
    title: 'More', 
    icon: 'grid-outline', 
    route: '/more',
    color: NeumorphicTheme.colors.text.secondary 
  },
];

export default function IndexScreen() {
  const { currentProfile, isAuthenticated } = usePINAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Format current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle feature press
  const handleFeaturePress = (feature: typeof DASHBOARD_FEATURES[0]) => {
    if (feature.route) {
      router.push(feature.route as any);
    }
  };

  // Handle login press
  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  // Handle profile selection
  const handleProfilePress = () => {
    router.push('/(auth)/select-staff-profile');
  };

  // Feature grid item component
  const FeatureItem = ({ feature }: { feature: typeof DASHBOARD_FEATURES[0] }) => (
    <TouchableOpacity
      onPress={() => handleFeaturePress(feature)}
      style={{
        width: (screenWidth - 80) / 4,
        aspectRatio: 1,
        backgroundColor: NeumorphicTheme.colors.surface.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        ...NeumorphicTheme.shadows.card,
      }}
    >
      <Ionicons 
        name={feature.icon as any} 
        size={24} 
        color={feature.color} 
        style={{ marginBottom: 8 }}
      />
      <Text style={{
        color: NeumorphicTheme.colors.text.primary,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
      }}>
        {feature.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={NeumorphicTheme.gradients.background}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={NeumorphicTheme.colors.background.primary} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}>
            {/* User Profile */}
            <TouchableOpacity
              onPress={handleProfilePress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: NeumorphicTheme.colors.surface.primary,
                borderWidth: 2,
                borderColor: NeumorphicTheme.colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={NeumorphicTheme.colors.brand.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: NeumorphicTheme.colors.text.primary,
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Hello
                </Text>
                <Text style={{
                  color: NeumorphicTheme.colors.text.secondary,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  {currentProfile ? currentProfile.name : 'Staff Member'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Header Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: NeumorphicTheme.colors.surface.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="search" size={20} color={NeumorphicTheme.colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: NeumorphicTheme.colors.surface.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="notifications" size={20} color={NeumorphicTheme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Authentication Status */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            style={{
              marginHorizontal: 20,
              marginBottom: 32,
              backgroundColor: NeumorphicTheme.colors.surface.primary,
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              ...NeumorphicTheme.shadows.card,
            }}
          >
            <Text style={{
              color: NeumorphicTheme.colors.text.primary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
            }}>
              {isAuthenticated && currentProfile 
                ? 'Welcome to Property Management'
                : 'You are not logged in'
              }
            </Text>

            {!isAuthenticated || !currentProfile ? (
              <View style={{ width: '100%' }}>
                <TouchableOpacity
                  onPress={handleLoginPress}
                  style={{
                    backgroundColor: NeumorphicTheme.colors.brand.primary,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{
                    color: NeumorphicTheme.colors.text.inverse,
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={{
                    borderWidth: 1,
                    borderColor: NeumorphicTheme.colors.border.default,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: NeumorphicTheme.colors.text.primary,
                    fontSize: 16,
                    fontWeight: '500',
                  }}>
                    Select Staff Profile
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{
                backgroundColor: NeumorphicTheme.colors.semantic.successMuted,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: NeumorphicTheme.colors.semantic.success,
              }}>
                <Text style={{
                  color: NeumorphicTheme.colors.semantic.success,
                  fontSize: 14,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  ✓ Logged in as {currentProfile.name}
                </Text>
              </View>
            )}
          </Animatable.View>

          {/* Features Grid */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
              {DASHBOARD_FEATURES.map((feature, index) => (
                <Animatable.View
                  key={feature.id}
                  animation="fadeInUp"
                  duration={600}
                  delay={index * 100}
                >
                  <FeatureItem feature={feature} />
                </Animatable.View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
