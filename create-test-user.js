#!/usr/bin/env node

// Create a test user in production Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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

async function createTestUser() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('✅ Firebase initialized successfully');
    console.log('👤 Creating test user...');

    const userCredential = await createUserWithEmailAndPassword(auth, 'test@exam.com', 'password123');
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: 'Shaun Ducker'
    });

    console.log('✅ Test user created successfully!');
    console.log('👤 User details:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    });

    console.log('🎉 You can now use these credentials to test the app:');
    console.log('📧 Email: test@exam.com');
    console.log('🔐 Password: password123');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ User already exists! You can use these credentials:');
      console.log('📧 Email: test@exam.com');
      console.log('🔐 Password: password123');
      process.exit(0);
    } else {
      console.error('❌ Failed to create test user:', error.message);
      console.error('Error code:', error.code);
      process.exit(1);
    }
  }
}

createTestUser();
