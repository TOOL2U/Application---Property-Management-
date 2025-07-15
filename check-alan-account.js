/**
 * Check Alan's Account Details
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where
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

async function checkAlanAccount() {
  console.log('🔍 Checking Alan\'s account details...');
  console.log('=' .repeat(50));

  try {
    const staffAccountsRef = collection(db, 'staff_accounts');
    const alanQuery = query(staffAccountsRef, where('email', '==', 'alan@example.com'));
    const alanSnapshot = await getDocs(alanQuery);
    
    if (alanSnapshot.empty) {
      console.log('❌ Alan\'s account not found');
      return;
    }

    const alanDoc = alanSnapshot.docs[0];
    const alanData = alanDoc.data();
    
    console.log('✅ Alan\'s Account Found:');
    console.log(`📋 Name: ${alanData.name}`);
    console.log(`📧 Email: ${alanData.email}`);
    console.log(`🎭 Role: ${alanData.role}`);
    console.log(`🏢 Department: ${alanData.department || 'Not set'}`);
    console.log(`🆔 Document ID: ${alanDoc.id}`);
    console.log(`✅ Active: ${alanData.isActive}`);
    
    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to the app login page');
    console.log('2. Enter email: alan@example.com');
    console.log('3. Enter password: [You need to set/reset password]');
    
    console.log('\n🎭 Expected Role-Based Navigation:');
    console.log(`Since Alan has role "${alanData.role}", he should see:`);
    
    if (['cleaner', 'maintenance', 'staff'].includes(alanData.role)) {
      console.log('✅ LIMITED NAVIGATION (Staff View):');
      console.log('   - Dashboard (simplified staff view)');
      console.log('   - Jobs (assigned jobs only)');
      console.log('   - Profile');
      console.log('');
      console.log('❌ HIDDEN TABS:');
      console.log('   - Properties, Tenants, Schedule');
      console.log('   - Maintenance, Payments, Map, History');
    } else if (['admin', 'manager'].includes(alanData.role)) {
      console.log('✅ FULL NAVIGATION (Admin/Manager View):');
      console.log('   - All tabs visible');
    }

  } catch (error) {
    console.error('❌ Error checking Alan\'s account:', error);
  }
}

checkAlanAccount().catch(console.error);
