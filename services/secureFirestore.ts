/**
 * Secure Firestore Service
 * Implements security requirements from mobile app security update
 * Ensures authentication before all operations and handles permission errors
 */

import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  CollectionReference,
  Query,
  Unsubscribe
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { firebaseAuthService } from './firebaseAuthService';
import { localStaffService } from './localStaffService';
import { firebaseUidService } from './firebaseUidService';

/**
 * Secure wrapper for Firestore operations
 * Ensures user authentication before all database operations
 */
class SecureFirestoreService {
  
  /**
   * Ensure user is authenticated before any Firestore operations
   * Required by new Firebase security rules
   * 
   * Checks both Firebase authentication and PIN authentication
   * During transition period, PIN authentication is accepted as temporary fallback
   */
  private async ensureAuthenticated(): Promise<void> {
    try {
      // First check if we have an active PIN session (temporary fallback)
      const activeSession = await localStaffService.getCurrentSession();
      
      if (activeSession && activeSession.profileId) {
        console.log('🔐 SecureFirestore: PIN authentication verified for:', activeSession.profileId);
        return; // PIN authentication is sufficient during transition
      }

      // If no PIN session, try Firebase authentication
      await firebaseAuthService.ensureAuthenticated();
      console.log('🔥 SecureFirestore: Firebase authentication verified');
    } catch (error) {
      console.error('🚫 SecureFirestore: Authentication required for database access');
      throw new Error('Authentication required. Please sign in to access database.');
    }
  }

  /**
   * Handle Firestore permission errors with helpful messages
   */
  private handleFirestoreError(error: any, operation: string): Error {
    console.error(`❌ SecureFirestore: ${operation} failed:`, error);

    if (error.code === 'permission-denied') {
      const user = firebaseAuthService.getCurrentUser();
      
      if (!user) {
        return new Error('Permission denied: You must be signed in to access this data.');
      }
      
      if (!user.role) {
        return new Error('Permission denied: Your user role is not set. Please contact your administrator.');
      }
      
      return new Error(`Permission denied: Your role (${user.role}) does not have access to this data.`);
    }
    
    if (error.code === 'unauthenticated') {
      return new Error('Authentication expired. Please sign in again.');
    }
    
    if (error.code === 'unavailable') {
      return new Error('Database temporarily unavailable. Please try again later.');
    }
    
    return new Error(error.message || `Database operation failed: ${operation}`);
  }

  /**
   * Secure document read operation
   */
  async getDocument(path: string): Promise<DocumentSnapshot> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`📖 SecureFirestore: Reading document: ${path}`);
      const db = await getDb();
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      
      console.log(`✅ SecureFirestore: Document read successful: ${path}`);
      return docSnap;
    } catch (error) {
      throw this.handleFirestoreError(error, `reading document ${path}`);
    }
  }

  /**
   * Secure collection query operation
   */
  async queryCollection(
    collectionPath: string, 
    constraints: any[] = []
  ): Promise<QuerySnapshot> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`📋 SecureFirestore: Querying collection: ${collectionPath}`);
      const db = await getDb();
      const collectionRef = collection(db, collectionPath);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      const querySnap = await getDocs(q);
      
      console.log(`✅ SecureFirestore: Collection query successful: ${collectionPath} (${querySnap.size} documents)`);
      return querySnap;
    } catch (error) {
      throw this.handleFirestoreError(error, `querying collection ${collectionPath}`);
    }
  }

  /**
   * Secure document write operation
   */
  async setDocument(path: string, data: any): Promise<void> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`✏️ SecureFirestore: Writing document: ${path}`);
      const db = await getDb();
      const docRef = doc(db, path);
      await setDoc(docRef, data);
      
      console.log(`✅ SecureFirestore: Document write successful: ${path}`);
    } catch (error) {
      throw this.handleFirestoreError(error, `writing document ${path}`);
    }
  }

  /**
   * Secure document update operation
   */
  async updateDocument(path: string, data: any): Promise<void> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`🔄 SecureFirestore: Updating document: ${path}`);
      const db = await getDb();
      const docRef = doc(db, path);
      await updateDoc(docRef, data);
      
      console.log(`✅ SecureFirestore: Document update successful: ${path}`);
    } catch (error) {
      throw this.handleFirestoreError(error, `updating document ${path}`);
    }
  }

  /**
   * Secure document delete operation
   */
  async deleteDocument(path: string): Promise<void> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`🗑️ SecureFirestore: Deleting document: ${path}`);
      const db = await getDb();
      const docRef = doc(db, path);
      await deleteDoc(docRef);
      
      console.log(`✅ SecureFirestore: Document delete successful: ${path}`);
    } catch (error) {
      throw this.handleFirestoreError(error, `deleting document ${path}`);
    }
  }

  /**
   * Secure real-time listener
   * Ensures authentication and handles permission errors
   */
  async subscribeToDocument(
    path: string, 
    callback: (snapshot: DocumentSnapshot) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Unsubscribe> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`👂 SecureFirestore: Setting up document listener: ${path}`);
      const db = await getDb();
      const docRef = doc(db, path);
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          console.log(`📡 SecureFirestore: Document update received: ${path}`);
          callback(snapshot);
        },
        (error) => {
          const handledError = this.handleFirestoreError(error, `listening to document ${path}`);
          console.error('❌ SecureFirestore: Document listener error:', handledError.message);
          
          if (errorCallback) {
            errorCallback(handledError);
          }
        }
      );
      
      console.log(`✅ SecureFirestore: Document listener set up successfully: ${path}`);
      return unsubscribe;
    } catch (error) {
      throw this.handleFirestoreError(error, `setting up listener for document ${path}`);
    }
  }

  /**
   * Secure collection listener
   */
  async subscribeToCollection(
    collectionPath: string,
    constraints: any[] = [],
    callback: (snapshot: QuerySnapshot) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Unsubscribe> {
    await this.ensureAuthenticated();
    
    try {
      console.log(`👂 SecureFirestore: Setting up collection listener: ${collectionPath}`);
      const db = await getDb();
      const collectionRef = collection(db, collectionPath);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`📡 SecureFirestore: Collection update received: ${collectionPath} (${snapshot.size} documents)`);
          callback(snapshot);
        },
        (error) => {
          const handledError = this.handleFirestoreError(error, `listening to collection ${collectionPath}`);
          console.error('❌ SecureFirestore: Collection listener error:', handledError.message);
          
          if (errorCallback) {
            errorCallback(handledError);
          }
        }
      );
      
      console.log(`✅ SecureFirestore: Collection listener set up successfully: ${collectionPath}`);
      return unsubscribe;
    } catch (error) {
      throw this.handleFirestoreError(error, `setting up listener for collection ${collectionPath}`);
    }
  }

  /**
   * Staff-specific operations (follow role-based access patterns)
   */

  /**
   * Get jobs for authenticated staff member
   * Security rules automatically filter to user's assigned jobs
   */
  async getStaffJobs(staffId?: string): Promise<any[]> {
    await this.ensureAuthenticated();
    
    // During transition period, check both Firebase and PIN authentication
    let targetStaffId = staffId;
    
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      // Firebase authentication available - use Firebase UID
      targetStaffId = staffId || user.uid;
    } else {
      // No Firebase user - check PIN authentication (transition period)
      const activeSession = await localStaffService.getCurrentSession();
      if (!activeSession || !activeSession.profileId) {
        throw new Error('User not authenticated');
      }
      
      if (!staffId) {
        // For PIN authentication, we need to get the Firebase UID from the staff profile
        const firebaseUid = await firebaseUidService.getFirebaseUid(activeSession.profileId);
        if (!firebaseUid) {
          throw new Error('Firebase UID not found for staff profile');
        }
        targetStaffId = firebaseUid;
      }
    }
    
    try {
      console.log(`📋 SecureFirestore: Getting jobs for staff: ${targetStaffId}`);
      
      // TRY BOTH FIELD NAMES - Webapp may use 'assignedTo' or 'assignedStaffId'
      let jobs: any[] = [];
      
      try {
        // Try 'assignedStaffId' first (current mobile app standard)
        console.log('🔍 Trying query with assignedStaffId...');
        const querySnap1 = await this.queryCollection('jobs', [
          where('assignedStaffId', '==', targetStaffId),
          orderBy('scheduledDate', 'asc')
        ]);
        jobs = querySnap1.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Found ${jobs.length} jobs using 'assignedStaffId'`);
        
        // If no jobs found with assignedStaffId, ALSO try assignedTo
        if (jobs.length === 0) {
          console.log('⚠️ No jobs found with assignedStaffId, trying assignedTo...');
          try {
            const querySnap2 = await this.queryCollection('jobs', [
              where('assignedTo', '==', targetStaffId),
              orderBy('scheduledDate', 'asc')
            ]);
            jobs = querySnap2.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`✅ Found ${jobs.length} jobs using 'assignedTo'`);
          } catch (error2: any) {
            console.warn(`⚠️ Query with 'assignedTo' also failed:`, error2.message);
            // Continue with empty jobs array
          }
        }
      } catch (error1: any) {
        console.warn(`⚠️ Query with 'assignedStaffId' failed:`, error1.message);
        
        // Fallback: Try 'assignedTo' (webapp standard from documentation)
        try {
          console.log('🔍 Trying query with assignedTo (after error)...');
          const querySnap2 = await this.queryCollection('jobs', [
            where('assignedTo', '==', targetStaffId),
            orderBy('scheduledDate', 'asc')
          ]);
          jobs = querySnap2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`✅ Found ${jobs.length} jobs using 'assignedTo'`);
        } catch (error2: any) {
          console.error(`❌ Both queries failed. assignedStaffId: ${error1.message}, assignedTo: ${error2.message}`);
          throw error1; // Throw the first error
        }
      }
      
      // Populate property/location data for each job
      console.log(`🏠 SecureFirestore: Populating property data for ${jobs.length} jobs...`);
      const jobsWithPropertyData = await Promise.all(
        jobs.map(async (job) => {
          try {
            // If job already has location data, skip
            if (job.location && job.location.address) {
              return job;
            }

            // Try to get property data using propertyId or propertyRef
            const propertyId = job.propertyId || job.propertyRef;
            if (!propertyId) {
              console.warn(`⚠️ Job ${job.id} has no propertyId or propertyRef`);
              return job;
            }

            // Fetch property document
            const propertyDoc = await this.getDocument(`properties/${propertyId}`);
            if (!propertyDoc.exists()) {
              console.warn(`⚠️ Property ${propertyId} not found for job ${job.id}`);
              return job;
            }

            const propertyData = propertyDoc.data();
            
            // Debug: Log property data structure
            console.log(`🔍 Property data structure for ${propertyId}:`, {
              hasAddress: !!propertyData.address,
              addressType: typeof propertyData.address,
              hasFullAddress: !!propertyData.fullAddress,
              hasCity: !!propertyData.city,
              hasProvince: !!propertyData.province,
              hasState: !!propertyData.state,
              keys: Object.keys(propertyData).join(', ')
            });
            
            // Handle different property data structures
            // Some properties have 'address' as string, others have 'fullAddress'
            // Some use 'state', others use 'province'
            const addressString = typeof propertyData.address === 'string' 
              ? propertyData.address 
              : propertyData.fullAddress || propertyData.streetAddress || '';
            
            const cityString = propertyData.city || '';
            const stateString = propertyData.state || propertyData.province || '';
            const zipCodeString = propertyData.zipCode || propertyData.postalCode || '';
            
            console.log(`📍 Mapped location data:`, { addressString, cityString, stateString, zipCodeString });
            
            // Populate location from property data
            const location = {
              address: addressString,
              city: cityString,
              state: stateString,
              zipCode: zipCodeString,
              googleMapsLink: propertyData.googleMapsLink || undefined,
              coordinates: propertyData.coordinates || undefined,
              accessCodes: propertyData.accessCodes || undefined,
              specialInstructions: propertyData.specialInstructions || undefined,
            };

            // Also populate property name if available
            const propertyName = propertyData.name || propertyData.title || propertyData.displayName || propertyData.propertyName || '';

            return {
              ...job,
              location,
              propertyName,
            };
          } catch (error) {
            console.warn(`⚠️ Failed to fetch property data for job ${job.id}:`, error);
            // Return job without property data rather than failing completely
            return job;
          }
        })
      );

      console.log(`✅ SecureFirestore: Retrieved ${jobsWithPropertyData.length} jobs for staff ${targetStaffId}`);
      return jobsWithPropertyData;
    } catch (error) {
      throw this.handleFirestoreError(error, `getting jobs for staff ${targetStaffId}`);
    }
  }

  /**
   * Get staff profile (only accessible by the staff member themselves or admins)
   */
  async getStaffProfile(staffId?: string): Promise<any | null> {
    await this.ensureAuthenticated();
    
    // During transition period, check both Firebase and PIN authentication
    let targetStaffId = staffId;
    
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      // Firebase authentication available - use Firebase UID
      targetStaffId = staffId || user.uid;
    } else {
      // No Firebase user - check PIN authentication (transition period)
      const activeSession = await localStaffService.getCurrentSession();
      if (!activeSession || !activeSession.profileId) {
        throw new Error('User not authenticated');
      }
      
      if (!staffId) {
        // For PIN authentication, we need to get the Firebase UID from the staff profile
        const firebaseUid = await firebaseUidService.getFirebaseUid(activeSession.profileId);
        if (!firebaseUid) {
          throw new Error('Firebase UID not found for staff profile');
        }
        targetStaffId = firebaseUid;
      }
    }
    
    try {
      console.log(`👤 SecureFirestore: Getting staff profile: ${targetStaffId}`);
      
      const docSnap = await this.getDocument(`staff/${targetStaffId}`);
      
      if (!docSnap.exists()) {
        console.log(`⚠️ SecureFirestore: Staff profile not found: ${targetStaffId}`);
        return null;
      }
      
      const profile = { id: docSnap.id, ...docSnap.data() };
      console.log(`✅ SecureFirestore: Retrieved staff profile: ${targetStaffId}`);
      return profile;
    } catch (error) {
      throw this.handleFirestoreError(error, `getting staff profile ${targetStaffId}`);
    }
  }

  /**
   * Update staff location (staff can only update their own location)
   */
  async updateStaffLocation(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: Date;
  }): Promise<void> {
    await this.ensureAuthenticated();
    
    // During transition period, check both Firebase and PIN authentication
    let staffUid: string;
    
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      // Firebase authentication available - use Firebase UID
      staffUid = user.uid;
    } else {
      // No Firebase user - check PIN authentication (transition period)
      const activeSession = await localStaffService.getCurrentSession();
      if (!activeSession || !activeSession.profileId) {
        throw new Error('User not authenticated');
      }
      
      // For PIN authentication, we need to get the Firebase UID from the staff profile
      const firebaseUid = await firebaseUidService.getFirebaseUid(activeSession.profileId);
      if (!firebaseUid) {
        throw new Error('Firebase UID not found for staff profile');
      }
      staffUid = firebaseUid;
    }

    try {
      console.log(`📍 SecureFirestore: Updating location for staff: ${staffUid}`);
      
      const locationData = {
        ...location,
        staffId: staffUid,
        timestamp: location.timestamp || new Date(),
        updatedAt: new Date()
      };
      
      // Create a new location document with auto-generated ID
      const db = await getDb();
      const locationRef = doc(collection(db, 'staff_locations'));
      await setDoc(locationRef, locationData);
      
      console.log(`✅ SecureFirestore: Location updated for staff: ${staffUid}`);
    } catch (error) {
      throw this.handleFirestoreError(error, `updating location for staff ${staffUid}`);
    }
  }

  /**
   * Get staff notifications (staff can only see their own notifications)
   */
  async getStaffNotifications(limitCount?: number): Promise<any[]> {
    await this.ensureAuthenticated();
    
    // During transition period, check both Firebase and PIN authentication
    let staffUid: string;
    
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      // Firebase authentication available - use Firebase UID
      staffUid = user.uid;
    } else {
      // No Firebase user - check PIN authentication (transition period)
      const activeSession = await localStaffService.getCurrentSession();
      if (!activeSession || !activeSession.profileId) {
        throw new Error('User not authenticated');
      }
      
      // For PIN authentication, we need to get the Firebase UID from the staff profile
      const firebaseUid = await firebaseUidService.getFirebaseUid(activeSession.profileId);
      if (!firebaseUid) {
        throw new Error('Firebase UID not found for staff profile');
      }
      staffUid = firebaseUid;
    }

    try {
      console.log(`🔔 SecureFirestore: Getting notifications for staff: ${staffUid}`);
      
      const db = await getDb();
      const collectionRef = collection(db, 'staff_notifications');
      let q = query(
        collectionRef,
        where('staffId', '==', staffUid),
        orderBy('createdAt', 'desc')
      );
      
      if (limitCount) {
        q = query(q, firestoreLimit(limitCount));
      }
      
      const querySnap = await getDocs(q);
      
      const notifications = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ SecureFirestore: Retrieved ${notifications.length} notifications for staff ${staffUid}`);
      return notifications;
    } catch (error) {
      throw this.handleFirestoreError(error, `getting notifications for staff ${staffUid}`);
    }
  }

  /**
   * Test database connectivity and permissions
   */
  async testDatabaseAccess(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      
      // During transition period, check both Firebase and PIN authentication
      let staffUid: string;
      
      const user = firebaseAuthService.getCurrentUser();
      if (user) {
        // Firebase authentication available - use Firebase UID
        staffUid = user.uid;
      } else {
        // No Firebase user - check PIN authentication (transition period)
        const activeSession = await localStaffService.getCurrentSession();
        if (!activeSession || !activeSession.profileId) {
          console.log('🚫 SecureFirestore: No authenticated user for test');
          return false;
        }
        
        // For PIN authentication, we need to get the Firebase UID from the staff profile
        const firebaseUid = await firebaseUidService.getFirebaseUid(activeSession.profileId);
        if (!firebaseUid) {
          console.log('🚫 SecureFirestore: Firebase UID not found for staff profile');
          return false;
        }
        staffUid = firebaseUid;
      }

      // Try to read user's own staff profile
      console.log('🧪 SecureFirestore: Testing database access...');
      await this.getDocument(`staff/${staffUid}`);
      
      console.log('✅ SecureFirestore: Database access test successful');
      return true;
    } catch (error) {
      console.error('❌ SecureFirestore: Database access test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureFirestore = new SecureFirestoreService();
export default secureFirestore;
