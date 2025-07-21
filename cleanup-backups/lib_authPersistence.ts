import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Auth persistence handler for React Native
class AuthPersistence {
  private static readonly AUTH_TOKEN_KEY = 'firebase_auth_token';
  private static readonly AUTH_USER_KEY = 'firebase_auth_user';

  // Initialize auth state persistence
  static async initializePersistence() {
    if (Platform.OS === 'web') {
      console.log('✅ Auth persistence: Using browser default persistence');
      return;
    }

    try {
      console.log('🔧 Setting up Firebase Auth persistence for React Native...');
      
      // Listen to auth state changes and persist to AsyncStorage
      onAuthStateChanged(auth, async (user: User | null) => {
        try {
          if (user) {
            // User is signed in, save auth state
            const authData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              timestamp: Date.now()
            };
            
            await AsyncStorage.setItem(this.AUTH_USER_KEY, JSON.stringify(authData));
            console.log('✅ Auth state saved to AsyncStorage');
          } else {
            // User is signed out, clear auth state
            await AsyncStorage.removeItem(this.AUTH_USER_KEY);
            await AsyncStorage.removeItem(this.AUTH_TOKEN_KEY);
            console.log('✅ Auth state cleared from AsyncStorage');
          }
        } catch (error) {
          console.error('❌ Failed to persist auth state:', error);
        }
      });

      // Try to restore auth state on app start
      await this.restoreAuthState();
      
      console.log('✅ Firebase Auth persistence initialized');
    } catch (error) {
      console.error('❌ Failed to initialize auth persistence:', error);
    }
  }

  // Restore auth state from AsyncStorage
  private static async restoreAuthState() {
    try {
      const savedAuthData = await AsyncStorage.getItem(this.AUTH_USER_KEY);
      if (savedAuthData) {
        const authData = JSON.parse(savedAuthData);
        console.log('📱 Found saved auth state:', authData.email);
        // The auth state will be automatically restored by Firebase
        // This just logs that we found saved state
      }
    } catch (error) {
      console.error('❌ Failed to restore auth state:', error);
    }
  }

  // Clear all auth data
  static async clearAuthData() {
    try {
      await AsyncStorage.removeItem(this.AUTH_USER_KEY);
      await AsyncStorage.removeItem(this.AUTH_TOKEN_KEY);
      console.log('✅ Auth data cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
    }
  }
}

export default AuthPersistence;
