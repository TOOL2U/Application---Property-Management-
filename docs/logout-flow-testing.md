# Logout Flow Testing Guide

## Overview of Changes

The logout functionality has been enhanced to ensure proper authentication flow and user experience. The following changes have been implemented:

### 1. Firebase Authentication Logout
- Enhanced `signOut()` method in `AuthContext` to properly clear Firebase authentication state
- Added comprehensive error handling with user feedback
- Ensured complete session cleanup including Firebase signOut call
- Added additional storage cleanup to remove all user-related data

### 2. Navigation Flow After Logout
- Updated profile screen logout to navigate to profile selection screen instead of login
- Used `router.replace()` to clear navigation stack and prevent back navigation
- Ensured navigation occurs only after successful Firebase logout completion
- Added error handling to ensure navigation happens even if there are errors

### 3. Logout Transition Animations
- Added smooth fadeOut animation (600ms) during logout process
- Implemented loading state with visual feedback using ActivityIndicator
- Ensured animations don't interfere with navigation flow
- Disabled all buttons during logout process to prevent user interaction

### 4. AuthService Firebase Integration
- Enhanced `authService.signOut()` to include proper documentation
- Improved `sharedAuthService.signOutShared()` to handle Firebase signOut with better error handling
- Maintained backward compatibility with existing session clearing logic
- Added additional checks to ensure Firebase Auth is available before calling signOut

### 5. Authentication Route Guards
- Enhanced auth layout to properly redirect unauthenticated users
- Added loading screen to prevent content flash during authentication checks
- Improved logging for better debugging
- Added additional checks for edge cases in authentication state

## Testing Instructions

### Test Case 1: Normal Logout Flow
1. Log in to the app with valid credentials
2. Navigate to the Profile screen
3. Click the "Sign Out" button
4. Confirm the confirmation dialog appears
5. Click "Sign Out" in the dialog
6. Verify:
   - Loading animation appears on the Sign Out button
   - Fadeout animation plays
   - Navigation redirects to profile selection screen
   - Cannot navigate back to authenticated screens

### Test Case 2: Logout with Network Issues
1. Enable airplane mode or disable network connection
2. Log in to the app with valid credentials
3. Navigate to the Profile screen
4. Click the "Sign Out" button
5. Confirm the confirmation dialog appears
6. Click "Sign Out" in the dialog
7. Verify:
   - Error handling works properly
   - User is still logged out (local state cleared)
   - Navigation redirects to profile selection screen
   - Error message is displayed to the user

### Test Case 3: Cold Start After Logout
1. Complete a successful logout
2. Close the app completely
3. Reopen the app
4. Verify:
   - App starts at the profile selection screen
   - Cannot access authenticated content
   - Firebase authentication state is properly cleared

### Test Case 4: Profile Selection After Logout
1. Complete a successful logout
2. On the profile selection screen, select a staff profile
3. Verify:
   - Can successfully log back in with a different profile
   - All previous user data is cleared
   - New profile data is loaded correctly

## Implementation Details

### Key Files Modified:
1. `contexts/AuthContext.tsx` - Enhanced signOut method
2. `app/(tabs)/profile.tsx` - Updated logout button and navigation
3. `app/(auth)/_layout.tsx` - Improved authentication guards
4. `services/authService.ts` - Updated signOut documentation
5. `services/sharedAuthService.ts` - Enhanced Firebase signOut handling

### Authentication Flow:
```
User clicks Sign Out
  ↓
Confirmation dialog
  ↓
Start loading animation
  ↓
Call AuthContext.signOut()
  ↓
Clear individual staff session (authService.signOut)
  ↓
Clear Firebase Auth (sharedAuthService.signOutShared)
  ↓
Clear all local state and storage
  ↓
Navigate to profile selection screen
```

## Troubleshooting

If you encounter issues with the logout flow:

1. Check browser console or device logs for error messages
2. Verify that Firebase Auth is properly initialized
3. Check if AsyncStorage is clearing properly
4. Ensure navigation is working correctly
5. Verify that the auth layout is correctly detecting authentication state

For persistent issues, try clearing all storage and cache:
- In web: Clear browser storage
- In mobile: Clear app data or reinstall the app
