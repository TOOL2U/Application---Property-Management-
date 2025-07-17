/**
 * Staff Profile Service
 * Handles staff profile management, PIN validation, and profile selection
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Note: This service now relies exclusively on staff_accounts collection
// No hardcoded credentials - all authentication is handled through PIN system

// Storage keys
const STORAGE_KEYS = {
  SELECTED_STAFF_ID: 'selected_staff_id',
  REMEMBER_STAFF: 'remember_staff',
  LAST_LOGIN_TIME: 'last_login_time'
};

// Staff profile interface
export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  pin: string;
  photo?: string;
  department?: string;
  isActive: boolean;
  createdAt?: any;
  lastLogin?: any;
}

// PIN validation result
export interface PINValidationResult {
  isValid: boolean;
  staffProfile?: StaffProfile;
  error?: string;
}

/**
 * Fetch all staff profiles from Firestore
 */
export const fetchAllStaffProfiles = async (): Promise<StaffProfile[]> => {
  try {
    console.log('🔍 Fetching all staff profiles...');
    
    const staffCollection = collection(db, 'staff_accounts');
    const snapshot = await getDocs(staffCollection);
    
    const profiles: StaffProfile[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({
        id: doc.id,
        name: data.name || 'Unknown Staff',
        email: data.email || '',
        role: data.role || 'staff',
        pin: data.pin || '',
        photo: data.photo || null,
        department: data.department || '',
        isActive: data.isActive !== false, // Default to true if not specified
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      });
    });

    console.log(`✅ Fetched ${profiles.length} staff profiles`);
    return profiles.filter(profile => profile.isActive); // Only return active profiles
  } catch (error) {
    console.error('❌ Error fetching staff profiles:', error);
    throw new Error('Failed to fetch staff profiles');
  }
};

/**
 * Get a specific staff profile by ID
 */
export const getStaffProfile = async (staffId: string): Promise<StaffProfile | null> => {
  try {
    console.log('🔍 Fetching staff profile:', staffId);
    
    const staffDoc = doc(db, 'staff_accounts', staffId);
    const snapshot = await getDoc(staffDoc);
    
    if (!snapshot.exists()) {
      console.warn('⚠️ Staff profile not found:', staffId);
      return null;
    }

    const data = snapshot.data();
    const profile: StaffProfile = {
      id: snapshot.id,
      name: data.name || 'Unknown Staff',
      email: data.email || '',
      role: data.role || 'staff',
      pin: data.pin || '',
      photo: data.photo || null,
      department: data.department || '',
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      lastLogin: data.lastLogin
    };

    console.log('✅ Staff profile fetched:', profile.name);
    return profile;
  } catch (error) {
    console.error('❌ Error fetching staff profile:', error);
    return null;
  }
};

/**
 * Validate PIN for a specific staff member
 */
export const validateStaffPIN = async (staffId: string, enteredPIN: string): Promise<PINValidationResult> => {
  try {
    console.log('🔐 Validating PIN for staff:', staffId);
    
    // Input validation
    if (!enteredPIN || enteredPIN.length !== 4) {
      return {
        isValid: false,
        error: 'PIN must be 4 digits'
      };
    }

    // Fetch staff profile
    const staffProfile = await getStaffProfile(staffId);
    if (!staffProfile) {
      return {
        isValid: false,
        error: 'Staff profile not found'
      };
    }

    if (!staffProfile.isActive) {
      return {
        isValid: false,
        error: 'Staff account is inactive'
      };
    }

    // Validate PIN (simple string comparison for now)
    const isValid = staffProfile.pin === enteredPIN;
    
    if (isValid) {
      console.log('✅ PIN validation successful for:', staffProfile.name);
      return {
        isValid: true,
        staffProfile
      };
    } else {
      console.log('❌ PIN validation failed for:', staffProfile.name);
      return {
        isValid: false,
        error: 'Incorrect PIN'
      };
    }
  } catch (error) {
    console.error('❌ Error validating PIN:', error);
    return {
      isValid: false,
      error: 'PIN validation failed'
    };
  }
};

/**
 * Save selected staff ID to local storage
 */
export const saveSelectedStaffId = async (staffId: string, remember: boolean = false): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_STAFF_ID, staffId);
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_STAFF, remember.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN_TIME, Date.now().toString());
    
    console.log('✅ Selected staff ID saved:', staffId, 'Remember:', remember);
  } catch (error) {
    console.error('❌ Error saving selected staff ID:', error);
  }
};

/**
 * Get saved staff ID from local storage
 */
export const getSavedStaffId = async (): Promise<string | null> => {
  try {
    const staffId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STAFF_ID);
    const remember = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_STAFF);
    
    if (staffId && remember === 'true') {
      console.log('✅ Retrieved saved staff ID:', staffId);
      return staffId;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting saved staff ID:', error);
    return null;
  }
};

/**
 * Clear saved staff data
 */
export const clearSavedStaffData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SELECTED_STAFF_ID,
      STORAGE_KEYS.REMEMBER_STAFF,
      STORAGE_KEYS.LAST_LOGIN_TIME
    ]);
    
    console.log('✅ Saved staff data cleared');
  } catch (error) {
    console.error('❌ Error clearing saved staff data:', error);
  }
};

/**
 * Check if staff data should be remembered (within 24 hours)
 */
export const shouldRememberStaff = async (): Promise<boolean> => {
  try {
    const lastLoginTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN_TIME);
    const remember = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_STAFF);
    
    if (!lastLoginTime || remember !== 'true') {
      return false;
    }

    const lastLogin = parseInt(lastLoginTime);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (now - lastLogin) < twentyFourHours;
  } catch (error) {
    console.error('❌ Error checking remember staff:', error);
    return false;
  }
};

/**
 * Rate limiting for PIN attempts
 */
const PIN_ATTEMPT_STORAGE_KEY = 'pin_attempts';
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkPINAttempts = async (staffId: string): Promise<{ canAttempt: boolean; attemptsLeft: number; lockoutTime?: number }> => {
  try {
    const attemptsData = await AsyncStorage.getItem(`${PIN_ATTEMPT_STORAGE_KEY}_${staffId}`);
    
    if (!attemptsData) {
      return { canAttempt: true, attemptsLeft: MAX_PIN_ATTEMPTS };
    }

    const { attempts, lastAttempt } = JSON.parse(attemptsData);
    const now = Date.now();
    
    // Reset attempts after lockout period
    if (now - lastAttempt > LOCKOUT_DURATION) {
      await AsyncStorage.removeItem(`${PIN_ATTEMPT_STORAGE_KEY}_${staffId}`);
      return { canAttempt: true, attemptsLeft: MAX_PIN_ATTEMPTS };
    }

    const attemptsLeft = MAX_PIN_ATTEMPTS - attempts;
    
    if (attemptsLeft <= 0) {
      const lockoutTime = lastAttempt + LOCKOUT_DURATION;
      return { canAttempt: false, attemptsLeft: 0, lockoutTime };
    }

    return { canAttempt: true, attemptsLeft };
  } catch (error) {
    console.error('❌ Error checking PIN attempts:', error);
    return { canAttempt: true, attemptsLeft: MAX_PIN_ATTEMPTS };
  }
};

export const recordPINAttempt = async (staffId: string, success: boolean): Promise<void> => {
  try {
    if (success) {
      // Clear attempts on successful PIN entry
      await AsyncStorage.removeItem(`${PIN_ATTEMPT_STORAGE_KEY}_${staffId}`);
      return;
    }

    const attemptsData = await AsyncStorage.getItem(`${PIN_ATTEMPT_STORAGE_KEY}_${staffId}`);
    const now = Date.now();
    
    let attempts = 1;
    if (attemptsData) {
      const { attempts: prevAttempts } = JSON.parse(attemptsData);
      attempts = prevAttempts + 1;
    }

    await AsyncStorage.setItem(`${PIN_ATTEMPT_STORAGE_KEY}_${staffId}`, JSON.stringify({
      attempts,
      lastAttempt: now
    }));

    console.log(`⚠️ PIN attempt recorded for ${staffId}: ${attempts}/${MAX_PIN_ATTEMPTS}`);
  } catch (error) {
    console.error('❌ Error recording PIN attempt:', error);
  }
};
