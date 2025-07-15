// Script to seed Firebase with test data for admin system
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../types/admin';

// Sample admin user data
const sampleAdminUser = {
  email: 'admin@siamoon.com',
  role: 'admin',
  displayName: 'Admin User',
  createdAt: new Date(),
  lastLogin: new Date(),
  permissions: [
    {
      resource: 'bookings',
      actions: ['read', 'write', 'approve'],
    },
    {
      resource: 'staff',
      actions: ['read', 'write'],
    },
    {
      resource: 'tasks',
      actions: ['read', 'write'],
    },
  ],
};

// Sample booking data
const sampleBookings = [
  {
    guestName: 'John Smith',
    guestEmail: 'john.smith@email.com',
    guestPhone: '+1-555-0123',
    propertyId: 'prop-001',
    propertyName: 'Luxury Villa Sunset',
    checkIn: new Date('2024-01-15'),
    checkOut: new Date('2024-01-20'),
    guests: 4,
    totalAmount: 2500,
    status: 'pending',
    paymentStatus: 'pending',
    specialRequests: 'Late check-in requested',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    guestName: 'Sarah Johnson',
    guestEmail: 'sarah.johnson@email.com',
    guestPhone: '+1-555-0456',
    propertyId: 'prop-002',
    propertyName: 'Modern Apartment Downtown',
    checkIn: new Date('2024-01-18'),
    checkOut: new Date('2024-01-22'),
    guests: 2,
    totalAmount: 1200,
    status: 'approved',
    paymentStatus: 'paid',
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedBy: 'admin-uid',
    approvedAt: new Date(),
  },
  {
    guestName: 'Michael Brown',
    guestEmail: 'michael.brown@email.com',
    guestPhone: '+1-555-0789',
    propertyId: 'prop-003',
    propertyName: 'Cozy Beach House',
    checkIn: new Date('2024-01-25'),
    checkOut: new Date('2024-01-30'),
    guests: 6,
    totalAmount: 3200,
    status: 'pending',
    paymentStatus: 'pending',
    specialRequests: 'Pet-friendly accommodation needed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Sample staff data
const sampleStaff = [
  {
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@siamoon.com',
    phone: '+1-555-1001',
    role: 'cleaner',
    isActive: true,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    skills: ['deep cleaning', 'laundry', 'maintenance'],
    rating: 4.8,
    completedTasks: 156,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@siamoon.com',
    phone: '+1-555-1002',
    role: 'maintenance',
    isActive: true,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    skills: ['plumbing', 'electrical', 'carpentry'],
    rating: 4.9,
    completedTasks: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'David Kim',
    email: 'david.kim@siamoon.com',
    phone: '+1-555-1003',
    role: 'concierge',
    isActive: true,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    },
    skills: ['guest relations', 'local knowledge', 'problem solving'],
    rating: 4.7,
    completedTasks: 234,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Sample property data
const sampleProperties = [
  {
    name: 'Luxury Villa Sunset',
    address: '123 Ocean Drive, Miami Beach, FL 33139',
    type: 'villa',
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    amenities: ['pool', 'ocean view', 'wifi', 'parking', 'kitchen'],
    images: ['villa1.jpg', 'villa2.jpg', 'villa3.jpg'],
    pricePerNight: 500,
    isActive: true,
    description: 'Stunning luxury villa with panoramic ocean views',
    rules: ['No smoking', 'No pets', 'Quiet hours 10pm-8am'],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Modern Apartment Downtown',
    address: '456 City Center Blvd, Miami, FL 33130',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    amenities: ['wifi', 'parking', 'kitchen', 'gym', 'pool'],
    images: ['apt1.jpg', 'apt2.jpg'],
    pricePerNight: 300,
    isActive: true,
    description: 'Modern apartment in the heart of downtown',
    rules: ['No smoking', 'Pets allowed with fee'],
    checkInTime: '16:00',
    checkOutTime: '11:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function seedFirebaseData() {
  try {
    console.log('Starting to seed Firebase data...');

    // Add sample bookings
    console.log('Adding sample bookings...');
    for (const booking of sampleBookings) {
      await addDoc(collection(db, COLLECTIONS.BOOKINGS), booking);
    }

    // Add sample staff
    console.log('Adding sample staff...');
    for (const staff of sampleStaff) {
      await addDoc(collection(db, COLLECTIONS.STAFF), staff);
    }

    // Add sample properties
    console.log('Adding sample properties...');
    for (const property of sampleProperties) {
      await addDoc(collection(db, COLLECTIONS.PROPERTIES), property);
    }

    // Add admin user (you'll need to create this user in Firebase Auth first)
    console.log('Adding admin user...');
    await setDoc(doc(db, COLLECTIONS.ADMIN_USERS, 'admin-uid'), sampleAdminUser);

    console.log('✅ Firebase data seeded successfully!');
    console.log('📧 Admin login: admin@siamoon.com');
    console.log('🔑 You need to create this user in Firebase Auth with a password');
    
  } catch (error) {
    console.error('❌ Error seeding Firebase data:', error);
  }
}

// Uncomment to run the seeding function
// seedFirebaseData();
