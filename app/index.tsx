import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { Logo } from '@/components/ui/Logo';
import { BrandTheme } from '@/constants/BrandTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Root Index - Initial App Entry Point
 * This component handles the initial routing based on authentication state
 * NOTE: This file CANNOT use PINAuth context as it loads before _layout.tsx providers
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check for active session (the key used by LocalStaffService)
        const sessionData = await AsyncStorage.getItem('@current_session');
        
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const expiresAt = new Date(session.expiresAt);
            const now = new Date();
            
            // Check if session is still valid
            if (expiresAt > now && session.profileId) {
              console.log('🏠 Index: Valid session found, redirecting to tabs');
              router.replace('/(tabs)');
              return;
            } else {
              console.log('🏠 Index: Session expired, clearing and redirecting to auth');
              await AsyncStorage.removeItem('@current_session');
            }
          } catch (parseError) {
            console.error('❌ Index: Error parsing session:', parseError);
            await AsyncStorage.removeItem('@current_session');
          }
        }
        
        console.log('🏠 Index: No valid session, redirecting to select-profile');
        router.replace('/(auth)/select-profile');
      } catch (error) {
        console.error('❌ Index: Error checking auth:', error);
        // Default to auth flow on error
        router.replace('/(auth)/select-profile');
      }
    }

    checkAuth();
  }, []);

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
