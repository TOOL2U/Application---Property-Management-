import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { StaffAccount } from './authService';
import { Storage } from '../utils/storage';

// Note: This service now relies exclusively on staff_accounts collection
// No hardcoded credentials - all authentication is handled through PIN system

// Storage keys
const SELECTED_STAFF_KEY = '@selected_staff_id';
const REMEMBER_STAFF_KEY = '@remember_staff_id';

export interface SharedAuthResult {
  success: boolean;
  error?: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  role: string;
  department?: string;
  photo?: string;
  isActive: boolean;
}

export interface PINVerificationResult {
  success: boolean;
  staff?: StaffAccount;
  error?: string;
}

/**
 * Shared Authentication Service
 * Handles shared Firebase Auth login and staff profile management
 */
class SharedAuthService {
  private readonly COLLECTION_NAME = 'staff_accounts';

  /**
   * Note: This method is deprecated as the app now uses PIN-based authentication
   * with staff_accounts collection exclusively
   */
  async signInShared(): Promise<SharedAuthResult> {
    console.warn('⚠️ SharedAuthService: signInShared is deprecated - use PIN authentication instead');
    return {
      success: false,
      error: 'Shared authentication is deprecated. Please use PIN authentication with staff accounts.'
    };
  }

  /**
   * Get all active staff profiles for selection
   */
  async getAllStaffProfiles(): Promise<StaffProfile[]> {
    try {
      console.log('👥 SharedAuthService: Fetching all staff profiles...');
      
      // Check if Firebase is properly initialized
      if (!db) {
        console.warn('⚠️ SharedAuthService: Firebase Firestore is not initialized, returning empty array');
        return [];
      }

      const staffCollection = collection(db, this.COLLECTION_NAME);
      const activeStaffQuery = query(staffCollection, where('isActive', '==', true));
      const querySnapshot = await getDocs(activeStaffQuery);

      const profiles: StaffProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        profiles.push({
          id: doc.id,
          name: data.name,
          role: data.role,
          department: data.department,
          photo: data.photo,
          isActive: data.isActive
        });
      });

      console.log(`✅ SharedAuthService: Found ${profiles.length} active staff profiles`);
      return profiles;
    } catch (error) {
      console.error('❌ SharedAuthService: Failed to fetch staff profiles:', error);
      return [];
    }
  }

  /**
   * Verify PIN for selected staff member
   */
  async verifyStaffPIN(staffId: string, enteredPIN: string): Promise<PINVerificationResult> {
    try {
      console.log('🔢 SharedAuthService: Verifying PIN for staff:', staffId);
      
      if (!enteredPIN || enteredPIN.length !== 4) {
        return { success: false, error: 'PIN must be 4 digits' };
      }

      const staffDoc = doc(db, this.COLLECTION_NAME, staffId);
      const staffSnapshot = await getDoc(staffDoc);

      if (!staffSnapshot.exists()) {
        console.log('❌ SharedAuthService: Staff member not found:', staffId);
        return { success: false, error: 'Staff member not found' };
      }

      const staffData = staffSnapshot.data();
      
      if (!staffData.isActive) {
        console.log('❌ SharedAuthService: Staff member is inactive:', staffId);
        return { success: false, error: 'Staff account is inactive' };
      }

      // Check if PIN exists and matches
      if (!staffData.pin) {
        console.log('❌ SharedAuthService: No PIN set for staff member:', staffId);
        return { success: false, error: 'No PIN set for this staff member' };
      }

      if (staffData.pin !== enteredPIN) {
        console.log('❌ SharedAuthService: Incorrect PIN for staff:', staffId);
        return { success: false, error: 'Incorrect PIN' };
      }

      // PIN verified successfully
      console.log('✅ SharedAuthService: PIN verified successfully for:', staffId);
      
      const staff: StaffAccount = {
        id: staffSnapshot.id,
        email: staffData.email,
        name: staffData.name,
        phone: staffData.phone,
        address: staffData.address,
        role: staffData.role,
        department: staffData.department,
        isActive: staffData.isActive,
        lastLogin: staffData.lastLogin,
        createdAt: staffData.createdAt,
        updatedAt: staffData.updatedAt,
        pin: staffData.pin,
        photo: staffData.photo
      };

      return { success: true, staff };
    } catch (error) {
      console.error('❌ SharedAuthService: PIN verification failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PIN verification failed' 
      };
    }
  }

  /**
   * Store selected staff ID
   */
  async storeSelectedStaff(staffId: string, remember: boolean = false): Promise<void> {
    try {
      await Storage.setItem(SELECTED_STAFF_KEY, staffId);
      
      if (remember) {
        await Storage.setItem(REMEMBER_STAFF_KEY, staffId);
        console.log('💾 SharedAuthService: Staff selection remembered');
      } else {
        await Storage.remove(REMEMBER_STAFF_KEY);
      }
      
      console.log('💾 SharedAuthService: Selected staff stored:', staffId);
    } catch (error) {
      console.error('❌ SharedAuthService: Failed to store selected staff:', error);
    }
  }

  /**
   * Get stored selected staff ID
   */
  async getSelectedStaff(): Promise<string | null> {
    try {
      return await Storage.getItem(SELECTED_STAFF_KEY);
    } catch (error) {
      console.error('❌ SharedAuthService: Failed to get selected staff:', error);
      return null;
    }
  }

  /**
   * Get remembered staff ID
   */
  async getRememberedStaff(): Promise<string | null> {
    try {
      return await Storage.getItem(REMEMBER_STAFF_KEY);
    } catch (error) {
      console.error('❌ SharedAuthService: Failed to get remembered staff:', error);
      return null;
    }
  }

  /**
   * Clear selected staff data
   */
  async clearSelectedStaff(): Promise<void> {
    try {
      await Storage.remove(SELECTED_STAFF_KEY);
      await Storage.remove(REMEMBER_STAFF_KEY);
      console.log('🗑️ SharedAuthService: Selected staff data cleared');
    } catch (error) {
      console.error('❌ SharedAuthService: Failed to clear selected staff:', error);
    }
  }

  /**
   * Sign out from shared Firebase Auth
   * This performs a complete Firebase Auth signOut and clears all staff selection data
   */
  async signOutShared(): Promise<void> {
    try {
      console.log('🚪 SharedAuthService: Starting Firebase signOut process...');

      // First clear selected staff data
      await this.clearSelectedStaff();
      console.log('✅ SharedAuthService: Selected staff data cleared');

      // Then sign out from Firebase Auth
      if (auth && typeof auth.signOut === 'function') {
        await signOut(auth);
        console.log('✅ SharedAuthService: Firebase Auth signOut successful');
      } else {
        console.warn('⚠️ SharedAuthService: Firebase Auth not available, skipping signOut');
      }

      console.log('🚪 SharedAuthService: Complete signOut process finished successfully');
    } catch (error) {
      console.error('❌ SharedAuthService: Sign out failed:', error);

      // Re-throw the error so it can be handled by the caller
      throw new Error('Firebase signOut failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export const sharedAuthService = new SharedAuthService();
export default sharedAuthService;
