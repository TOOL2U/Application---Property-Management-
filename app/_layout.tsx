// Import Node.js polyfills first for web compatibility
import '../polyfills/node-polyfills';

// Import gesture handler first (required for React Native)
import 'react-native-gesture-handler';

// Import NativeWind CSS
import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PINAuthProvider } from "@/contexts/PINAuthContext";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { JobProvider } from '@/contexts/JobContext';
import { AppNotificationProvider } from '@/contexts/AppNotificationContext';
import { PushNotificationProvider } from '@/contexts/PushNotificationContext';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { SiaMoonPaperTheme } from '@/constants/PaperTheme';
import { initializeFirebase } from '@/lib/firebase';
import { AppAuditIntegration } from '@/components/audit/AppAuditIntegration';
import { loadBrandFonts } from '@/utils/BrandFonts';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [loaded, error] = useFonts({
    // Brand Kit Fonts - Loaded via BrandFonts utility
    'Aileron-Bold': require('../assets/fonts/Aileron-Bold.otf'),
    'Aileron-Regular': require('../assets/fonts/Aileron-Regular.otf'),
    'Aileron-Light': require('../assets/fonts/Aileron-Light.otf'),
    'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
    'MadeMirage-Regular': require('../assets/fonts/MadeMirage-Regular.otf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App startup: Initializing Firebase...');
        
        // Initialize Firebase first
        await initializeFirebase();
        setFirebaseReady(true);
        console.log('✅ Firebase initialization complete');
        
        // Load Brand Kit fonts
        console.log('🎨 Loading Brand Kit fonts...');
        await loadBrandFonts();
        console.log('✅ Brand fonts loaded');
        
        // Pre-load fonts, make any API calls you need to do here
        // Artificially delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error('❌ App startup error:', e);
        // Continue even if Firebase fails to ensure app doesn't crash
        setFirebaseReady(true);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    if (loaded || error) {
      prepare();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (appIsReady && firebaseReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, firebaseReady]);

  if (!appIsReady || !firebaseReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <TranslationProvider>
            <PaperProvider theme={SiaMoonPaperTheme}>
              <ThemeProvider>
                <ErrorBoundary>
                  <AuthProvider>
                    <PINAuthProvider>
                      <PushNotificationProvider>
                        <AppNotificationProvider>
                          <JobProvider>
                            <AppAuditIntegration>
                              <ErrorBoundary>
                                <StatusBar style="light" backgroundColor="#000000" />
                                <Stack
                                  screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: '#000000' },
                                  }}
                                >
                                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                  <Stack.Screen name="+not-found" />
                                </Stack>
                              </ErrorBoundary>
                            </AppAuditIntegration>
                          </JobProvider>
                        </AppNotificationProvider>
                      </PushNotificationProvider>
                    </PINAuthProvider>
                  </AuthProvider>
                </ErrorBoundary>
              </ThemeProvider>
            </PaperProvider>
          </TranslationProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
