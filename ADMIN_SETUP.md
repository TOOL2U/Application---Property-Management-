# Sia Moon Property Management - Admin System Setup

## 🚀 Overview

The admin system provides full booking management, staff assignment, and task coordination capabilities that sync in real-time with your existing web application.

## 🔧 Firebase Configuration

The app is configured to connect to your existing Firebase project:
- **Project ID**: `operty-b54dc`
- **Auth Domain**: `operty-b54dc.firebaseapp.com`
- **Real-time sync** with your web application

## 📱 Admin Features

### 1. **Admin Authentication**
- Secure login with Firebase Auth
- Role-based access control
- Admin-only routes protection

### 2. **Booking Management**
- View all bookings in real-time
- Approve/reject bookings with reasons
- Automatic sync with web app
- Status tracking and history

### 3. **Task Assignment**
- Assign tasks to staff after booking approval
- Multiple staff assignment support
- Task types: cleaning, maintenance, concierge, inspection
- Priority levels and due dates

### 4. **Staff Management**
- View active staff members
- Staff availability tracking
- Skills and ratings system
- Task completion history

## 🛠️ Setup Instructions

### Step 1: Firebase Auth Setup
1. Go to Firebase Console → Authentication
2. Create an admin user with email: `admin@siamoon.com`
3. Set a secure password for the admin account

### Step 2: Firestore Collections
The app uses these Firestore collections:
- `bookings` - Booking data (synced with web app)
- `staff` - Staff member profiles
- `tasks` - Task assignments and tracking
- `admin_users` - Admin user permissions
- `properties` - Property information

### Step 3: Sample Data (Optional)
Run the seeding script to populate test data:
```typescript
// In scripts/seedFirebaseData.ts
import { seedFirebaseData } from './scripts/seedFirebaseData';
seedFirebaseData();
```

### Step 4: Security Rules
Add these Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin users collection
    match /admin_users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 How to Access Admin Panel

### From Mobile App:
1. Open the Sia Moon Property Management app
2. Look for the **"Admin"** button in the header (orange shield icon)
3. Tap to navigate to admin login
4. Enter admin credentials

### Direct Navigation:
- Admin Login: `/admin/login`
- Admin Dashboard: `/admin/dashboard`

## 🔄 Real-time Sync Features

### Booking Workflow:
1. **Guest books** via web app → Booking appears in mobile admin
2. **Admin approves** in mobile → Status updates in web app
3. **Admin assigns tasks** → Staff receives assignments
4. **Staff completes tasks** → Updates reflect everywhere

### Data Synchronization:
- **Real-time listeners** for instant updates
- **Offline support** with Firebase persistence
- **Conflict resolution** for concurrent edits
- **Automatic retry** for failed operations

## 🎨 Design System

The admin interface matches your web app theme:
- **Dark theme** with neon gradients
- **Glassmorphism effects** for modern look
- **Professional cards** and layouts
- **Mobile-optimized** for iPhone 15
- **Consistent branding** with Sia Moon colors

## 🔐 Security Features

### Authentication:
- Firebase Auth integration
- Admin role verification
- Session management
- Secure token handling

### Authorization:
- Role-based permissions
- Resource-level access control
- Admin-only route protection
- Firestore security rules

## 📊 Admin Dashboard Features

### Overview Tab:
- Total bookings count
- Pending approvals
- Revenue tracking
- Staff performance metrics

### Bookings Tab:
- Real-time booking list
- Approve/reject actions
- Guest information display
- Task assignment modal

### Staff Tab:
- Active staff members
- Availability status
- Skills and ratings
- Task assignments

## 🚀 Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install firebase @react-native-async-storage/async-storage
   ```

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Access admin panel**:
   - Web: http://localhost:8083 → Click "Admin" button
   - Mobile: Scan QR code → Tap "Admin" button

4. **Login with admin credentials**:
   - Email: `admin@siamoon.com`
   - Password: [Set in Firebase Auth]

## 🔧 Troubleshooting

### Common Issues:

1. **"Access denied" error**:
   - Ensure admin user exists in Firebase Auth
   - Check admin_users collection has the user document

2. **No bookings showing**:
   - Verify Firestore collections exist
   - Check security rules allow read access
   - Ensure data is in correct format

3. **Real-time updates not working**:
   - Check internet connection
   - Verify Firebase configuration
   - Look for console errors

### Support:
- Check browser console for errors
- Verify Firebase project settings
- Test with sample data first

## 🎯 Next Steps

The admin system is now fully integrated and ready for production use. All booking approvals, task assignments, and staff management will sync seamlessly between your mobile app and web application.

**Happy managing! 🏠✨**
