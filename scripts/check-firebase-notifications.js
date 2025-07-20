#!/usr/bin/env node

/**
 * Firebase Notifications Checker
 * Analyzes notification collections to identify duplicate notification sources
 */

const { execSync } = require('child_process');

console.log('🔍 Firebase Notifications Analysis');
console.log('===================================\n');

// Function to run Firebase CLI commands and parse JSON output
function runFirebaseCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Function to get recent documents from a collection
function getRecentDocuments(collection, limit = 10) {
  console.log(`📋 Checking ${collection} collection...`);
  
  try {
    const command = `firebase firestore:get ${collection} --limit ${limit} --format json`;
    const output = runFirebaseCommand(command);
    
    if (!output) {
      console.log(`   ⚠️  Could not retrieve data from ${collection}`);
      return [];
    }

    // Try to parse the JSON output
    try {
      const data = JSON.parse(output);
      if (Array.isArray(data)) {
        console.log(`   ✅ Found ${data.length} documents in ${collection}`);
        return data;
      } else if (data && typeof data === 'object') {
        // Single document
        console.log(`   ✅ Found 1 document in ${collection}`);
        return [data];
      } else {
        console.log(`   ℹ️  No documents found in ${collection}`);
        return [];
      }
    } catch (parseError) {
      console.log(`   ⚠️  Could not parse JSON from ${collection}: ${parseError.message}`);
      return [];
    }
  } catch (error) {
    console.log(`   ❌ Error accessing ${collection}: ${error.message}`);
    return [];
  }
}

// Function to analyze notification patterns
function analyzeNotificationPatterns(notifications, collectionName) {
  if (!notifications || notifications.length === 0) {
    console.log(`   📊 No notifications to analyze in ${collectionName}\n`);
    return;
  }

  console.log(`\n📊 Analysis of ${collectionName}:`);
  console.log(`   Total notifications: ${notifications.length}`);

  // Group by job ID or related entity
  const groupedByJob = {};
  const groupedByStaff = {};
  const groupedByType = {};
  const groupedByTimestamp = {};

  notifications.forEach(notif => {
    // Group by job ID
    const jobId = notif.jobId || notif.relatedJobId || notif.entityId || 'unknown';
    if (!groupedByJob[jobId]) groupedByJob[jobId] = [];
    groupedByJob[jobId].push(notif);

    // Group by staff ID
    const staffId = notif.staffId || notif.assignedTo || notif.recipientId || 'unknown';
    if (!groupedByStaff[staffId]) groupedByStaff[staffId] = [];
    groupedByStaff[staffId].push(notif);

    // Group by notification type
    const type = notif.type || notif.eventType || notif.notificationType || 'unknown';
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(notif);

    // Group by timestamp (to find rapid duplicates)
    const timestamp = notif.timestamp || notif.createdAt || notif.sentAt;
    if (timestamp) {
      const timeKey = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toISOString().substring(0, 16); // Group by minute
      if (!groupedByTimestamp[timeKey]) groupedByTimestamp[timeKey] = [];
      groupedByTimestamp[timeKey].push(notif);
    }
  });

  // Check for potential duplicates
  console.log('\n   🔍 Potential Issues Found:');
  
  let issuesFound = false;

  // Check for multiple notifications per job
  Object.entries(groupedByJob).forEach(([jobId, notifs]) => {
    if (notifs.length > 1 && jobId !== 'unknown') {
      console.log(`   ⚠️  Job ${jobId}: ${notifs.length} notifications (potential duplicates)`);
      issuesFound = true;
    }
  });

  // Check for rapid notifications in same time window
  Object.entries(groupedByTimestamp).forEach(([timeKey, notifs]) => {
    if (notifs.length > 3) {
      console.log(`   ⚠️  ${timeKey}: ${notifs.length} notifications in same minute (potential spam)`);
      issuesFound = true;
    }
  });

  // Check notification types
  console.log('\n   📈 Notification Types:');
  Object.entries(groupedByType).forEach(([type, notifs]) => {
    console.log(`   - ${type}: ${notifs.length} notifications`);
  });

  // Check staff distribution
  console.log('\n   👥 Staff Distribution:');
  Object.entries(groupedByStaff).forEach(([staffId, notifs]) => {
    if (notifs.length > 5) {
      console.log(`   - Staff ${staffId}: ${notifs.length} notifications`);
    }
  });

  if (!issuesFound) {
    console.log(`   ✅ No obvious duplicate patterns found in ${collectionName}`);
  }

  console.log('');
}

// Function to check for notification-related fields in jobs
function checkJobNotificationFields() {
  console.log('📋 Checking jobs collection for notification fields...');
  
  try {
    const command = 'firebase firestore:get jobs --limit 5 --format json';
    const output = runFirebaseCommand(command);
    
    if (!output) {
      console.log('   ⚠️  Could not retrieve jobs data');
      return;
    }

    const jobs = JSON.parse(output);
    if (!Array.isArray(jobs) || jobs.length === 0) {
      console.log('   ℹ️  No jobs found');
      return;
    }

    console.log(`   ✅ Found ${jobs.length} jobs to analyze`);

    // Check for notification-related fields
    const notificationFields = ['notificationSent', 'reminderSent', 'notificationCount', 'lastNotificationSent'];
    const foundFields = new Set();

    jobs.forEach(job => {
      notificationFields.forEach(field => {
        if (job.hasOwnProperty(field)) {
          foundFields.add(field);
        }
      });
    });

    if (foundFields.size > 0) {
      console.log('\n   🔍 Notification-related fields found in jobs:');
      foundFields.forEach(field => {
        const jobsWithField = jobs.filter(job => job.hasOwnProperty(field));
        console.log(`   - ${field}: present in ${jobsWithField.length}/${jobs.length} jobs`);
        
        // Check for potential issues
        if (field === 'notificationCount') {
          jobsWithField.forEach(job => {
            if (job[field] > 1) {
              console.log(`     ⚠️  Job ${job.id || 'unknown'}: ${field} = ${job[field]} (potential duplicates)`);
            }
          });
        }
      });
    } else {
      console.log('   ✅ No notification tracking fields found in jobs');
    }

  } catch (error) {
    console.log(`   ❌ Error checking jobs: ${error.message}`);
  }

  console.log('');
}

// Main analysis function
async function analyzeNotifications() {
  console.log('🔍 Starting Firebase notification analysis...\n');

  // Check different notification collections
  const collectionsToCheck = [
    'notifications',
    'staff_notifications',
    'notification_events', // Our new collection
    'job_events'
  ];

  const allNotificationData = {};

  for (const collection of collectionsToCheck) {
    const data = getRecentDocuments(collection, 20);
    allNotificationData[collection] = data;
    
    if (data && data.length > 0) {
      analyzeNotificationPatterns(data, collection);
    }
  }

  // Check jobs for notification fields
  checkJobNotificationFields();

  // Summary and recommendations
  console.log('📊 Summary and Recommendations');
  console.log('===============================\n');

  const totalNotifications = Object.values(allNotificationData)
    .reduce((sum, data) => sum + (data ? data.length : 0), 0);

  console.log(`Total notifications found: ${totalNotifications}`);

  // Check if multiple notification systems are active
  const activeCollections = Object.entries(allNotificationData)
    .filter(([_, data]) => data && data.length > 0)
    .map(([collection, _]) => collection);

  if (activeCollections.length > 1) {
    console.log('\n⚠️  MULTIPLE NOTIFICATION SYSTEMS DETECTED:');
    activeCollections.forEach(collection => {
      console.log(`   - ${collection} (${allNotificationData[collection].length} notifications)`);
    });
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('   1. This suggests multiple notification systems are running simultaneously');
    console.log('   2. The webapp team may have their own notification system');
    console.log('   3. You should coordinate with the webapp dev team to:');
    console.log('      - Identify which system should be the primary one');
    console.log('      - Disable redundant notification systems');
    console.log('      - Ensure only one system sends notifications per event');
    console.log('\n📞 NEXT STEPS:');
    console.log('   1. Contact the webapp dev team immediately');
    console.log('   2. Share this analysis with them');
    console.log('   3. Coordinate to disable duplicate notification sources');
    console.log('   4. Implement a single, unified notification system');
  } else if (activeCollections.length === 1) {
    console.log(`\n✅ Single notification system detected: ${activeCollections[0]}`);
    console.log('   This is good - only one system appears to be active');
  } else {
    console.log('\n❓ No recent notifications found in any collection');
    console.log('   This could mean:');
    console.log('   - Notifications are stored elsewhere');
    console.log('   - The webapp team uses a different notification system');
    console.log('   - Notifications are not being stored in Firestore');
  }

  console.log('\n🎯 CONCLUSION:');
  if (activeCollections.length > 1) {
    console.log('   The duplicate notification issue is likely caused by multiple');
    console.log('   notification systems running simultaneously. Contact the webapp');
    console.log('   dev team to coordinate a solution.');
  } else {
    console.log('   The notification system appears to be properly consolidated.');
    console.log('   If you\'re still experiencing duplicates, the issue may be');
    console.log('   in the webapp or external notification services.');
  }
}

// Run the analysis
analyzeNotifications().catch(error => {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
});
