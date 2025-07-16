/**
 * Create Sample Jobs Script
 * Creates sample jobs in Firebase for testing the staff dashboard
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

// Sample job data
const sampleJobs = [
  {
    title: 'Pool Cleaning Service',
    description: 'Clean pool, check chemical levels, and maintain equipment. Ensure water is crystal clear for guest arrival.',
    type: 'cleaning',
    status: 'pending',
    priority: 'high',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    estimatedDuration: 120, // 2 hours
    propertyId: 'property-1',
    propertyName: 'Ocean View Villa',
    location: {
      address: '123 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139',
      specialInstructions: 'Use pool gate code: 1234'
    },
    contacts: [
      {
        name: 'John Smith',
        phone: '+1 (555) 123-4567',
        email: 'john@oceanview.com',
        role: 'property_manager'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Test water pH levels',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Clean pool filters',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Vacuum pool floor',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'Guest checking in tomorrow morning. Pool must be ready by 8 AM.',
    tools: ['Pool vacuum', 'Chemical test kit', 'Pool net'],
    materials: ['Chlorine', 'pH adjuster'],
    estimatedCost: 75,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  },
  {
    title: 'HVAC Maintenance Check',
    description: 'Perform routine maintenance on HVAC system. Check filters, clean vents, and test temperature control.',
    type: 'maintenance',
    status: 'pending',
    priority: 'medium',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    estimatedDuration: 90, // 1.5 hours
    propertyId: 'property-2',
    propertyName: 'Sunset Beach House',
    location: {
      address: '456 Sunset Boulevard',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33140',
      specialInstructions: 'HVAC unit is on the roof. Use ladder in garage.'
    },
    contacts: [
      {
        name: 'Sarah Johnson',
        phone: '+1 (555) 987-6543',
        email: 'sarah@sunsetbeach.com',
        role: 'owner'
      }
    ],
    requirements: [
      {
        id: 'req-1',
        description: 'Replace air filters',
        isCompleted: false
      },
      {
        id: 'req-2',
        description: 'Clean air vents',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Test thermostat functionality',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'System has been making unusual noises. Please investigate.',
    tools: ['Screwdriver set', 'Vacuum cleaner', 'Ladder'],
    materials: ['Air filters', 'Cleaning supplies'],
    estimatedCost: 120,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  },
  {
    title: 'Property Inspection',
    description: 'Conduct thorough property inspection before guest arrival. Check all amenities and report any issues.',
    type: 'inspection',
    status: 'pending',
    priority: 'urgent',
    assignedTo: STAFF_IDS[0],
    assignedBy: 'admin-user-id',
    assignedAt: serverTimestamp(),
    scheduledDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    estimatedDuration: 60, // 1 hour
    propertyId: 'property-3',
    propertyName: 'Luxury Penthouse Suite',
    location: {
      address: '789 Collins Avenue',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33141',
      specialInstructions: 'Penthouse access requires special elevator key from concierge.'
    },
    contacts: [
      {
        name: 'Michael Brown',
        phone: '+1 (555) 456-7890',
        email: 'michael@luxurysuites.com',
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
        description: 'Test WiFi connectivity',
        isCompleted: false
      },
      {
        id: 'req-3',
        description: 'Verify cleanliness standards',
        isCompleted: false
      },
      {
        id: 'req-4',
        description: 'Check amenities (towels, toiletries, etc.)',
        isCompleted: false
      }
    ],
    photos: [],
    specialInstructions: 'VIP guest arriving tonight. Everything must be perfect.',
    tools: ['Inspection checklist', 'Camera', 'WiFi tester'],
    materials: [],
    estimatedCost: 0,
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-user-id'
  }
];

async function createSampleJobs() {
  try {
    console.log('🚀 Creating sample jobs in Firebase...');

    const jobsCollection = collection(db, 'jobs');
    
    for (let i = 0; i < sampleJobs.length; i++) {
      const job = sampleJobs[i];
      console.log(`📝 Creating job ${i + 1}: ${job.title}`);
      
      const docRef = await addDoc(jobsCollection, job);
      console.log(`✅ Job created with ID: ${docRef.id}`);
    }

    console.log('🎉 All sample jobs created successfully!');
    console.log('\n📱 You can now test the staff dashboard with these jobs:');
    console.log('1. Pool Cleaning Service (High Priority)');
    console.log('2. HVAC Maintenance Check (Medium Priority)');
    console.log('3. Property Inspection (Urgent Priority)');
    console.log('\n🔍 All jobs are assigned to staff ID:', STAFF_IDS[0]);
    console.log('📅 Jobs are scheduled at different times in the future');
    console.log('⚡ Jobs have status "pending" and can be accepted/declined');

  } catch (error) {
    console.error('❌ Error creating sample jobs:', error);
  }
}

// Run the script
createSampleJobs();
