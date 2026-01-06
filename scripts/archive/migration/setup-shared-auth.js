/**
 * Setup Shared Authentication System
 *
 * This script:
 * 1. Creates the shared Firebase Auth account (staff@siamoon.com)
 * 2. Adds PIN fields to existing staff accounts
 * 3. Sets up sample PIN codes for testing
 */

// Use dynamic imports for Firebase v10+
async function loadFirebase() {
  const { initializeApp } = await import('firebase/app');
  const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
  } = await import('firebase/auth');
  const {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
  } = await import('firebase/firestore');

  return {
    initializeApp,
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
  };
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Firebase will be initialized in the main function

// Shared credentials
const SHARED_CREDENTIALS = {
  email: 'staff@siamoon.com',
  password: 'staff123'
};

// Sample PIN codes for testing (in production, these should be set by users)
const SAMPLE_PINS = {
  'admin@siamoon.com': '1234',
  'test@example.com': '5678',
  'alan@example.com': '9999',
  'staff@example.com': '1111'
};

async function setupSharedAuth() {
  console.log('🚀 SETTING UP SHARED AUTHENTICATION SYSTEM');
  console.log('=' .repeat(60));

  try {
    // Load Firebase modules
    const {
      initializeApp,
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      getFirestore,
      collection,
      getDocs,
      doc,
      updateDoc,
      serverTimestamp
    } = await loadFirebase();

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    // Step 1: Create or verify shared Firebase Auth account
    console.log('\n📋 Step 1: Setting up shared Firebase Auth account...');
    
    try {
      // Try to sign in first to check if account exists
      await signInWithEmailAndPassword(auth, SHARED_CREDENTIALS.email, SHARED_CREDENTIALS.password);
      console.log('✅ Shared Firebase Auth account already exists');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        console.log('📝 Creating new shared Firebase Auth account...');
        
        try {
          await createUserWithEmailAndPassword(auth, SHARED_CREDENTIALS.email, SHARED_CREDENTIALS.password);
          console.log('✅ Shared Firebase Auth account created successfully');
        } catch (createError) {
          if (createError.code === 'auth/email-already-in-use') {
            console.log('⚠️ Account exists but password is different. Please update manually.');
          } else {
            throw createError;
          }
        }
      } else {
        throw error;
      }
    }

    // Step 2: Update staff accounts with PIN fields
    console.log('\n📋 Step 2: Adding PIN fields to staff accounts...');
    
    const staffCollection = collection(db, 'staff_accounts');
    const staffSnapshot = await getDocs(staffCollection);
    
    console.log(`Found ${staffSnapshot.size} staff accounts to update`);
    
    let updatedCount = 0;
    const updatePromises = [];

    staffSnapshot.forEach((staffDoc) => {
      const staffData = staffDoc.data();
      const staffEmail = staffData.email;
      
      // Determine PIN for this staff member
      let pin = SAMPLE_PINS[staffEmail];
      if (!pin) {
        // Generate a default PIN based on name
        const nameParts = staffData.name?.split(' ') || ['User'];
        pin = (nameParts[0].length * 1111).toString().slice(0, 4).padStart(4, '0');
      }
      
      // Prepare update data
      const updateData = {
        pin: pin,
        photo: null, // Will be set later when photo upload is implemented
        updatedAt: serverTimestamp()
      };
      
      // Only add PIN if it doesn't exist
      if (!staffData.pin) {
        const updatePromise = updateDoc(doc(db, 'staff_accounts', staffDoc.id), updateData)
          .then(() => {
            console.log(`✅ Updated ${staffData.name} (${staffEmail}) with PIN: ${pin}`);
            updatedCount++;
          })
          .catch((error) => {
            console.error(`❌ Failed to update ${staffEmail}:`, error);
          });
        
        updatePromises.push(updatePromise);
      } else {
        console.log(`⏭️ ${staffData.name} (${staffEmail}) already has PIN: ${staffData.pin}`);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`\n✅ Updated ${updatedCount} staff accounts with PIN fields`);

    // Step 3: Display summary
    console.log('\n📋 Step 3: Setup Summary');
    console.log('=' .repeat(40));
    console.log(`✅ Shared Firebase Auth Account: ${SHARED_CREDENTIALS.email}`);
    console.log(`✅ Password: ${SHARED_CREDENTIALS.password}`);
    console.log(`✅ Staff accounts updated: ${updatedCount}`);
    
    console.log('\n🔐 Test PIN Codes:');
    const finalStaffSnapshot = await getDocs(staffCollection);
    finalStaffSnapshot.forEach((staffDoc) => {
      const staffData = staffDoc.data();
      if (staffData.pin) {
        console.log(`   ${staffData.name} (${staffData.email}): ${staffData.pin}`);
      }
    });

    console.log('\n🎯 Next Steps:');
    console.log('1. Test login with staff@siamoon.com / staff123');
    console.log('2. Select a staff profile');
    console.log('3. Enter the PIN code for that staff member');
    console.log('4. Verify role-based navigation works correctly');
    
    console.log('\n✅ Shared authentication system setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSharedAuth()
  .then(() => {
    console.log('\n🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
