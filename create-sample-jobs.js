/**
 * Create Sample Jobs for Testing
 * Adds sample job data to Firebase Firestore for testing the mobile app
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw",
  authDomain: "operty-b54dc.firebaseapp.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "914547669275",
  appId: "1:914547669275:web:0897d32d59b17134a53bbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createSampleJobs() {
  console.log('🏗️ Creating sample jobs for testing...');
  console.log('=' .repeat(50));

  try {
    // First, get the staff user ID for test@example.com
    const staffAccountsRef = collection(db, 'staff_accounts');
    const staffQuery = query(staffAccountsRef, where('email', '==', 'test@example.com'));
    const staffSnapshot = await getDocs(staffQuery);
    
    if (staffSnapshot.empty) {
      console.log('❌ Staff user test@example.com not found');
      console.log('💡 Please create a staff account first');
      return;
    }

    const staffUser = staffSnapshot.docs[0];
    const staffUserId = staffUser.id;
    const staffData = staffUser.data();
    
    console.log(`✅ Found staff user: ${staffData.name} (${staffData.email})`);
    console.log(`📋 Staff ID: ${staffUserId}`);

    // Sample jobs data
    const sampleJobs = [
      {
        title: 'Deep Clean Apartment 2B',
        description: 'Complete deep cleaning of 2-bedroom apartment including kitchen, bathrooms, and all living areas. Pay special attention to baseboards and windows.',
        type: 'cleaning',
        status: 'assigned',
        priority: 'high',
        assignedTo: staffUserId,
        assignedBy: 'admin_user_id',
        assignedAt: serverTimestamp(),
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedDuration: 180, // 3 hours
        propertyId: 'property_001',
        location: {
          address: '123 Main Street, Apt 2B',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194
          },
          accessCodes: {
            gate: '1234',
            door: '5678'
          },
          specialInstructions: 'Ring doorbell twice. Tenant will be present during cleaning.'
        },
        contacts: [
          {
            name: 'Sarah Johnson',
            phone: '+1-555-0123',
            email: 'sarah.johnson@email.com',
            role: 'tenant',
            preferredContactMethod: 'phone'
          }
        ],
        requirements: [
          {
            id: 'req_001',
            description: 'Clean all windows inside and out',
            isCompleted: false
          },
          {
            id: 'req_002',
            description: 'Deep clean kitchen appliances',
            isCompleted: false
          },
          {
            id: 'req_003',
            description: 'Sanitize all bathrooms',
            isCompleted: false
          }
        ],
        photos: [],
        specialInstructions: 'Use eco-friendly cleaning products only. Tenant has allergies.',
        tools: ['vacuum', 'mop', 'cleaning supplies'],
        materials: ['eco-friendly detergent', 'microfiber cloths'],
        estimatedCost: 150,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin_user_id',
        notificationsEnabled: true,
        reminderSent: false
      },
      {
        title: 'Fix Leaky Faucet - Kitchen',
        description: 'Repair dripping kitchen faucet in unit 4A. Tenant reports constant dripping that started 3 days ago.',
        type: 'maintenance',
        status: 'assigned',
        priority: 'medium',
        assignedTo: staffUserId,
        assignedBy: 'admin_user_id',
        assignedAt: serverTimestamp(),
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        estimatedDuration: 60, // 1 hour
        propertyId: 'property_002',
        location: {
          address: '456 Oak Avenue, Unit 4A',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103',
          coordinates: {
            latitude: 37.7849,
            longitude: -122.4094
          },
          accessCodes: {
            gate: '9876',
            door: '4321'
          },
          specialInstructions: 'Tenant works from home. Please call before arriving.'
        },
        contacts: [
          {
            name: 'Mike Chen',
            phone: '+1-555-0456',
            email: 'mike.chen@email.com',
            role: 'tenant',
            preferredContactMethod: 'text'
          }
        ],
        requirements: [
          {
            id: 'req_004',
            description: 'Inspect faucet and identify leak source',
            isCompleted: false
          },
          {
            id: 'req_005',
            description: 'Replace worn parts as needed',
            isCompleted: false
          },
          {
            id: 'req_006',
            description: 'Test faucet operation after repair',
            isCompleted: false
          }
        ],
        photos: [],
        specialInstructions: 'Check water pressure after repair. Tenant mentioned low pressure.',
        tools: ['wrench set', 'plumber\'s tape', 'flashlight'],
        materials: ['faucet washers', 'O-rings'],
        estimatedCost: 75,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin_user_id',
        notificationsEnabled: true,
        reminderSent: false
      },
      {
        title: 'Property Inspection - Monthly',
        description: 'Conduct monthly property inspection for building maintenance and safety compliance.',
        type: 'inspection',
        status: 'assigned',
        priority: 'low',
        assignedTo: staffUserId,
        assignedBy: 'admin_user_id',
        assignedAt: serverTimestamp(),
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedDuration: 120, // 2 hours
        propertyId: 'property_003',
        location: {
          address: '789 Pine Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94104',
          coordinates: {
            latitude: 37.7949,
            longitude: -122.3994
          },
          specialInstructions: 'Full building inspection. Start with common areas.'
        },
        contacts: [
          {
            name: 'Property Manager',
            phone: '+1-555-0789',
            email: 'manager@property.com',
            role: 'property_manager',
            preferredContactMethod: 'email'
          }
        ],
        requirements: [
          {
            id: 'req_007',
            description: 'Check all common area lighting',
            isCompleted: false
          },
          {
            id: 'req_008',
            description: 'Inspect fire safety equipment',
            isCompleted: false
          },
          {
            id: 'req_009',
            description: 'Document any maintenance needs',
            isCompleted: false
          }
        ],
        photos: [],
        specialInstructions: 'Take photos of any issues found. Submit report within 24 hours.',
        tools: ['flashlight', 'measuring tape', 'camera'],
        materials: [],
        estimatedCost: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin_user_id',
        notificationsEnabled: true,
        reminderSent: false
      }
    ];

    // Add jobs to Firestore
    const jobsRef = collection(db, 'jobs');
    const createdJobs = [];

    for (let i = 0; i < sampleJobs.length; i++) {
      const job = sampleJobs[i];
      console.log(`\n📝 Creating job ${i + 1}: ${job.title}`);
      
      const docRef = await addDoc(jobsRef, job);
      createdJobs.push({ id: docRef.id, ...job });
      
      console.log(`✅ Job created with ID: ${docRef.id}`);
      console.log(`   Type: ${job.type}`);
      console.log(`   Priority: ${job.priority}`);
      console.log(`   Scheduled: ${job.scheduledDate.toDate ? 'Server timestamp' : job.scheduledDate.toLocaleString()}`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Sample jobs created successfully!');
    console.log(`📊 Total jobs created: ${createdJobs.length}`);
    
    console.log('\n📱 TESTING INSTRUCTIONS:');
    console.log('1. Login to the mobile app with: test@example.com');
    console.log('2. Check the Dashboard for pending jobs');
    console.log('3. Navigate to Jobs tab to see all assigned jobs');
    console.log('4. Accept jobs from the Dashboard');
    console.log('5. Start and complete jobs with photo uploads');
    
    console.log('\n🎭 ROLE-BASED TESTING:');
    console.log('• Staff users will see only Dashboard, Jobs, and Profile tabs');
    console.log('• Admin users will see all tabs including Properties, Schedule, etc.');
    console.log('• Test with both admin@siamoon.com (admin) and test@example.com (manager)');

  } catch (error) {
    console.error('❌ Error creating sample jobs:', error);
  }
}

// Run the script
createSampleJobs().catch(console.error);
