import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { View, ActivityIndicator, Text } from 'react-native';
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
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000'
    }}>
      <Logo
        size="appIcon"
        style={{ marginBottom: 32 }}
        accessibilityLabel="Sia Moon Staff App Logo"
      />
      <Text style={{
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 1
      }}>
        Sia Moon Staff
      </Text>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );
}
