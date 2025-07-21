import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { View, ActivityIndicator } from 'react-native';
import { Logo } from '@/components/ui/Logo';

export default function Index() {
  const { isAuthenticated, isLoading } = usePINAuth();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only perform initial routing, not logout routing
    if (!isLoading && !hasInitialized) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/select-profile');
      }
      setHasInitialized(true);
    }
  }, [isAuthenticated, isLoading, hasInitialized]);

  return (
    <View className="flex-1 justify-center items-center bg-dark-bg">
      <Logo size="appIcon" style={{ marginBottom: 24 }} />
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );
}
