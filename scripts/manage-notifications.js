const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "operty-b54dc",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL
  });
}

const db = admin.firestore();

async function listNotifications(staffId = "IDJrsXWiL2dCHVpveH97") {
  try {
    console.log(`📋 Listing notifications for Staff ID: ${staffId}`);
    
    const snapshot = await db.collection('notifications')
      .where('assignedTo', '==', staffId)
      .orderBy('timestamp', 'desc')
      .get();
    
    if (snapshot.empty) {
      console.log('📭 No notifications found for this staff member');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} notifications:`);
    console.log('');
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
      const readStatus = data.read ? '✅ Read' : '🔴 Unread';
      const priority = data.priority?.toUpperCase() || 'MEDIUM';
      
      console.log(`${index + 1}. [${priority}] ${data.title}`);
      console.log(`   📝 ${data.body}`);
      console.log(`   📅 ${timestamp.toLocaleString()}`);
      console.log(`   ${readStatus} | Type: ${data.type} | ID: ${doc.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing notifications:', error);
  }
}

async function clearNotifications(staffId = "IDJrsXWiL2dCHVpveH97") {
  try {
    console.log(`🗑️ Clearing all notifications for Staff ID: ${staffId}`);
    
    const snapshot = await db.collection('notifications')
      .where('assignedTo', '==', staffId)
      .get();
    
    if (snapshot.empty) {
      console.log('📭 No notifications to clear');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Cleared ${count} notifications`);
    
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
}

async function markAllAsRead(staffId = "IDJrsXWiL2dCHVpveH97") {
  try {
    console.log(`📖 Marking all notifications as read for Staff ID: ${staffId}`);
    
    const snapshot = await db.collection('notifications')
      .where('assignedTo', '==', staffId)
      .where('read', '==', false)
      .get();
    
    if (snapshot.empty) {
      console.log('📭 No unread notifications found');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: admin.firestore.Timestamp.now()
      });
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Marked ${count} notifications as read`);
    
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
  }
}

async function addSingleNotification(staffId = "IDJrsXWiL2dCHVpveH97", customData = {}) {
  try {
    const notification = {
      assignedTo: staffId,
      title: customData.title || "Test Notification",
      body: customData.body || "This is a test notification",
      message: customData.body || "This is a test notification",
      type: customData.type || "system",
      priority: customData.priority || "medium",
      read: false,
      timestamp: admin.firestore.Timestamp.now(),
      data: customData.data || {}
    };
    
    const docRef = await db.collection('notifications').add(notification);
    console.log(`✅ Added notification with ID: ${docRef.id}`);
    console.log(`📝 Title: ${notification.title}`);
    console.log(`📱 Staff: ${staffId}`);
    
  } catch (error) {
    console.error('❌ Error adding notification:', error);
  }
}

// Command line interface
const command = process.argv[2];
const staffId = process.argv[3] || "IDJrsXWiL2dCHVpveH97";

async function main() {
  console.log('🔔 Firebase Notification Management Tool');
  console.log('=====================================');
  
  switch (command) {
    case 'list':
      await listNotifications(staffId);
      break;
      
    case 'clear':
      await clearNotifications(staffId);
      break;
      
    case 'mark-read':
      await markAllAsRead(staffId);
      break;
      
    case 'add':
      const title = process.argv[4] || "Quick Test Notification";
      const body = process.argv[5] || "This is a quick test notification";
      const priority = process.argv[6] || "medium";
      
      await addSingleNotification(staffId, {
        title,
        body,
        priority,
        type: "system"
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node manage-notifications.js list [staffId]');
      console.log('  node manage-notifications.js clear [staffId]');
      console.log('  node manage-notifications.js mark-read [staffId]');
      console.log('  node manage-notifications.js add [staffId] [title] [body] [priority]');
      console.log('');
      console.log('Examples:');
      console.log('  node manage-notifications.js list');
      console.log('  node manage-notifications.js add IDJrsXWiL2dCHVpveH97 "New Job" "Villa 101 cleaning" "high"');
      console.log('  node manage-notifications.js clear');
  }
  
  process.exit(0);
}

// Run the script
main().catch(console.error);
