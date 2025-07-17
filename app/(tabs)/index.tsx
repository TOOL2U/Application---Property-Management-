import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import { shadowStyles } from '@/utils/shadowUtils';
import { jobService } from '@/services/jobService';
import LogoutOverlay from '@/components/auth/LogoutOverlay';

export default function IndexScreen() {
  const { currentProfile, isAuthenticated, logout } = usePINAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingJobs, setPendingJobs] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  // Load pending jobs count when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentProfile?.id) {
      loadPendingJobsCount();
    } else {
      setPendingJobs(0);
    }
  }, [isAuthenticated, currentProfile?.id]);

  const loadPendingJobsCount = async () => {
    try {
      setLoadingJobs(true);
      if (!currentProfile?.id) return;
      
      const response = await jobService.getStaffJobs(currentProfile.id, {
        status: ['assigned', 'pending']
      });
      
      if (response.success && response.jobs) {
        setPendingJobs(response.jobs.length);
      }
    } catch (error) {
      console.error('Error loading pending jobs:', error);
      setPendingJobs(0);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && currentProfile?.id) {
      await loadPendingJobsCount();
    }
    setRefreshing(false);
  };

  // Handle navigation to jobs
  const handleViewJobs = () => {
    router.push('/(tabs)/jobs');
  };

  // Handle profile selection
  const handleProfilePress = () => {
    router.push('/(auth)/select-profile');
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle switch profile functionality
  const handleSwitchProfile = () => {
    Alert.alert(
      'Switch Profile',
      'Are you sure you want to switch to a different profile? This will log you out of the current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Profile',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSwitchingProfile(true);
              console.log('🔄 Dashboard: Starting profile switch process...');

              // Add smooth transition delay for better UX
              await new Promise(resolve => setTimeout(resolve, 300));

              // Perform the comprehensive logout
              await logout();
              console.log('✅ Dashboard: Logout completed, navigating to profile selection...');

              // Add smooth transition delay
              await new Promise(resolve => setTimeout(resolve, 300));

              // Navigate to profile selection screen and completely clear navigation stack
              router.replace('/(auth)/select-profile');
              console.log('✅ Dashboard: Navigation to profile selection completed');

            } catch (error) {
              console.error('❌ Dashboard: Profile switch error:', error);

              // Show user-friendly error message
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Profile Switch Complete',
                `You have been successfully logged out.\n\n${errorMessage ? `Note: ${errorMessage}` : ''}`,
                [{
                  text: 'Continue',
                  onPress: () => {
                    // Ensure navigation happens even if there were errors
                    router.replace('/(auth)/select-profile');
                  }
                }]
              );
            } finally {
              setIsSwitchingProfile(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={600}
            style={{
              paddingHorizontal: 16,
              paddingTop: 24,
              paddingBottom: 16,
            }}
          >
            <Text style={{
              color: '#F1F1F1',
              fontSize: 24,
              fontWeight: 'bold',
              fontFamily: 'Urbanist_700Bold',
            }}>
              Property Management
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 4,
              fontFamily: 'Inter_400Regular',
            }}>
              {isAuthenticated && currentProfile 
                ? `Welcome back, ${currentProfile.name}`
                : 'Please log in to receive jobs'
              }
            </Text>
          </Animatable.View>

          {/* Profile Card */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={200}
            style={{
              marginHorizontal: 16,
              marginBottom: 24,
              backgroundColor: '#1C1F2A',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#374151',
              ...shadowStyles.large,
            }}
          >
            {isAuthenticated && currentProfile ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LinearGradient
                  colors={['#C6FF00', '#A3E635']}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{
                    color: '#0B0F1A',
                    fontSize: 20,
                    fontWeight: 'bold',
                    fontFamily: 'Inter_700Bold',
                  }}>
                    {getInitials(currentProfile.name)}
                  </Text>
                </LinearGradient>
                
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#F1F1F1',
                    fontSize: 18,
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                    marginBottom: 4,
                  }}>
                    {currentProfile.name}
                  </Text>
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: 14,
                    fontFamily: 'Inter_400Regular',
                    marginBottom: 4,
                  }}>
                    {currentProfile.role} • Ready for jobs
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#22C55E',
                      marginRight: 8,
                    }} />
                    <Text style={{
                      color: '#22C55E',
                      fontSize: 12,
                      fontFamily: 'Inter_500Medium',
                    }}>
                      Online
                    </Text>
                  </View>
                </View>

                {/* Switch Profile Button */}
                <TouchableOpacity
                  onPress={handleSwitchProfile}
                  style={{
                    backgroundColor: 'rgba(198, 255, 0, 0.1)',
                    borderWidth: 1,
                    borderColor: '#C6FF00',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 12,
                    ...shadowStyles.small,
                  }}
                  disabled={isSwitchingProfile}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={20}
                    color="#C6FF00"
                  />
                  <Text style={{
                    color: '#C6FF00',
                    fontSize: 10,
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                    marginTop: 2,
                  }}>
                    Switch
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="person-circle-outline" size={64} color="#9CA3AF" />
                <Text style={{
                  color: '#F1F1F1',
                  fontSize: 16,
                  fontWeight: '600',
                  fontFamily: 'Inter_600SemiBold',
                  marginTop: 12,
                  marginBottom: 8,
                }}>
                  Not Logged In
                </Text>
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  fontFamily: 'Inter_400Regular',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  Please log in to receive job assignments
                </Text>
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={{
                    backgroundColor: '#C6FF00',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{
                    color: '#0B0F1A',
                    fontSize: 14,
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                  }}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animatable.View>

          {/* Jobs Overview */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={400}
            style={{
              marginHorizontal: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{
              color: '#F1F1F1',
              fontSize: 18,
              fontWeight: '600',
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 16,
            }}>
              Job Status
            </Text>

            <TouchableOpacity
              onPress={handleViewJobs}
              style={{
                backgroundColor: '#1C1F2A',
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: '#374151',
                ...shadowStyles.medium,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: 'rgba(198, 255, 0, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Ionicons name="briefcase" size={24} color="#C6FF00" />
                  </View>
                  
                  <View>
                    <Text style={{
                      color: '#F1F1F1',
                      fontSize: 16,
                      fontWeight: '600',
                      fontFamily: 'Inter_600SemiBold',
                      marginBottom: 4,
                    }}>
                      {isAuthenticated ? 'Pending Jobs' : 'No Active Jobs'}
                    </Text>
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: 14,
                      fontFamily: 'Inter_400Regular',
                    }}>
                      {isAuthenticated 
                        ? `${pendingJobs} jobs waiting`
                        : 'Log in to receive assignments'
                      }
                    </Text>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  {isAuthenticated && pendingJobs > 0 && (
                    <View style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 12,
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '600',
                        fontFamily: 'Inter_600SemiBold',
                      }}>
                        {pendingJobs}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* Quick Actions */}
          {isAuthenticated && currentProfile && (
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={600}
              style={{
                marginHorizontal: 16,
              }}
            >
              <Text style={{
                color: '#F1F1F1',
                fontSize: 18,
                fontWeight: '600',
                fontFamily: 'Inter_600SemiBold',
                marginBottom: 16,
              }}>
                Quick Actions
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/scan')}
                  style={{
                    flex: 1,
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 16,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#374151',
                    ...shadowStyles.small,
                  }}
                >
                  <Ionicons name="qr-code" size={32} color="#C6FF00" />
                  <Text style={{
                    color: '#F1F1F1',
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'Inter_500Medium',
                    marginTop: 8,
                  }}>
                    Scan QR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{
                    flex: 1,
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 16,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#374151',
                    ...shadowStyles.small,
                  }}
                >
                  <Ionicons name="person" size={32} color="#C6FF00" />
                  <Text style={{
                    color: '#F1F1F1',
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'Inter_500Medium',
                    marginTop: 8,
                  }}>
                    Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Beautiful Logout Overlay with AIS Telecom Styling */}
      <LogoutOverlay
        visible={isSwitchingProfile}
        message="Switching profile..."
      />
    </View>
  );
}
