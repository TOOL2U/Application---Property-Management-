/**
 * Check Available Staff Accounts
 * List all staff accounts in the Firebase Firestore database
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs
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

async function checkStaffAccounts() {
  console.log('👥 CHECKING AVAILABLE STAFF ACCOUNTS');
  console.log('=' .repeat(50));
  
  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const querySnapshot = await getDocs(staffAccountsRef);
    
    if (querySnapshot.empty) {
      console.log('❌ No staff accounts found in the database');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} staff account(s):\n`);
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      
      console.log(`${index + 1}. 👤 Staff Account:`);
      console.log(`   📧 Email: ${data.email}`);
      console.log(`   👤 Name: ${data.name || 'Not specified'}`);
      console.log(`   🎭 Role: ${data.role}`);
      console.log(`   📱 Phone: ${data.phone || 'Not specified'}`);
      console.log(`   🏢 Department: ${data.department || 'Not specified'}`);
      console.log(`   ✅ Active: ${data.isActive ? 'Yes' : 'No'}`);
      console.log(`   🔐 Has Password: ${data.passwordHash ? 'Yes' : 'No'}`);
      console.log(`   🆔 Document ID: ${doc.id}`);
      
      if (data.lastLogin) {
        const lastLogin = data.lastLogin.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin);
        console.log(`   🕐 Last Login: ${lastLogin.toLocaleString()}`);
      } else {
        console.log(`   🕐 Last Login: Never`);
      }
      
      if (data.createdAt) {
        const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        console.log(`   📅 Created: ${createdAt.toLocaleString()}`);
      }
      
      console.log(''); // Empty line for separation
    });
    
    // Provide testing guidance
    console.log('🧪 TESTING GUIDANCE:');
    console.log('=' .repeat(50));
    
    const activeAccounts = [];
    const accountsWithPasswords = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isActive) {
        activeAccounts.push(data);
      }
      if (data.passwordHash) {
        accountsWithPasswords.push(data);
      }
    });
    
    console.log(`✅ Active accounts: ${activeAccounts.length}`);
    console.log(`🔐 Accounts with passwords: ${accountsWithPasswords.length}`);
    
    if (activeAccounts.length > 0 && accountsWithPasswords.length > 0) {
      console.log('\n💡 READY FOR TESTING:');
      
      activeAccounts.forEach((account, index) => {
        if (account.passwordHash) {
          console.log(`\n${index + 1}. Test Account: ${account.email}`);
          console.log(`   Role: ${account.role}`);
          console.log(`   Status: Ready for testing`);
          console.log(`   Note: Use the password you set when creating this account in your webapp`);
        }
      });
      
      console.log('\n🔍 TO TEST:');
      console.log('1. Go to: http://localhost:8082');
      console.log('2. Use one of the email addresses above');
      console.log('3. Enter the password you created in your webapp');
      console.log('4. Verify role-based features work correctly');
      
    } else {
      console.log('\n⚠️ SETUP NEEDED:');
      if (activeAccounts.length === 0) {
        console.log('❌ No active staff accounts found');
        console.log('💡 Create staff accounts in your webapp first');
      }
      if (accountsWithPasswords.length === 0) {
        console.log('❌ No accounts have password hashes');
        console.log('💡 Set passwords for staff accounts in your webapp');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking staff accounts:', error.message);
    console.error('🔍 Make sure Firebase is properly configured');
  }
}

// Run the check
checkStaffAccounts().catch(console.error);
