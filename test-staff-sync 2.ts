/**
 * Test Staff Accounts Sync
 * Quick test to verify staff_accounts are loading in the mobile app
 */

import { staffSyncService } from './services/staffSyncService';

async function testStaffAccountsSync() {
  console.log('🧪 Testing Staff Accounts Sync...\n');
  
  try {
    // Test 1: Direct fetch from Firestore
    console.log('📋 Test 1: Direct Firestore Fetch');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const syncResponse = await staffSyncService.fetchStaffProfiles(false);
    
    console.log(`✅ Sync Status: ${syncResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Staff Profiles Found: ${syncResponse.profiles.length}`);
    console.log(`📦 From Cache: ${syncResponse.fromCache ? 'Yes' : 'No'}`);
    
    if (syncResponse.error) {
      console.log(`❌ Error: ${syncResponse.error}`);
    }
    
    // Test 2: Display staff profiles
    if (syncResponse.profiles.length > 0) {
      console.log('\n👥 Test 2: Staff Profile Details');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      syncResponse.profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name}`);
        console.log(`   ID: ${profile.id}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Department: ${profile.department}`);
        console.log(`   Active: ${profile.isActive ? 'Yes' : 'No'}`);
        console.log(`   Phone: ${profile.phone || 'Not provided'}`);
        console.log(`   Avatar: ${profile.avatar ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      // Test 3: Real-time subscription
      console.log('🔄 Test 3: Real-time Updates');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const unsubscribe = staffSyncService.subscribeToStaffUpdates((updatedProfiles) => {
        console.log(`📡 Real-time update: ${updatedProfiles.length} staff profiles`);
        
        // Log any new profiles
        updatedProfiles.forEach((profile) => {
          console.log(`   📝 Profile: ${profile.name} (${profile.role})`);
        });
      });
      
      // Test for 2 seconds then cleanup
      setTimeout(() => {
        unsubscribe();
        console.log('🧹 Real-time listener cleaned up');
        console.log('\n🎉 Staff sync test completed successfully!');
        
        // Test 4: Check specific roles
        console.log('\n📊 Test 4: Role Distribution');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const roleStats = {
          admin: 0,
          manager: 0,
          cleaner: 0,
          maintenance: 0,
          staff: 0
        };
        
        syncResponse.profiles.forEach(profile => {
          roleStats[profile.role]++;
        });
        
        console.log('Role breakdown:');
        Object.entries(roleStats).forEach(([role, count]) => {
          if (count > 0) {
            console.log(`   ${role}: ${count} ${count === 1 ? 'person' : 'people'}`);
          }
        });
        
      }, 2000);
      
    } else {
      console.log('\n⚠️ No staff profiles found!');
      console.log('Possible issues:');
      console.log('• staff_accounts collection is empty');
      console.log('• All staff accounts have status != "active" or isActive != true');
      console.log('• Firebase security rules are blocking access');
      console.log('• Firestore connection issues');
      
      // Test 5: Debug collection access
      console.log('\n🔍 Test 5: Debug Collection Access');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        // Import Firebase dependencies
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        
        console.log('Testing direct collection access...');
        
        const staffRef = collection(db, 'staff_accounts');
        const querySnapshot = await getDocs(staffRef);
        
        console.log(`📋 Total documents in staff_accounts: ${querySnapshot.size}`);
        
        if (querySnapshot.size > 0) {
          console.log('Sample documents:');
          let count = 0;
          querySnapshot.forEach((doc) => {
            if (count < 3) {
              const data = doc.data();
              console.log(`   Document ${doc.id}:`, {
                name: data.displayName || data.name || data.fullName,
                email: data.email,
                status: data.status,
                isActive: data.isActive,
                role: data.role || data.accountType || data.userRole
              });
              count++;
            }
          });
        }
        
      } catch (debugError) {
        console.log('❌ Direct collection access failed:', debugError);
      }
    }
    
  } catch (error) {
    console.error('❌ Staff sync test failed:', error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check Firebase configuration');
    console.log('2. Verify Firestore security rules');
    console.log('3. Ensure staff_accounts collection exists');
    console.log('4. Check network connectivity');
  }
}

// Export for use in components
export { testStaffAccountsSync };

// Run test immediately
testStaffAccountsSync();
