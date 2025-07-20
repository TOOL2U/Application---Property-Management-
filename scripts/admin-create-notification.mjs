/**
 * Firebase Admin Script to Create Test Notifications
 * Run with: node scripts/admin-create-notification.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../config/service-account-key.json');

let adminApp;
if (getApps().length === 0) {
  try {
    // Try to load service account key
    const serviceAccount = await import(serviceAccountPath, { assert: { type: 'json' } });
    adminApp = initializeApp({
      credential: cert(serviceAccount.default)
    });
  } catch (error) {
    console.log('⚠️ Service account key not found, using environment variables...');
    // Fallback to environment variables
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'property-management-f68bf',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

async function createTestNotification() {
  try {
    const staffId = 'IDJrsXWiL2dCHVpveH97';
    const firebaseUid = 'gTtR5gSKOtUEweLwchSnVreylMy1';

    console.log('🔔 Creating test notification for:');
    console.log('- Staff ID:', staffId);
    console.log('- Firebase UID:', firebaseUid);

    const notification = {
      userId: firebaseUid,
      staffId: staffId,
      staffEmail: 'staff@siamoon.com',
      staffName: 'Test Staff',
      type: 'job_assigned',
      jobId: 'test-job-' + Date.now(),
      jobTitle: 'Emergency Maintenance',
      jobType: 'maintenance',
      propertyName: 'Moonlight Villa Resort',
      propertyAddress: '123 Paradise Beach, Villa 42',
      priority: 'high',
      status: 'assigned',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM tomorrow
      estimatedDuration: '3 hours',
      specialInstructions: 'Urgent repair needed for villa guests arriving tonight',
      actionRequired: true,
      read: false,
      readAt: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const docRef = await db.collection('staff_notifications').add(notification);
    
    console.log('✅ Successfully created test notification!');
    console.log('📄 Document ID:', docRef.id);
    console.log('🎉 The notification should now appear in your app');
    console.log('');
    console.log('📱 Notification Details:');
    console.log('- Title: Emergency Maintenance');
    console.log('- Property: Moonlight Villa Resort');
    console.log('- Priority: High');
    console.log('- Status: Assigned');

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    
    if (error.code === 'permission-denied') {
      console.log('');
      console.log('🔧 To fix permission issues:');
      console.log('1. Make sure you have a service account key in config/service-account-key.json');
      console.log('2. Or set these environment variables:');
      console.log('   - FIREBASE_PROJECT_ID');
      console.log('   - FIREBASE_CLIENT_EMAIL');
      console.log('   - FIREBASE_PRIVATE_KEY');
    }
  }
}

// Run the function
createTestNotification();
