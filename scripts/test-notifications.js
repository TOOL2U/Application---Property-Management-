/**
 * Test Notifications Script
 * Creates a new job assignment to test real-time notifications
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOqKJGJGJGJGJGJGJGJGJGJGJGJGJGJGJG",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample staff IDs (replace with actual staff IDs from your Firebase)
const STAFF_IDS = [
  'VPPtbGl8WhMicZURHOgQ9BUzJd02', // admin@siamoon.com
  'test-staff-id-1', // staff@siamoon.com
  'test-staff-id-2', // test@example.com
];

// Test notification job data
const testJobs = [
  {
    title: '🚨 URGENT: Water Leak Emergency',
    description: 'Emergency water leak in bathroom. Immediate attention required to prevent property damage.',
    type: 'maintenance',
    status: 'pending',
    priority: 'urgent',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    estimatedDuration: 60, // 1 hour
    propertyId: 'property-emergency',
    propertyName: 'Oceanfront Penthouse - Unit 2401',
    location: {
      address: '1000 Biscayne Blvd, Unit 2401',
      city: 'Miami',
      state: 'FL',
      zipCode: '33132',
      specialInstructions: 'Emergency access code: 9999. Contact building security first.'
    },
    contacts: [
      {
        name: 'Emergency Maintenance',
        phone: '+1 (555) 911-0000',
        email: 'emergency@oceanfront.com',
        role: 'emergency_contact'
      },
      {
        name: 'Building Security',
        phone: '+1 (555) 911-0001',
        email: 'security@oceanfront.com',
        role: 'security'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Shut off water supply',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Assess damage extent',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Begin emergency repairs',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'EMERGENCY: Water is actively leaking. Shut off main water supply immediately upon arrival.',
    tools: ['Pipe wrench', 'Emergency repair kit', 'Water detector'],
    materials: ['Pipe sealant', 'Emergency patches', 'Towels'],
    estimatedCost: 200,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  },
  {
    title: 'Guest Checkout Cleaning',
    description: 'Standard post-checkout cleaning for guest departure. Prepare unit for next guest arrival.',
    type: 'cleaning',
    status: 'pending',
    priority: 'high',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    estimatedDuration: 120, // 2 hours
    propertyId: 'property-checkout',
    propertyName: 'Miami Beach Condo - Unit 15B',
    location: {
      address: '500 Collins Avenue, Unit 15B',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139',
      specialInstructions: 'Unit key available at front desk. Guest checked out at 11 AM.'
    },
    contacts: [
      {
        name: 'Front Desk',
        phone: '+1 (555) 123-4567',
        email: 'frontdesk@miamibeach.com',
        role: 'front_desk'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Deep clean all rooms',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Replace linens and towels',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Restock amenities',
        isCompleted: false
      },
      {
        id: 'req-4',
        description: 'Final inspection',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'Next guest arrives at 4 PM. Unit must be ready by 3:30 PM.',
    tools: ['Vacuum cleaner', 'Cleaning supplies', 'Fresh linens'],
    materials: ['All-purpose cleaner', 'Bathroom cleaner', 'Amenities'],
    estimatedCost: 100,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  },
  {
    title: 'Routine Property Inspection',
    description: 'Weekly property inspection to ensure everything is in good condition.',
    type: 'inspection',
    status: 'pending',
    priority: 'medium',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    estimatedDuration: 45, // 45 minutes
    propertyId: 'property-inspection',
    propertyName: 'Downtown Loft - Studio A',
    location: {
      address: '200 Biscayne Boulevard, Studio A',
      city: 'Miami',
      state: 'FL',
      zipCode: '33131',
      specialInstructions: 'Property is currently vacant. Use master key.'
    },
    contacts: [
      {
        name: 'Property Manager',
        phone: '+1 (555) 987-6543',
        email: 'manager@downtownloft.com',
        role: 'property_manager'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Check all appliances',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Inspect plumbing',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Test electrical systems',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'Take photos of any issues found during inspection.',
    tools: ['Inspection checklist', 'Camera', 'Flashlight'],
    materials: [],
    estimatedCost: 0,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  }
];

async function createTestNotificationJob(jobIndex = 0) {
  try {
    if (jobIndex >= testJobs.length) {
      console.log('❌ Invalid job index. Available jobs: 0-' + (testJobs.length - 1));
      return;
    }

    const job = testJobs[jobIndex];
    console.log(`🔔 Creating test notification job: ${job.title}`);
    console.log(`📱 Priority: ${job.priority.toUpperCase()}`);
    console.log(`👤 Assigned to: ${job.assignedTo}`);

    const jobsCollection = collection(db, 'jobs');
    const docRef = await addDoc(jobsCollection, job);
    
    console.log(`✅ Test job created with ID: ${docRef.id}`);
    console.log('\n🎯 This should trigger a real-time notification in the mobile app!');
    console.log(`📲 Expected notification type: ${job.priority === 'urgent' ? 'MODAL' : 'BANNER'}`);
    console.log(`⏰ Scheduled for: ${new Date(job.scheduledDate).toLocaleString()}`);
    console.log(`🏠 Property: ${job.propertyName}`);

  } catch (error) {
    console.error('❌ Error creating test notification job:', error);
  }
}

async function createAllTestJobs() {
  try {
    console.log('🚀 Creating all test notification jobs...');

    for (let i = 0; i < testJobs.length; i++) {
      await createTestNotificationJob(i);
      console.log('---');
      
      // Wait 2 seconds between jobs to see notifications clearly
      if (i < testJobs.length - 1) {
        console.log('⏳ Waiting 2 seconds before next job...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('🎉 All test notification jobs created!');
    console.log('\n📱 Check your mobile app for real-time notifications:');
    console.log('1. 🚨 URGENT job should show a MODAL notification');
    console.log('2. 🔥 HIGH priority job should show a BANNER notification');
    console.log('3. 📋 MEDIUM priority job should show a BANNER notification');

  } catch (error) {
    console.error('❌ Error creating test jobs:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const jobIndex = parseInt(args[1]) || 0;

if (command === 'single') {
  createTestNotificationJob(jobIndex);
} else if (command === 'all') {
  createAllTestJobs();
} else {
  console.log('📋 Usage:');
  console.log('  node scripts/test-notifications.js single [jobIndex]  - Create single test job');
  console.log('  node scripts/test-notifications.js all               - Create all test jobs');
  console.log('\n📝 Available test jobs:');
  testJobs.forEach((job, index) => {
    console.log(`  ${index}: ${job.title} (${job.priority.toUpperCase()})`);
  });
}
