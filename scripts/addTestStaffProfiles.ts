/**
 * Script to add test staff profiles to Firestore
 * Run this to populate the staff_accounts collection with test data
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Test staff profiles
const testStaffProfiles = [
  {
    id: 'admin-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@siamoon.com',
    role: 'admin',
    pin: '1234',
    department: 'Management',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  },
  {
    id: 'manager-001',
    name: 'Mike Chen',
    email: 'mike.chen@siamoon.com',
    role: 'manager',
    pin: '5678',
    department: 'Operations',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  },
  {
    id: 'cleaner-001',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@siamoon.com',
    role: 'cleaner',
    pin: '9876',
    department: 'Housekeeping',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  },
  {
    id: 'cleaner-002',
    name: 'James Wilson',
    email: 'james.wilson@siamoon.com',
    role: 'cleaner',
    pin: '5432',
    department: 'Housekeeping',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  },
  {
    id: 'maintenance-001',
    name: 'David Kim',
    email: 'david.kim@siamoon.com',
    role: 'maintenance',
    pin: '1111',
    department: 'Maintenance',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  },
  {
    id: 'staff-001',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@siamoon.com',
    role: 'staff',
    pin: '2222',
    department: 'General',
    isActive: true,
    photo: null,
    createdAt: new Date(),
    lastLogin: null
  }
];

/**
 * Add test staff profiles to Firestore
 */
export const addTestStaffProfiles = async () => {
  try {
    console.log('🔧 Adding test staff profiles to Firestore...');
    
    const staffCollection = collection(db, 'staff_accounts');
    
    for (const profile of testStaffProfiles) {
      const staffDoc = doc(staffCollection, profile.id);
      await setDoc(staffDoc, profile);
      console.log(`✅ Added staff profile: ${profile.name} (${profile.role})`);
    }
    
    console.log('✅ All test staff profiles added successfully!');
    console.log('\n📋 Test Staff Profiles:');
    testStaffProfiles.forEach(profile => {
      console.log(`   ${profile.name} - ${profile.role} - PIN: ${profile.pin}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error adding test staff profiles:', error);
    throw error;
  }
};

/**
 * Remove test staff profiles from Firestore
 */
export const removeTestStaffProfiles = async () => {
  try {
    console.log('🗑️ Removing test staff profiles from Firestore...');
    
    const { deleteDoc } = await import('firebase/firestore');
    const staffCollection = collection(db, 'staff_accounts');
    
    for (const profile of testStaffProfiles) {
      const staffDoc = doc(staffCollection, profile.id);
      await deleteDoc(staffDoc);
      console.log(`🗑️ Removed staff profile: ${profile.name}`);
    }
    
    console.log('✅ All test staff profiles removed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error removing test staff profiles:', error);
    throw error;
  }
};

// If running directly
if (require.main === module) {
  addTestStaffProfiles()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
