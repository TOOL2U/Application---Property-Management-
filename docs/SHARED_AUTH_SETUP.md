# Shared Authentication System Setup Guide

## 🎯 Overview

This guide walks you through setting up the new shared Firebase Auth + PIN-protected profiles system for the Sia Moon Property Management mobile app.

## 🏗️ System Architecture

### New Authentication Flow
```
1. User enters shared credentials (staff@siamoon.com / staff123)
2. Firebase Auth authenticates the shared account
3. App displays "Select Your Profile" screen with all staff profiles
4. User selects their profile and enters their 4-digit PIN
5. App verifies PIN against Firestore staff_accounts collection
6. User is authenticated and routed to their role-based dashboard
```

### Key Components
- **Shared Firebase Auth Account**: `staff@siamoon.com` / `staff123`
- **Staff Profiles**: Stored in Firestore `staff_accounts` collection
- **PIN Protection**: Each staff member has a unique 4-digit PIN
- **Role-Based Access**: Navigation and features based on staff role

## 🚀 Setup Steps

### Step 1: Create Shared Firebase Auth Account

1. **Option A: Firebase Console (Recommended)**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to your project → Authentication → Users
   - Click "Add User"
   - Email: `staff@siamoon.com`
   - Password: `staff123`
   - Click "Add User"

2. **Option B: Firebase CLI**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Create user (requires custom script)
   ```

### Step 2: Add PIN Fields to Staff Accounts

Run the provided script to add PIN fields to existing staff accounts:

```bash
node scripts/add-pin-fields.js
```

This script will:
- Add a `pin` field to each staff account
- Add a `photo` field (initially null)
- Set sample PIN codes for testing

### Step 3: Test the System

1. **Launch the mobile app**
   ```bash
   npm run dev
   ```

2. **Test shared login**
   - Email: `staff@siamoon.com`
   - Password: `staff123`
   - Should navigate to "Select Your Profile" screen

3. **Test profile selection**
   - Select any staff profile
   - Enter the PIN code (see console output from Step 2)
   - Should authenticate and navigate to dashboard

## 🔐 Default PIN Codes

After running the setup script, these PIN codes will be available for testing:

| Staff Member | Email | PIN | Role |
|--------------|-------|-----|------|
| Admin User | admin@siamoon.com | 1234 | admin |
| Test Manager | test@example.com | 5678 | manager |
| Alan Johnson | alan@example.com | 9999 | cleaner |
| Staff User | staff@example.com | 1111 | staff |

> **Note**: In production, staff members should set their own PIN codes through a secure process.

## 🛠️ Technical Implementation

### New Files Created
- `services/sharedAuthService.ts` - Shared authentication logic
- `components/auth/SelectStaffProfileScreen.tsx` - Profile selection UI
- `components/auth/PINEntryModal.tsx` - PIN entry interface
- `app/(auth)/select-profile.tsx` - Route for profile selection

### Modified Files
- `services/authService.ts` - Added PIN and photo fields to StaffAccount interface
- `contexts/AuthContext.tsx` - Added shared auth methods
- `components/auth/StaffLoginScreen.tsx` - Updated to handle shared login
- `app/(auth)/_layout.tsx` - Added new route

### Database Schema Changes
```typescript
// staff_accounts collection - new fields
interface StaffAccount {
  // ... existing fields
  pin?: string;        // 4-digit PIN code
  photo?: string;      // Profile photo URL
}
```

## 🔒 Security Considerations

### PIN Security
- PINs are stored as plain text in Firestore (consider hashing in production)
- Rate limiting on PIN attempts (3 attempts max)
- Account lockout after failed attempts
- Vibration feedback for incorrect PINs

### Firebase Security Rules
Update Firestore rules to protect staff data:

```javascript
// Allow read access to staff profiles for authenticated users
match /staff_accounts/{staffId} {
  allow read: if request.auth != null;
  allow write: if isAdmin() || resource.id == request.auth.uid;
}
```

### Session Management
- Shared Firebase Auth session for app-level authentication
- Individual staff selection stored locally
- Session persistence with secure storage
- Automatic logout on app backgrounding (optional)

## 🎨 User Experience Features

### Profile Selection Screen
- Grid layout of staff profiles with photos/initials
- Role and department display
- "Quick Access" badge for last used profile
- Pull-to-refresh functionality
- Empty state handling

### PIN Entry Modal
- Glassmorphism design matching app theme
- Number pad for PIN input
- Visual feedback with dots
- Error handling with retry attempts
- Auto-submit on 4-digit entry

### Remember Me Functionality
- Option to remember last selected profile
- Quick access indicator on profile cards
- Secure storage of preference

## 🧪 Testing Scenarios

### Happy Path
1. ✅ Shared login with correct credentials
2. ✅ Profile selection displays all active staff
3. ✅ PIN entry with correct PIN
4. ✅ Navigation to role-appropriate dashboard
5. ✅ Role-based feature access

### Error Handling
1. ❌ Invalid shared credentials
2. ❌ Network connectivity issues
3. ❌ Incorrect PIN (with retry logic)
4. ❌ Inactive staff accounts
5. ❌ Missing PIN data

### Edge Cases
1. 🔄 App backgrounding during PIN entry
2. 🔄 Firebase Auth session expiry
3. 🔄 Firestore connection issues
4. 🔄 Multiple rapid PIN attempts

## 🚀 Deployment Checklist

- [ ] Shared Firebase Auth account created
- [ ] PIN fields added to all staff accounts
- [ ] Firebase Security Rules updated
- [ ] Mobile app updated with new authentication flow
- [ ] Testing completed for all user roles
- [ ] Documentation updated
- [ ] Staff training on new login process

## 🔧 Troubleshooting

### Common Issues

**"Authentication failed" on shared login**
- Verify shared account exists in Firebase Auth
- Check credentials: `staff@siamoon.com` / `staff123`
- Ensure Firebase configuration is correct

**"No staff profiles found"**
- Verify staff_accounts collection exists in Firestore
- Check Firestore security rules allow read access
- Ensure staff accounts have `isActive: true`

**"No PIN set for this staff member"**
- Run the PIN setup script: `node scripts/add-pin-fields.js`
- Manually add PIN field to staff document in Firestore

**Profile selection screen shows empty**
- Check network connectivity
- Verify Firestore rules allow reading staff_accounts
- Check console for error messages

## 📞 Support

For technical support or questions about the shared authentication system:

1. Check the console logs for detailed error messages
2. Verify Firebase configuration and connectivity
3. Test with Firebase emulator for local development
4. Contact the development team for assistance

---

**Last Updated**: 2025-07-16  
**Version**: 1.0.0  
**Author**: Augment Agent
