import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import {
  Home,
  Briefcase,
  Users,
  User,
  Settings,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  Wrench,
  History,
} from 'lucide-react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole } = useStaffAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Role-based tab visibility using useStaffAuth hook
  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
  const isAdminOrManager = hasRole(['admin', 'manager']);

  // Debug logging for role-based navigation
  console.log('🔍 Tab Layout - Role-based Navigation:', {
    userEmail: user?.email,
    userRole: user?.role,
    isStaffUser,
    isAdminOrManager,
    showingStaffTabs: isStaffUser
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: 'rgba(139, 92, 246, 0.2)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: '#8b5cf6',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      {/* Dashboard - Always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      {/* Jobs - Always visible */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />

      {/* Admin/Manager Only Tabs - Hidden for staff users */}
      {!isStaffUser && isAdminOrManager && (
        <>
          <Tabs.Screen
            name="properties"
            options={{
              title: 'Properties',
              tabBarIcon: ({ color, size }) => (
                <Building size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="tenants"
            options={{
              title: 'Tenants',
              tabBarIcon: ({ color, size }) => (
                <Users size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="schedule"
            options={{
              title: 'Schedule',
              tabBarIcon: ({ color, size }) => (
                <Calendar size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="maintenance"
            options={{
              title: 'Maintenance',
              tabBarIcon: ({ color, size }) => (
                <Wrench size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="payments"
            options={{
              title: 'Payments',
              tabBarIcon: ({ color, size }) => (
                <DollarSign size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="map"
            options={{
              title: 'Map',
              tabBarIcon: ({ color, size }) => (
                <MapPin size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'History',
              tabBarIcon: ({ color, size }) => (
                <History size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
