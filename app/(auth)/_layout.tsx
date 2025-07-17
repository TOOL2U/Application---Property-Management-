import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { usePINAuth } from "@/contexts/PINAuthContext";

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
        backgroundColor: '#0B0F1A'
      }}>
        <ActivityIndicator size="large" color="#C6FF00" />
        <Text style={{
          color: '#FFFFFF',
          marginTop: 20,
          fontSize: 16,
          fontFamily: 'Inter'
        }}>
          Verifying authentication...
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0F1A' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="select-profile" options={{ headerShown: false }} />
      <Stack.Screen name="enter-pin" options={{ headerShown: false }} />
      <Stack.Screen name="create-pin" options={{ headerShown: false }} />
    </Stack>
  );
}
