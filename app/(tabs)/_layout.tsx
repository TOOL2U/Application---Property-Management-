import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useAppNotifications } from "@/contexts/AppNotificationContext";
import ScreenWrapper from '@/components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from '@/hooks/useTranslation';

// AIS-inspired tab icon component with neon green theme
const AISTabIcon = ({
  name,
  focused,
  color,
  size = 24,
  isCenter = false,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
  isCenter?: boolean;
}) => {
  const iconSize = isCenter ? 28 : size;

  return (
    <View className="items-center justify-center">
      {/* Center scan button special styling */}
      {isCenter ? (
        <View
          className="items-center justify-center rounded-2xl p-3"
          style={{
            backgroundColor: focused ? 'rgba(198, 255, 0, 0.15)' : 'rgba(198, 255, 0, 0.1)',
            borderWidth: focused ? 1.5 : 1,
            borderColor: focused ? '#C6FF00' : 'rgba(198, 255, 0, 0.3)',
            shadowColor: focused ? '#C6FF00' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: focused ? 0.6 : 0,
            shadowRadius: focused ? 8 : 0,
            elevation: focused ? 8 : 4,
          }}
        >
          <Ionicons
            name={name}
            size={iconSize}
            color={color}
          />
        </View>
      ) : (
        /* Regular tab icon */
        <View className="items-center justify-center">
          <Ionicons
            name={focused ? name : (name.includes('-outline') ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap)}
            size={iconSize}
            color={color}
            style={{
              shadowColor: focused ? '#C6FF00' : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: focused ? 0.5 : 0,
              shadowRadius: focused ? 6 : 0,
            }}
          />
        </View>
      )}
    </View>
  );
};

// Notification icon with badge
const NotificationIcon = ({ focused, color, unreadCount }: { focused: boolean; color: string; unreadCount: number }) => {
  return (
    <View className="items-center justify-center relative">
      <AISTabIcon name="notifications" focused={focused} color={color} />
      {unreadCount > 0 && (
        <View 
          style={{
            position: 'absolute',
            top: -2,
            right: -6,
            backgroundColor: '#FF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#0B0F1A'
          }}
        >
          <Text 
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  const { isAuthenticated, isLoading } = usePINAuth();
  const { unreadCount } = useAppNotifications();
  const { t } = useTranslation();
  const router = useRouter();

  console.log('🏠 TabLayout rendered:', {
    isAuthenticated,
    isLoading
  });

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000'
      }}>
        <ActivityIndicator size="large" color="#C6FF00" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/select-staff-profile');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScreenWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#C6FF00',
          tabBarInactiveTintColor: '#666666',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0B0F1A',
            borderTopWidth: 1,
            borderTopColor: '#1E2A3A',
            paddingBottom: Platform.OS === 'ios' ? 20 : 5,
            paddingTop: 5,
            height: Platform.OS === 'ios' ? 85 : 60,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('navigation.jobs'),
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="briefcase" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('navigation.notifications'),
          tabBarIcon: ({ color, focused }) => (
            <NotificationIcon focused={focused} color={color} unreadCount={unreadCount} />
          ),
        }}
      />

      </Tabs>
    </ScreenWrapper>
  );
}