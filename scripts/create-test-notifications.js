#!/usr/bin/env node
/**
 * Create Test Notifications
 * 
 * This script creates sample notifications in the staff_notifications collection
 * to test the mobile app notification system.
 * 
 * Usage:
 *   node scripts/create-test-notifications.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://operty-b54dc.firebaseio.com'
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('Please ensure firebase-service-account.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Get a staff member's Firebase UID
 */
async function getStaffFirebaseUid(email) {
  try {
    const staffQuery = await db.collection('staff_accounts')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (staffQuery.empty) {
      console.log(`⚠️  No staff found with email: ${email}`);
      return null;
    }
    
    const staffDoc = staffQuery.docs[0];
    const staffData = staffDoc.data();
    
    console.log(`✅ Found staff: ${staffData.name} (${email})`);
    console.log(`   Document ID: ${staffDoc.id}`);
    console.log(`   Firebase UID: ${staffData.firebaseUid || 'NOT SET'}`);
    
    return {
      docId: staffDoc.id,
      firebaseUid: staffData.firebaseUid || staffData.userId || staffDoc.id,
      name: staffData.name,
      email: staffData.email
    };
  } catch (error) {
    console.error('❌ Error getting staff:', error);
    return null;
  }
}

/**
 * Create a test job document
 */
async function createTestJob(staffInfo) {
  try {
    const jobData = {
      title: '🧪 TEST: Clean Villa Sunset',
      description: 'Full property cleaning before guest check-in. Test notification job.',
      type: 'cleaning',
      status: 'assigned',
      priority: 'high',
      
      // Assignment fields - USE BOTH for compatibility
      assignedTo: staffInfo.firebaseUid,
      assignedStaffId: staffInfo.firebaseUid,
      assignedBy: 'admin_test',
      assignedAt: admin.firestore.Timestamp.now(),
      
      // Scheduling
      scheduledDate: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      ),
      scheduledStartTime: '14:00',
      estimatedDuration: 180, // 3 hours
      
      // Property
      propertyId: 'test_property_001',
      propertyName: 'Villa Sunset Beach',
      propertyPhotos: ['https://via.placeholder.com/400x300'],
      
      // Location
      location: {
        address: '123 Beach Road, Ban Tai',
        city: 'Koh Phangan',
        state: 'Surat Thani',
        zipCode: '84280',
        accessCodes: {
          gate: '1234',
          door: '5678'
        },
        specialInstructions: 'Call property manager before entering'
      },
      
      // Booking context
      bookingRef: 'BK2026010701',
      checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      checkOutDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      guestCount: 4,
      specialNotes: '🎉 Important: Guests arriving tomorrow at 3 PM',
      
      // Contacts
      contacts: [{
        name: 'Property Manager',
        phone: '+66812345678',
        email: 'manager@siamoon.com',
        role: 'property_manager',
        preferredContactMethod: 'phone'
      }],
      
      // Requirements
      requirements: [
        {
          id: 'req1',
          description: 'Clean all bedrooms and change linens',
          isCompleted: false
        },
        {
          id: 'req2',
          description: 'Clean bathrooms and restock amenities',
          isCompleted: false
        },
        {
          id: 'req3',
          description: 'Check all appliances are working',
          isCompleted: false
        }
      ],
      
      photos: [],
      notificationsEnabled: true,
      reminderSent: false,
      
      // Timestamps
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      createdBy: 'test_script'
    };
    
    const jobRef = await db.collection('jobs').add(jobData);
    console.log(`✅ Created test job: ${jobRef.id}`);
    console.log(`   Title: ${jobData.title}`);
    console.log(`   Property: ${jobData.propertyName}`);
    console.log(`   Assigned to: ${staffInfo.name}`);
    
    return jobRef.id;
  } catch (error) {
    console.error('❌ Error creating test job:', error);
    return null;
  }
}

/**
 * Create a test notification
 */
async function createTestNotification(jobId, staffInfo, notificationType = 'job_assigned') {
  try {
    const notificationData = {
      // CRITICAL FIELDS for mobile app queries
      jobId: jobId,
      staffId: staffInfo.docId,
      userId: staffInfo.firebaseUid, // ⚠️ MOST IMPORTANT - mobile app queries this
      
      // Notification details
      type: notificationType,
      title: notificationType === 'job_assigned' 
        ? `🔔 New Assignment: Clean Villa Sunset`
        : `📝 Update: Job Status Changed`,
      body: 'You have been assigned a new cleaning job. Please review and accept.',
      status: 'pending',
      actionRequired: true,
      
      // Job summary (for display)
      jobTitle: '🧪 TEST: Clean Villa Sunset',
      jobType: 'cleaning',
      priority: 'high',
      propertyName: 'Villa Sunset Beach',
      propertyAddress: '123 Beach Road, Ban Tai, Koh Phangan',
      scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      scheduledStartTime: '14:00',
      estimatedDuration: 180,
      specialInstructions: '🎉 Guests arriving tomorrow - please complete by 2 PM',
      
      // Staff info
      staffName: staffInfo.name,
      staffEmail: staffInfo.email,
      
      // Timestamps
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      ),
      readAt: null,
      
      // Additional data
      data: {
        source: 'test_script',
        testNotification: true
      }
    };
    
    const notificationRef = await db.collection('staff_notifications').add(notificationData);
    console.log(`✅ Created test notification: ${notificationRef.id}`);
    console.log(`   Type: ${notificationType}`);
    console.log(`   Title: ${notificationData.title}`);
    console.log(`   userId (for queries): ${notificationData.userId}`);
    console.log(`   staffId: ${notificationData.staffId}`);
    
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting test notification creation...\n');
  
  // Get staff email from command line or use default
  const staffEmail = process.argv[2] || 'staff@siamoon.com';
  
  console.log(`📧 Looking for staff with email: ${staffEmail}\n`);
  
  // Step 1: Get staff information
  const staffInfo = await getStaffFirebaseUid(staffEmail);
  
  if (!staffInfo) {
    console.error('\n❌ Cannot proceed without staff information');
    console.log('\n💡 Usage: node scripts/create-test-notifications.js [staff-email]');
    console.log('   Example: node scripts/create-test-notifications.js john@siamoon.com');
    process.exit(1);
  }
  
  console.log('\n---\n');
  
  // Step 2: Create test job
  console.log('📋 Creating test job...');
  const jobId = await createTestJob(staffInfo);
  
  if (!jobId) {
    console.error('\n❌ Failed to create test job');
    process.exit(1);
  }
  
  console.log('\n---\n');
  
  // Step 3: Create test notification
  console.log('🔔 Creating test notification...');
  const notificationId = await createTestNotification(jobId, staffInfo, 'job_assigned');
  
  if (!notificationId) {
    console.error('\n❌ Failed to create test notification');
    process.exit(1);
  }
  
  console.log('\n---\n');
  console.log('✅ Test notification creation complete!\n');
  console.log('📱 Check the mobile app:');
  console.log(`   1. Log in as: ${staffInfo.email}`);
  console.log('   2. Check the Notifications tab (should show badge)');
  console.log('   3. Tap notification to view job details');
  console.log('   4. Check the Jobs tab to see the assigned job\n');
  console.log('🔍 Verification queries:');
  console.log(`   Firestore > staff_notifications > where userId == "${staffInfo.firebaseUid}"`);
  console.log(`   Firestore > jobs > where assignedTo == "${staffInfo.firebaseUid}"`);
  console.log('\n🧹 Cleanup:');
  console.log('   These are test records. Delete them after testing.');
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
