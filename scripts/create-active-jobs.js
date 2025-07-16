/**
 * Create Active Jobs Script
 * Creates sample accepted jobs in Firebase for testing the Active Jobs view
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

// Sample active job data
const activeJobs = [
  {
    title: 'Kitchen Deep Clean',
    description: 'Deep clean kitchen appliances, countertops, and cabinets. Sanitize all surfaces and check for any maintenance issues.',
    type: 'cleaning',
    status: 'accepted',
    priority: 'high',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    acceptedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    scheduledDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    estimatedDuration: 180, // 3 hours
    propertyId: 'property-4',
    propertyName: 'Downtown Loft',
    location: {
      address: '321 Main Street, Apt 15B',
      city: 'Miami',
      state: 'FL',
      zipCode: '33130',
      coordinates: {
        latitude: 25.7617,
        longitude: -80.1918
      },
      specialInstructions: 'Building entrance code: 5678. Elevator to 15th floor.'
    },
    contacts: [
      {
        name: 'Emma Wilson',
        phone: '+1 (555) 234-5678',
        email: 'emma@downtownloft.com',
        role: 'property_manager'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Clean oven and stovetop',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Sanitize refrigerator interior',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Deep clean dishwasher',
        isCompleted: false
      },
      {
        id: 'req-4',
        description: 'Wipe down all cabinets',
        isCompleted: false
      }
    ],
    photos: [], // No photos yet - staff needs to upload
    specialInstructions: 'Guest has food allergies. Use only approved cleaning products.',
    tools: ['Vacuum cleaner', 'Microfiber cloths', 'All-purpose cleaner'],
    materials: ['Sanitizer', 'Degreaser', 'Glass cleaner'],
    estimatedCost: 150,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    createdBy: 'admin-user-id'
  },
  {
    title: 'Bathroom Fixture Repair',
    description: 'Fix leaky faucet in master bathroom and replace shower head. Check water pressure and ensure proper drainage.',
    type: 'maintenance',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    acceptedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
    startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    scheduledDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago (started)
    estimatedDuration: 120, // 2 hours
    propertyId: 'property-5',
    propertyName: 'Beachfront Condo',
    location: {
      address: '987 Ocean Drive, Unit 8A',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139',
      coordinates: {
        latitude: 25.7907,
        longitude: -80.1300
      },
      specialInstructions: 'Concierge will provide unit key. Water shutoff valve is in utility closet.'
    },
    contacts: [
      {
        name: 'David Chen',
        phone: '+1 (555) 345-6789',
        email: 'david@beachfrontcondo.com',
        role: 'owner'
      },
      {
        name: 'Maintenance Supervisor',
        phone: '+1 (555) 999-0000',
        email: 'maintenance@building.com',
        role: 'supervisor'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Replace faucet washers',
        isCompleted: true
      },
      {
        id: 'req-2',
        description: 'Install new shower head',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Test water pressure',
        isCompleted: false
      },
      {
        id: 'req-4',
        description: 'Check drain functionality',
        isCompleted: false
      }
    ],
    photos: [], // Staff should upload progress photos
    specialInstructions: 'Use only brass fittings. Guest checking in tomorrow evening.',
    tools: ['Wrench set', 'Plumber\'s tape', 'Pipe cutter'],
    materials: ['Faucet washers', 'Shower head', 'Plumber\'s putty'],
    estimatedCost: 85,
    notificationsEnabled: true,
    reminderSent: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdBy: 'admin-user-id'
  },
  {
    title: 'Garden Maintenance',
    description: 'Trim hedges, water plants, and clean outdoor furniture. Prepare garden area for upcoming guest event.',
    type: 'maintenance',
    status: 'accepted',
    priority: 'low',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    acceptedAt: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
    scheduledDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    estimatedDuration: 90, // 1.5 hours
    propertyId: 'property-6',
    propertyName: 'Garden Villa',
    location: {
      address: '456 Garden Lane',
      city: 'Coral Gables',
      state: 'FL',
      zipCode: '33134',
      coordinates: {
        latitude: 25.7214,
        longitude: -80.2683
      },
      specialInstructions: 'Garden tools are in the shed. Use side gate entrance.'
    },
    contacts: [
      {
        name: 'Lisa Martinez',
        phone: '+1 (555) 456-7890',
        email: 'lisa@gardenvilla.com',
        role: 'property_manager'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Trim all hedges',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Water all plants',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Clean outdoor furniture',
        isCompleted: false
      },
      {
        id: 'req-4',
        description: 'Remove any weeds',
        isCompleted: false
      }
    ],
    photos: [], // Staff needs to upload completion photos
    specialInstructions: 'Event is tomorrow afternoon. Garden must look perfect.',
    tools: ['Hedge trimmer', 'Garden hose', 'Cleaning supplies'],
    materials: ['Plant fertilizer', 'Furniture polish'],
    estimatedCost: 60,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
    createdBy: 'admin-user-id'
  }
];

async function createActiveJobs() {
  try {
    console.log('🚀 Creating active jobs in Firebase...');

    const jobsCollection = collection(db, 'jobs');
    
    for (let i = 0; i < activeJobs.length; i++) {
      const job = activeJobs[i];
      console.log(`📝 Creating active job ${i + 1}: ${job.title} (${job.status})`);
      
      const docRef = await addDoc(jobsCollection, {
        ...job,
        assignedAt: Timestamp.fromDate(job.assignedAt),
        acceptedAt: job.acceptedAt ? Timestamp.fromDate(job.acceptedAt) : null,
        startedAt: job.startedAt ? Timestamp.fromDate(job.startedAt) : null,
        scheduledDate: Timestamp.fromDate(job.scheduledDate),
        createdAt: Timestamp.fromDate(job.createdAt),
        updatedAt: Timestamp.fromDate(job.updatedAt),
      });
      console.log(`✅ Active job created with ID: ${docRef.id}`);
    }

    console.log('🎉 All active jobs created successfully!');
    console.log('\n📱 You can now test the Active Jobs view with these jobs:');
    console.log('1. Kitchen Deep Clean (Accepted - High Priority)');
    console.log('2. Bathroom Fixture Repair (In Progress - Medium Priority)');
    console.log('3. Garden Maintenance (Accepted - Low Priority)');
    console.log('\n🔍 All jobs are assigned to staff ID:', STAFF_IDS[0]);
    console.log('📅 Jobs have different schedules and statuses');
    console.log('⚡ Jobs are ready for photo upload and completion');
    console.log('🗺️  Jobs include Google Maps integration');
    console.log('📞 Jobs have contact information for staff');

  } catch (error) {
    console.error('❌ Error creating active jobs:', error);
  }
}

// Run the script
createActiveJobs();
