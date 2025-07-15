# Staff Accounts Authentication System

## Overview

The Sia Moon Property Management application now uses the `staff_accounts` Firestore collection as the **single source of truth** for all authentication and user profile data. This system provides secure, role-based authentication with proper password hashing.

## 🏗️ Architecture

### Collection Structure: `staff_accounts`

```json
{
  "email": "shaun@siamoon.com",
  "passwordHash": "$2a$12$...", // bcrypt hash
  "name": "Shaun Ducker",
  "phone": "0933880630",
  "address": "50/2 moo 6, Koh Phangan, Surat Thani 84280",
  "role": "admin", // admin | manager | cleaner | maintenance | staff
  "department": "Management",
  "isActive": true,
  "createdAt": "2025-01-15T12:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z",
  "lastLogin": "2025-01-15T12:00:00Z"
}
```

### Key Features

- ✅ **Secure Password Hashing**: Uses bcrypt with 12 salt rounds
- ✅ **Role-Based Access**: Admin, Manager, Cleaner, Maintenance, Staff roles
- ✅ **Session Management**: 24-hour session expiration
- ✅ **Detailed Logging**: Comprehensive authentication logging
- ✅ **Error Handling**: Graceful fallbacks and user-friendly error messages
- ✅ **Firestore Security Rules**: Proper access control

## 🔐 Authentication Flow

1. **User Login**: Email and password submitted
2. **Database Query**: Search `staff_accounts` for active user by email
3. **Password Verification**: Compare password with bcrypt hash
4. **Session Creation**: Generate 24-hour session token
5. **Role Assignment**: Store user role in auth context
6. **Last Login Update**: Update timestamp in Firestore

## 🛠️ Implementation

### AuthService (`services/authService.ts`)

```typescript
import { authService } from '../services/authService';

// Authenticate user
const result = await authService.authenticateUser(email, password);
if (result.success) {
  console.log('User authenticated:', result.user);
  console.log('Role:', result.user.role);
}

// Get user by email
const user = await authService.getUserByEmail('user@example.com');

// Create new staff account (admin only)
const newUser = await authService.createStaffAccount({
  email: 'new@example.com',
  password: 'securepassword',
  name: 'New User',
  role: 'staff'
});
```

### AuthContext (`contexts/AuthContext.tsx`)

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, userRole, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password');
      console.log('Logged in as:', userRole);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

## 🧪 Testing

### Test Users

The system includes pre-configured test users:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `shaun@siamoon.com` | `admin123` | admin | System administrator |
| `manager@siamoon.com` | `manager123` | manager | Property manager |
| `cleaner@siamoon.com` | `cleaner123` | cleaner | Housekeeping staff |
| `maintenance@siamoon.com` | `maintenance123` | maintenance | Maintenance staff |
| `test@exam.com` | `password123` | staff | General test user |

### Test Scripts

```bash
# Create test users in emulator
node scripts/create-test-users.js

# Test authentication system
node scripts/test-auth-system.js

# Migrate from old collection (if needed)
node scripts/migrate-staff-accounts.js
```

## 🔒 Security Rules

Firestore security rules for `staff_accounts`:

```javascript
match /staff_accounts/{staffId} {
  // Users can read their own profile
  allow read: if request.auth != null && request.auth.uid == staffId;
  
  // Admins can read all profiles
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/staff_accounts/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/staff_accounts/$(request.auth.uid)).data.role == 'admin';
  
  // Users can update their own profile (excluding sensitive fields)
  allow update: if request.auth != null && 
    request.auth.uid == staffId &&
    !('passwordHash' in request.resource.data) &&
    !('role' in request.resource.data);
  
  // Only admins can create/delete accounts
  allow create, delete: if request.auth != null && 
    exists(/databases/$(database)/documents/staff_accounts/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/staff_accounts/$(request.auth.uid)).data.role == 'admin';
}
```

## 🚀 Deployment

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Create Staff Accounts

Use the Firebase Console or emulator UI to create staff accounts with proper password hashes.

### 3. Test Authentication

```bash
# Start emulators
firebase emulators:start

# Test in application
npm run dev
```

## 📱 Usage in Application

### Login Screen

The login screen automatically uses the new authentication system:

1. User enters email and password
2. System queries `staff_accounts` collection
3. Password is verified using bcrypt
4. User role is stored in auth context
5. Session is created with 24-hour expiration

### Role-Based Features

```typescript
const { userRole } = useAuth();

// Show admin features
if (userRole === 'admin') {
  return <AdminPanel />;
}

// Show manager features
if (userRole === 'manager') {
  return <ManagerDashboard />;
}

// Show staff features
return <StaffInterface />;
```

## 🔧 Migration from Old System

If migrating from an existing authentication system:

1. **Backup existing data**
2. **Run migration script**: `node scripts/migrate-staff-accounts.js`
3. **Update security rules**: `firebase deploy --only firestore:rules`
4. **Test thoroughly** with existing users
5. **Update application code** to use new AuthContext

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**: Check Firestore security rules
2. **User Not Found**: Verify email exists in `staff_accounts`
3. **Password Mismatch**: Ensure password is properly hashed
4. **Session Expired**: Check 24-hour session timeout

### Debug Logging

Enable detailed logging in the console:

```typescript
// Check authentication logs
console.log('🔐 AuthService: Authenticating user:', email);
console.log('✅ AuthContext: Authentication successful');
console.log('👤 User role:', userRole);
```

## 📞 Support

For issues with the authentication system:

1. Check the console logs for detailed error messages
2. Verify Firebase emulator is running (for development)
3. Ensure Firestore rules are properly deployed
4. Contact system administrator for account issues

---

**Note**: This authentication system is designed for staff access only. Customer/guest authentication should use a separate system.
