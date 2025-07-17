# Sign-Out Flow Testing Guide

## 🎯 Overview

This guide tests the new sign-out behavior where staff members can either:
1. **Switch Profile**: Stay logged into shared Firebase Auth, return to profile selection
2. **Complete Sign Out**: Sign out of everything, return to login screen

## 🔄 New Sign-Out Flow

### Current Implementation

When a staff member taps "Sign Out" in their profile, they now see **two options**:

```
┌─────────────────────────────┐
│        Sign Out Options     │
├─────────────────────────────┤
│                             │
│  Choose how you want to     │
│  sign out:                  │
│                             │
│  [Cancel]                   │
│  [Switch Profile]           │
│  [Complete Sign Out]        │
│                             │
└─────────────────────────────┘
```

### Option 1: Switch Profile
- **Action**: `signOutToProfileSelection()`
- **Behavior**: 
  - Clears individual staff session
  - Keeps shared Firebase Auth active (`staff@siamoon.com` stays logged in)
  - Clears selected staff data
  - Redirects to "Select Your Profile" screen
- **Result**: User can immediately select a different profile without re-entering shared credentials

### Option 2: Complete Sign Out
- **Action**: `signOut()`
- **Behavior**:
  - Clears individual staff session
  - Signs out from shared Firebase Auth completely
  - Clears all auth state
  - Redirects to login screen
- **Result**: User must enter `staff@siamoon.com / staff123` again

## 🧪 Testing Scenarios

### Test 1: Switch Profile Flow
1. **Setup**: Login with shared credentials and select a staff profile
2. **Action**: Go to Profile → Sign Out → "Switch Profile"
3. **Expected Result**: 
   - Should redirect to "Select Your Profile" screen
   - Should see all staff profiles available
   - Should NOT need to enter shared credentials again
   - Should be able to select a different profile immediately

### Test 2: Complete Sign Out Flow
1. **Setup**: Login with shared credentials and select a staff profile
2. **Action**: Go to Profile → Sign Out → "Complete Sign Out"
3. **Expected Result**:
   - Should redirect to login screen
   - Should need to enter `staff@siamoon.com / staff123` again
   - Should go through full authentication flow

### Test 3: Navigation Logic
1. **Test App Restart After Switch Profile**:
   - Switch profile (don't complete sign out)
   - Close and restart app
   - **Expected**: Should go directly to profile selection (shared auth preserved)

2. **Test App Restart After Complete Sign Out**:
   - Complete sign out
   - Close and restart app
   - **Expected**: Should go to login screen

### Test 4: Firebase Auth State
1. **During Switch Profile**:
   - Check Firebase Auth state: Should remain `staff@siamoon.com`
   - Check app auth state: Should be `isAuthenticated: false`
   - Check navigation: Should be on profile selection screen

2. **During Complete Sign Out**:
   - Check Firebase Auth state: Should be `null`
   - Check app auth state: Should be `isAuthenticated: false`
   - Check navigation: Should be on login screen

## 🔍 Debug Information

### Console Logs to Watch For

**Switch Profile Flow:**
```
🔄 AuthContext: Signing out to profile selection...
✅ AuthService: Individual session cleared
✅ SharedAuthService: Selected staff cleared
✅ AuthContext: Signed out to profile selection - shared auth preserved
🔄 AuthLayout: Shared auth active, redirecting to profile selection
```

**Complete Sign Out Flow:**
```
👋 AuthContext: Starting sign out process...
✅ AuthService: Sign out completed
✅ SharedAuthService: Sign out completed
✅ AuthContext: Sign out completed - all auth state cleared
🔐 AuthLayout: No auth, staying on login
```

### Firebase Auth State Monitoring

The auth layout now monitors Firebase Auth state:
```typescript
auth.onAuthStateChanged((user) => {
  const isSharedAuth = user?.email === 'staff@siamoon.com';
  // Navigation logic based on shared auth state
});
```

## 🎯 Expected User Experience

### For Staff Members:
1. **Quick Profile Switching**: Can easily switch between staff profiles without re-entering shared credentials
2. **Complete Privacy**: Can fully sign out when leaving the device
3. **Clear Options**: Understand the difference between switching profiles and signing out completely

### For Administrators:
1. **Shared Device Support**: Multiple staff can use the same device efficiently
2. **Security Control**: Complete sign out ensures no residual access
3. **Audit Trail**: Different sign-out methods can be logged differently

## 🚀 Implementation Details

### New AuthContext Methods:
- `signOutToProfileSelection()`: Partial sign out for profile switching
- `signOut()`: Complete sign out (unchanged behavior)

### Navigation Logic:
- **Authenticated User**: `/(tabs)` (dashboard)
- **Shared Auth Active + No Profile**: `/(auth)/select-profile`
- **No Auth**: `/(auth)/login`

### Storage Management:
- **Switch Profile**: Clears selected staff ID, preserves shared auth session
- **Complete Sign Out**: Clears everything including Firebase Auth session

## ✅ Success Criteria

The implementation is successful if:
1. ✅ Staff can switch profiles without re-entering shared credentials
2. ✅ Staff can completely sign out and return to login screen
3. ✅ Navigation correctly handles both scenarios
4. ✅ Firebase Auth state is properly managed
5. ✅ App restart behavior is correct for both scenarios
6. ✅ No authentication state leaks between different sign-out methods

## 🐛 Potential Issues to Watch For

1. **Navigation Loops**: Ensure auth layout doesn't cause infinite redirects
2. **State Persistence**: Verify shared auth state survives app restarts
3. **Memory Leaks**: Ensure proper cleanup of auth listeners
4. **Race Conditions**: Handle rapid sign-out/sign-in scenarios
5. **Error Handling**: Graceful handling of Firebase Auth errors

---

**Ready for Testing!** 🎉

The new sign-out flow provides flexibility for both quick profile switching and complete security sign-out, making the app more user-friendly for shared device scenarios while maintaining security.
