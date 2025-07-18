// Import Node.js polyfills first for web compatibility
import '../polyfills/node-polyfills';

// Import NativeWind CSS - temporarily disabled for debugging
// import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { PINAuthProvider } from "@/contexts/PINAuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { JobProvider } from '@/contexts/JobContext';
import { AppNotificationProvider } from '@/contexts/AppNotificationContext';
import { SiaMoonPaperTheme } from '@/constants/PaperTheme';
import { initializeFirebase } from '@/lib/firebase';

import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [loaded, error] = useFonts({
    // Add your custom fonts here if needed
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App startup: Initializing Firebase...');
        
        // Initialize Firebase first
        await initializeFirebase();
        setFirebaseReady(true);
        console.log('✅ Firebase initialization complete');
        
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
    <ErrorBoundary>
      <PaperProvider theme={SiaMoonPaperTheme}>
        <ThemeProvider>
          <ErrorBoundary>
            <PINAuthProvider>
              <AppNotificationProvider>
                <JobProvider>
                  <ErrorBoundary>
                    <StatusBar style="light" backgroundColor="#0B0F1A" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#0B0F1A' },
                      }}
                    >
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                  </ErrorBoundary>
                </JobProvider>
              </AppNotificationProvider>
            </PINAuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
