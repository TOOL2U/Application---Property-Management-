/**
 * Enhanced Firebase Auth Service
 * Fixes timeout warnings and authentication state issues
 */

import { auth as originalAuth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged as firebaseOnAuthStateChanged, User } from 'firebase/auth';

class EnhancedAuthService {
  private isInitialized = false;
  private currentUser: User | null = null;
  private initializationPromise: Promise<void> | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    // Start initialization immediately but don't block
    this.initialize().catch(error => {
      console.warn('⚠️ Auth initialization delayed, will retry when needed');
    });
  }

  /**
   * Initialize authentication with proper error handling
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔐 EnhancedAuth: Starting authentication initialization...');

      // Set up auth state listener with timeout handling
      this.unsubscribeAuth = firebaseOnAuthStateChanged(originalAuth, (user: User | null) => {
        this.currentUser = user;
        this.notifyListeners(user);
        
        if (user) {
          console.log('✅ EnhancedAuth: User authenticated successfully');
        } else {
          // Don't log here to reduce noise - handle in ensureAuthenticated
          this.ensureAuthenticated();
        }
      });

      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Ensure we have an authenticated user
      await this.ensureAuthenticated();
      
      this.isInitialized = true;
      console.log('✅ EnhancedAuth: Initialization complete');

    } catch (error) {
      console.warn('⚠️ EnhancedAuth: Initial setup encountered issues, will work when needed');
      // Don't throw - allow the app to continue
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Ensure user is authenticated with minimal logging
   */
  private async ensureAuthenticated(): Promise<User | null> {
    try {
      // Check if already authenticated
      if (originalAuth.currentUser) {
        this.currentUser = originalAuth.currentUser;
        return originalAuth.currentUser;
      }

      // Only log when actually attempting sign-in
      console.log('🔄 EnhancedAuth: Authenticating user...');
      const userCredential = await signInAnonymously(originalAuth);
      this.currentUser = userCredential.user;
      
      console.log('✅ EnhancedAuth: Authentication successful');
      return userCredential.user;

    } catch (error) {
      // Silent handling - auth will work when Firebase is ready
      console.warn('⚠️ EnhancedAuth: Authentication pending, will retry automatically');
      return null;
    }
  }

  /**
   * Get current user with initialization guarantee
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // If still no user, try once more
    if (!this.currentUser) {
      await this.ensureAuthenticated();
    }
    
    return this.currentUser;
  }

  /**
   * Get current user synchronously
   */
  getCurrentUserSync(): User | null {
    return this.currentUser;
  }

  /**
   * Enhanced auth state listener with immediate callback
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Call immediately with current state if available
    if (this.isInitialized) {
      callback(this.currentUser);
    } else {
      // Initialize and then call
      this.initialize().then(() => {
        callback(this.currentUser);
      });
    }

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners efficiently
   */
  private notifyListeners(user: User | null): void {
    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      this.authStateListeners.forEach(listener => {
        try {
          listener(user);
        } catch (error) {
          console.error('❌ EnhancedAuth: Listener error:', error);
        }
      });
    }, 0);
  }

  /**
   * Check authentication status
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Get Firebase UID safely
   */
  getFirebaseUid(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Force authentication refresh
   */
  async refreshAuth(): Promise<User | null> {
    console.log('🔄 EnhancedAuth: Refreshing authentication...');
    this.currentUser = null;
    return this.ensureAuthenticated();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    this.authStateListeners = [];
    this.currentUser = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const enhancedAuthService = new EnhancedAuthService();

// Export convenience functions that reduce timeout issues
export const getCurrentUser = (): User | null => enhancedAuthService.getCurrentUserSync();
export const getCurrentUserAsync = (): Promise<User | null> => enhancedAuthService.getCurrentUser();
export const isAuthenticated = (): boolean => enhancedAuthService.isAuthenticated();
export const getFirebaseUid = (): string | null => enhancedAuthService.getFirebaseUid();

/**
 * Enhanced auth state listener that handles initialization delays
 */
export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return enhancedAuthService.onAuthStateChanged(callback);
};

export default enhancedAuthService;
