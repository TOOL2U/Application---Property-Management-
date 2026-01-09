# 📱 Web App to Mobile App Integration Guide
## Sia Moon Property Management - Staff Mobile Application

**Document Version:** 2.0  
**Last Updated:** January 6, 2026  
**Mobile App Version:** 1.0.0  
**For:** Web Application Development Team

---

## 🎯 Executive Summary

This guide provides the **EXACT** specifications for integrating the Sia Moon web application with our Expo-based mobile staff application. The mobile app allows staff members to receive job assignments, accept/reject jobs, update job status, and complete tasks in the field.

**Critical Integration Points:**
1. ✅ Firebase Firestore Database (shared backend)
2. ✅ Firebase Authentication (shared user management)
3. ✅ Firebase Cloud Messaging (push notifications)
4. ✅ Real-time job synchronization
5. ✅ Staff profile management

---

## 🔥 Firebase Project Configuration

### Project Details
```
Firebase Project ID: operty-b54dc
Project Name: Sia Moon Property Management
Region: asia-southeast1 (Bangkok)
Authentication: Enabled
Firestore: Production mode
Cloud Messaging: Enabled
```

### Mobile App Details
```
App Name: Sia Moon Staff
Bundle ID (iOS): com.shauntool2u.siamoonstaff
Package Name (Android): com.shauntool2u.siamoonstaff
Platform: Expo SDK 53 (React Native)
Routing: Expo Router (file-based)
```

---

## 👤 Staff Account Structure

### Primary Collection: `staff_accounts`

**Collection Path:** `/staff_accounts/{documentId}`

This is the **SINGLE SOURCE OF TRUTH** for all staff members.

#### Document Structure
```typescript
{
  // Document ID: Firestore auto-generated (e.g., "abc123xyz456")
  
  // ===== AUTHENTICATION FIELDS =====
  email: string;              // ✅ REQUIRED - Unique staff email
  passwordHash: string;       // ✅ REQUIRED - bcrypt hash (12 rounds)
  firebaseUid: string;        // ✅ CRITICAL - Firebase Auth UID
  userId?: string;            // Backup/legacy user ID
  
  // ===== PROFILE INFORMATION =====
  name: string;               // ✅ REQUIRED - Full name
  phone: string;              // ✅ REQUIRED - Contact number
  address?: string;           // Physical address
  role: string;               // ✅ REQUIRED - Role type (see below)
  department?: string;        // Department name
  
  // ===== STATUS & PERMISSIONS =====
  isActive: boolean;          // ✅ REQUIRED - Account status
  canReceiveJobs: boolean;    // Can be assigned jobs
  notificationsEnabled: boolean; // Push notification preference
  
  // ===== SKILLS & CAPABILITIES =====
  skills?: string[];          // e.g., ["cleaning", "maintenance", "repair"]
  certifications?: string[];  // Professional certifications
  languages?: string[];       // Spoken languages
  
  // ===== FCM TOKEN FOR PUSH NOTIFICATIONS =====
  fcmToken?: string;          // ⚠️ IMPORTANT - Current FCM token
  fcmTokens?: string[];       // Array of tokens (multi-device support)
  
  // ===== TIMESTAMPS =====
  createdAt: Timestamp;       // Account creation date
  updatedAt: Timestamp;       // Last profile update
  lastLogin?: Timestamp;      // Last successful login
  lastActive?: Timestamp;     // Last app activity
  
  // ===== AVAILABILITY =====
  availability?: {
    monday: { available: boolean; hours?: string };
    tuesday: { available: boolean; hours?: string };
    wednesday: { available: boolean; hours?: string };
    thursday: { available: boolean; hours?: string };
    friday: { available: boolean; hours?: string };
    saturday: { available: boolean; hours?: string };
    sunday: { available: boolean; hours?: string };
  };
  
  // ===== STATISTICS (Optional) =====
  stats?: {
    totalJobsCompleted: number;
    totalJobsAssigned: number;
    averageRating: number;
    onTimeCompletionRate: number;
  };
}
```

#### Valid Role Values
```typescript
type StaffRole = 
  | 'admin'        // Full system access
  | 'manager'      // Can assign and verify jobs
  | 'cleaner'      // Housekeeping staff
  | 'maintenance'  // Maintenance technician
  | 'staff';       // General staff member
```

#### Example Staff Document
```json
{
  "email": "john.doe@siamoon.com",
  "passwordHash": "$2a$12$KIXxLjmXeQ...",
  "firebaseUid": "xyz789abc123def456",
  "userId": "staff_001",
  "name": "John Doe",
  "phone": "+66812345678",
  "address": "123 Beach Road, Koh Phangan, Surat Thani",
  "role": "maintenance",
  "department": "Property Maintenance",
  "isActive": true,
  "canReceiveJobs": true,
  "notificationsEnabled": true,
  "skills": ["plumbing", "electrical", "carpentry"],
  "fcmToken": "eKL9x...FCM_TOKEN_HERE...mN3p",
  "createdAt": Timestamp(2025, 1, 1),
  "updatedAt": Timestamp(2026, 1, 6),
  "lastLogin": Timestamp(2026, 1, 6, 8, 30),
  "stats": {
    "totalJobsCompleted": 47,
    "totalJobsAssigned": 52,
    "averageRating": 4.8,
    "onTimeCompletionRate": 0.94
  }
}
```

---

## 💼 Job Management Structure

### Primary Collection: `jobs`

**Collection Path:** `/jobs/{jobId}`

This collection stores ALL job assignments for staff members.

#### Document Structure
```typescript
{
  // ===== JOB IDENTIFICATION =====
  id: string;                 // Document ID (Firestore auto-generated)
  title: string;              // ✅ REQUIRED - Job title/summary
  description: string;        // ✅ REQUIRED - Detailed description
  
  // ===== JOB TYPE & PRIORITY =====
  type: JobType;              // ✅ REQUIRED - Job category (see below)
  priority: JobPriority;      // ✅ REQUIRED - Urgency level (see below)
  status: JobStatus;          // ✅ REQUIRED - Current state (see below)
  
  // ===== 🎯 CRITICAL ASSIGNMENT FIELDS =====
  // The webapp MUST use ONE of these fields to assign jobs to staff:
  
  assignedTo: string;         // ⚠️ OPTION 1: Staff Firebase UID or Document ID
  // OR
  assignedStaffId: string;    // ⚠️ OPTION 2: Staff Firebase UID or Document ID
  
  // Mobile app queries BOTH fields for compatibility:
  // - First tries: where('assignedStaffId', '==', staffId)
  // - Then tries: where('assignedTo', '==', staffId)
  // Recommendation: Use 'assignedTo' for consistency with Job interface
  
  assignedBy: string;         // Admin/Manager who assigned
  assignedAt: Timestamp;      // Assignment timestamp
  acceptedAt?: Timestamp;     // When staff accepted
  startedAt?: Timestamp;      // When staff started work
  completedAt?: Timestamp;    // When staff completed
  verifiedAt?: Timestamp;     // When admin verified
  
  // ===== SCHEDULING =====
  scheduledDate: Timestamp;   // ✅ REQUIRED - When job should be done
  scheduledStartTime?: string; // e.g., "09:00" or "14:00"
  estimatedDuration: number;  // ✅ REQUIRED - Minutes (e.g., 120)
  actualDuration?: number;    // Actual time taken (minutes)
  
  // ===== PROPERTY INFORMATION =====
  propertyId: string;         // ✅ REQUIRED - Reference to properties collection
  propertyName: string;       // Display name (e.g., "Villa Sunset")
  propertyPhotos?: string[];  // Array of property image URLs
  
  // ===== LOCATION DATA =====
  location: {
    address: string;          // ✅ REQUIRED - Street address
    city: string;             // City name
    state: string;            // State/Province
    zipCode?: string;         // Postal code
    googleMapsLink?: string;  // Pre-constructed Google Maps URL
    coordinates?: {
      latitude: number;       // GPS latitude
      longitude: number;      // GPS longitude
    };
    accessCodes?: {
      gate?: string;          // Gate access code
      door?: string;          // Door lock code
      alarm?: string;         // Alarm code
    };
    specialInstructions?: string; // Access instructions
  };
  
  // ===== BOOKING CONTEXT (For cleaning jobs) =====
  bookingRef?: string;        // Booking reference number
  checkInDate?: string;       // Guest check-in (ISO date)
  checkOutDate?: string;      // Guest check-out (ISO date)
  guestCount?: number;        // Number of guests
  accessInstructions?: string; // How to access property
  specialNotes?: string;      // Important warnings/notes
  
  // ===== CONTACT INFORMATION =====
  contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    role: 'tenant' | 'property_manager' | 'owner' | 'emergency';
    preferredContactMethod: 'phone' | 'email' | 'text';
  }>;
  
  // ===== JOB REQUIREMENTS =====
  requirements: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    completedAt?: Timestamp;
    completedBy?: string;
    photos?: string[];        // Photo URLs
    notes?: string;
  }>;
  
  // ===== COMPLETION DATA =====
  photos: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    uploadedAt: Timestamp;
    uploadedBy: string;
    type: 'before' | 'during' | 'after' | 'issue' | 'completion';
    description?: string;
  }>;
  completionNotes?: string;   // Staff completion notes
  
  // ===== ADDITIONAL INFO =====
  specialInstructions?: string;
  tools?: string[];           // Required tools
  materials?: string[];       // Required materials
  estimatedCost?: number;     // Estimated cost (THB)
  actualCost?: number;        // Actual cost (THB)
  
  // ===== REJECTION/CANCELLATION =====
  rejectionReason?: string;
  rejectedAt?: Timestamp;
  cancellationReason?: string;
  cancelledAt?: Timestamp;
  
  // ===== TRACKING =====
  staffLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Timestamp;
  };
  
  // ===== NOTIFICATIONS =====
  notificationsEnabled: boolean;
  reminderSent: boolean;
  
  // ===== TIMESTAMPS =====
  createdAt: Timestamp;       // ✅ REQUIRED
  updatedAt: Timestamp;       // ✅ REQUIRED
  createdBy: string;          // Admin/Manager UID
}
```

#### Valid Enum Values

**Job Type:**
```typescript
type JobType = 
  | 'cleaning'      // Housekeeping/cleaning
  | 'maintenance'   // General maintenance
  | 'inspection'    // Property inspection
  | 'repair'        // Repair work
  | 'installation'  // Installing equipment
  | 'emergency'     // Emergency response
  | 'general';      // General tasks
```

**Job Status:**
```typescript
type JobStatus = 
  | 'pending'       // Created, waiting for assignment
  | 'assigned'      // Assigned to staff, waiting acceptance
  | 'accepted'      // Staff accepted the job
  | 'in_progress'   // Staff actively working
  | 'completed'     // Staff marked complete
  | 'verified'      // Manager verified completion
  | 'cancelled'     // Job cancelled
  | 'rejected';     // Staff rejected the job
```

**Job Priority:**
```typescript
type JobPriority = 
  | 'low'       // Can be done anytime
  | 'medium'    // Normal priority
  | 'high'      // Urgent
  | 'urgent';   // Emergency - immediate attention
```

---

## 🔔 Push Notification System

### Collection: `staff_notifications`

**Collection Path:** `/staff_notifications/{notificationId}`

The mobile app listens to this collection for real-time job assignment notifications.

#### Document Structure
```typescript
{
  // ===== NOTIFICATION IDENTIFICATION =====
  id: string;                 // Document ID (auto-generated)
  
  // ===== 🎯 CRITICAL LINKING FIELDS =====
  jobId: string;              // ✅ REQUIRED - Reference to jobs/{jobId}
  staffId: string;            // ✅ REQUIRED - staff_accounts document ID
  userId: string;             // ✅ REQUIRED - Firebase Auth UID (for queries)
  
  // The mobile app queries: where('userId', '==', currentUserFirebaseUid)
  // Ensure this matches the 'firebaseUid' field in staff_accounts
  
  // ===== NOTIFICATION CONTENT =====
  type: NotificationType;     // ✅ REQUIRED - Type of notification
  title: string;              // ✅ REQUIRED - Notification title
  body?: string;              // Notification body/message
  
  // ===== JOB SUMMARY DATA (for display) =====
  jobTitle: string;           // Job title (duplicate for quick access)
  jobType: JobType;           // Job type
  priority: JobPriority;      // Priority level
  propertyName: string;       // Property name
  propertyAddress?: string;   // Property address
  scheduledDate: string;      // ISO date string
  scheduledStartTime?: string; // e.g., "14:00"
  estimatedDuration?: number; // Minutes
  
  // ===== NOTIFICATION STATE =====
  status: 'pending' | 'read' | 'expired';
  readAt?: Timestamp;         // When notification was read
  actionRequired: boolean;    // Requires user action
  
  // ===== STAFF INFO (for display) =====
  staffName: string;          // Staff member name
  staffEmail: string;         // Staff email
  
  // ===== ADDITIONAL DATA =====
  specialInstructions?: string;
  data?: Record<string, any>; // Additional payload data
  
  // ===== TIMESTAMPS =====
  createdAt: Timestamp;       // ✅ REQUIRED
  expiresAt: Timestamp;       // Auto-expire after 24 hours
  sentAt?: Timestamp;         // When FCM was sent
  deliveredAt?: Timestamp;    // When FCM was delivered
}
```

#### Valid Notification Types
```typescript
type NotificationType = 
  | 'job_assigned'      // New job assigned
  | 'job_updated'       // Job details changed
  | 'job_cancelled'     // Job was cancelled
  | 'job_reminder'      // Reminder for upcoming job
  | 'job_overdue'       // Job past scheduled time
  | 'urgent_request'    // Urgent job request
  | 'message'           // General message
  | 'announcement';     // System announcement
```

---

## 📡 How Mobile App Queries Data

### Authentication Flow
```typescript
// 1. User logs in with email/password
// 2. Query staff_accounts collection
const staffQuery = query(
  collection(db, 'staff_accounts'),
  where('email', '==', userEmail),
  where('isActive', '==', true)
);

// 3. Get staff document
const staffDocs = await getDocs(staffQuery);
const staffData = staffDocs.docs[0].data();
const staffDocId = staffDocs.docs[0].id;

// 4. Get Firebase UID
const firebaseUid = staffData.firebaseUid || staffData.userId;

// 5. Store in app context
// - staffDocId: Used for staff-specific operations
// - firebaseUid: Used for authentication and notifications
```

### Fetching Jobs for Staff
```typescript
// Mobile app queries BOTH field names for compatibility

// Primary query (tries first):
const jobsQuery1 = query(
  collection(db, 'jobs'),
  where('assignedStaffId', '==', staffFirebaseUid),
  orderBy('scheduledDate', 'asc')
);

// Fallback query (if no results):
const jobsQuery2 = query(
  collection(db, 'jobs'),
  where('assignedTo', '==', staffFirebaseUid),
  orderBy('scheduledDate', 'asc')
);

// Gets all jobs where staff is assigned
// Returns: Array of job documents
```

### Real-time Notification Listener
```typescript
// Mobile app subscribes to notifications
const notificationsQuery = query(
  collection(db, 'staff_notifications'),
  where('userId', '==', currentUserFirebaseUid),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
);

// Real-time listener
onSnapshot(notificationsQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const notification = change.doc.data();
      // Show push notification
      // Update UI
      // Play sound
    }
  });
});
```

---

## 🚀 Integration Requirements for Web App

### ✅ STEP 1: Creating/Updating Staff Accounts

When creating a staff account in the web app:

```typescript
// Example: Creating a new staff member
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import bcrypt from 'bcrypt';

async function createStaffMember(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: StaffRole;
}) {
  // 1. Hash the password (CRITICAL - use bcrypt with 12 rounds)
  const passwordHash = await bcrypt.hash(data.password, 12);
  
  // 2. Create Firebase Auth user (optional but recommended)
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );
  const firebaseUid = userCredential.user.uid;
  
  // 3. Create staff_accounts document
  const staffDoc = await addDoc(collection(db, 'staff_accounts'), {
    email: data.email,
    passwordHash: passwordHash,
    firebaseUid: firebaseUid,      // ⚠️ CRITICAL - Mobile app needs this
    name: data.name,
    phone: data.phone,
    role: data.role,
    isActive: true,
    canReceiveJobs: true,
    notificationsEnabled: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  return {
    staffId: staffDoc.id,
    firebaseUid: firebaseUid,
  };
}
```

### ✅ STEP 2: Assigning Jobs to Staff

When assigning a job from the web app:

```typescript
// Example: Creating and assigning a job
import { collection, addDoc, Timestamp } from 'firebase/firestore';

async function assignJobToStaff(data: {
  staffId: string;           // staff_accounts document ID
  staffFirebaseUid: string;  // staff.firebaseUid field
  propertyId: string;
  title: string;
  description: string;
  scheduledDate: Date;
  // ... other job fields
}) {
  // 1. Create job document
  const jobDoc = await addDoc(collection(db, 'jobs'), {
    // Job details
    title: data.title,
    description: data.description,
    type: 'cleaning',
    priority: 'medium',
    status: 'assigned',
    
    // ⚠️ CRITICAL ASSIGNMENT FIELDS
    // Use BOTH fields for maximum compatibility:
    assignedTo: data.staffFirebaseUid,        // Primary field
    assignedStaffId: data.staffFirebaseUid,   // Compatibility field
    
    assignedBy: currentAdminUid,
    assignedAt: Timestamp.now(),
    
    // Scheduling
    scheduledDate: Timestamp.fromDate(data.scheduledDate),
    estimatedDuration: 120, // minutes
    
    // Property
    propertyId: data.propertyId,
    propertyName: 'Villa Sunset',
    
    // Location (REQUIRED)
    location: {
      address: '123 Beach Road',
      city: 'Koh Phangan',
      state: 'Surat Thani',
      zipCode: '84280',
    },
    
    // Contacts (REQUIRED)
    contacts: [],
    
    // Requirements
    requirements: [],
    photos: [],
    
    // Flags
    notificationsEnabled: true,
    reminderSent: false,
    
    // Timestamps
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: currentAdminUid,
  });
  
  // 2. Create notification for mobile app
  await createNotificationForJob(jobDoc.id, data.staffId, data.staffFirebaseUid);
  
  return jobDoc.id;
}
```

### ✅ STEP 3: Creating Push Notifications

**CRITICAL:** Create a notification document for real-time alerts:

```typescript
// Example: Creating a notification
import { collection, addDoc, Timestamp } from 'firebase/firestore';

async function createNotificationForJob(
  jobId: string,
  staffDocId: string,
  staffFirebaseUid: string
) {
  // Get job details
  const jobSnap = await getDoc(doc(db, 'jobs', jobId));
  const jobData = jobSnap.data();
  
  // Get staff details
  const staffSnap = await getDoc(doc(db, 'staff_accounts', staffDocId));
  const staffData = staffSnap.data();
  
  // Create notification
  await addDoc(collection(db, 'staff_notifications'), {
    // ⚠️ CRITICAL LINKING FIELDS
    jobId: jobId,
    staffId: staffDocId,                    // Document ID
    userId: staffFirebaseUid,               // Firebase Auth UID (for queries)
    
    // Notification details
    type: 'job_assigned',
    title: `New Job: ${jobData.title}`,
    body: `You have been assigned a ${jobData.type} job at ${jobData.propertyName}`,
    
    // Job summary (for quick display)
    jobTitle: jobData.title,
    jobType: jobData.type,
    priority: jobData.priority,
    propertyName: jobData.propertyName,
    propertyAddress: jobData.location?.address,
    scheduledDate: jobData.scheduledDate.toDate().toISOString(),
    scheduledStartTime: jobData.scheduledStartTime,
    estimatedDuration: jobData.estimatedDuration,
    
    // Staff info
    staffName: staffData.name,
    staffEmail: staffData.email,
    
    // State
    status: 'pending',
    actionRequired: true,
    
    // Timestamps
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
  
  // Optional: Send FCM push notification
  if (staffData.fcmToken) {
    await sendFCMNotification(staffData.fcmToken, {
      title: `New Job: ${jobData.title}`,
      body: `${jobData.type} at ${jobData.propertyName}`,
      data: {
        jobId: jobId,
        type: 'job_assigned',
      },
    });
  }
}
```

### ✅ STEP 4: Handling Job Status Updates

When staff updates job status from mobile app:

```typescript
// Listen for job status changes in web app
const jobRef = doc(db, 'jobs', jobId);

onSnapshot(jobRef, (docSnap) => {
  const jobData = docSnap.data();
  
  switch (jobData.status) {
    case 'accepted':
      // Staff accepted - update UI
      console.log(`Staff accepted job at ${jobData.acceptedAt}`);
      break;
      
    case 'rejected':
      // Staff rejected - reassign or notify admin
      console.log(`Staff rejected: ${jobData.rejectionReason}`);
      break;
      
    case 'in_progress':
      // Staff started - track progress
      console.log(`Work started at ${jobData.startedAt}`);
      break;
      
    case 'completed':
      // Staff completed - verify work
      console.log(`Completed at ${jobData.completedAt}`);
      console.log(`Notes: ${jobData.completionNotes}`);
      console.log(`Photos: ${jobData.photos.length}`);
      break;
  }
});
```

---

## 🔍 Common Integration Scenarios

### Scenario 1: Assign Cleaning Job Before Guest Arrival

```typescript
async function assignPreCheckInCleaning(booking: {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  bookingRef: string;
}) {
  // 1. Find available cleaner
  const cleanersQuery = query(
    collection(db, 'staff_accounts'),
    where('role', '==', 'cleaner'),
    where('isActive', '==', true),
    where('canReceiveJobs', '==', true)
  );
  const cleaners = await getDocs(cleanersQuery);
  const selectedCleaner = cleaners.docs[0]; // Use scheduling logic
  
  // 2. Get property details
  const propertySnap = await getDoc(doc(db, 'properties', booking.propertyId));
  const property = propertySnap.data();
  
  // 3. Calculate cleaning time (day before check-in)
  const cleaningDate = new Date(booking.checkInDate);
  cleaningDate.setDate(cleaningDate.getDate() - 1);
  cleaningDate.setHours(10, 0, 0, 0); // 10:00 AM
  
  // 4. Create job
  const jobDoc = await addDoc(collection(db, 'jobs'), {
    title: `Pre-Arrival Cleaning - ${property.name}`,
    description: `Full property cleaning before guest arrival`,
    type: 'cleaning',
    priority: 'high',
    status: 'assigned',
    
    // Assignment
    assignedTo: selectedCleaner.data().firebaseUid,
    assignedStaffId: selectedCleaner.data().firebaseUid,
    assignedBy: currentUserId,
    assignedAt: Timestamp.now(),
    
    // Scheduling
    scheduledDate: Timestamp.fromDate(cleaningDate),
    scheduledStartTime: '10:00',
    estimatedDuration: 180, // 3 hours
    
    // Property
    propertyId: booking.propertyId,
    propertyName: property.name,
    propertyPhotos: property.photos || [],
    location: {
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      accessCodes: property.accessCodes,
      specialInstructions: property.accessInstructions,
    },
    
    // Booking context
    bookingRef: booking.bookingRef,
    checkInDate: booking.checkInDate.toISOString(),
    checkOutDate: booking.checkOutDate.toISOString(),
    guestCount: booking.guestCount,
    specialNotes: `Guest arriving ${booking.checkInDate.toLocaleDateString()} at 3:00 PM`,
    
    // Requirements
    requirements: [
      {
        id: 'req1',
        description: 'Clean all bedrooms',
        isCompleted: false,
      },
      {
        id: 'req2',
        description: 'Clean bathrooms',
        isCompleted: false,
      },
      {
        id: 'req3',
        description: 'Restock amenities',
        isCompleted: false,
      },
      {
        id: 'req4',
        description: 'Check all appliances',
        isCompleted: false,
      },
    ],
    
    contacts: [
      {
        name: property.managerName,
        phone: property.managerPhone,
        email: property.managerEmail,
        role: 'property_manager',
        preferredContactMethod: 'phone',
      },
    ],
    
    photos: [],
    notificationsEnabled: true,
    reminderSent: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: currentUserId,
  });
  
  // 5. Send notification
  await createNotificationForJob(
    jobDoc.id,
    selectedCleaner.id,
    selectedCleaner.data().firebaseUid
  );
  
  return jobDoc.id;
}
```

### Scenario 2: Assign Maintenance Emergency

```typescript
async function assignEmergencyMaintenance(issue: {
  propertyId: string;
  description: string;
  reportedBy: string;
  urgency: 'high' | 'urgent';
}) {
  // 1. Find on-duty maintenance staff
  const maintenanceQuery = query(
    collection(db, 'staff_accounts'),
    where('role', '==', 'maintenance'),
    where('isActive', '==', true),
    where('canReceiveJobs', '==', true)
  );
  const staff = await getDocs(maintenanceQuery);
  
  // Sort by location or availability (implement your logic)
  const selectedStaff = staff.docs[0];
  
  // 2. Create urgent job
  const jobDoc = await addDoc(collection(db, 'jobs'), {
    title: `🚨 EMERGENCY: ${issue.description}`,
    description: `URGENT maintenance required. Reported by: ${issue.reportedBy}`,
    type: 'emergency',
    priority: issue.urgency,
    status: 'assigned',
    
    assignedTo: selectedStaff.data().firebaseUid,
    assignedStaffId: selectedStaff.data().firebaseUid,
    assignedBy: currentUserId,
    assignedAt: Timestamp.now(),
    
    scheduledDate: Timestamp.now(), // ASAP
    scheduledStartTime: 'ASAP',
    estimatedDuration: 60,
    
    propertyId: issue.propertyId,
    // ... other fields
    
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // 3. Send high-priority notification
  await createNotificationForJob(
    jobDoc.id,
    selectedStaff.id,
    selectedStaff.data().firebaseUid
  );
  
  // 4. Optional: Send SMS alert for emergencies
  await sendSMSAlert(selectedStaff.data().phone, 
    `EMERGENCY JOB ASSIGNED: ${issue.description}`);
  
  return jobDoc.id;
}
```

---

## 📊 Firebase Security Rules

Required Firestore security rules for mobile app access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Staff can read their own profile
    match /staff_accounts/{staffId} {
      allow read: if request.auth != null && 
        (request.auth.uid == staffId || 
         request.auth.uid == resource.data.firebaseUid);
      
      // Staff can update their own profile (limited fields)
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.firebaseUid &&
        !('passwordHash' in request.resource.data) &&
        !('role' in request.resource.data) &&
        !('isActive' in request.resource.data);
    }
    
    // Jobs: Staff can read jobs assigned to them
    match /jobs/{jobId} {
      allow read: if request.auth != null && (
        resource.data.assignedTo == request.auth.uid ||
        resource.data.assignedStaffId == request.auth.uid
      );
      
      // Staff can update job status and completion fields
      allow update: if request.auth != null && (
        resource.data.assignedTo == request.auth.uid ||
        resource.data.assignedStaffId == request.auth.uid
      ) && (
        // Only allow updating specific fields
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'acceptedAt', 'startedAt', 'completedAt',
                    'completionNotes', 'photos', 'requirements',
                    'actualDuration', 'staffLocation', 'updatedAt',
                    'rejectionReason', 'rejectedAt'])
      );
    }
    
    // Notifications: Staff can read their own notifications
    match /staff_notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Staff can mark as read
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'readAt']);
    }
    
    // Properties: Staff can read property details
    match /properties/{propertyId} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## 🧪 Testing the Integration

### Test Account

Use this account to test the integration:

```
Email: staff@siamoon.com
Role: staff
Status: Active
```

### Testing Steps

1. **Create Test Job in Web App**
   ```typescript
   // Use the assignJobToStaff function above
   // Set assignedTo to the test staff's firebaseUid
   ```

2. **Verify Mobile App Receives Job**
   - Open mobile app
   - Log in with test account
   - Check Jobs tab
   - Job should appear in "Assigned" section

3. **Test Notification**
   - Create notification document
   - Mobile app should show push notification
   - Tap notification → Opens job details

4. **Test Job Actions**
   - Accept job in mobile app
   - Check job status in web app → Should show "accepted"
   - Start job in mobile app
   - Check status → Should show "in_progress"
   - Complete job with photos and notes
   - Check status → Should show "completed"

### Debug Queries

Check if job assignment is correct:

```typescript
// In Firebase Console or web app
const jobsQuery = query(
  collection(db, 'jobs'),
  where('assignedTo', '==', 'STAFF_FIREBASE_UID')
);
const jobs = await getDocs(jobsQuery);
console.log(`Found ${jobs.size} jobs for staff`);
```

Check if notifications are created:

```typescript
const notificationsQuery = query(
  collection(db, 'staff_notifications'),
  where('userId', '==', 'STAFF_FIREBASE_UID'),
  where('status', '==', 'pending')
);
const notifications = await getDocs(notificationsQuery);
console.log(`Found ${notifications.size} pending notifications`);
```

---

## ⚠️ Critical Integration Checklist

Before going live, ensure:

- [ ] **Staff Accounts**: All staff have `firebaseUid` field populated
- [ ] **Job Assignment**: Web app sets BOTH `assignedTo` and `assignedStaffId` fields
- [ ] **Notification Creation**: Create `staff_notifications` document for each job assignment
- [ ] **userId Matching**: Notification `userId` matches staff `firebaseUid`
- [ ] **Location Data**: Jobs include complete `location` object with address
- [ ] **Property Info**: Jobs include `propertyName` and `propertyPhotos`
- [ ] **Security Rules**: Firestore rules allow staff read/update access
- [ ] **FCM Tokens**: Staff accounts store current FCM tokens
- [ ] **Timestamp Format**: Use Firebase `Timestamp.now()` not JavaScript `Date`
- [ ] **Testing**: Test with real staff account end-to-end

---

## 🆘 Troubleshooting

### Issue: Staff Not Receiving Jobs

**Check:**
1. Is `assignedTo` or `assignedStaffId` set correctly?
2. Does the value match staff's `firebaseUid`?
3. Query both field names to test

```typescript
// Test both queries
const test1 = await getDocs(query(
  collection(db, 'jobs'),
  where('assignedStaffId', '==', staffUid)
));
console.log('assignedStaffId results:', test1.size);

const test2 = await getDocs(query(
  collection(db, 'jobs'),
  where('assignedTo', '==', staffUid)
));
console.log('assignedTo results:', test2.size);
```

### Issue: Notifications Not Showing

**Check:**
1. Is `staff_notifications` document created?
2. Does `userId` field match staff's `firebaseUid`?
3. Is `status` set to 'pending'?
4. Has notification expired (check `expiresAt`)?

```typescript
// Check notification documents
const notifQuery = query(
  collection(db, 'staff_notifications'),
  where('staffId', '==', staffDocId)
);
const notifs = await getDocs(notifQuery);
notifs.forEach(doc => {
  console.log('Notification:', doc.id, doc.data());
});
```

### Issue: Permission Denied Errors

**Check:**
1. Are Firestore security rules deployed?
2. Does staff have valid Firebase Auth token?
3. Is `isActive` set to `true` in staff profile?

---

## 📞 Support Contacts

**Mobile App Team:**
- Platform: Expo SDK 53 / React Native
- Router: Expo Router
- Firebase: Client SDK (modular v9+)

**Integration Questions:**
- Check this document first
- Review Firebase Console logs
- Test with provided test account
- Verify Firestore structure matches exactly

**Key Files in Mobile App:**
- `services/secureFirestore.ts` - Job queries
- `contexts/PINAuthContext.tsx` - Authentication
- `contexts/JobContext.tsx` - Job management
- `services/enhancedNotificationService.ts` - Notifications

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Jan 6, 2026 | Complete rewrite with exact field specifications |
| 1.0 | Jan 15, 2025 | Initial documentation |

---

## ✅ Quick Reference Card

**Assign Job to Staff:**
```typescript
{
  assignedTo: "staff-firebase-uid",          // ✅ REQUIRED
  assignedStaffId: "staff-firebase-uid",     // ✅ RECOMMENDED
  status: "assigned",
  scheduledDate: Timestamp.now(),
  propertyId: "property-id",
  location: { address, city, state },
  // ... other required fields
}
```

**Create Notification:**
```typescript
{
  jobId: "job-id",                           // ✅ REQUIRED
  staffId: "staff-doc-id",                   // ✅ REQUIRED  
  userId: "staff-firebase-uid",              // ✅ REQUIRED
  type: "job_assigned",
  status: "pending",
  createdAt: Timestamp.now(),
  expiresAt: Timestamp (24h from now),
  // ... other fields
}
```

**Get Staff Firebase UID:**
```typescript
const staffDoc = await getDoc(doc(db, 'staff_accounts', staffDocId));
const firebaseUid = staffDoc.data().firebaseUid;
// Use this for assignedTo and userId fields
```

---

**END OF DOCUMENT**

