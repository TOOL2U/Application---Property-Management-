import { useEffect, useMemo, useCallback } from 'react';
import { Tabs, useSegments } from 'expo-router';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useAppNotifications } from "@/contexts/AppNotificationContext";
import ScreenWrapper from '@/components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { BrandTheme } from '@/constants/BrandTheme';

// Brand Kit Tab Icon Component
const BrandTabIcon = ({
  name,
  focused,
  color,
  size = 24,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
}) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={focused ? name : (name.includes('-outline') ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={size}
        color={color}
        style={{
          shadowColor: focused ? BrandTheme.colors.YELLOW : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: focused ? 0.5 : 0,
          shadowRadius: focused ? 6 : 0,
        }}
      />
    </View>
  );
};

// Brand Kit Notification Icon with Badge
const BrandNotificationIcon = ({ focused, color, unreadCount }: { focused: boolean; color: string; unreadCount: number }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <BrandTabIcon name="notifications" focused={focused} color={color} />
      {unreadCount > 0 && (
        <View 
          style={{
            position: 'absolute',
            top: -2,
            right: -6,
            backgroundColor: BrandTheme.colors.ERROR, // Brand red
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: BrandTheme.colors.BLACK // Brand black border
          }}
        >
          <Text 
            style={{
              color: BrandTheme.colors.TEXT_PRIMARY,
              fontSize: 12,
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: BrandTheme.typography.fontFamily.primary,
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
  const { unreadCount, notifications } = useAppNotifications();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();

  // Check if we're on the map screen - use segments instead of pathname
  const isOnMapScreen = useMemo(() => {
    return segments[1] === 'map';
  }, [segments]);

  // Handle FAB press - memoized to prevent re-renders
  const handleFABPress = useCallback(() => {
    if (isOnMapScreen) {
      router.push('/');
    } else {
      router.push('/map');
    }
  }, [isOnMapScreen, router]);

  console.log('🏠 TabLayout rendered:', {
    isAuthenticated,
    isLoading,
    segments,
    isOnMapScreen
  });

  // DEBUG: Log notification state for troubleshooting
  console.log('🔔 TabLayout: Notification state:', {
    unreadCount,
    totalNotifications: notifications.length,
    notificationIds: notifications.map(n => n.id).slice(0, 3)
  });

  // Redirect to login if not authenticated - MUST be before any conditional returns
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🏠 TabLayout: Not authenticated, redirecting to select-profile');
      router.replace('/(auth)/select-profile');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BrandTheme.colors.GREY_PRIMARY // Brand background
      }}>
        <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScreenWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: BrandTheme.colors.YELLOW,
          tabBarInactiveTintColor: BrandTheme.colors.GREY_SECONDARY,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: BrandTheme.colors.BLACK,
            borderTopWidth: 1,
            borderTopColor: BrandTheme.colors.BORDER_SUBTLE,
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
            <BrandTabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('navigation.jobs'),
          tabBarIcon: ({ color, focused }) => (
            <BrandTabIcon name="briefcase" focused={focused} color={color} />
          ),
        }}
      />
      
      {/* Hide map tab - it's now in the FAB */}
      <Tabs.Screen
        name="map"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, focused }) => (
            <BrandTabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, focused }) => (
            <BrandTabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('navigation.notifications'),
          tabBarIcon: ({ color, focused }) => (
            <BrandNotificationIcon focused={focused} color={color} unreadCount={unreadCount} />
          ),
        }}
      />
      </Tabs>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <View style={styles.fabInner}>
          <Ionicons
            name={isOnMapScreen ? "home" : "map"}
            size={28}
            color={BrandTheme.colors.BLACK}
          />
        </View>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 85 : 70,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandTheme.colors.YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    ...BrandTheme.shadows.YELLOW_GLOW,
    borderWidth: 3,
    borderColor: BrandTheme.colors.BLACK,
    elevation: 8,
    zIndex: 1000,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});