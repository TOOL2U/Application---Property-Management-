import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import { shadowStyles } from '@/utils/shadowUtils';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import { useTranslation } from '@/hooks/useTranslation';

export default function IndexScreen() {
  const { currentProfile, isAuthenticated, logout } = usePINAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  // Use the useStaffJobs hook to get pending jobs
  const { pendingJobs, refreshJobs, loading: loadingJobs } = useStaffJobs({
    enableRealtime: true,
    enableCache: true,
  });

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && currentProfile?.id) {
      await refreshJobs();
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
                `You have been successfully logged out.\\n\\n${errorMessage ? `Note: ${errorMessage}` : ''}`,
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
                ? t('home.welcomeBack', { name: currentProfile.name })
                : t('home.pleaseLogin')
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
                {/* Profile Photo or Initials */}
                {currentProfile.avatar ? (
                  <Image
                    source={{ uri: currentProfile.avatar }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginRight: 16,
                    }}
                  />
                ) : (
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
                )}
                
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
                    {t('home.switch')}
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
                  {t('home.notLoggedIn')}
                </Text>
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  fontFamily: 'Inter_400Regular',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                  {t('home.pleaseLoginToReceiveJobs')}
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
                    {t('auth.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animatable.View>

          {/* Central JOBS Button */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={400}
            style={{
              marginHorizontal: 32,
              marginBottom: 32,
              marginTop: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              onPress={handleViewJobs}
              style={{
                width: '100%',
                minHeight: 120,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
                position: 'relative',
              }}
              activeOpacity={0.8}
            >
              {/* Glow Effect - Brighter when pending jobs */}
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 32,
                  backgroundColor: isAuthenticated && pendingJobs.length > 0 ? '#C6FF00' : 'rgba(198, 255, 0, 0.3)',
                  opacity: isAuthenticated && pendingJobs.length > 0 ? 0.4 : 0.2,
                  shadowColor: '#C6FF00',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isAuthenticated && pendingJobs.length > 0 ? 0.6 : 0.3,
                  shadowRadius: isAuthenticated && pendingJobs.length > 0 ? 20 : 12,
                  elevation: isAuthenticated && pendingJobs.length > 0 ? 15 : 8,
                }}
              />
              
              {/* Main Button */}
              <LinearGradient
                colors={
                  isAuthenticated && pendingJobs.length > 0 
                    ? ['#C6FF00', '#A3E635', '#84CC16'] 
                    : ['rgba(198, 255, 0, 0.8)', 'rgba(163, 230, 53, 0.6)', 'rgba(132, 204, 22, 0.4)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: '100%',
                  minHeight: 120,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  shadowColor: '#C6FF00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isAuthenticated && pendingJobs.length > 0 ? 0.5 : 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    color: '#0B0F1A',
                    fontSize: 28,
                    fontWeight: 'bold',
                    fontFamily: 'Inter_700Bold',
                    letterSpacing: 2,
                    marginRight: 12,
                  }}
                >
                  {t('navigation.jobs').toUpperCase()}
                </Text>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color="#0B0F1A" 
                  style={{
                    marginLeft: 4,
                  }}
                />
                
                {/* Pending Jobs Badge */}
                {isAuthenticated && pendingJobs.length > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 16,
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderWidth: 2,
                      borderColor: '#0B0F1A',
                      shadowColor: '#EF4444',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '700',
                        fontFamily: 'Inter_700Bold',
                      }}
                    >
                      {pendingJobs.length}
                    </Text>
                  </View>
                )}
              </LinearGradient>
              
              {/* Pulse Animation for Pending Jobs */}
              {isAuthenticated && pendingJobs.length > 0 && (
                <Animatable.View
                  animation="pulse"
                  iterationCount="infinite"
                  duration={2000}
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: -12,
                    right: -12,
                    bottom: -12,
                    borderRadius: 36,
                    borderWidth: 3,
                    borderColor: 'rgba(198, 255, 0, 0.4)',
                  }}
                />
              )}
            </TouchableOpacity>
            
            {/* Status Text Below Button */}
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 14,
                fontFamily: 'Inter_400Regular',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {isAuthenticated 
                ? (pendingJobs.length > 0 
                  ? t('home.jobsWaiting', { count: pendingJobs.length })
                  : t('home.noPendingJobs')
                )
                : t('home.loginToReceiveJobs')
              }
            </Text>
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
                  onPress={() => router.push('/scan')}
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
