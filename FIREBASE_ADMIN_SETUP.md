# Firebase Admin SDK Setup Guide

This guide explains how to set up and use Firebase Admin SDK for server-side operations in your Sia Moon Property Management app.

## 🔧 Configuration

### 1. Environment Variables

The following environment variables have been added to your `.env.local` file:

```bash
# Firebase Admin SDK Configuration
FIREBASE_ADMIN_DATABASE_URL=https://operty-b54dc-default-rtdb.firebaseio.com
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY=xpUSYFIvNKD7Cmx7trScX2ph2pqT8SKgETyr7gJP
FIREBASE_ADMIN_PROJECT_ID=operty-b54dc
```

### 2. Service Account Key

You have two options for providing the service account key:

#### Option A: Direct Key (Current Setup)
```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY=xpUSYFIvNKD7Cmx7trScX2ph2pqT8SKgETyr7gJP
```

#### Option B: Service Account File Path
```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json
```

## 📁 Files Created

### 1. `lib/firebaseAdmin.ts`
- Main Firebase Admin SDK configuration
- Helper functions for common operations
- TypeScript support

### 2. `scripts/firebase-admin-example.js`
- Example script showing how to use Firebase Admin
- Demonstrates common operations like user management, notifications, etc.

## 🚀 Usage Examples

### Initialize Firebase Admin

```javascript
import { initializeFirebaseAdmin } from './lib/firebaseAdmin';

// Initialize once at app startup
initializeFirebaseAdmin();
```

### Common Operations

#### 1. User Management
```javascript
import { getAuthAdmin, setCustomUserClaims } from './lib/firebaseAdmin';

// Set user role
await setCustomUserClaims('user123', { 
  role: 'admin', 
  permissions: ['read', 'write', 'delete'] 
});

// List all users
const auth = getAuthAdmin();
const users = await auth.listUsers(100);
```

#### 2. Firestore Operations
```javascript
import { getFirestoreAdmin } from './lib/firebaseAdmin';

const firestore = getFirestoreAdmin();

// Bulk operations
const batch = firestore.batch();
// ... add operations to batch
await batch.commit();
```

#### 3. Push Notifications
```javascript
import { sendMulticastNotification } from './lib/firebaseAdmin';

await sendMulticastNotification(
  ['device_token_1', 'device_token_2'],
  { title: 'New Job Assigned', body: 'You have a new cleaning job' },
  { jobId: 'job123', type: 'cleaning' }
);
```

## 🧪 Testing

Run the example script to test your configuration:

```bash
node scripts/firebase-admin-example.js
```

This will:
- Initialize Firebase Admin SDK
- List all users
- Get staff accounts from Firestore
- Show example operations

## 🔐 Security Notes

### Important Security Considerations:

1. **Never expose admin credentials in client-side code**
2. **Use environment variables for sensitive data**
3. **Restrict service account permissions to minimum required**
4. **Use different service accounts for different environments**

### Production Setup:

For production, consider:
- Using Google Cloud Secret Manager
- Setting up proper IAM roles
- Using service account impersonation
- Implementing proper logging and monitoring

## 📋 Common Use Cases

### 1. Role-Based Access Control
```javascript
// Set user roles after registration
await setCustomUserClaims(userId, { role: 'staff' });

// Verify user permissions in API endpoints
const decodedToken = await verifyIdToken(idToken);
const userRole = decodedToken.role;
```

### 2. Bulk Data Operations
```javascript
// Bulk update staff accounts
const batch = firestore.batch();
staffAccounts.forEach(account => {
  const ref = firestore.collection('staff_accounts').doc(account.id);
  batch.update(ref, { lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
});
await batch.commit();
```

### 3. Push Notifications for Job Updates
```javascript
// Notify staff when new job is assigned
await sendMulticastNotification(
  staffTokens,
  { 
    title: 'New Job Assignment', 
    body: `New ${jobType} job at ${propertyAddress}` 
  },
  { 
    jobId: job.id, 
    type: 'job_assignment',
    priority: job.priority 
  }
);
```

## 🛠️ Integration with Your App

### API Routes (if using Next.js API routes)
```javascript
// pages/api/admin/users.js
import { getAuthAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  try {
    const auth = getAuthAdmin();
    const users = await auth.listUsers();
    res.json({ users: users.users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Server-side Functions
```javascript
// For scheduled tasks, webhooks, etc.
import { getFirestoreAdmin } from './lib/firebaseAdmin';

export async function processJobAssignments() {
  const firestore = getFirestoreAdmin();
  // Process job assignments logic
}
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Service account key not found"**
   - Check that your service account key is properly set in environment variables
   - Verify the key format (should be valid JSON or base64 encoded)

2. **"Permission denied"**
   - Ensure your service account has the necessary permissions
   - Check Firebase project settings and IAM roles

3. **"Project not found"**
   - Verify the project ID in your configuration
   - Ensure you're using the correct Firebase project

### Debug Mode:
Enable debug logging by setting:
```bash
DEBUG=firebase-admin:*
```

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Service Account Key Management](https://cloud.google.com/iam/docs/service-accounts)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## 🎯 Next Steps

1. **Test the configuration** using the example script
2. **Set up proper service account permissions** in Firebase Console
3. **Implement role-based access control** for your staff users
4. **Set up push notifications** for job assignments
5. **Create admin API endpoints** for bulk operations

---

**Note**: The service account key provided (`xpUSYFIvNKD7Cmx7trScX2ph2pqT8SKgETyr7gJP`) appears to be a partial key. You'll need to replace this with your complete service account JSON key from the Firebase Console.
