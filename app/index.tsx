import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only perform initial routing, not logout routing
    if (!isLoading && !hasInitialized) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      setHasInitialized(true);
    }
  }, [isAuthenticated, isLoading, hasInitialized]);

  return (
    <View className="flex-1 justify-center items-center bg-dark-bg">
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );
}
