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
        size="large"
        style={{ 
          marginBottom: 40,
          shadowColor: '#C6FF00',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}
        accessibilityLabel="Sia Moon Staff App Logo"
      />
      <Text style={{
        color: '#ffffff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 2,
        fontFamily: 'Inter_700Bold',
      }}>
        Sia Moon
      </Text>
      <Text style={{
        color: '#C6FF00',
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: 'Inter_500Medium',
      }}>
        Property Management Staff
      </Text>
      <ActivityIndicator size="large" color="#C6FF00" />
    </View>
  );
}
