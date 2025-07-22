/**
 * Firebase UID Mapping Service
 * Maps staff profiles to Firebase UIDs for web app integration
 * Updated to reduce authentication timeout warnings
 */

import { auth, getFirebaseFirestore } from '@/lib/firebase';
import { signInAnonymously, User } from 'firebase/auth';
import { enhancedAuthService } from './enhancedAuthService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StaffFirebaseMapping {
  staffId: string;
  firebaseUid: string;
  email?: string;
  lastMapped: string;
}

const FIREBASE_MAPPING_KEY = 'staff_firebase_mapping';

class FirebaseUidService {
  private currentUser: User | null = null;
  private mappings: Map<string, StaffFirebaseMapping> = new Map();

  constructor() {
    this.initializeAuth();
    this.loadMappings();
  }

  /**
   * Initialize Firebase authentication with enhanced service
   */
  private async initializeAuth(): Promise<void> {
    try {
      console.log('🔐 FirebaseUid: Initializing authentication...');

      // Use enhanced auth service to reduce timeout warnings
      enhancedAuthService.onAuthStateChanged((user: User | null) => {
        this.currentUser = user;
        if (user) {
          console.log('✅ FirebaseUid: User authenticated:', user.uid);
        } else {
          console.log('❌ FirebaseUid: User not authenticated');
        }
      });

      // Ensure we have an authenticated user
      const user = await enhancedAuthService.getCurrentUser();
      if (!user) {
        console.log('🔄 FirebaseUid: Ensuring authentication...');
        // The enhanced service will handle anonymous sign-in automatically
      }

    } catch (error) {
      console.error('❌ FirebaseUid: Authentication initialization failed:', error);
    }
  }

  /**
   * Load stored mappings from AsyncStorage
   */
  private async loadMappings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(FIREBASE_MAPPING_KEY);
      if (stored) {
        const mappingsArray: StaffFirebaseMapping[] = JSON.parse(stored);
        mappingsArray.forEach(mapping => {
          this.mappings.set(mapping.staffId, mapping);
        });
        console.log('📱 FirebaseUid: Loaded', mappingsArray.length, 'staff mappings');
      }
    } catch (error) {
      console.error('❌ FirebaseUid: Failed to load mappings:', error);
    }
  }

  /**
   * Save mappings to AsyncStorage
   */
  private async saveMappings(): Promise<void> {
    try {
      const mappingsArray = Array.from(this.mappings.values());
      await AsyncStorage.setItem(FIREBASE_MAPPING_KEY, JSON.stringify(mappingsArray));
      console.log('💾 FirebaseUid: Saved', mappingsArray.length, 'staff mappings');
    } catch (error) {
      console.error('❌ FirebaseUid: Failed to save mappings:', error);
    }
  }

  /**
   * Get Firebase UID for a staff member
   */
  async getFirebaseUid(staffId: string): Promise<string | null> {
    console.log('🔍 FirebaseUid: Getting Firebase UID for staff:', staffId);
    console.log('🔍 FirebaseUid: StaffId type:', typeof staffId, 'length:', staffId?.length);
    
    // Direct mapping for known test staff account (by ID)
    if (staffId === 'IDJrsXWiL2dCHVpveH97') {
      console.log('🎯 FirebaseUid: Direct mapping for test staff account (by ID)');
      const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      await this.addMapping(staffId, testUid, 'staff@siamoon.com');
      return testUid;
    }
    
    // Direct mapping for known test staff account (by email)
    if (staffId === 'staff@siamoon.com') {
      console.log('🎯 MOBILE DEBUG: Direct mapping for test staff account (by email)');
      const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      console.log('🎯 MOBILE DEBUG: Returning Firebase UID:', testUid);
      await this.addMapping(staffId, testUid, 'staff@siamoon.com');
      return testUid;
    }
    
    // If the input is already a Firebase UID format (long string), return as-is
    if (staffId && staffId.length > 20 && !staffId.includes('@')) {
      console.log('🔄 FirebaseUid: Input appears to be a Firebase UID already:', staffId);
      return staffId;
    }
    
    // Check if we have a stored mapping
    const mapping = this.mappings.get(staffId);
    if (mapping) {
      console.log('📍 FirebaseUid: Found cached mapping for staff:', staffId, '→', mapping.firebaseUid);
      return mapping.firebaseUid;
    }

    // Try to get Firebase UID from staff_accounts collection
    try {
      const firebaseUid = await this.getFirebaseUidFromDatabase(staffId);
      if (firebaseUid) {
        console.log('✅ FirebaseUid: Found Firebase UID in database:', staffId, '→', firebaseUid);
        // Cache the mapping for future use
        await this.addMapping(staffId, firebaseUid);
        return firebaseUid;
      }
    } catch (error) {
      console.error('❌ FirebaseUid: Error querying database for staff:', staffId, error);
    }

    // For the test staff account from the webapp team
    if (staffId === 'staff@siamoon.com' || staffId.includes('staff@siamoon.com')) {
      const testUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      await this.addMapping(staffId, testUid, 'staff@siamoon.com');
      console.log('🧪 FirebaseUid: Using test staff UID for:', staffId);
      return testUid;
    }

    // Use current user's UID as fallback for development
    if (this.currentUser) {
      console.log('🔄 FirebaseUid: Using current user UID as fallback for:', staffId);
      await this.addMapping(staffId, this.currentUser.uid);
      return this.currentUser.uid;
    }

    console.log('❌ FirebaseUid: No Firebase UID found for staff:', staffId);
    return null;
  }

  /**
   * Get Firebase UID from staff_accounts collection in Firestore
   */
  private async getFirebaseUidFromDatabase(staffId: string): Promise<string | null> {
    try {
      const db = await getFirebaseFirestore();
      
      // First, try to get the staff account by document ID
      try {
        const staffDocRef = doc(db, 'staff_accounts', staffId);
        const staffDocSnap = await getDoc(staffDocRef);
        
        if (staffDocSnap.exists()) {
          const staffData = staffDocSnap.data();
          console.log('📋 FirebaseUid: Found staff by document ID:', staffId, {
            email: staffData.email,
            name: staffData.name,
            firebaseUid: staffData.firebaseUid,
            role: staffData.role
          });
          
          // Special handling for the test staff account
          if (staffData.email === 'staff@siamoon.com') {
            console.log('🧪 FirebaseUid: Detected test staff account, using special Firebase UID');
            return 'gTtR5gSKOtUEweLwchSnVreylMy1';
          }
          
          // Return firebaseUid field if it exists, otherwise use the document ID
          const firebaseUid = staffData.firebaseUid || staffDocSnap.id;
          return firebaseUid;
        }
      } catch (error) {
        console.log('⚠️ FirebaseUid: Staff not found by document ID, trying email query...');
      }

      // If not found by ID, try to find by email (in case staffId is an email)
      if (staffId.includes('@')) {
        const staffQuery = query(
          collection(db, 'staff_accounts'),
          where('email', '==', staffId)
        );
        
        const querySnapshot = await getDocs(staffQuery);
        
        if (!querySnapshot.empty) {
          const staffDoc = querySnapshot.docs[0];
          const staffData = staffDoc.data();
          console.log('📋 FirebaseUid: Found staff by email:', staffId, {
            id: staffDoc.id,
            email: staffData.email,
            name: staffData.name,
            firebaseUid: staffData.firebaseUid
          });
          
          // Special handling for the test staff account
          if (staffData.email === 'staff@siamoon.com') {
            console.log('🧪 FirebaseUid: Detected test staff account by email, using special Firebase UID');
            return 'gTtR5gSKOtUEweLwchSnVreylMy1';
          }
          
          // Return firebaseUid field if it exists, otherwise use the document ID
          const firebaseUid = staffData.firebaseUid || staffDoc.id;
          return firebaseUid;
        }
      }

      console.log('⚠️ FirebaseUid: Staff account not found in database:', staffId);
      return null;
      
    } catch (error) {
      console.error('❌ FirebaseUid: Database query failed:', error);
      return null;
    }
  }

  /**
   * Add a staff → Firebase UID mapping
   */
  async addMapping(
    staffId: string, 
    firebaseUid: string, 
    email?: string
  ): Promise<void> {
    const mapping: StaffFirebaseMapping = {
      staffId,
      firebaseUid,
      email,
      lastMapped: new Date().toISOString(),
    };

    this.mappings.set(staffId, mapping);
    await this.saveMappings();

    console.log('✅ FirebaseUid: Added mapping:', staffId, '→', firebaseUid);
  }

  /**
   * Get all mappings
   */
  getAllMappings(): StaffFirebaseMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user's UID
   */
  getCurrentUid(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Remove a mapping
   */
  async removeMapping(staffId: string): Promise<void> {
    this.mappings.delete(staffId);
    await this.saveMappings();
    console.log('🗑️ FirebaseUid: Removed mapping for:', staffId);
  }

  /**
   * Clear all mappings (for testing/reset)
   */
  async clearAllMappings(): Promise<void> {
    this.mappings.clear();
    await AsyncStorage.removeItem(FIREBASE_MAPPING_KEY);
    console.log('🧹 FirebaseUid: Cleared all mappings');
  }

  /**
   * Test the mapping for a staff member
   */
  async testMapping(staffId: string): Promise<{
    success: boolean;
    firebaseUid: string | null;
    mapping?: StaffFirebaseMapping;
  }> {
    try {
      const firebaseUid = await this.getFirebaseUid(staffId);
      const mapping = this.mappings.get(staffId);
      
      return {
        success: firebaseUid !== null,
        firebaseUid,
        mapping,
      };
    } catch (error) {
      console.error('❌ FirebaseUid: Test mapping failed:', error);
      return {
        success: false,
        firebaseUid: null,
      };
    }
  }

  /**
   * Initialize test mappings for development
   */
  async initializeTestMappings(): Promise<void> {
    console.log('🧪 FirebaseUid: Initializing test mappings...');

    // Test staff account from webapp team (by email)
    await this.addMapping(
      'staff@siamoon.com',
      'gTtR5gSKOtUEweLwchSnVreylMy1',
      'staff@siamoon.com'
    );

    // Test staff account from webapp team (by document ID)
    await this.addMapping(
      'IDJrsXWiL2dCHVpveH97',
      'gTtR5gSKOtUEweLwchSnVreylMy1',
      'staff@siamoon.com'
    );

    // Add current user as a fallback test mapping
    if (this.currentUser) {
      await this.addMapping(
        'test_staff_' + this.currentUser.uid,
        this.currentUser.uid,
        'test@example.com'
      );
    }

    console.log('✅ FirebaseUid: Test mappings initialized');
  }

  /**
   * Get staff email by staff ID from Firebase database
   */
  async getStaffEmailById(staffId: string): Promise<string | null> {
    try {
      const db = await getFirebaseFirestore();
      const staffDocRef = doc(db, 'staff_accounts', staffId);
      const staffDocSnap = await getDoc(staffDocRef);
      
      if (staffDocSnap.exists()) {
        const staffData = staffDocSnap.data();
        return staffData.email || null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ FirebaseUid: Error getting staff email:', error);
      return null;
    }
  }
}

// Export singleton instance
export const firebaseUidService = new FirebaseUidService();
export type { StaffFirebaseMapping };
