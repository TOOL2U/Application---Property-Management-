const admin = require('firebase-admin');

/**
 * TestJobService - Utility for creating test jobs with proper userId fields
 * Used to verify mobile app integration after staff accounts are linked
 */

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.log('⚠️  Using default Firebase Admin configuration');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

class TestJobService {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Create test job for staff member with userId verification
   */
  async createTestJobForStaff(staffId, customData = {}) {
    try {
      // Get staff data to verify userId exists
      const staffDoc = await this.db.collection('staff_accounts').doc(staffId).get();
      
      if (!staffDoc.exists) {
        throw new Error(`Staff document ${staffId} not found`);
      }

      const staffData = staffDoc.data();
      
      if (!staffData.userId) {
        throw new Error(`Staff ${staffData.displayName} has no userId field. Run staff-fix.js first.`);
      }

      const testJob = {
        title: `Test Job for ${staffData.displayName}`,
        description: `Mobile app integration test job for ${staffData.displayName}. If you can see this job in the mobile app, the integration is working correctly.`,
        
        // CRITICAL FIELDS for mobile app
        userId: staffData.userId,        // Firebase Auth UID - for mobile app queries
        assignedStaffId: staffId,        // Staff document ID - for web app
        
        // Standard job fields
        status: 'pending',
        priority: 'medium',
        type: staffData.role || 'general',
        
        location: {
          address: 'Test Property, Bangkok, Thailand',
          coordinates: {
            latitude: 13.7563,
            longitude: 100.5018
          }
        },
        
        estimatedDuration: 120, // 2 hours
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        
        // Metadata
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'test-job-service',
        isTestJob: true, // Mark for easy identification/cleanup
        
        // Override with custom data
        ...customData
      };

      const jobRef = await this.db.collection('jobs').add(testJob);
      
      console.log(`✅ Created test job ${jobRef.id} for ${staffData.displayName}`);
      console.log(`📱 Staff should see this job in mobile app with email: ${staffData.email}`);
      
      return {
        jobId: jobRef.id,
        staffData: {
          id: staffId,
          email: staffData.email,
          displayName: staffData.displayName,
          userId: staffData.userId
        }
      };
      
    } catch (error) {
      console.error(`❌ Error creating test job for staff ${staffId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create test jobs for all staff with userIds
   */
  async createTestJobsForAllStaff() {
    try {
      const staffSnapshot = await this.db.collection('staff_accounts')
        .where('userId', '!=', null)
        .get();

      if (staffSnapshot.empty) {
        throw new Error('No staff accounts have userId fields. Run staff-fix.js first.');
      }

      const results = [];
      
      for (const staffDoc of staffSnapshot.docs) {
        const staffData = staffDoc.data();
        
        try {
          const result = await this.createTestJobForStaff(staffDoc.id, {
            title: `Test Job - ${staffData.displayName}`,
            description: `Verification job for mobile app integration test`
          });
          
          results.push({ success: true, ...result });
          
          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          results.push({ 
            success: false, 
            staffId: staffDoc.id, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`\n📊 Test Job Creation Summary:`);
      console.log(`✅ Successfully created: ${successCount} test jobs`);
      console.log(`❌ Failed: ${failureCount} jobs`);

      return results;
      
    } catch (error) {
      console.error('❌ Error creating test jobs for all staff:', error.message);
      throw error;
    }
  }

  /**
   * Verify staff account has proper userId field
   */
  async verifyStaffUserId(staffId) {
    try {
      const staffDoc = await this.db.collection('staff_accounts').doc(staffId).get();
      
      if (!staffDoc.exists) {
        return { valid: false, error: 'Staff document not found' };
      }

      const staffData = staffDoc.data();
      
      if (!staffData.userId) {
        return { 
          valid: false, 
          error: 'No userId field',
          staffData: {
            email: staffData.email,
            displayName: staffData.displayName
          }
        };
      }

      // Verify Firebase Auth account exists
      try {
        await admin.auth().getUser(staffData.userId);
        
        return {
          valid: true,
          staffData: {
            id: staffId,
            email: staffData.email,
            displayName: staffData.displayName,
            userId: staffData.userId
          }
        };
        
      } catch (authError) {
        return {
          valid: false,
          error: 'Firebase Auth account not found',
          userId: staffData.userId
        };
      }
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get all staff verification status
   */
  async getStaffVerificationStatus() {
    try {
      const staffSnapshot = await this.db.collection('staff_accounts').get();
      
      const verificationResults = [];
      
      for (const staffDoc of staffSnapshot.docs) {
        const verification = await this.verifyStaffUserId(staffDoc.id);
        verificationResults.push({
          staffId: staffDoc.id,
          ...verification
        });
      }

      const validCount = verificationResults.filter(r => r.valid).length;
      const invalidCount = verificationResults.filter(r => !r.valid).length;

      console.log(`\n📊 Staff Verification Summary:`);
      console.log(`✅ Valid (has userId + Firebase Auth): ${validCount}`);
      console.log(`❌ Invalid (missing userId or Auth): ${invalidCount}`);
      console.log(`📝 Total staff accounts: ${verificationResults.length}`);

      return verificationResults;
      
    } catch (error) {
      console.error('❌ Error verifying staff status:', error.message);
      throw error;
    }
  }

  /**
   * Clean up test jobs
   */
  async cleanupTestJobs() {
    try {
      const testJobsSnapshot = await this.db.collection('jobs')
        .where('isTestJob', '==', true)
        .get();

      if (testJobsSnapshot.empty) {
        console.log('ℹ️  No test jobs found to clean up');
        return 0;
      }

      const batch = this.db.batch();
      
      testJobsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`✅ Cleaned up ${testJobsSnapshot.size} test jobs`);
      return testJobsSnapshot.size;
      
    } catch (error) {
      console.error('❌ Error cleaning up test jobs:', error.message);
      throw error;
    }
  }

  /**
   * Get jobs for specific staff (mobile app simulation)
   */
  async getJobsForStaff(userId) {
    try {
      const jobsSnapshot = await this.db.collection('jobs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const jobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`📱 Found ${jobs.length} jobs for userId: ${userId}`);
      
      return jobs;
      
    } catch (error) {
      console.error(`❌ Error getting jobs for userId ${userId}:`, error.message);
      throw error;
    }
  }
}

// CLI usage if run directly
if (require.main === module) {
  const testService = new TestJobService();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'verify-all':
      testService.getStaffVerificationStatus();
      break;
      
    case 'create-test-jobs':
      testService.createTestJobsForAllStaff();
      break;
      
    case 'cleanup':
      testService.cleanupTestJobs();
      break;
      
    case 'verify-staff':
      if (args[1]) {
        testService.verifyStaffUserId(args[1]);
      } else {
        console.log('Usage: node TestJobService.js verify-staff <staffId>');
      }
      break;
      
    case 'get-jobs':
      if (args[1]) {
        testService.getJobsForStaff(args[1]);
      } else {
        console.log('Usage: node TestJobService.js get-jobs <userId>');
      }
      break;
      
    default:
      console.log('Available commands:');
      console.log('  verify-all      - Check all staff userId status');
      console.log('  create-test-jobs - Create test jobs for all valid staff');
      console.log('  cleanup         - Remove all test jobs');
      console.log('  verify-staff <id> - Check specific staff userId');
      console.log('  get-jobs <userId> - Get jobs for specific user (mobile simulation)');
  }
}

export default TestJobService;
