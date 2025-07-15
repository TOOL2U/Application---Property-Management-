#!/usr/bin/env node

// Test Firebase Auth configuration
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe",
  measurementId: "G-R1PELW8B8Q",
};

async function testAuth() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized successfully');
    console.log('📧 Testing user authentication...');

    const userCredential = await signInWithEmailAndPassword(auth, 'test@exam.com', 'password123');
    const user = userCredential.user;

    console.log('✅ Authentication successful!');
    console.log('👤 User:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    });

    console.log('🎉 Firebase Auth is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase Auth test failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testAuth();
