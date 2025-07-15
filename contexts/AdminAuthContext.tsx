import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/lib/firebase';
import { AdminUser, COLLECTIONS } from '@/types/admin';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_USERS, firebaseUser.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as Omit<AdminUser, 'id'>;
            const admin: AdminUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              ...adminData,
            };
            
            // Update last login
            await setDoc(doc(db, COLLECTIONS.ADMIN_USERS, firebaseUser.uid), {
              ...adminData,
              lastLogin: new Date(),
            }, { merge: true });
            
            setAdminUser(admin);
          } else {
            // User exists in Firebase Auth but not in admin collection
            console.log('User is not an admin');
            setAdminUser(null);
            await firebaseSignOut(auth);
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is admin - this will be handled by the auth state change listener
      const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMIN_USERS, userCredential.user.uid));
      
      if (!adminDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear Firebase auth session
      await firebaseSignOut(auth);

      // Clear local state
      setAdminUser(null);

      // Clear any cached admin data from AsyncStorage
      await AsyncStorage.multiRemove([
        'admin_user',
        'admin_session',
        'admin_preferences',
        'admin_cache'
      ]);

      console.log('Admin signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear local state to ensure user is logged out
      setAdminUser(null);
      throw error;
    }
  };

  const value: AdminAuthContextType = {
    adminUser,
    loading,
    signIn,
    signOut,
    isAdmin: !!adminUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
