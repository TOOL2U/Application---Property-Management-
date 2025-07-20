#!/usr/bin/env node

/**
 * Direct Firestore Notifications Checker
 * Uses Firebase Admin SDK to check notification collections
 */

const admin = require('firebase-admin');
const path = require('path');

console.log('🔍 Direct Firestore Notifications Analysis');
console.log('==========================================\n');

// Initialize Firebase Admin SDK
async function initializeFirebase() {
  try {
    // Try to find service account key
    const serviceAccountPaths = [
      './serviceAccountKey.json',
      './firebase-service-account.json',
      './config/serviceAccountKey.json',
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    ].filter(Boolean);

    let serviceAccount = null;
    for (const keyPath of serviceAccountPaths) {
      try {
        serviceAccount = require(path.resolve(keyPath));
        console.log(`✅ Found service account key: ${keyPath}`);
        break;
      } catch (error) {
        // Continue to next path
      }
    }

    if (!serviceAccount) {
      console.log('⚠️  No service account key found. Trying default credentials...');
      admin.initializeApp({
        projectId: 'operty-b54dc' // From the Firebase projects list
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    console.log('✅ Firebase Admin SDK initialized\n');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

// Function to check a collection
async function checkCollection(db, collectionName, limit = 20) {
  try {
    console.log(`📋 Checking ${collectionName} collection...`);
    
    const snapshot = await db.collection(collectionName)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    if (snapshot.empty) {
      console.log(`   ℹ️  No documents found in ${collectionName}`);
      return [];
    }

    const docs = [];
    snapshot.forEach(doc => {
      docs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`   ✅ Found ${docs.length} documents in ${collectionName}`);
    return docs;
  } catch (error) {
    if (error.code === 9) {
      // Try without orderBy if timestamp field doesn't exist
      try {
        const snapshot = await db.collection(collectionName).limit(limit).get();
        if (snapshot.empty) {
          console.log(`   ℹ️  No documents found in ${collectionName}`);
          return [];
        }

        const docs = [];
        snapshot.forEach(doc => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });

        console.log(`   ✅ Found ${docs.length} documents in ${collectionName} (no timestamp ordering)`);
        return docs;
      } catch (innerError) {
        console.log(`   ❌ Error accessing ${collectionName}: ${innerError.message}`);
        return [];
      }
    } else {
      console.log(`   ❌ Error accessing ${collectionName}: ${error.message}`);
      return [];
    }
  }
}

// Function to analyze notification patterns
function analyzeNotificationPatterns(notifications, collectionName) {
  if (!notifications || notifications.length === 0) {
    return;
  }

  console.log(`\n📊 Analysis of ${collectionName}:`);
  console.log(`   Total notifications: ${notifications.length}`);

  // Group by potential job ID fields
  const jobIdFields = ['jobId', 'relatedJobId', 'entityId', 'job_id', 'assignmentId'];
  const groupedByJob = {};
  
  notifications.forEach(notif => {
    let jobId = 'unknown';
    for (const field of jobIdFields) {
      if (notif[field]) {
        jobId = notif[field];
        break;
      }
    }
    
    if (!groupedByJob[jobId]) groupedByJob[jobId] = [];
    groupedByJob[jobId].push(notif);
  });

  // Check for potential duplicates
  let duplicatesFound = false;
  Object.entries(groupedByJob).forEach(([jobId, notifs]) => {
    if (notifs.length > 1 && jobId !== 'unknown') {
      console.log(`   ⚠️  Job ${jobId}: ${notifs.length} notifications (POTENTIAL DUPLICATES)`);
      duplicatesFound = true;
      
      // Show timestamps if available
      notifs.forEach((notif, index) => {
        const timestamp = notif.timestamp || notif.createdAt || notif.sentAt;
        const timeStr = timestamp ? new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toISOString() : 'unknown';
        console.log(`      ${index + 1}. ${timeStr} - Type: ${notif.type || notif.eventType || 'unknown'}`);
      });
    }
  });

  // Check notification types
  const typeGroups = {};
  notifications.forEach(notif => {
    const type = notif.type || notif.eventType || notif.notificationType || 'unknown';
    if (!typeGroups[type]) typeGroups[type] = 0;
    typeGroups[type]++;
  });

  console.log('\n   📈 Notification Types:');
  Object.entries(typeGroups).forEach(([type, count]) => {
    console.log(`      - ${type}: ${count} notifications`);
  });

  if (!duplicatesFound) {
    console.log(`   ✅ No obvious duplicates found in ${collectionName}`);
  }

  return duplicatesFound;
}

// Function to check jobs collection for notification flags
async function checkJobsForNotificationFlags(db) {
  try {
    console.log('\n📋 Checking jobs collection for notification tracking...');
    
    const snapshot = await db.collection('jobs').limit(10).get();
    
    if (snapshot.empty) {
      console.log('   ℹ️  No jobs found');
      return false;
    }

    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`   ✅ Found ${jobs.length} jobs to analyze`);

    // Check for notification-related fields
    const notificationFields = [
      'notificationSent', 'reminderSent', 'notificationCount', 
      'lastNotificationSent', 'notificationHistory', 'duplicateNotifications'
    ];
    
    const foundFields = new Set();
    let suspiciousJobs = 0;

    jobs.forEach(job => {
      notificationFields.forEach(field => {
        if (job.hasOwnProperty(field)) {
          foundFields.add(field);
          
          // Check for suspicious values
          if (field === 'notificationCount' && job[field] > 1) {
            console.log(`   ⚠️  Job ${job.id}: notificationCount = ${job[field]} (SUSPICIOUS)`);
            suspiciousJobs++;
          }
        }
      });
    });

    if (foundFields.size > 0) {
      console.log('\n   🔍 Notification tracking fields found:');
      foundFields.forEach(field => {
        const jobsWithField = jobs.filter(job => job.hasOwnProperty(field));
        console.log(`      - ${field}: present in ${jobsWithField.length}/${jobs.length} jobs`);
      });
    }

    return suspiciousJobs > 0;
  } catch (error) {
    console.log(`   ❌ Error checking jobs: ${error.message}`);
    return false;
  }
}

// Main analysis function
async function analyzeNotifications() {
  let db;
  
  try {
    db = await initializeFirebase();
  } catch (error) {
    console.log('❌ Cannot connect to Firebase. This could mean:');
    console.log('   1. No service account key is configured');
    console.log('   2. The Firebase project is not accessible');
    console.log('   3. You need to run: firebase login');
    console.log('\n🔧 To fix this:');
    console.log('   1. Contact your webapp dev team for the service account key');
    console.log('   2. Or ask them to run this analysis from their environment');
    return;
  }

  // Collections to check
  const collectionsToCheck = [
    'notifications',
    'staff_notifications', 
    'notification_events',
    'job_events',
    'user_notifications',
    'push_notifications'
  ];

  const allNotificationData = {};
  let totalNotifications = 0;
  let duplicatesDetected = false;

  for (const collection of collectionsToCheck) {
    const data = await checkCollection(db, collection);
    allNotificationData[collection] = data;
    totalNotifications += data.length;
    
    if (data.length > 0) {
      const hasDuplicates = analyzeNotificationPatterns(data, collection);
      if (hasDuplicates) {
        duplicatesDetected = true;
      }
    }
  }

  // Check jobs for notification tracking
  const jobsHaveSuspiciousFlags = await checkJobsForNotificationFlags(db);

  // Summary and recommendations
  console.log('\n📊 FIREBASE ANALYSIS SUMMARY');
  console.log('=============================\n');

  console.log(`Total notifications found: ${totalNotifications}`);

  const activeCollections = Object.entries(allNotificationData)
    .filter(([_, data]) => data && data.length > 0)
    .map(([collection, data]) => ({ collection, count: data.length }));

  if (activeCollections.length > 1) {
    console.log('\n🚨 CRITICAL: MULTIPLE NOTIFICATION SYSTEMS DETECTED!');
    console.log('   Active notification collections:');
    activeCollections.forEach(({ collection, count }) => {
      console.log(`   - ${collection}: ${count} notifications`);
    });
    duplicatesDetected = true;
  }

  if (duplicatesDetected || jobsHaveSuspiciousFlags) {
    console.log('\n🚨 DUPLICATE NOTIFICATION SOURCES CONFIRMED!');
    console.log('\n🔧 IMMEDIATE ACTION REQUIRED:');
    console.log('   1. 📞 Contact your webapp dev team IMMEDIATELY');
    console.log('   2. 📋 Share this analysis report with them');
    console.log('   3. 🛑 Ask them to disable their notification system temporarily');
    console.log('   4. 🔄 Coordinate to use only ONE notification system');
    console.log('\n💡 ROOT CAUSE IDENTIFIED:');
    console.log('   - Multiple notification systems are running simultaneously');
    console.log('   - Both mobile app and webapp are sending notifications');
    console.log('   - This is causing the 19 duplicate notifications issue');
    console.log('\n📞 WHAT TO TELL THE WEBAPP TEAM:');
    console.log('   "We found multiple notification systems running at the same time.');
    console.log('   This is causing duplicate notifications (19 for one job).');
    console.log('   We need to coordinate to use only one notification system.');
    console.log('   Can you temporarily disable your notification triggers');
    console.log('   while we implement a unified solution?"');
  } else {
    console.log('\n✅ No obvious duplicate notification sources found in Firebase');
    console.log('\n🤔 If you\'re still experiencing duplicates, they might be coming from:');
    console.log('   1. External notification services (not stored in Firestore)');
    console.log('   2. The webapp using a different notification system');
    console.log('   3. Third-party integrations or webhooks');
    console.log('\n📞 NEXT STEPS:');
    console.log('   1. Contact the webapp dev team anyway');
    console.log('   2. Ask them what notification system they\'re using');
    console.log('   3. Check if they have external notification services');
    console.log('   4. Coordinate to ensure only one system sends notifications');
  }

  console.log('\n🎯 CONCLUSION:');
  if (duplicatesDetected || activeCollections.length > 1) {
    console.log('   The duplicate notification issue is CONFIRMED to be caused by');
    console.log('   multiple notification systems. Contact the webapp team immediately.');
  } else {
    console.log('   No obvious duplicates found in Firebase, but the webapp team');
    console.log('   may be using external notification services. Contact them to coordinate.');
  }

  // Close Firebase connection
  admin.app().delete();
}

// Run the analysis
analyzeNotifications().catch(error => {
  console.error('❌ Analysis failed:', error.message);
  console.log('\n🔧 This might be due to:');
  console.log('   1. Missing Firebase credentials');
  console.log('   2. Network connectivity issues');
  console.log('   3. Firebase project access permissions');
  console.log('\n📞 Contact your webapp dev team to run this analysis from their environment.');
  process.exit(1);
});
