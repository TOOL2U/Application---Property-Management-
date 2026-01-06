# 🚨 CRITICAL: Backend Security Changes - Mobile App Integration Update

**To:** Mobile App Development Team  
**From:** Backend Engineering Team  
**Date:** January 4, 2026  
**Priority:** HIGH - Immediate Action Required  
**Subject:** Firebase Security Rules Updated - Authentication & Permission Changes

---

## 🚨 URGENT: Firebase Firestore Security Rules Changed

We've implemented **comprehensive Firebase security rules** as part of our production readiness initiative. This will directly impact mobile app Firestore access and **requires immediate mobile app updates**.

### 🔥 BREAKING CHANGE: Authentication Now Required

**Previous State:** Open database access (insecure)  
**Current State:** All database operations require authentication + proper roles  

**Impact:** Mobile app will receive permission denied errors for ALL Firestore operations until updated.

---

## 🔐 NEW AUTHENTICATION REQUIREMENTS

### 1. **User Authentication Required**
```javascript
// ALL Firestore operations now require authenticated user
// Mobile app MUST authenticate users before any database access
auth.currentUser !== null  // Required for ALL operations
```

### 2. **Custom Claims Required**
Users must have role claims set in their Firebase Auth token:
```javascript
// Required custom claims structure:
{
  "role": "staff" | "admin" | "manager" | "cleaner" | "inspector" | "maintenance",
  "companyId": "company_123",  // Optional but recommended
  "admin": true  // For admin users only
}
```

### 3. **Role-Based Access Control**
- **Staff roles:** `staff`, `cleaner`, `inspector`, `maintenance`
- **Admin roles:** `admin`, `manager`, `supervisor`
- **Permission model:** Users can only access their own data unless admin

---

## 📋 REQUIRED MOBILE APP CHANGES

### ✅ IMMEDIATE ACTIONS NEEDED

#### 1. **Authentication Flow Update**
```javascript
// BEFORE (will fail now):
const jobsRef = db.collection('jobs')
const jobs = await jobsRef.get()

// AFTER (required now):
const user = auth.currentUser
if (!user) {
  // Redirect to login - NO database access without auth
  return 
}

// Only after authentication:
const jobsRef = db.collection('jobs')
const jobs = await jobsRef.get()  // Will work if user has correct role
```

#### 2. **Role-Based UI Logic**
```javascript
// Check user role for UI permissions
const userRole = await user.getIdTokenResult()
const role = userRole.claims.role

if (role === 'admin' || role === 'manager') {
  // Show admin features
} else if (role === 'staff') {
  // Show staff features only
}
```

#### 3. **Error Handling for Permission Denied**
```javascript
try {
  const data = await db.collection('jobs').get()
} catch (error) {
  if (error.code === 'permission-denied') {
    // Handle permission errors gracefully
    // Possible causes:
    // 1. User not authenticated
    // 2. User role not set
    // 3. User accessing unauthorized data
  }
}
```

---

## 🗂️ COLLECTION ACCESS PERMISSIONS

### **Staff Can Access:**
- ✅ Their own data in `/staff/{staffId}` (read only)
- ✅ Jobs assigned to them in `/jobs/{jobId}` (read only)
- ✅ Their location updates in `/staff_locations/{locationId}`
- ✅ Their availability in `/staff_availability/{availabilityId}`
- ✅ Job progress for their jobs in `/job_progress/{progressId}`
- ✅ Calendar events (read only)
- ✅ Properties (read only)
- ✅ Their notifications

### **Staff CANNOT Access:**
- ❌ Other staff members' data
- ❌ Bookings collections (admin only)
- ❌ Audit logs (admin only)
- ❌ Webhook logs (admin only)
- ❌ User management data

### **Admin Can Access:**
- ✅ **Everything** - full read/write access to all collections

---

## 🔧 TECHNICAL IMPLEMENTATION GUIDE

### 1. **Firebase Auth Setup**
```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Ensure user is authenticated before ANY Firestore operations
const ensureAuthenticated = async () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      if (user) {
        resolve(user)
      } else {
        reject(new Error('User not authenticated'))
      }
    })
  })
}
```

### 2. **Safe Data Fetching Pattern**
```javascript
const fetchUserJobs = async () => {
  try {
    const user = await ensureAuthenticated()
    
    // Get user's ID token with claims
    const idTokenResult = await user.getIdTokenResult()
    const userRole = idTokenResult.claims.role
    
    if (!userRole) {
      throw new Error('User role not set - contact admin')
    }
    
    // Fetch jobs - security rules will filter to user's jobs automatically
    const jobsSnapshot = await db.collection('jobs')
      .where('assignedStaffId', '==', user.uid)
      .get()
    
    return jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    if (error.code === 'permission-denied') {
      // Handle permission error - likely auth issue
    }
    throw error
  }
}
```

### 3. **Role Checking Utility**
```javascript
const getUserRole = async () => {
  const user = auth.currentUser
  if (!user) return null
  
  const idTokenResult = await user.getIdTokenResult()
  return idTokenResult.claims.role
}

const isAdmin = async () => {
  const role = await getUserRole()
  return ['admin', 'manager', 'supervisor'].includes(role)
}

const isStaff = async () => {
  const role = await getUserRole()
  return ['staff', 'cleaner', 'inspector', 'maintenance'].includes(role)
}
```

---

## 🚨 COMMON PERMISSION ERROR SCENARIOS

### Error: `FirebaseError: Missing or insufficient permissions`

**Causes & Solutions:**

1. **User Not Authenticated**
   ```javascript
   // Check authentication status
   if (!auth.currentUser) {
     // Redirect to login
   }
   ```

2. **Missing Role Claims**
   ```javascript
   // Check if user has role set
   const idToken = await user.getIdTokenResult()
   if (!idToken.claims.role) {
     // Contact admin to set user role
   }
   ```

3. **Accessing Unauthorized Data**
   ```javascript
   // Staff trying to access admin-only data
   // Solution: Implement proper role-based UI logic
   ```

### Error: `collection is not defined` or `doc is not defined`

**Cause:** Database rules now require specific access patterns

**Solution:** Ensure proper collection access based on user role:
```javascript
// Staff accessing their own data (ALLOWED)
const staffDoc = db.doc(`staff/${user.uid}`)

// Staff accessing other staff data (DENIED) 
const otherStaffDoc = db.doc(`staff/other_user_id`)  // Will fail

// Admin accessing any data (ALLOWED)
// Admins can access any collection
```

---

## 🛠️ DEBUGGING TIPS

### 1. **Test Authentication Status**
```javascript
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User authenticated:', user.uid)
    user.getIdTokenResult().then(idTokenResult => {
      console.log('User role:', idTokenResult.claims.role)
    })
  } else {
    console.log('User not authenticated')
  }
})
```

### 2. **Test Firestore Access**
```javascript
const testFirestoreAccess = async () => {
  try {
    // Try to read a simple document
    const doc = await db.collection('staff').doc(auth.currentUser.uid).get()
    console.log('Firestore access working:', doc.exists)
  } catch (error) {
    console.error('Firestore access failed:', error.code, error.message)
  }
}
```

### 3. **Firebase Console Debugging**
- Check **Authentication** tab for user roles in custom claims
- Check **Firestore** tab for permission denied errors in usage logs
- Verify **Security Rules** match the rules we've deployed

---

## 📞 SUPPORT & ESCALATION

### Immediate Questions/Issues:
- **Slack:** #mobile-backend-integration
- **Emergency:** Contact backend team directly

### Common Issues & Quick Fixes:

1. **"permission-denied" on all operations**
   - **Fix:** Ensure user authentication before database access

2. **"Missing role" errors**  
   - **Fix:** Contact backend team to set user roles in Firebase Auth custom claims

3. **Can't access specific collections**
   - **Fix:** Verify user role permissions in the table above

4. **Authentication working but still permission errors**
   - **Fix:** Force token refresh: `user.getIdToken(true)`

---

## ⚡ TESTING CHECKLIST

Before releasing mobile app updates:

- [ ] **Authentication Flow:** Users must login before any database operations
- [ ] **Role Verification:** Check user role claims are properly set
- [ ] **Permission Testing:** Test staff can only access their own data  
- [ ] **Admin Testing:** Test admin users can access all data
- [ ] **Error Handling:** Graceful handling of permission-denied errors
- [ ] **Offline Handling:** Ensure security works with offline persistence

---

## 🎯 TIMELINE & URGENCY

**CRITICAL DEADLINE:** Mobile app must be updated immediately

- **Current State:** Mobile app likely failing with permission errors
- **Required:** Authentication + role-based access implementation
- **Timeline:** Update needed ASAP to restore functionality
- **Testing:** Coordinate with backend team for role assignment testing

**This security update is non-negotiable for production deployment.** Please prioritize these changes and coordinate with our team for testing and role assignments.

---

**📧 For immediate support, contact the backend team. We're standing by to help with Firebase rule testing and user role configuration.**

---

## 🌐 COMPLETE MOBILE API INTEGRATION GUIDE

### 🔗 **Backend API Endpoints for Mobile App**

#### **1. Mobile-Specific API Endpoints**

##### **📱 Job Management APIs**
```bash
# Get jobs for staff member
GET /api/mobile/jobs?staffId={staffId}&status={status}&limit={limit}
Headers:
- X-API-Key: sia-moon-mobile-app-2025-secure-key
- X-Mobile-Secret: mobile-app-sync-2025-secure
- Content-Type: application/json

# Update job progress
POST /api/mobile/update-job-progress
Body: {
  "jobId": "string",
  "staffId": "string", 
  "status": "started|in_progress|completed|paused",
  "progress": "number (0-100)",
  "notes": "string",
  "location": { "lat": number, "lng": number },
  "timestamp": "ISO string"
}

# Complete job
POST /api/mobile/job-completion
Body: {
  "jobId": "string",
  "staffId": "string",
  "completedAt": "ISO string",
  "photos": ["cloudinary_url1", "cloudinary_url2"],
  "notes": "string",
  "qualityRating": "number (1-5)",
  "issuesReported": "string[]"
}
```

##### **📍 Location & GPS APIs**
```bash
# Update staff location
POST /api/mobile/update-location  
Body: {
  "staffId": "string",
  "latitude": "number",
  "longitude": "number", 
  "accuracy": "number",
  "status": "working|traveling|break|emergency|offline",
  "speed": "number (optional)",
  "heading": "number (optional)",
  "batteryLevel": "number (optional)",
  "timestamp": "ISO string (optional)"
}

Response: {
  "success": true,
  "locationId": "string",
  "nearbyProperties": [...],
  "nextAssignment": {...}
}
```

##### **📋 Job Assignments APIs**
```bash
# Get job assignments
GET /api/mobile/job-assignments?staffId={staffId}&date={YYYY-MM-DD}

# Respond to job assignment 
POST /api/mobile/job-assignments/{assignmentId}/respond
Body: {
  "action": "accept|decline",
  "staffId": "string",
  "reason": "string (if declining)",
  "estimatedArrival": "ISO string (if accepting)"
}

# Update assignment status
PUT /api/mobile/job-assignments/{assignmentId}/status
Body: {
  "status": "accepted|started|paused|completed|cancelled",
  "staffId": "string",
  "location": { "lat": number, "lng": number },
  "notes": "string"
}
```

##### **🔔 Notifications APIs**
```bash
# Get notifications for staff
GET /api/mobile/notifications?staffId={staffId}&unreadOnly={boolean}&limit={number}

Response: {
  "success": true,
  "notifications": [{
    "id": "string",
    "type": "job_assignment|job_update|system_alert",
    "title": "string", 
    "message": "string",
    "isRead": "boolean",
    "createdAt": "timestamp",
    "data": {...}
  }]
}

# Acknowledge notification
POST /api/mobile/notifications/acknowledge
Body: {
  "notificationId": "string",
  "staffId": "string",
  "acknowledgedAt": "ISO string"
}
```

##### **🔄 Data Synchronization APIs**
```bash
# Comprehensive sync endpoint
POST /api/mobile/sync
Body: {
  "lastSyncTimestamp": "number",
  "staffId": "string",
  "deviceId": "string", 
  "platform": "mobile",
  "pendingChanges": {
    "jobs": [...],
    "assignments": [...],
    "locations": [...]
  }
}

Response: {
  "success": true,
  "data": {
    "jobs": [...],
    "assignments": [...], 
    "properties": [...],
    "notifications": [...],
    "lastSyncTimestamp": "number"
  },
  "conflicts": [...],
  "serverTimestamp": "number"
}
```

---

#### **2. General API Endpoints (Mobile Compatible)**

##### **🏢 Operational Tasks**
```bash
# Get operational tasks
GET /api/operational-tasks?staffId={staffId}&status={status}&property={propertyId}

# Create/Update task
POST /api/operational-tasks
Body: {
  "type": "checkin_prep|checkout_process|cleaning|inspection|maintenance",
  "propertyId": "string",
  "assignedStaffId": "string",
  "scheduledDate": "ISO string",
  "priority": "low|medium|high|urgent",
  "description": "string"
}
```

##### **🔧 Property Inspection**
```bash
# Submit inspection report
POST /api/inspection
Body: {
  "jobId": "string",
  "propertyId": "string", 
  "staffId": "string",
  "checklist": {
    "cleaning": { "score": number, "issues": [...] },
    "maintenance": { "score": number, "issues": [...] },
    "inventory": { "score": number, "missing": [...] }
  },
  "photos": ["url1", "url2"],
  "overallScore": "number",
  "notes": "string"
}
```

##### **📊 Audit Reporting**
```bash
# Generate mobile audit report
GET /api/mobile/audit-report?staffId={staffId}&startDate={date}&endDate={date}

Response: {
  "jobsCompleted": "number",
  "averageTime": "number", 
  "qualityScore": "number",
  "issuesReported": "number",
  "performanceMetrics": {...}
}
```

---

#### **3. Webhook Endpoints (Backend ↔ External Systems)**

##### **🏨 PMS Integration Webhook**
```bash
# Property Management System webhook receiver
POST /api/pms-webhook
Headers:
- X-Webhook-Token: {PMS_WEBHOOK_SECRET}
- X-Webhook-Timestamp: {unix_timestamp}

Body: {
  "externalBookingId": "string",
  "source": "airbnb|booking.com|vrbo",
  "action": "create|update|cancel",
  "propertyId": "string",
  "propertyName": "string", 
  "guestName": "string",
  "guestEmail": "string",
  "checkInDate": "ISO string",
  "checkOutDate": "ISO string",
  "totalPrice": "number",
  "specialRequests": "string"
}
```

##### **📋 Booking Approval Webhook**
```bash
# Booking approval workflow webhook
POST /api/booking-approval-webhook
Body: {
  "bookingId": "string",
  "action": "approved|rejected|pending",
  "reason": "string",
  "approvedBy": "string",
  "timestamp": "ISO string"
}
```

---

#### **4. Firebase Cloud Functions (Real-time)**

##### **📱 Push Notifications**
```bash
# Firebase Cloud Function: onJobAssigned
Trigger: Firestore document change in /jobs/{jobId}
Purpose: Sends push notifications when jobs are assigned

# Firebase Cloud Function: jobTimeoutMonitor  
Schedule: Every 5 minutes
Purpose: Monitors job timeouts and triggers escalations

# Firebase Cloud Function: onNotificationAcknowledged
Trigger: Firestore document change in /notifications/{notificationId}
Purpose: Updates notification status and cleanup
```

---

### 🔐 **Authentication & Security Requirements**

#### **1. API Authentication Methods**

##### **Mobile API Key Authentication**
```javascript
// Required headers for mobile API endpoints
const headers = {
  'X-API-Key': 'sia-moon-mobile-app-2025-secure-key',
  'X-Mobile-Secret': 'mobile-app-sync-2025-secure', 
  'Content-Type': 'application/json'
}
```

##### **Firebase Authentication (Required for all Firestore)**
```javascript
// Must authenticate user first
const user = await auth().signInWithEmailAndPassword(email, password)
const idToken = await user.getIdToken()

// Include in requests to Firestore
const headers = {
  'Authorization': `Bearer ${idToken}`,
  'Content-Type': 'application/json'
}
```

#### **2. Webhook Security**

##### **PMS Webhook Validation**
```javascript
// Webhook requests must include:
headers: {
  'X-Webhook-Token': process.env.PMS_WEBHOOK_SECRET,
  'X-Webhook-Timestamp': Date.now().toString()
}

// Backend validates:
// 1. Token matches configured secret
// 2. Timestamp within 5 minutes (replay protection)
// 3. Idempotency key prevents duplicates
```

---

### 📡 **Real-Time Connectivity**

#### **1. Firebase Realtime Listeners**

##### **Job Status Updates**
```javascript
// Listen for job changes
const unsubscribe = db.collection('jobs')
  .where('assignedStaffId', '==', staffId)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' || change.type === 'modified') {
        // Update mobile UI with job changes
        updateJobInUI(change.doc.data())
      }
    })
  })
```

##### **Notification Listeners**
```javascript
// Real-time notifications
const unsubscribe = db.collection('staff_notifications')
  .where('staffId', '==', staffId)
  .where('isRead', '==', false)
  .onSnapshot(snapshot => {
    snapshot.docs.forEach(doc => {
      const notification = doc.data()
      displayNotification(notification)
    })
  })
```

#### **2. Push Notification Integration**

##### **Firebase Cloud Messaging Setup**
```javascript
// Mobile app must register FCM token
import messaging from '@react-native-firebase/messaging'

// Register device token
const fcmToken = await messaging().getToken()

// Store token in Firestore for backend to use
await db.collection('staff_device_tokens').doc(staffId).set({
  deviceToken: fcmToken,
  platform: Platform.OS,
  lastActive: serverTimestamp(),
  notificationsEnabled: true
})

// Listen for push notifications
messaging().onMessage(async remoteMessage => {
  // Handle foreground notifications
  displayLocalNotification(remoteMessage)
})
```

---

### 🔄 **Data Flow Architecture**

#### **1. Mobile ↔ Backend Communication Pattern**

```mermaid
Mobile App → Firebase Auth → API Endpoint → Firestore → Cloud Function → Push Notification → Mobile App
```

#### **2. Webhook Integration Flow**

```mermaid
External PMS → Webhook → Backend Processing → Job Creation → Firebase → Mobile Sync
```

#### **3. Real-time Update Flow**

```mermaid
Admin/Web App → Firestore Update → Realtime Listener → Mobile App Update
```

---

### 📦 **Required Mobile App Dependencies**

#### **Firebase SDK**
```json
{
  "@react-native-firebase/app": "^18.6.1",
  "@react-native-firebase/auth": "^18.6.1", 
  "@react-native-firebase/firestore": "^18.6.1",
  "@react-native-firebase/messaging": "^18.6.1",
  "@react-native-firebase/storage": "^18.6.1"
}
```

#### **Location & GPS**
```json
{
  "@react-native-community/geolocation": "^3.0.6",
  "react-native-background-job": "^1.2.5",
  "react-native-background-task": "^0.2.1"
}
```

#### **HTTP & Networking**
```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

---

### 🧪 **Testing Endpoints**

#### **Test Mobile Integration**
```bash
# Test mobile simulator
POST /api/mobile/test-simulator
Body: {
  "staffId": "string",
  "simulateJobAssignment": true,
  "simulateLocationUpdate": true,
  "simulatePushNotification": true
}
```

#### **Health Check APIs**  
```bash
# Check API health
GET /api/health

# Check notification system
GET /api/health/notifications

# Check AI service
GET /api/health/ai-service
```

---

### 🔧 **Environment Variables (Mobile App)**

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id

# API Configuration  
API_BASE_URL=https://yourdomain.com/api
MOBILE_API_KEY=sia-moon-mobile-app-2025-secure-key
MOBILE_SECRET=mobile-app-sync-2025-secure

# Push Notifications
FCM_SERVER_KEY=your_fcm_server_key
```

---

### ⚡ **Performance Optimization**

#### **1. Data Caching Strategy**
- Cache job assignments locally
- Sync data when connectivity restored
- Use optimistic updates for better UX

#### **2. Background Tasks**
- Location updates every 30 seconds when active
- Job status sync every 2 minutes
- Push notification handling in background

#### **3. Offline Support**
- Queue API calls when offline
- Show cached data with offline indicator
- Auto-retry failed requests when online

---

This comprehensive integration guide covers **all connection points** between the mobile app and backend system. The mobile team should implement these APIs, authentication patterns, and real-time listeners to ensure full connectivity with the new security model.
