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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import LanguagePicker from '@/components/settings/LanguagePicker';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t, currentLanguageInfo } = useTranslation();
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
  
  // Language settings
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  
  // Push Notification Settings
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationVolume, setNotificationVolume] = useState(75);
  const [notificationSound, setNotificationSound] = useState('default');
  const [urgentNotifications, setUrgentNotifications] = useState(true);
  const [jobNotifications, setJobNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [loudMode, setLoudMode] = useState(false);
  const [vibration, setVibration] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
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
                t('auth.logoutComplete'),
                `${t('auth.logoutSuccess')}\n\n${errorMessage ? `${t('common.note')}: ${errorMessage}` : ''}`,
                [{
                  text: t('common.continue'),
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
      t('settings.contactSupport'),
      t('settings.contactSupportQuestion'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.email'),
          onPress: () => Linking.openURL('mailto:support@siamoon.com'),
        },
        {
          text: t('settings.phone'),
          onPress: () => Linking.openURL('tel:+1234567890'),
        },
      ]
    );
  };

  const handleNotificationSettings = () => {
    setShowNotificationModal(true);
  };

  const testNotificationSound = () => {
    // In a real app, this would play the selected notification sound
    Alert.alert(t('settings.testSound'), t('settings.testSoundMessage', { sound: notificationSound, volume: notificationVolume }));
  };

  const availableSounds = [
    { id: 'default', name: 'Default', icon: 'musical-note' },
    { id: 'chime', name: 'Chime', icon: 'notifications' },
    { id: 'bell', name: 'Bell', icon: 'notifications-outline' },
    { id: 'urgent', name: 'Urgent Alert', icon: 'warning' },
    { id: 'loud-beep', name: 'Loud Beep', icon: 'volume-high' },
    { id: 'air-horn', name: 'Air Horn', icon: 'megaphone' },
    { id: 'siren', name: 'Emergency Siren', icon: 'alarm' },
  ];

  const settingsData: SettingItem[] = [
    // Account Section
    {
      id: 'view-profile',
      title: t('settings.viewProfile'),
      subtitle: t('settings.viewProfileSubtitle'),
      icon: 'person-outline',
      type: 'navigation',
      onPress: () => router.push('/profile-view'),
    },
    {
      id: 'edit-profile',
      title: t('settings.editProfile'),
      subtitle: t('settings.editProfileSubtitle'),
      icon: 'create-outline',
      type: 'navigation',
      onPress: () => router.push('/(modal)/edit-profile'),
    },
    {
      id: 'notifications',
      title: t('settings.pushNotifications'),
      subtitle: `${notifications ? t('common.enabled') : t('common.disabled')} • ${t('settings.volume')}: ${notificationVolume}% • ${loudMode ? t('settings.loudMode') : t('settings.normalMode')}`,
      icon: 'notifications-outline',
      type: 'navigation',
      onPress: handleNotificationSettings,
    },
    {
      id: 'biometric',
      title: t('settings.biometricLogin'),
      subtitle: t('settings.biometricSubtitle'),
      icon: 'finger-print-outline',
      type: 'toggle',
      value: biometric,
      onToggle: setBiometric,
    },

    // App Settings
    {
      id: 'autoSync',
      title: t('settings.autoSync'),
      subtitle: t('settings.autoSyncSubtitle'),
      icon: 'sync-outline',
      type: 'toggle',
      value: autoSync,
      onToggle: setAutoSync,
    },
    {
      id: 'language',
      title: t('settings.language'),
      subtitle: `${currentLanguageInfo?.flag} ${currentLanguageInfo?.nativeName || 'English'}`,
      icon: 'language-outline',
      type: 'navigation',
      onPress: () => {
        console.log('🌐 Settings: Language button pressed, opening language picker');
        setShowLanguagePicker(true);
      },
    },

    // Admin Only Settings
    ...(isAdminOrManager ? [
      {
        id: 'admin-panel',
        title: t('settings.adminPanel'),
        subtitle: t('settings.adminPanelSubtitle'),
        icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
        type: 'navigation' as const,
        onPress: () => Alert.alert(t('settings.adminPanel'), t('settings.adminPanelComingSoon')),
      },
      {
        id: 'manage-staff',
        title: t('settings.manageStaff'),
        subtitle: t('settings.manageStaffSubtitle'),
        icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
        type: 'navigation' as const,
        onPress: () => Alert.alert(t('settings.staffManagement'), t('settings.staffManagementComingSoon')),
      },
    ] : []),

    // Support & Info
    {
      id: 'help',
      title: t('settings.helpSupport'),
      subtitle: t('settings.helpSupportSubtitle'),
      icon: 'help-circle-outline',
      type: 'action',
      onPress: handleContactSupport,
    },
    {
      id: 'about',
      title: t('settings.about'),
      subtitle: t('settings.aboutSubtitle'),
      icon: 'information-circle-outline',
      type: 'navigation',
      onPress: () => Alert.alert(t('settings.about'), t('settings.aboutText')),
    },
    {
      id: 'privacy',
      title: t('settings.privacyPolicy'),
      subtitle: t('settings.privacyPolicySubtitle'),
      icon: 'document-text-outline',
      type: 'action',
      onPress: () => Linking.openURL('https://siamoon.com/privacy'),
    },

    // Danger Zone
    {
      id: 'signout',
      title: t('auth.signOut'),
      subtitle: t('settings.signOutSubtitle'),
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
    <View
      key={item.id}
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
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <View
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
        </View>

        {/* User Info Card */}
        <View
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
        </View>

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

      {/* Push Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#1E2A3A',
            }}>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(198, 255, 0, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name="close" size={20} color="#C6FF00" />
              </TouchableOpacity>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                flex: 1,
              }}>
                Push Notification Settings
              </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              {/* Main Toggle */}
              <View style={{
                backgroundColor: '#1C1F2A',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#374151',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                      Enable Push Notifications
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                      Receive job updates and important alerts
                    </Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#374151', true: 'rgba(198, 255, 0, 0.3)' }}
                    thumbColor={notifications ? '#C6FF00' : '#9CA3AF'}
                  />
                </View>
              </View>

              {notifications && (
                <>
                  {/* Volume Control */}
                  <View style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#374151',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                        Volume: {notificationVolume}%
                      </Text>
                      <TouchableOpacity
                        onPress={testNotificationSound}
                        style={{
                          backgroundColor: 'rgba(198, 255, 0, 0.2)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#C6FF00', fontSize: 12, fontWeight: '600' }}>
                          Test Sound
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Custom Volume Slider using TouchableOpacity */}
                    <View style={{ marginBottom: 16 }}>
                      <View style={{
                        height: 6,
                        backgroundColor: '#374151',
                        borderRadius: 3,
                        position: 'relative',
                      }}>
                        <View style={{
                          height: 6,
                          backgroundColor: '#C6FF00',
                          borderRadius: 3,
                          width: `${notificationVolume}%`,
                        }} />
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            left: `${Math.max(0, notificationVolume - 2)}%`,
                            top: -5,
                            width: 16,
                            height: 16,
                            backgroundColor: '#C6FF00',
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: '#0B0F1A',
                          }}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <TouchableOpacity onPress={() => setNotificationVolume(25)}>
                          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>25%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setNotificationVolume(50)}>
                          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>50%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setNotificationVolume(75)}>
                          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>75%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setNotificationVolume(100)}>
                          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>100%</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Loud Mode Toggle */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                          Loud Mode
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                          Extra loud notifications for urgent alerts
                        </Text>
                      </View>
                      <Switch
                        value={loudMode}
                        onValueChange={setLoudMode}
                        trackColor={{ false: '#374151', true: 'rgba(239, 68, 68, 0.3)' }}
                        thumbColor={loudMode ? '#ef4444' : '#9CA3AF'}
                      />
                    </View>
                  </View>

                  {/* Sound Selection */}
                  <View style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#374151',
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                      Notification Sound
                    </Text>
                    {availableSounds.map((sound) => (
                      <TouchableOpacity
                        key={sound.id}
                        onPress={() => setNotificationSound(sound.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          borderBottomWidth: sound.id !== availableSounds[availableSounds.length - 1].id ? 1 : 0,
                          borderBottomColor: '#374151',
                        }}
                      >
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: notificationSound === sound.id ? 'rgba(198, 255, 0, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          <Ionicons
                            name={sound.icon as keyof typeof Ionicons.glyphMap}
                            size={16}
                            color={notificationSound === sound.id ? '#C6FF00' : '#9CA3AF'}
                          />
                        </View>
                        <Text style={{
                          color: notificationSound === sound.id ? '#C6FF00' : 'white',
                          fontSize: 16,
                          fontWeight: notificationSound === sound.id ? '600' : '400',
                          flex: 1,
                        }}>
                          {sound.name}
                        </Text>
                        {notificationSound === sound.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#C6FF00" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Notification Types */}
                  <View style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#374151',
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                      Notification Types
                    </Text>
                    
                    {[
                      { key: 'urgent', value: urgentNotifications, setter: setUrgentNotifications, title: 'Urgent Alerts', subtitle: 'Emergency and high-priority notifications', icon: 'warning' },
                      { key: 'job', value: jobNotifications, setter: setJobNotifications, title: 'Job Updates', subtitle: 'New assignments and job status changes', icon: 'briefcase' },
                      { key: 'message', value: messageNotifications, setter: setMessageNotifications, title: 'Messages', subtitle: 'Chat messages and team communications', icon: 'chatbubble' },
                      { key: 'system', value: systemNotifications, setter: setSystemNotifications, title: 'System Updates', subtitle: 'App updates and maintenance notices', icon: 'settings' },
                    ].map((item, index) => (
                      <View key={item.key} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 12,
                        borderBottomWidth: index < 3 ? 1 : 0,
                        borderBottomColor: '#374151',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: 'rgba(198, 255, 0, 0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}>
                            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color="#C6FF00" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                              {item.title}
                            </Text>
                            <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>
                              {item.subtitle}
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={item.value}
                          onValueChange={item.setter}
                          trackColor={{ false: '#374151', true: 'rgba(198, 255, 0, 0.3)' }}
                          thumbColor={item.value ? '#C6FF00' : '#9CA3AF'}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Additional Settings */}
                  <View style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#374151',
                  }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                      Additional Settings
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                          Vibration
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                          Vibrate device when notifications arrive
                        </Text>
                      </View>
                      <Switch
                        value={vibration}
                        onValueChange={setVibration}
                        trackColor={{ false: '#374151', true: 'rgba(198, 255, 0, 0.3)' }}
                        thumbColor={vibration ? '#C6FF00' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
      />
    </View>
  );
}
