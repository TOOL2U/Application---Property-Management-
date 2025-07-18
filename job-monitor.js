/**
 * Job Monitor - Watch for new jobs from webapp
 * Ready to receive jobs from webapp team
 */

const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "property-management-9df0c"
});

const db = admin.firestore();

console.log('🚀 JOB MONITOR ACTIVE');
console.log('═══════════════════════════════════════');
console.log('📱 Ready to receive jobs from webapp');
console.log('🔍 Monitoring collections:');
console.log('   - jobs (all new jobs)');
console.log('   - job_assignments (real-time assignments)');
console.log('🎯 Webapp team: Send your test jobs now!');
console.log('═══════════════════════════════════════\n');

let jobCount = 0;
let assignmentCount = 0;

// Monitor all jobs collection
const jobsRef = db.collection('jobs');

const unsubscribeJobs = jobsRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
  console.log(`🔄 Jobs collection update: ${snapshot.size} total jobs`);
  
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      jobCount++;
      const job = change.doc.data();
      console.log(`\n🆕 NEW JOB DETECTED! (#${jobCount})`);
      console.log(`   ID: ${change.doc.id}`);
      console.log(`   Title: ${job.title || 'Untitled'}`);
      console.log(`   Description: ${job.description || 'No description'}`);
      console.log(`   Status: ${job.status || 'Unknown'}`);
      console.log(`   Assigned To: ${job.assignedStaffId || job.userId || 'Unassigned'}`);
      console.log(`   Priority: ${job.priority || 'medium'}`);
      console.log(`   Created: ${job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
      console.log(`   Source: ${job.source || 'webapp'}`);
      console.log('   ──────────────────────────────────────');
    }
  });
}, (error) => {
  console.error('❌ Error monitoring jobs:', error);
});

// Monitor job assignments collection (if it exists)
const assignmentsRef = db.collection('job_assignments');

const unsubscribeAssignments = assignmentsRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
  console.log(`🔄 Job assignments update: ${snapshot.size} total assignments`);
  
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      assignmentCount++;
      const assignment = change.doc.data();
      console.log(`\n🎯 NEW JOB ASSIGNMENT! (#${assignmentCount})`);
      console.log(`   Assignment ID: ${change.doc.id}`);
      console.log(`   Job ID: ${assignment.jobId || 'Unknown'}`);
      console.log(`   Staff ID: ${assignment.staffId || 'Unknown'}`);
      console.log(`   Status: ${assignment.status || 'Unknown'}`);
      console.log(`   Assigned At: ${assignment.createdAt ? new Date(assignment.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
      console.log('   ──────────────────────────────────────');
    }
  });
}, (error) => {
  console.error('❌ Error monitoring assignments:', error);
});

// Show monitoring status every 30 seconds
setInterval(() => {
  console.log(`\n📊 MONITORING STATUS (${new Date().toLocaleString()})`);
  console.log(`   Jobs detected: ${jobCount}`);
  console.log(`   Assignments detected: ${assignmentCount}`);
  console.log(`   Status: ✅ Active and ready`);
  console.log('   Webapp team: Send your test jobs now!\n');
}, 30000);

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down job monitor...');
  unsubscribeJobs();
  unsubscribeAssignments();
  console.log('✅ Job monitor stopped');
  process.exit(0);
});

console.log('✅ Monitor is ready! Send your test jobs from the webapp now.');
console.log('   Press Ctrl+C to stop monitoring\n');
