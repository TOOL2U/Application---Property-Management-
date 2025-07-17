/**
 * Add PIN Fields to Staff Accounts
 * 
 * This script adds PIN fields to existing staff accounts in Firestore
 * Run this after creating the shared Firebase Auth account manually
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample PIN codes for testing (in production, these should be set by users)
const SAMPLE_PINS = {
  'admin@siamoon.com': '1234',
  'test@example.com': '5678', 
  'alan@example.com': '9999',
  'staff@example.com': '1111'
};

async function addPinFields() {
  console.log('🔢 ADDING PIN FIELDS TO STAFF ACCOUNTS');
  console.log('=' .repeat(50));

  try {
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

    // Display summary
    console.log('\n🔐 Current PIN Codes:');
    const finalStaffSnapshot = await getDocs(staffCollection);
    finalStaffSnapshot.forEach((staffDoc) => {
      const staffData = staffDoc.data();
      if (staffData.pin) {
        console.log(`   ${staffData.name} (${staffData.email}): ${staffData.pin}`);
      }
    });

    console.log('\n✅ PIN fields added successfully!');

  } catch (error) {
    console.error('❌ Failed to add PIN fields:', error);
    process.exit(1);
  }
}

// Run the script
addPinFields()
  .then(() => {
    console.log('\n🎉 PIN fields setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
