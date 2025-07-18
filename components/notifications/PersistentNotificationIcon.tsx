/**
 * Persistent Notification Icon
 * Displays a notification icon that appears on all screens
 */

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { useAppNotifications } from '@/contexts/AppNotificationContext';
import { shadowStyles } from '@/utils/shadowUtils';

interface PersistentNotificationIconProps {
  style?: any;
}

export const PersistentNotificationIcon: React.FC<PersistentNotificationIconProps> = ({ style }) => {
  const { unreadCount } = useAppNotifications();
  const router = useRouter();

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
      
      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={2000}
          style={{
            position: 'absolute',
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: '#C6FF00',
            opacity: 0.3,
          }}
        />
      )}
    </TouchableOpacity>
  );
};
