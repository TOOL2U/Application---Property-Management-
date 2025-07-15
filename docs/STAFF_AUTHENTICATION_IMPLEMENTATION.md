# Staff Authentication System Implementation

## 🎯 Overview

This document outlines the complete implementation of the staff authentication system for the Sia Moon Property Management React Native mobile application. The system integrates with the existing Firebase Firestore `staff_accounts` collection and provides secure, role-based authentication.

## 🏗️ Architecture

### Authentication Flow
```
Mobile App → AuthService → Firebase Firestore → staff_accounts collection
                ↓
            bcrypt verification → Session creation → Secure storage
```

### Key Components
1. **AuthService** - Core authentication logic
2. **AuthContext** - App-wide authentication state management
3. **StaffLoginScreen** - User interface for authentication
4. **SecureStorage** - Secure token and session management
5. **useStaffAuth** - Enhanced authentication hook with role-based utilities

## 🔐 Security Features

### Password Security
- **bcrypt hashing** with 12 salt rounds
- **No plain text passwords** stored anywhere
- **Secure password verification** using bcrypt.compare()

### Session Management
- **24-hour session duration** with automatic expiration
- **Secure token storage** using Keychain (iOS) / Keystore (Android)
- **Session validation** on app startup and periodic refresh
- **Automatic session cleanup** on expiration

### Rate Limiting
- **Maximum 5 failed attempts** per email address
- **15-minute lockout** after exceeding attempts
- **Attempt tracking** with automatic cleanup

### Data Protection
- **Sensitive data encryption** using device secure storage
- **No password hashes** exposed to client code
- **Secure error messages** without system details

## 📱 Implementation Details

### 1. Firebase Configuration
```typescript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};
```

### 2. Authentication Service
```typescript
// services/authService.ts
class AuthService {
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    // Rate limiting check
    // User lookup in staff_accounts collection
    // Password verification with bcrypt
    // Session creation and storage
    // Last login timestamp update
  }
}
```

### 3. Authentication Context
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: StaffUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // ... other properties
}
```

### 4. Login Screen
```typescript
// components/auth/StaffLoginScreen.tsx
export default function StaffLoginScreen() {
  // Form validation
  // Error handling
  // Loading states
  // Secure input handling
}
```

## 🎭 Role-Based Access Control

### Supported Roles
- **admin** - Full system access
- **manager** - Property and staff management
- **maintenance** - Maintenance task management
- **cleaner** - Cleaning task management
- **staff** - Basic task access

### Permission System
```typescript
const ROLE_PERMISSIONS = {
  admin: ['manage_users', 'manage_properties', 'view_reports', ...],
  manager: ['manage_properties', 'assign_tasks', 'view_reports', ...],
  maintenance: ['view_maintenance_tasks', 'update_task_status', ...],
  cleaner: ['view_cleaning_tasks', 'update_task_status', ...],
  staff: ['view_assigned_tasks', 'update_task_status', ...]
};
```

### Usage Example
```typescript
const { hasRole, hasPermission, isAdmin } = useStaffAuth();

if (hasRole('admin')) {
  // Show admin features
}

if (hasPermission('manage_users')) {
  // Show user management
}
```

## 🗄️ Database Schema

### staff_accounts Collection
```json
{
  "id": "document_id",
  "email": "admin@siamoon.com",
  "passwordHash": "$2b$12$...",
  "name": "Admin User",
  "phone": "+1234567890",
  "role": "admin",
  "department": "Management",
  "isActive": true,
  "lastLogin": "2025-07-15T12:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-07-15T12:00:00Z"
}
```

## 🔧 Configuration

### Environment Variables
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Development Settings
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native-keychain": "^8.2.0",
  "firebase": "^10.14.1"
}
```

## 🧪 Testing

### Test Coverage
- ✅ Firebase connection
- ✅ Staff accounts collection structure
- ✅ Admin user authentication
- ✅ Role-based access control
- ✅ Password security (bcrypt)
- ✅ Session management

### Test Credentials
```
Email: admin@siamoon.com
Password: admin123
Role: admin
```

### Running Tests
```bash
node test-staff-auth-system.js
```

## 🚀 Usage Guide

### 1. Login Process
1. User enters email and password
2. Form validation occurs
3. AuthService authenticates against staff_accounts
4. Session is created and stored securely
5. User is redirected to main app

### 2. Session Management
- Sessions automatically validate on app startup
- Periodic refresh every 30 minutes
- Automatic logout on session expiration
- Manual logout clears all stored data

### 3. Role-Based Features
```typescript
// Component with role protection
const AdminPanel = withRoleAccess(
  AdminPanelComponent,
  'admin',
  UnauthorizedComponent
);

// Permission-based rendering
const { hasPermission } = usePermission('manage_users');
if (hasPermission) {
  return <UserManagementButton />;
}
```

## 🔒 Security Best Practices

### Implemented
- ✅ bcrypt password hashing
- ✅ Secure session storage
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error message sanitization
- ✅ Automatic session expiration

### Recommendations
- 🔧 Implement password complexity requirements
- 🔧 Add two-factor authentication
- 🔧 Monitor authentication logs
- 🔧 Regular security audits
- 🔧 Implement password reset flow

## 🐛 Troubleshooting

### Common Issues

#### Authentication Fails
- Check Firebase configuration
- Verify staff_accounts collection exists
- Ensure user has passwordHash field
- Check network connectivity

#### Session Not Persisting
- Verify AsyncStorage permissions
- Check Keychain/Keystore availability
- Ensure session expiration logic

#### Role-Based Access Not Working
- Verify user role in database
- Check permission mappings
- Ensure AuthContext is properly wrapped

### Debug Commands
```bash
# Test Firebase connection
node test-staff-auth-system.js

# Check environment variables
expo config

# View logs
expo start --clear
```

## 📞 Support

For technical support or questions about the authentication system:

1. Check this documentation
2. Review test results
3. Check Firebase console logs
4. Contact development team

## 🔄 Updates

### Version 2.0.0 (Current)
- ✅ Complete staff authentication system
- ✅ Role-based access control
- ✅ Secure session management
- ✅ Rate limiting protection
- ✅ Comprehensive testing

### Future Enhancements
- 🔮 Two-factor authentication
- 🔮 Biometric authentication
- 🔮 Password reset flow
- 🔮 Advanced audit logging
- 🔮 Single sign-on (SSO) integration
