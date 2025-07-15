#!/usr/bin/env node

// Test different credentials and reset password if needed
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

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

async function testDifferentCredentials() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized successfully');
    
    const testCredentials = [
      { email: 'test@exam.com', password: 'password123' },
      { email: 'test@exam.com', password: 'Password123' },
      { email: 'test@exam.com', password: 'Password123!' },
      { email: 'test@exam.com', password: 'testpassword' },
    ];

    for (const creds of testCredentials) {
      try {
        console.log(`🔐 Testing password: ${creds.password}`);
        const userCredential = await signInWithEmailAndPassword(auth, creds.email, creds.password);
        const user = userCredential.user;

        console.log('✅ Authentication successful!');
        console.log('👤 User:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        });

        console.log('🎉 Correct credentials found!');
        console.log(`📧 Email: ${creds.email}`);
        console.log(`🔐 Password: ${creds.password}`);
        process.exit(0);
      } catch (error) {
        console.log(`❌ Password ${creds.password} failed: ${error.code}`);
      }
    }

    console.log('⚠️ None of the test passwords worked. Sending password reset email...');
    try {
      await sendPasswordResetEmail(auth, 'test@exam.com');
      console.log('✅ Password reset email sent to test@exam.com');
      console.log('📧 Check your email and reset the password, then try again');
    } catch (resetError) {
      console.error('❌ Failed to send password reset email:', resetError.message);
    }

    process.exit(1);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testDifferentCredentials();
