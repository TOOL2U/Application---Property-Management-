import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export default function AuthLayout() {
  const { isAuthenticated, isStaffSelected, isLoading } = useAuth();
  const router = useRouter();
  const [isSharedAuthActive, setIsSharedAuthActive] = useState(false);

  useEffect(() => {
    // Check if shared Firebase Auth is active
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const isSharedAuth = user?.email === 'staff@siamoon.com';
      setIsSharedAuthActive(isSharedAuth);

      console.log('🔍 AuthLayout: Firebase Auth state changed:', {
        userEmail: user?.email,
        isSharedAuth,
        isAuthenticated,
        isStaffSelected,
        isLoading
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // If user is fully authenticated (has selected profile), go to tabs
    if (isAuthenticated && isStaffSelected) {
      console.log('🚀 AuthLayout: User authenticated with staff selected, redirecting to tabs');
      router.replace('/(tabs)');
    }
    // If shared auth is active but no profile selected, go to profile selection
    else if (isSharedAuthActive && !isStaffSelected) {
      console.log('🔄 AuthLayout: Shared auth active, redirecting to profile selection');
      router.replace('/(auth)/select-staff-profile');
    }
    // Otherwise, stay on login screen
    else {
      console.log('🔐 AuthLayout: No auth, staying on login');
    }
  }, [isAuthenticated, isStaffSelected, isLoading, isSharedAuthActive]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="select-staff-profile" options={{ headerShown: false }} />
    </Stack>
  );
}
