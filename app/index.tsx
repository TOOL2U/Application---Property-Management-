import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { View, ActivityIndicator, Text } from 'react-native';
import { Logo } from '@/components/ui/Logo';
import { BrandTheme } from '@/constants/BrandTheme';

export default function Index() {
  const { isAuthenticated, isLoading } = usePINAuth();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only perform initial routing, not logout routing
    if (!isLoading && !hasInitialized) {
      console.log('🏠 Index: Performing initial routing', { 
        isAuthenticated, 
        isLoading, 
        hasInitialized 
      });

      if (isAuthenticated) {
        console.log('🏠 Index: User is authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('🏠 Index: User not authenticated, redirecting to select-profile');
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
      backgroundColor: BrandTheme.colors.GREY_PRIMARY // Brand background
    }}>
      <Logo
        size="large"
        style={{ 
          marginBottom: 40,
          shadowColor: BrandTheme.colors.YELLOW,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}
        accessibilityLabel="Sia Moon Staff App Logo"
      />
      <Text style={{
        color: BrandTheme.colors.TEXT_PRIMARY, // Brand white
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 2,
        fontFamily: BrandTheme.typography.fontFamily.primary, // Aileron-Bold
      }}>
        Sia Moon
      </Text>
      <Text style={{
        color: BrandTheme.colors.YELLOW, // Brand yellow
        fontSize: 18,
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: BrandTheme.typography.fontFamily.regular, // Aileron-Regular
      }}>
        Property Management Staff
      </Text>
      <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
    </View>
  );
}
