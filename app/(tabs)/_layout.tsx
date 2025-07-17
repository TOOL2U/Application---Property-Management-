import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';

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

export default function TabLayout() {
  const { isAuthenticated, isLoading } = usePINAuth();

  console.log('🏠 TabLayout rendered:', {
    isAuthenticated,
    isLoading
  });

  // Temporarily remove authentication guard to test navigation
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0F1A'
      }}>
        <ActivityIndicator size="large" color="#C6FF00" />
        <Text style={{
          color: '#FFFFFF',
          marginTop: 20,
          fontSize: 16,
          fontFamily: 'Inter'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="briefcase" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="qr-code" focused={focused} color={color} isCenter={true} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AISTabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
