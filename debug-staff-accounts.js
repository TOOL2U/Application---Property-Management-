/**
 * Debug Staff Accounts Collection
 * Comprehensive analysis of Firebase staff_accounts collection structure
 * and mobile app synchronization issues
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
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

/**
 * Analyze the actual structure of staff_accounts documents
 */
async function analyzeStaffAccountsStructure() {
  console.log('🔍 ANALYZING STAFF_ACCOUNTS COLLECTION STRUCTURE');
  console.log('=' .repeat(80));
  
  try {
    const staffRef = collection(db, 'staff_accounts');
    const snapshot = await getDocs(staffRef);
    
    console.log(`📊 Total documents in staff_accounts: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No documents found in staff_accounts collection');
      return;
    }
    
    const allFields = new Set();
    const statusValues = new Set();
    const roleValues = new Set();
    const documents = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({ id: doc.id, data });
      
      // Collect all field names
      Object.keys(data).forEach(field => allFields.add(field));
      
      // Collect status values
      if (data.status) statusValues.add(data.status);
      if (data.isActive !== undefined) statusValues.add(`isActive: ${data.isActive}`);
      
      // Collect role values
      if (data.role) roleValues.add(data.role);
      if (data.accountType) roleValues.add(`accountType: ${data.accountType}`);
      if (data.userRole) roleValues.add(`userRole: ${data.userRole}`);
    });
    
    console.log('\n📋 ALL FIELD NAMES FOUND:');
    console.log(Array.from(allFields).sort().join(', '));
    
    console.log('\n🔄 STATUS VALUES FOUND:');
    Array.from(statusValues).forEach(status => console.log(`   • ${status}`));
    
    console.log('\n👤 ROLE VALUES FOUND:');
    Array.from(roleValues).forEach(role => console.log(`   • ${role}`));
    
    console.log('\n📄 DETAILED DOCUMENT ANALYSIS:');
    documents.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1}: ${doc.id} ---`);
      console.log(`Raw data:`, JSON.stringify(doc.data, null, 2));
    });
    
    return documents;
  } catch (error) {
    console.error('❌ Error analyzing staff_accounts structure:', error);
    return [];
  }
}

/**
 * Test different query variations to find the right filter
 */
async function testQueryVariations(documents) {
  console.log('\n🧪 TESTING DIFFERENT QUERY VARIATIONS');
  console.log('=' .repeat(80));
  
  const queries = [
    { name: 'status == "active"', field: 'status', value: 'active' },
    { name: 'status == "Active"', field: 'status', value: 'Active' },
    { name: 'isActive == true', field: 'isActive', value: true },
    { name: 'isActive == "true"', field: 'isActive', value: 'true' },
  ];
  
  for (const queryTest of queries) {
    try {
      console.log(`\n🔍 Testing query: ${queryTest.name}`);
      
      const staffRef = collection(db, 'staff_accounts');
      const q = query(staffRef, where(queryTest.field, '==', queryTest.value));
      const querySnapshot = await getDocs(q);
      
      console.log(`   Results: ${querySnapshot.size} documents`);
      
      if (querySnapshot.size > 0) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   • ${doc.id}: ${data.name || data.displayName || 'No name'}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
  }
}

/**
 * Simulate mobile app profile mapping
 */
function simulateMobileAppMapping(documents) {
  console.log('\n📱 SIMULATING MOBILE APP PROFILE MAPPING');
  console.log('=' .repeat(80));
  
  const mobileProfiles = [];
  
  documents.forEach((doc) => {
    const data = doc.data;
    
    console.log(`\n🔄 Mapping document: ${doc.id}`);
    console.log(`   Raw data fields:`, Object.keys(data));
    
    // Simulate the mobile app mapping logic
    const profile = {
      id: doc.id,
      name: data.displayName || data.name || data.fullName || 'Unknown Staff',
      email: data.email || '',
      role: mapRole(data.role || data.accountType || data.userRole || 'staff'),
      isActive: data.status === 'active' || data.isActive === true,
      department: data.department || data.division || 'General',
      phone: data.phoneNumber || data.phone || '',
      avatar: data.photoURL || data.avatar || data.profileImage || data.photo,
      createdAt: data.createdAt?.toDate?.() || data.dateCreated?.toDate?.() || new Date(),
      lastLogin: data.lastLoginAt?.toDate?.() || data.lastLogin?.toDate?.(),
    };
    
    console.log(`   Mapped profile:`, {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      isActive: profile.isActive,
      department: profile.department
    });
    
    if (profile.isActive) {
      mobileProfiles.push(profile);
      console.log(`   ✅ Would appear in mobile app`);
    } else {
      console.log(`   ❌ Would NOT appear in mobile app (not active)`);
    }
  });
  
  console.log(`\n📱 MOBILE APP WOULD SHOW: ${mobileProfiles.length} profiles`);
  mobileProfiles.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.name} (${profile.role}) - ${profile.email}`);
  });
  
  return mobileProfiles;
}

/**
 * Helper function to map roles (same as mobile app)
 */
function mapRole(webAppRole) {
  if (!webAppRole) return 'staff';
  
  const roleMapping = {
    'administrator': 'admin',
    'admin': 'admin',
    'system_admin': 'admin',
    'manager': 'manager',
    'supervisor': 'manager',
    'team_lead': 'manager',
    'lead': 'manager',
    'cleaner': 'cleaner',
    'cleaning': 'cleaner',
    'housekeeper': 'cleaner',
    'housekeeping': 'cleaner',
    'maintenance': 'maintenance',
    'technician': 'maintenance',
    'repair': 'maintenance',
    'engineer': 'maintenance',
    'maintenance_tech': 'maintenance',
    'staff': 'staff',
    'employee': 'staff',
    'worker': 'staff',
    'user': 'staff',
    'member': 'staff',
  };

  const normalizedRole = webAppRole.toLowerCase().trim();
  return roleMapping[normalizedRole] || 'staff';
}

/**
 * Generate recommendations for fixing the sync
 */
function generateRecommendations(documents, mobileProfiles) {
  console.log('\n💡 RECOMMENDATIONS FOR FIXING SYNC ISSUES');
  console.log('=' .repeat(80));
  
  const totalDocs = documents.length;
  const activeDocs = mobileProfiles.length;
  
  console.log(`📊 Summary: ${activeDocs}/${totalDocs} documents would appear in mobile app`);
  
  if (activeDocs === 0) {
    console.log('\n❌ CRITICAL: No documents would appear in mobile app!');
    console.log('🔧 Possible fixes:');
    console.log('   1. Check status field values in Firebase');
    console.log('   2. Update mobile app query to match actual status values');
    console.log('   3. Ensure documents have proper status field');
  } else if (activeDocs < totalDocs) {
    console.log('\n⚠️  WARNING: Some documents missing from mobile app');
    console.log('🔧 Check inactive documents for proper status values');
  } else {
    console.log('\n✅ SUCCESS: All documents should appear in mobile app');
  }
  
  // Check for common issues
  const hasStatusField = documents.some(doc => doc.data.status !== undefined);
  const hasIsActiveField = documents.some(doc => doc.data.isActive !== undefined);
  
  if (!hasStatusField && !hasIsActiveField) {
    console.log('\n❌ ISSUE: No status or isActive field found');
    console.log('🔧 Add status field with "active" value to documents');
  }
  
  const hasNameField = documents.some(doc => 
    doc.data.name || doc.data.displayName || doc.data.fullName
  );
  
  if (!hasNameField) {
    console.log('\n❌ ISSUE: No name fields found');
    console.log('🔧 Add name, displayName, or fullName field to documents');
  }
}

/**
 * Main debug function
 */
async function debugStaffAccountsSync() {
  console.log('🐛 STAFF ACCOUNTS SYNC DEBUG TOOL');
  console.log('Investigating Firebase staff_accounts ↔ Mobile app synchronization');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Analyze collection structure
    const documents = await analyzeStaffAccountsStructure();
    
    if (documents.length === 0) {
      console.log('\n❌ No documents to analyze. Exiting.');
      return;
    }
    
    // Step 2: Test query variations
    await testQueryVariations(documents);
    
    // Step 3: Simulate mobile app mapping
    const mobileProfiles = simulateMobileAppMapping(documents);
    
    // Step 4: Generate recommendations
    generateRecommendations(documents, mobileProfiles);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug tool
debugStaffAccountsSync();
