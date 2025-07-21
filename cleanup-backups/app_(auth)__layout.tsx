import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { usePINAuth } from "@/contexts/PINAuthContext";
import ScreenWrapper from '@/components/ScreenWrapper';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = usePINAuth();
  const router = useRouter();

  // Simplified: Let PIN screens handle their own navigation
  // Only redirect on app startup if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('🚀 AuthLayout: User is authenticated, redirecting to tabs');
  router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while authentication state is being determined
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

  return (
    <ScreenWrapper>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="select-profile" options={{ headerShown: false }} />
        <Stack.Screen name="enter-pin" options={{ headerShown: false }} />
        <Stack.Screen name="create-pin" options={{ headerShown: false }} />
      </Stack>
    </ScreenWrapper>
  );
}
