import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { AITheme } from '@/constants/AITheme';

// Modern AI-inspired tab icon component
const AITabIcon = ({
  name,
  focused,
  color,
  size = 24,
  label
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
  label?: string;
}) => (
  <Animatable.View
    animation={focused ? 'pulse' : undefined}
    duration={1000}
    iterationCount="infinite"
    className="items-center justify-center"
  >
    {/* Glow effect background for active tab */}
    {focused && (
      <View className="absolute inset-0 rounded-full bg-purple-500/20 blur-sm" />
    )}
    
    {/* Icon container with gradient background when active */}
    <View className={`
      items-center justify-center rounded-xl p-2
      ${focused ? 'bg-purple-500/10' : ''}
    `}>
      <Ionicons
        name={focused ? name : (name.includes('-outline') ? name : `${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={size}
        color={color}
        style={{
          shadowColor: focused ? AITheme.colors.brand.primary : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: focused ? 0.8 : 0,
          shadowRadius: focused ? 12 : 0,
        }}
      />
    </View>
    
    {/* Optional label with modern typography */}
    {label && (
      <Text className={`
        text-xs mt-1 font-medium tracking-wider
        ${focused ? 'text-purple-400' : 'text-gray-400'}
      `}>
        {label}
      </Text>
    )}
  </Animatable.View>
);

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole } = useStaffAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    // This ensures immediate redirect on sign out
    if (!isLoading && !isAuthenticated) {
      console.log('🚨 Tab layout detected unauthenticated user, redirecting to login...');
      // Use replace to prevent back navigation to tabs
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render tabs if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  // Role-based tab visibility using useStaffAuth hook
  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
  const isAdminOrManager = hasRole(['admin', 'manager']);

  // Debug logging for role-based navigation
  console.log('🔍 Tab Layout - Role-Based Navigation:', {
    userEmail: user?.email,
    userRole: user?.role,
    isStaffUser,
    isAdminOrManager,
    tabsShown: isStaffUser
      ? '3 tabs (Dashboard, Active Jobs, Profile)'
      : '13 tabs (Dashboard, Jobs, Bookings, Assign Staff, Manage Jobs, Properties, Tenants, Schedule, Maintenance, Payments, Map, History, Profile)',
    staffSimplifiedView: isStaffUser,
    adminFeaturesEnabled: isAdminOrManager
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AITheme.colors.background.secondary,
          borderTopWidth: 0,
          paddingBottom: 24,
          paddingTop: 12,
          height: 84,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...AITheme.shadows.xl,
        },
        tabBarBackground: () => (
          <BlurView intensity={20} className="flex-1 overflow-hidden rounded-t-3xl">
            <LinearGradient
              colors={AITheme.gradients.surface}
              className="flex-1"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </BlurView>
        ),
        tabBarActiveTintColor: AITheme.colors.brand.primary,
        tabBarInactiveTintColor: AITheme.colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 4,
          fontFamily: AITheme.typography.fonts.primary,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      {/* Dashboard - Always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <AITabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />

      {/* Jobs Tab - Different title for staff vs admin */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: isStaffUser ? 'Active Jobs' : 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <AITabIcon name="clipboard" focused={focused} color={color} />
          ),
        }}
      />

      {/* Admin/Manager Only Tabs - Hidden for staff users */}
      {!isStaffUser && isAdminOrManager && (
        <>
          {/* Core Admin Features */}
          <Tabs.Screen
            name="bookings"
            options={{
              title: 'Bookings',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="calendar" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="assign-staff"
            options={{
              title: 'Assign Staff',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="people" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="manage-jobs"
            options={{
              title: 'Manage Jobs',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="construct" focused={focused} color={color} />
              ),
            }}
          />

          {/* Additional Admin Features */}
          <Tabs.Screen
            name="properties"
            options={{
              title: 'Properties',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="business" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="tenants"
            options={{
              title: 'Tenants',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="people" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="schedule"
            options={{
              title: 'Schedule',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="time" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="maintenance"
            options={{
              title: 'Maintenance',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="build" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="payments"
            options={{
              title: 'Payments',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="card" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="map"
            options={{
              title: 'Map',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="map" focused={focused} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'History',
              tabBarIcon: ({ color, focused }) => (
                <AITabIcon name="time" focused={focused} color={color} />
              ),
            }}
          />
        </>
      )}

      {/* Profile - Always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AITabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />

      {/* Developers Tab - Always visible for easy navigation */}
      <Tabs.Screen
        name="developers"
        options={{
          title: 'Developers',
          tabBarIcon: ({ color, focused }) => (
            <AITabIcon name="code" focused={focused} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
