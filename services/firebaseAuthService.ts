/**
 * Firebase Authentication Service
 * Implements new security requirements from backend team
 * Handles authentication, role claims, and permission errors
 */

import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  IdTokenResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface StaffRole {
  role: 'staff' | 'admin' | 'manager' | 'cleaner' | 'inspector' | 'maintenance';
  companyId?: string;
  admin?: boolean;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: string;
  isAdmin: boolean;
  claims: StaffRole;
}

class FirebaseAuthService {
  private currentUser: AuthenticatedUser | null = null;
  private authStateListeners: ((user: AuthenticatedUser | null) => void)[] = [];

  constructor() {
    // Set up auth state listener
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const userWithClaims = await this.createAuthenticatedUser(firebaseUser, idTokenResult);
          this.currentUser = userWithClaims;
          console.log('✅ Firebase Auth: User authenticated with role:', userWithClaims.role);
        } catch (error) {
          console.error('❌ Firebase Auth: Failed to process user claims:', error);
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
        console.log('🔓 Firebase Auth: User signed out');
      }

      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  /**
   * Ensure user is authenticated before any Firestore operations
   * As required by new security rules
   */
  async ensureAuthenticated(): Promise<AuthenticatedUser> {
    return new Promise((resolve, reject) => {
      if (this.currentUser) {
        resolve(this.currentUser);
        return;
      }

      // Wait for auth state change
      const unsubscribe = this.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not authenticated - all database operations require authentication'));
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Authentication timeout - please login'));
      }, 5000);
    });
  }

  /**
   * Sign in staff member with email and password
   * Required for all Firestore operations per new security rules
   */
  async signInStaff(email: string, password: string): Promise<AuthenticatedUser> {
    try {
      console.log('🔐 Firebase Auth: Signing in staff member:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult();
      
      // Validate role claims
      if (!idTokenResult.claims.role) {
        throw new Error('User role not set - contact administrator to set user role in Firebase Auth custom claims');
      }

      const authenticatedUser = await this.createAuthenticatedUser(userCredential.user, idTokenResult);
      
      console.log('✅ Firebase Auth: Staff sign-in successful:', {
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        isAdmin: authenticatedUser.isAdmin
      });

      return authenticatedUser;
    } catch (error: any) {
      console.error('❌ Firebase Auth: Sign-in failed:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('Staff account not found. Please contact your administrator.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Invalid password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      
      throw new Error(error.message || 'Sign-in failed. Please try again.');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ Firebase Auth: User signed out successfully');
    } catch (error) {
      console.error('❌ Firebase Auth: Sign-out failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    if (!this.currentUser) return false;
    
    return this.currentUser.isAdmin || 
           ['admin', 'manager', 'supervisor'].includes(this.currentUser.role);
  }

  /**
   * Check if current user is staff
   */
  isStaff(): boolean {
    if (!this.currentUser) return false;
    
    return ['staff', 'cleaner', 'inspector', 'maintenance'].includes(this.currentUser.role);
  }

  /**
   * Get user's ID token with claims
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    return await user.getIdToken(forceRefresh);
  }

  /**
   * Get user role from token claims
   */
  async getUserRole(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      const idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims.role as string || null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  /**
   * Force refresh user token and claims
   * Useful when roles are updated on backend
   */
  async refreshUserToken(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      console.log('🔄 Firebase Auth: Refreshing user token and claims...');
      const idTokenResult = await user.getIdTokenResult(true); // Force refresh
      const updatedUser = await this.createAuthenticatedUser(user, idTokenResult);
      this.currentUser = updatedUser;
      
      // Notify listeners of updated claims
      this.authStateListeners.forEach(listener => listener(this.currentUser));
      
      console.log('✅ Firebase Auth: Token refreshed, role:', updatedUser.role);
    } catch (error) {
      console.error('❌ Firebase Auth: Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChanged(callback: (user: AuthenticatedUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle Firestore permission errors
   * Provides helpful error messages and retry suggestions
   */
  handlePermissionError(error: any): Error {
    if (error.code === 'permission-denied') {
      if (!this.currentUser) {
        return new Error('Permission denied: User not authenticated. Please sign in to access this data.');
      }
      
      if (!this.currentUser.role) {
        return new Error('Permission denied: User role not set. Please contact your administrator.');
      }
      
      return new Error(`Permission denied: Your role (${this.currentUser.role}) does not have access to this data.`);
    }
    
    return error;
  }

  /**
   * Test Firestore access with current authentication
   * Useful for debugging permission issues
   */
  async testFirestoreAccess(): Promise<boolean> {
    try {
      if (!this.currentUser) {
        console.log('🚫 Firestore Test: No authenticated user');
        return false;
      }

      // Try to access a simple document the user should have access to
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const staffDoc = doc(db, 'staff', this.currentUser.uid);
      await getDoc(staffDoc);
      
      console.log('✅ Firestore Test: Access working for user:', this.currentUser.email);
      return true;
    } catch (error: any) {
      console.error('❌ Firestore Test: Access failed:', error.code, error.message);
      return false;
    }
  }

  /**
   * Create authenticated user object with role claims
   */
  private async createAuthenticatedUser(firebaseUser: User, idTokenResult: IdTokenResult): Promise<AuthenticatedUser> {
    const role = idTokenResult.claims.role as string;
    const isAdmin = idTokenResult.claims.admin === true || 
                   ['admin', 'manager', 'supervisor'].includes(role);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      role,
      isAdmin,
      claims: {
        role: role as StaffRole['role'],
        companyId: idTokenResult.claims.companyId as string,
        admin: isAdmin
      }
    };
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
