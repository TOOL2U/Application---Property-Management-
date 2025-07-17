/**
 * Local Staff Service
 * Manages staff profiles and data for PIN-based authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web-compatible secure storage
let SecureStore: any;
if (Platform.OS === 'web') {
  // For web, use localStorage as a fallback
  SecureStore = {
    setItemAsync: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    getItemAsync: async (key: string) => {
      return localStorage.getItem(key);
    },
    deleteItemAsync: async (key: string) => {
      localStorage.removeItem(key);
    },
  };
} else {
  // For native platforms, use expo-secure-store
  SecureStore = require('expo-secure-store');
}

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'cleaner' | 'maintenance' | 'housekeeper' | 'concierge';
  avatar?: string;
  isActive: boolean;
  department?: string;
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface StaffSession {
  profileId: string;
  loginTime: Date;
  expiresAt: Date;
  deviceId: string;
}

// Storage keys
const STAFF_PROFILES_KEY = '@staff_profiles';
const CURRENT_SESSION_KEY = '@current_session';
const PIN_PREFIX = 'staff_pin_';  // Fixed: Removed @ symbol for SecureStore compatibility

/**
 * Sanitize profile ID for use as SecureStore key
 * SecureStore keys must contain only alphanumeric characters, ".", "-", and "_"
 * This function ensures the key is valid by replacing or removing invalid characters
 */
const sanitizeKeyForSecureStore = (profileId: string): string => {
  if (!profileId || profileId.trim() === '') {
    console.warn('⚠️ LocalStaffService: Empty profile ID provided, using fallback');
    return 'unknown_profile';
  }
  
  // Replace any character that's not alphanumeric, ".", "-", or "_" with underscore
  const sanitized = profileId
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace invalid chars with underscore
    .replace(/-/g, '_')                // Replace hyphens with underscores (more reliable)
    .replace(/_{2,}/g, '_')            // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '');          // Remove leading/trailing underscores
  
  console.log(`🔧 LocalStaffService: Sanitized key "${profileId}" -> "${sanitized}"`);
  return sanitized || 'fallback_key';
};

/**
 * Create a valid SecureStore key by combining prefix and sanitized profile ID
 */
const createSecureStoreKey = (profileId: string): string => {
  const sanitizedId = sanitizeKeyForSecureStore(profileId);
  const fullKey = `${PIN_PREFIX}${sanitizedId}`;
  
  // Final validation - ensure the complete key is valid
  const validKey = fullKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  if (validKey !== fullKey) {
    console.log(`🔧 LocalStaffService: Final key sanitization: "${fullKey}" -> "${validKey}"`);
  }
  
  return validKey;
};

class LocalStaffService {
  /**
   * Initialize staff profiles storage (production ready - no default data)
   */
  async initializeStaffProfiles(): Promise<void> {
    try {
      const existingProfiles = await this.getStaffProfiles();
      console.log(`📋 LocalStaffService: Found ${existingProfiles.length} existing staff profiles`);
      
      // In production, staff profiles should be managed through the admin panel
      // No default profiles are created automatically
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to initialize staff profiles:', error);
    }
  }

  /**
   * Get all staff profiles
   */
  async getStaffProfiles(): Promise<StaffProfile[]> {
    try {
      const profilesData = await AsyncStorage.getItem(STAFF_PROFILES_KEY);
      if (profilesData) {
        const profiles = JSON.parse(profilesData);
        // Convert date strings back to Date objects
        return profiles.map((profile: any) => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
          lastLogin: profile.lastLogin ? new Date(profile.lastLogin) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to get staff profiles:', error);
      return [];
    }
  }

  /**
   * Get active staff profiles only
   */
  async getActiveStaffProfiles(): Promise<StaffProfile[]> {
    const profiles = await this.getStaffProfiles();
    return profiles.filter(profile => profile.isActive);
  }

  /**
   * Get staff profile by ID
   */
  async getStaffProfile(profileId: string): Promise<StaffProfile | null> {
    const profiles = await this.getStaffProfiles();
    return profiles.find(profile => profile.id === profileId) || null;
  }

  /**
   * Set PIN for a staff profile
   */
  async setStaffPIN(profileId: string, pin: string): Promise<boolean> {
    try {
      // Validate input
      if (!profileId || typeof profileId !== 'string' || profileId.trim() === '') {
        console.error(`❌ LocalStaffService: Invalid profile ID provided to setStaffPIN: "${profileId}"`);
        return false;
      }
      
      if (!pin || typeof pin !== 'string' || pin.length !== 4) {
        console.error(`❌ LocalStaffService: Invalid PIN provided: "${pin}"`);
        return false;
      }
      
      const pinKey = createSecureStoreKey(profileId);
      
      // Validate the final key
      if (!pinKey || pinKey === PIN_PREFIX || pinKey.length < 5) {
        console.error(`❌ LocalStaffService: Invalid PIN key generated: "${pinKey}"`);
        return false;
      }
      
      await SecureStore.setItemAsync(pinKey, pin);
      console.log(`🔐 LocalStaffService: PIN set for profile ${profileId} (key: ${pinKey})`);
      return true;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to set PIN:', error);
      console.error(`   Profile ID: "${profileId}" (type: ${typeof profileId})`);
      console.error(`   PIN: "${pin}" (type: ${typeof pin})`);
      return false;
    }
  }

  /**
   * Verify PIN for a staff profile
   */
  async verifyStaffPIN(profileId: string, pin: string): Promise<boolean> {
    try {
      const pinKey = createSecureStoreKey(profileId);
      const storedPin = await SecureStore.getItemAsync(pinKey);
      
      if (!storedPin) {
        console.log(`🔐 LocalStaffService: No PIN found for profile ${profileId} (key: ${pinKey})`);
        return false;
      }
      
      const isValid = storedPin === pin;
      console.log(`🔐 LocalStaffService: PIN verification for ${profileId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      return isValid;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to verify PIN:', error);
      return false;
    }
  }  /**
   * Check if PIN exists for a staff profile
   */
  async hasPIN(profileId: string): Promise<boolean> {
    try {
      // Validate input
      if (!profileId || typeof profileId !== 'string' || profileId.trim() === '') {
        console.warn(`⚠️ LocalStaffService: Invalid profile ID provided to hasPIN: "${profileId}"`);
        return false;
      }
      
      console.log(`🔍 LocalStaffService: Checking PIN for profile: "${profileId}"`);
      
      const pinKey = createSecureStoreKey(profileId);
      
      // Validate the final key
      if (!pinKey || pinKey === PIN_PREFIX || pinKey.length < 5) {
        console.warn(`⚠️ LocalStaffService: Invalid PIN key generated: "${pinKey}"`);
        return false;
      }
      
      console.log(`🔑 LocalStaffService: Using valid key: "${pinKey}"`);
      
      const storedPin = await SecureStore.getItemAsync(pinKey);
      const hasPin = !!storedPin;
      console.log(`🔐 LocalStaffService: PIN check for ${profileId} (key: ${pinKey}): ${hasPin ? 'EXISTS' : 'NOT_FOUND'}`);
      return hasPin;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to check PIN existence:', error);
      console.error(`   Profile ID: "${profileId}" (type: ${typeof profileId})`);
      console.error(`   Error details:`, error);
      return false;
    }
  }

  /**
   * Create a new session for a staff profile
   */
  async createSession(profileId: string): Promise<StaffSession> {
    const session: StaffSession = {
      profileId,
      loginTime: new Date(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      deviceId: 'mobile-app', // Could be made dynamic
    };

    try {
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
      
      // Update last login time for the profile
      await this.updateLastLogin(profileId);
      
      console.log(`✅ LocalStaffService: Session created for profile ${profileId}`);
      return session;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<StaffSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Convert date strings back to Date objects
        const parsedSession: StaffSession = {
          ...session,
          loginTime: new Date(session.loginTime),
          expiresAt: new Date(session.expiresAt),
        };

        // Check if session is still valid
        if (parsedSession.expiresAt > new Date()) {
          return parsedSession;
        } else {
          console.log('⏰ LocalStaffService: Session expired, clearing...');
          await this.clearSession();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Clear current session
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      console.log('🗑️ LocalStaffService: Session cleared');
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to clear session:', error);
    }
  }

  /**
   * Update last login time for a profile
   */
  private async updateLastLogin(profileId: string): Promise<void> {
    try {
      const profiles = await this.getStaffProfiles();
      const updatedProfiles = profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, lastLogin: new Date() }
          : profile
      );
      await AsyncStorage.setItem(STAFF_PROFILES_KEY, JSON.stringify(updatedProfiles));
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to update last login:', error);
    }
  }

  /**
   * Remove PIN for a staff profile (for testing/reset purposes)
   */
  async removePIN(profileId: string): Promise<boolean> {
    try {
      const pinKey = createSecureStoreKey(profileId);
      await SecureStore.deleteItemAsync(pinKey);
      console.log(`🗑️ LocalStaffService: PIN removed for profile ${profileId} (key: ${pinKey})`);
      return true;
    } catch (error) {
      console.error('❌ LocalStaffService: Failed to remove PIN:', error);
      return false;
    }
  }
}

export const localStaffService = new LocalStaffService();
export default localStaffService;
