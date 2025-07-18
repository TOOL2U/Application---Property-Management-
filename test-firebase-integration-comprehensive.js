/**
 * Comprehensive Firebase Integration Test
 * 
 * This script tests the complete Firebase integration as documented
 * in the Firebase integration documentation, including:
 * - Firebase project configuration
 * - Staff account authentication 
 * - Notification system
 * - Job assignment integration
 * - Real-time listeners
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc, onSnapshot } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Firebase configuration for operty-b54dc project
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe",
  measurementId: "G-R1PELW8B8Q"
};

class FirebaseIntegrationTest {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.testResults = {
      projectConnection: false,
      staffAccountsCollection: false,
      notificationsCollection: false,
      jobsCollection: false,
      jobAssignmentsCollection: false,
      authentication: false,
      realTimeListeners: false,
      testStaffAccount: false,
      testFirebaseUID: null,
      errors: []
    };
  }

  async initialize() {
    try {
      console.log('🔥 Initializing Firebase for integration test...');
      
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      
      console.log('✅ Firebase initialized successfully');
      this.testResults.projectConnection = true;
      
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.testResults.errors.push(`Firebase initialization: ${error.message}`);
    }
  }

  async testAuthentication() {
    try {
      console.log('🔐 Testing Firebase Authentication...');
      
      const userCredential = await signInAnonymously(this.auth);
      const user = userCredential.user;
      
      if (user && user.uid) {
        console.log('✅ Authentication successful, user UID:', user.uid);
        this.testResults.authentication = true;
        this.testResults.testFirebaseUID = user.uid;
      } else {
        throw new Error('Authentication failed - no user returned');
      }
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      this.testResults.errors.push(`Authentication: ${error.message}`);
    }
  }

  async testStaffAccountsCollection() {
    try {
      console.log('👥 Testing staff_accounts collection...');
      
      const staffCollection = collection(this.db, 'staff_accounts');
      const staffSnapshot = await getDocs(staffCollection);
      
      console.log(`📊 Found ${staffSnapshot.size} documents in staff_accounts collection`);
      
      if (staffSnapshot.size > 0) {
        this.testResults.staffAccountsCollection = true;
        
        // Look for test staff account
        const testStaffQuery = query(
          staffCollection,
          where('email', '==', 'staff@siamoon.com')
        );
        const testStaffSnapshot = await getDocs(testStaffQuery);
        
        if (!testStaffSnapshot.empty) {
          const testStaffDoc = testStaffSnapshot.docs[0];
          const testStaffData = testStaffDoc.data();
          
          console.log('✅ Test staff account found:', {
            id: testStaffDoc.id,
            email: testStaffData.email,
            name: testStaffData.name,
            firebaseUid: testStaffData.firebaseUid
          });
          
          this.testResults.testStaffAccount = true;
          
          // Verify Firebase UID matches expected value
          const expectedUID = 'gTtR5gSKOtUEweLwchSnVreylMy1';
          if (testStaffData.firebaseUid === expectedUID || testStaffDoc.id === expectedUID) {
            console.log('✅ Test staff Firebase UID matches expected value');
          } else {
            console.log('⚠️ Test staff Firebase UID mismatch:');
            console.log('  Expected:', expectedUID);
            console.log('  Found firebaseUid:', testStaffData.firebaseUid);
            console.log('  Found doc ID:', testStaffDoc.id);
          }
        } else {
          console.log('⚠️ Test staff account (staff@siamoon.com) not found');
        }
        
        // Log sample staff account structure
        const firstDoc = staffSnapshot.docs[0];
        const firstDocData = firstDoc.data();
        console.log('📋 Sample staff account structure:', {
          id: firstDoc.id,
          fields: Object.keys(firstDocData),
          sampleData: {
            email: firstDocData.email,
            name: firstDocData.name,
            role: firstDocData.role,
            firebaseUid: firstDocData.firebaseUid,
            isActive: firstDocData.isActive
          }
        });
      } else {
        throw new Error('No documents found in staff_accounts collection');
      }
      
    } catch (error) {
      console.error('❌ Staff accounts collection test failed:', error);
      this.testResults.errors.push(`Staff accounts: ${error.message}`);
    }
  }

  async testNotificationsCollection() {
    try {
      console.log('🔔 Testing staff_notifications collection...');
      
      const notificationsCollection = collection(this.db, 'staff_notifications');
      const notificationsSnapshot = await getDocs(notificationsCollection);
      
      console.log(`📊 Found ${notificationsSnapshot.size} documents in staff_notifications collection`);
      
      if (notificationsSnapshot.size > 0) {
        this.testResults.notificationsCollection = true;
        
        // Log sample notification structure
        const firstDoc = notificationsSnapshot.docs[0];
        const firstDocData = firstDoc.data();
        console.log('📋 Sample notification structure:', {
          id: firstDoc.id,
          fields: Object.keys(firstDocData),
          sampleData: {
            userId: firstDocData.userId,
            type: firstDocData.type,
            title: firstDocData.title,
            message: firstDocData.message,
            read: firstDocData.read,
            timestamp: firstDocData.timestamp?.toDate?.() || firstDocData.timestamp
          }
        });
        
        // Test querying by userId
        const testUserId = 'gTtR5gSKOtUEweLwchSnVreylMy1';
        const userNotificationsQuery = query(
          notificationsCollection,
          where('userId', '==', testUserId)
        );
        const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
        
        console.log(`📊 Found ${userNotificationsSnapshot.size} notifications for test user ${testUserId}`);
        
      } else {
        console.log('⚠️ No notifications found in staff_notifications collection');
        this.testResults.notificationsCollection = true; // Still valid if empty
      }
      
    } catch (error) {
      console.error('❌ Notifications collection test failed:', error);
      this.testResults.errors.push(`Notifications: ${error.message}`);
    }
  }

  async testJobsCollection() {
    try {
      console.log('💼 Testing jobs collection...');
      
      const jobsCollection = collection(this.db, 'jobs');
      const jobsSnapshot = await getDocs(jobsCollection);
      
      console.log(`📊 Found ${jobsSnapshot.size} documents in jobs collection`);
      
      if (jobsSnapshot.size > 0) {
        this.testResults.jobsCollection = true;
        
        // Log sample job structure
        const firstDoc = jobsSnapshot.docs[0];
        const firstDocData = firstDoc.data();
        console.log('📋 Sample job structure:', {
          id: firstDoc.id,
          fields: Object.keys(firstDocData),
          sampleData: {
            title: firstDocData.title,
            description: firstDocData.description,
            assignedStaffId: firstDocData.assignedStaffId,
            status: firstDocData.status,
            jobType: firstDocData.jobType,
            priority: firstDocData.priority,
            location: firstDocData.location,
            createdAt: firstDocData.createdAt?.toDate?.() || firstDocData.createdAt
          }
        });
        
        // Test querying by assignedStaffId
        const testStaffId = 'gTtR5gSKOtUEweLwchSnVreylMy1';
        const staffJobsQuery = query(
          jobsCollection,
          where('assignedStaffId', '==', testStaffId)
        );
        const staffJobsSnapshot = await getDocs(staffJobsQuery);
        
        console.log(`📊 Found ${staffJobsSnapshot.size} jobs assigned to test staff ${testStaffId}`);
        
        if (staffJobsSnapshot.size > 0) {
          staffJobsSnapshot.forEach((doc, index) => {
            const jobData = doc.data();
            console.log(`  Job ${index + 1}: ${jobData.title} (${jobData.status})`);
          });
        }
        
      } else {
        console.log('⚠️ No jobs found in jobs collection');
        this.testResults.jobsCollection = true; // Still valid if empty
      }
      
    } catch (error) {
      console.error('❌ Jobs collection test failed:', error);
      this.testResults.errors.push(`Jobs: ${error.message}`);
    }
  }

  async testJobAssignmentsCollection() {
    try {
      console.log('📋 Testing job_assignments collection...');
      
      const jobAssignmentsCollection = collection(this.db, 'job_assignments');
      const jobAssignmentsSnapshot = await getDocs(jobAssignmentsCollection);
      
      console.log(`📊 Found ${jobAssignmentsSnapshot.size} documents in job_assignments collection`);
      
      if (jobAssignmentsSnapshot.size > 0) {
        this.testResults.jobAssignmentsCollection = true;
        
        // Log sample job assignment structure
        const firstDoc = jobAssignmentsSnapshot.docs[0];
        const firstDocData = firstDoc.data();
        console.log('📋 Sample job assignment structure:', {
          id: firstDoc.id,
          fields: Object.keys(firstDocData),
          sampleData: {
            staffId: firstDocData.staffId,
            title: firstDocData.title,
            status: firstDocData.status,
            type: firstDocData.type,
            priority: firstDocData.priority,
            assignedAt: firstDocData.assignedAt?.toDate?.() || firstDocData.assignedAt,
            scheduledFor: firstDocData.scheduledFor?.toDate?.() || firstDocData.scheduledFor
          }
        });
        
      } else {
        console.log('⚠️ No job assignments found in job_assignments collection');
        this.testResults.jobAssignmentsCollection = true; // Still valid if empty
      }
      
    } catch (error) {
      console.error('❌ Job assignments collection test failed:', error);
      this.testResults.errors.push(`Job assignments: ${error.message}`);
    }
  }

  async testRealTimeListeners() {
    try {
      console.log('🔄 Testing real-time listeners...');
      
      let listenerWorks = false;
      
      // Test notifications listener
      const testUserId = 'gTtR5gSKOtUEweLwchSnVreylMy1';
      const notificationsQuery = query(
        collection(this.db, 'staff_notifications'),
        where('userId', '==', testUserId)
      );
      
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        console.log('🔄 Real-time listener triggered:', snapshot.size, 'notifications');
        listenerWorks = true;
      }, (error) => {
        console.error('❌ Real-time listener error:', error);
      });
      
      // Wait a moment for the listener to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (listenerWorks) {
        console.log('✅ Real-time listeners working');
        this.testResults.realTimeListeners = true;
      }
      
      // Clean up listener
      unsubscribe();
      
    } catch (error) {
      console.error('❌ Real-time listeners test failed:', error);
      this.testResults.errors.push(`Real-time listeners: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting comprehensive Firebase integration test...\n');
    
    await this.initialize();
    
    if (this.testResults.projectConnection) {
      await this.testAuthentication();
      await this.testStaffAccountsCollection();
      await this.testNotificationsCollection(); 
      await this.testJobsCollection();
      await this.testJobAssignmentsCollection();
      await this.testRealTimeListeners();
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 Firebase Integration Test Results:');
    console.log('=====================================');
    
    const tests = [
      { name: 'Project Connection', result: this.testResults.projectConnection },
      { name: 'Authentication', result: this.testResults.authentication },
      { name: 'Staff Accounts Collection', result: this.testResults.staffAccountsCollection },
      { name: 'Notifications Collection', result: this.testResults.notificationsCollection },
      { name: 'Jobs Collection', result: this.testResults.jobsCollection },
      { name: 'Job Assignments Collection', result: this.testResults.jobAssignmentsCollection },
      { name: 'Real-time Listeners', result: this.testResults.realTimeListeners },
      { name: 'Test Staff Account', result: this.testResults.testStaffAccount }
    ];
    
    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
    });
    
    const passCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;
    
    console.log(`\n📈 Overall: ${passCount}/${totalCount} tests passed`);
    
    if (this.testResults.testFirebaseUID) {
      console.log(`🔑 Test Firebase UID: ${this.testResults.testFirebaseUID}`);
    }
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.testResults.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    if (passCount === totalCount) {
      console.log('\n🎉 All Firebase integration tests passed! Mobile app should work with webapp integration.');
    } else {
      console.log('\n⚠️ Some tests failed. Check Firebase configuration and project setup.');
    }
  }
}

// Run the test
const test = new FirebaseIntegrationTest();
test.runAllTests().catch(console.error);

module.exports = FirebaseIntegrationTest;
