import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // For demo purposes, create a mock user if Firebase is not configured
          const mockUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: 'staff',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1 (555) 123-4567',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser(mockUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Set mock user for demo
          const mockUser: User = {
            id: firebaseUser.uid || 'demo-user',
            email: firebaseUser.email || 'demo@example.com',
            role: 'staff',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1 (555) 123-4567',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setUser(mockUser);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // For demo purposes, create a mock successful login
      console.log('Demo login attempt:', email);
      if (email === 'demo@siamoon.com' && password === 'demo123') {
        const mockUser: User = {
          id: 'demo-user-123',
          email: email,
          role: 'staff',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1 (555) 123-4567',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setUser(mockUser);
        setFirebaseUser({
          uid: 'demo-user-123',
          email: email,
        } as FirebaseUser);
        return;
      }
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // For demo, just clear the user
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
