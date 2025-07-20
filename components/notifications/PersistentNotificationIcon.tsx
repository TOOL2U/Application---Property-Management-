/**
 * Persistent Notification Icon
 * Displays a notification icon that appears on all screens
 */

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter, usePathname } from 'expo-router';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { shadowStyles } from '@/utils/shadowUtils';

interface PersistentNotificationIconProps {
  style?: any;
}

export const PersistentNotificationIcon: React.FC<PersistentNotificationIconProps> = ({ style }) => {
  const { unreadCount } = useAppNotifications();
  const { pendingJobs } = useStaffJobs({ enableRealtime: true });
  const router = useRouter();
  const pathname = usePathname();

  // Get pending jobs count for glow effect
  const hasPendingJobs = pendingJobs.length > 0;

  // Hide notification icon on auth screens
  const isAuthScreen = pathname?.includes('/(auth)') || 
                      pathname?.includes('/select-profile') || 
                      pathname?.includes('/select-staff-profile') ||
                      pathname?.includes('/enter-pin') ||
                      pathname?.includes('/create-pin');

  // Don't render anything on auth screens
  if (isAuthScreen) {
    return null;
  }

  const handlePress = () => {
    console.log('🔔 PersistentNotificationIcon: Navigating to notifications screen');
    router.push('/(tabs)/notifications');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(28, 31, 42, 0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#374151',
          ...shadowStyles.medium,
        },
        style
      ]}
      activeOpacity={0.8}
    >
      {/* Glow Effect - Same as JOBS button when pending jobs exist */}
      {hasPendingJobs && (
        <View
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            borderRadius: 32,
            backgroundColor: '#C6FF00',
            opacity: 0.4,
            shadowColor: '#C6FF00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 15,
          }}
        />
      )}

      <Ionicons 
        name="notifications-outline" 
        size={22} 
        color="#F1F1F1" 
      />
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <Animatable.View
          animation="bounceIn"
          duration={400}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#0B0F1A',
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 'bold',
            lineHeight: 16,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </Animatable.View>
      )}
      
      {/* Pulse animation for pending jobs - Same as JOBS button */}
      {hasPendingJobs && (
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
  );
};
