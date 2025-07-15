# Sia Moon Property Management - Mobile App

A professional mobile application for property management staff, featuring secure Firebase Firestore authentication and comprehensive property management tools.

## 🔐 Authentication System

### Overview
This application uses Firebase Firestore for authentication, connecting to a "staff accounts" collection where user credentials are managed through a separate web application.

### Features
- **Secure Authentication**: Firebase Firestore-based authentication system
- **Session Management**: 24-hour session expiration with automatic renewal
- **Role-Based Access**: Support for staff and admin roles
- **Professional UI**: Clean, modern sign-in interface with form validation
- **Error Handling**: Comprehensive error handling for network issues and invalid credentials
- **Loading States**: Visual feedback during authentication attempts
- **Offline Support**: Cached authentication with session validation

### Staff Accounts Collection Structure
```javascript
{
  email: "user@company.com",
  password: "hashed_password", // In production, use proper password hashing
  firstName: "John",
  lastName: "Doe",
  role: "staff" | "admin",
  department: "Maintenance",
  isActive: true,
  lastLogin: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🚀 Setup Instructions

### 1. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a "staff accounts" collection
4. Copy your Firebase configuration

### 2. Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
```bash
npm run dev
```

## 📱 Authentication Flow

### Sign In Process
1. User enters email and password
2. App validates form inputs
3. Queries Firestore "staff accounts" collection
4. Verifies credentials and account status
5. Creates secure session with 24-hour expiration
6. Stores user data locally with AsyncStorage
7. Updates last login timestamp in Firestore
8. Redirects to main application

### Session Management
- Sessions expire after 24 hours
- Automatic session validation on app launch
- Secure storage using AsyncStorage
- Automatic cleanup on sign out

### Security Features
- Input validation and sanitization
- Secure credential handling
- Network error handling
- Rate limiting protection
- Session expiration management
- Secure storage encryption

## 🛠 Technical Implementation

### Key Components
- **AuthContext**: Centralized authentication state management
- **AuthService**: Firebase Firestore authentication logic
- **Storage**: Secure local storage utilities
- **LoginScreen**: Professional sign-in interface

### Authentication Context
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
}
```

### Error Handling
- Network connectivity issues
- Invalid credentials
- Firebase service errors
- Session expiration
- Account deactivation

## 🔒 Security Best Practices

### Implemented Security Measures
- Secure credential transmission
- Session timeout management
- Input validation and sanitization
- Error message standardization
- Secure local storage
- Network security checks

### Recommended Production Enhancements
- Implement proper password hashing (bcrypt, Argon2)
- Add multi-factor authentication
- Implement rate limiting
- Add audit logging
- Use Firebase Security Rules
- Implement certificate pinning

## 📊 Monitoring and Logging

### Authentication Logging
- Successful sign-ins
- Failed authentication attempts
- Session management events
- Network connectivity issues
- Error tracking and reporting

### Debug Information
- Firebase connection status
- Authentication flow tracking
- Storage operations
- Network request monitoring

## 🎨 UI/UX Features

### Professional Design
- Modern, clean interface
- Neumorphic design elements
- Responsive layout
- Loading states and animations
- Error feedback
- Accessibility support

### Form Validation
- Real-time input validation
- Clear error messages
- Visual feedback
- Keyboard optimization
- Auto-complete support

## 📝 Development Notes

### Testing Accounts
For development and testing, you can create test accounts in your Firestore "staff accounts" collection:

```javascript
// Staff Account
{
  email: "staff@company.com",
  password: "password123",
  firstName: "John",
  lastName: "Staff",
  role: "staff",
  isActive: true
}

// Admin Account
{
  email: "admin@company.com",
  password: "admin123",
  firstName: "Jane",
  lastName: "Admin",
  role: "admin",
  isActive: true
}
```

### Firebase Rules
Implement proper Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /staff accounts/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Configure production Firebase project
- [ ] Implement proper password hashing
- [ ] Set up Firebase Security Rules
- [ ] Configure environment variables
- [ ] Enable Firebase Analytics
- [ ] Set up error monitoring
- [ ] Configure push notifications
- [ ] Test authentication flow
- [ ] Verify session management
- [ ] Test offline functionality

## 📞 Support

For technical support or questions about the authentication system:
- Email: support@siamoon.com
- Documentation: [Internal Wiki]
- Emergency: Contact system administrator

---

**Note**: This authentication system is designed for internal staff use only. All user accounts must be created through the administrative web interface.
