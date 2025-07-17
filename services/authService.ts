import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import bcrypt from 'bcryptjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface StaffAccount {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff';
  department?: string;
  isActive: boolean;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
  // New fields for PIN-protected profiles
  pin?: string; // 4-digit PIN code
  photo?: string; // Profile photo URL
  // Internal fields (not exposed to client)
  passwordHash?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
  createdAt: number;
}

export interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: StaffAccount;
  error?: string;
}

class AuthService {
  private readonly COLLECTION_NAME = 'staff_accounts';
  private readonly SESSION_KEY = '@staff_auth_session';
  private readonly ATTEMPTS_KEY = '@login_attempts';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Authenticate user with email and password with enhanced security
   */
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService: Authenticating user:', email);

      // Validate input
      if (!email?.trim() || !password?.trim()) {
        await this.recordLoginAttempt(email, false);
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Check rate limiting
      const isLocked = await this.isAccountLocked(email);
      if (isLocked) {
        console.log('🔒 AuthService: Account temporarily locked:', email);
        return {
          success: false,
          error: 'Too many failed attempts. Please try again later.'
        };
      }

      // Query Firestore for active staff account
      const staffAccountsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        staffAccountsRef,
        where('email', '==', email.toLowerCase().trim()),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ AuthService: No active account found for:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Get the first matching document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as DocumentData;

      // Verify password using bcrypt
      const passwordHash = userData.passwordHash;
      if (!passwordHash) {
        console.error('❌ AuthService: No password hash found for user:', email);
        return {
          success: false,
          error: 'Account configuration error. Please contact support.'
        };
      }

      const passwordMatch = await bcrypt.compare(password, passwordHash);
      if (!passwordMatch) {
        console.log('❌ AuthService: Invalid password for user:', email);
        await this.recordLoginAttempt(email, false);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Record successful login attempt
      await this.recordLoginAttempt(email, true);

      // Create authenticated user object
      const authenticatedUser: StaffAccount = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

      // Update last login timestamp
      await this.updateLastLogin(userDoc.id);

      // Create and store secure session
      const session = await this.createSession(authenticatedUser);
      await this.storeSession(session);

      console.log('✅ AuthService: Authentication successful for:', email);
      console.log('👤 User role:', authenticatedUser.role);
      console.log('🎫 Session created with expiration:', new Date(session.expiresAt));

      return {
        success: true,
        user: authenticatedUser
      };

    } catch (error) {
      console.error('❌ AuthService: Authentication error:', error);

      let errorMessage = 'Authentication failed';

      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('permission-denied')) {
          errorMessage = 'Access denied. Contact your administrator.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ AuthService: Updated last login for user:', userId);
    } catch (error) {
      console.warn('⚠️ AuthService: Failed to update last login:', error);
      // Don't throw error as this is not critical for authentication
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<StaffAccount | null> {
    try {
      const staffAccountsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        staffAccountsRef,
        where('__name__', '==', userId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as DocumentData;

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name, // Fixed: use 'name' instead of firstName/lastName
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    } catch (error) {
      console.error('❌ AuthService: Get user error:', error);
      return null;
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Create a new staff account (admin function)
   */
  async createStaffAccount(accountData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
    role: 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff';
    department?: string;
  }): Promise<AuthResult> {
    try {
      console.log('👤 AuthService: Creating staff account for:', accountData.email);

      // Check if email already exists
      const existingUser = await this.getUserByEmail(accountData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already exists'
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(accountData.password);

      // Create user document
      const staffAccountsRef = collection(db, this.COLLECTION_NAME);
      const newUserDoc = doc(staffAccountsRef);

      const userData = {
        email: accountData.email.toLowerCase().trim(),
        passwordHash,
        name: accountData.name,
        phone: accountData.phone || '',
        address: accountData.address || '',
        role: accountData.role,
        department: accountData.department || '',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null
      };

      await updateDoc(newUserDoc, userData);

      console.log('✅ AuthService: Staff account created successfully');
      return {
        success: true,
        user: {
          id: newUserDoc.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          role: userData.role,
          department: userData.department,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          lastLogin: userData.lastLogin
        }
      };

    } catch (error) {
      console.error('❌ AuthService: Create account error:', error);
      return {
        success: false,
        error: 'Failed to create account'
      };
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<StaffAccount | null> {
    try {
      const staffAccountsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        staffAccountsRef,
        where('email', '==', email.toLowerCase().trim())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as DocumentData;

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };

    } catch (error) {
      console.error('❌ AuthService: Get user by email error:', error);
      return null;
    }
  }

  /**
   * Check if Firebase connection is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const testRef = collection(db, this.COLLECTION_NAME);
      const testQuery = query(testRef, where('isActive', '==', true));
      await getDocs(testQuery);
      return true;
    } catch (error) {
      console.error('❌ AuthService: Connection check failed:', error);
      return false;
    }
  }

  /**
   * Create secure session token
   */
  private async createSession(user: StaffAccount): Promise<AuthSession> {
    const now = Date.now();
    const token = this.generateSecureToken();

    return {
      token,
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: now + this.SESSION_DURATION,
      createdAt: now
    };
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '_' + Date.now();
  }

  /**
   * Obfuscate token for web storage (simple XOR-based obfuscation)
   */
  private obfuscateToken(token: string): string {
    const key = 'SiaMoonPropertyManagement2025';
    let result = '';
    for (let i = 0; i < token.length; i++) {
      const charCode = token.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode the result
  }

  /**
   * Store session securely (platform-aware)
   */
  private async storeSession(session: AuthSession): Promise<void> {
    try {
      // Store in AsyncStorage for easy access
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      // Store sensitive data based on platform
      if (Platform.OS === 'web') {
        // For web, use AsyncStorage with encryption-like obfuscation
        const obfuscatedToken = this.obfuscateToken(session.token);
        await AsyncStorage.setItem('@staff_auth_token_secure', obfuscatedToken);
        await AsyncStorage.setItem('@staff_auth_user_id', session.userId);
      } else {
        // For mobile, use Keychain/Keystore
        const Keychain = require('react-native-keychain');
        await Keychain.setInternetCredentials(
          'staff_auth_token',
          session.userId,
          session.token
        );
      }

      console.log('🔐 Session stored securely');
    } catch (error) {
      console.error('❌ Failed to store session:', error);
      throw new Error('Failed to create secure session');
    }
  }

  /**
   * Retrieve stored session (platform-aware)
   */
  async getStoredSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('⏰ Session expired, clearing stored data');
        await this.clearSession();
        return null;
      }

      // Verify token based on platform
      if (Platform.OS === 'web') {
        // For web, verify against obfuscated token in AsyncStorage
        const storedObfuscatedToken = await AsyncStorage.getItem('@staff_auth_token_secure');
        const storedUserId = await AsyncStorage.getItem('@staff_auth_user_id');

        if (!storedObfuscatedToken || !storedUserId) {
          console.log('🔒 Token not found, clearing session');
          await this.clearSession();
          return null;
        }

        const expectedObfuscatedToken = this.obfuscateToken(session.token);
        if (storedObfuscatedToken !== expectedObfuscatedToken || storedUserId !== session.userId) {
          console.log('🔒 Token mismatch, clearing session');
          await this.clearSession();
          return null;
        }
      } else {
        // For mobile, verify token in keychain
        const Keychain = require('react-native-keychain');
        const credentials = await Keychain.getInternetCredentials('staff_auth_token');
        if (!credentials || credentials.password !== session.token) {
          console.log('🔒 Token mismatch, clearing session');
          await this.clearSession();
          return null;
        }
      }

      return session;
    } catch (error) {
      console.error('❌ Failed to retrieve session:', error);
      return null;
    }
  }

  /**
   * Clear stored session (platform-aware)
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);

      if (Platform.OS === 'web') {
        // For web, clear AsyncStorage items
        await AsyncStorage.removeItem('@staff_auth_token_secure');
        await AsyncStorage.removeItem('@staff_auth_user_id');
      } else {
        // For mobile, clear Keychain
        const Keychain = require('react-native-keychain');
        await Keychain.resetInternetCredentials('staff_auth_token');
      }

      console.log('🗑️ Session cleared');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Record login attempt for rate limiting
   */
  private async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    try {
      const attemptsData = await AsyncStorage.getItem(this.ATTEMPTS_KEY);
      const attempts: LoginAttempt[] = attemptsData ? JSON.parse(attemptsData) : [];

      // Add new attempt
      attempts.push({
        email: email.toLowerCase(),
        timestamp: Date.now(),
        success
      });

      // Keep only recent attempts (last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneDayAgo);

      await AsyncStorage.setItem(this.ATTEMPTS_KEY, JSON.stringify(recentAttempts));
    } catch (error) {
      console.error('❌ Failed to record login attempt:', error);
    }
  }

  /**
   * Check if account is temporarily locked due to failed attempts
   */
  private async isAccountLocked(email: string): Promise<boolean> {
    try {
      const attemptsData = await AsyncStorage.getItem(this.ATTEMPTS_KEY);
      if (!attemptsData) {
        return false;
      }

      const attempts: LoginAttempt[] = JSON.parse(attemptsData);
      const userEmail = email.toLowerCase();
      const lockoutTime = Date.now() - this.LOCKOUT_DURATION;

      // Get recent failed attempts for this email
      const recentFailedAttempts = attempts.filter(attempt =>
        attempt.email === userEmail &&
        !attempt.success &&
        attempt.timestamp > lockoutTime
      );

      return recentFailedAttempts.length >= this.MAX_LOGIN_ATTEMPTS;
    } catch (error) {
      console.error('❌ Failed to check account lock status:', error);
      return false;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<StaffAccount | null> {
    try {
      const session = await this.getStoredSession();
      if (!session) {
        return null;
      }

      // Get fresh user data from Firestore
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, session.userId));
      if (!userDoc.exists()) {
        console.log('❌ User no longer exists, clearing session');
        await this.clearSession();
        return null;
      }

      const userData = userDoc.data() as DocumentData;

      // Check if user is still active
      if (!userData.isActive) {
        console.log('❌ User account deactivated, clearing session');
        await this.clearSession();
        return null;
      }

      return {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        role: userData.role,
        department: userData.department,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return null;
    }
  }

  /**
   * Sign out user - clears individual staff session only
   * Note: This does NOT clear Firebase Auth - use sharedAuthService.signOutShared() for that
   */
  async signOut(): Promise<void> {
    try {
      console.log('👋 AuthService: Starting individual staff session sign out...');
      await this.clearSession();
      console.log('✅ AuthService: Individual staff session cleared successfully');
    } catch (error) {
      console.error('❌ AuthService: Sign out error:', error);
      // Don't throw error here - we want to ensure sign out always succeeds
      // even if there are issues clearing the session
      console.log('⚠️ AuthService: Sign out completed with warnings');
    }
  }
}

export const authService = new AuthService();
export default authService;
