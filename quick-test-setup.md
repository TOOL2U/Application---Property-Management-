# Quick Test Setup for Shared Authentication

## 🚀 Quick Start (5 minutes)

### Step 1: Create Shared Firebase Auth Account
**Option A: Firebase Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project → Authentication → Users
3. Click "Add User"
4. Email: `staff@siamoon.com`
5. Password: `staff123`
6. Click "Add User"

### Step 2: Add PIN Fields to Staff Accounts
```bash
# This adds PIN fields to existing staff accounts
node scripts/add-pin-fields.js
```

### Step 3: Test the App
```bash
# Start the mobile app
npm run dev
```

## 🧪 Testing the Sign-Out Flow

### Test Scenario 1: Switch Profile
1. **Login**: Use `staff@siamoon.com` / `staff123`
2. **Select Profile**: Choose any staff member and enter their PIN
3. **Navigate**: Go to Profile tab
4. **Sign Out**: Tap "Sign Out" → Choose "Switch Profile"
5. **Expected**: Should return to profile selection screen (no re-login needed)

### Test Scenario 2: Complete Sign Out
1. **From Profile Screen**: Tap "Sign Out" → Choose "Complete Sign Out"
2. **Expected**: Should return to login screen
3. **Verify**: Must enter `staff@siamoon.com` / `staff123` again

### Test Scenario 3: App Restart Behavior
1. **After Switch Profile**: Close app, reopen
   - **Expected**: Goes directly to profile selection
2. **After Complete Sign Out**: Close app, reopen
   - **Expected**: Goes to login screen

## 🔐 Default PIN Codes (After Setup)

| Staff Member | Email | PIN | Role |
|--------------|-------|-----|------|
| Admin User | admin@siamoon.com | 1234 | admin |
| Test Manager | test@example.com | 5678 | manager |
| Alan Johnson | alan@example.com | 9999 | cleaner |
| Staff User | staff@example.com | 1111 | staff |

## 🎯 What to Look For

### ✅ Success Indicators:
- Profile selection screen shows all staff with photos/initials
- PIN entry modal appears with number pad
- "Switch Profile" keeps you in the app without re-login
- "Complete Sign Out" requires full re-authentication
- Role-based navigation works after PIN verification

### ❌ Issues to Report:
- Navigation loops or stuck screens
- PIN verification failures
- Firebase Auth errors
- Missing staff profiles
- Incorrect role-based access

## 🔧 Troubleshooting

### "No staff profiles found"
- Verify Firestore `staff_accounts` collection exists
- Check that accounts have `isActive: true`
- Run PIN setup script again

### "Authentication failed"
- Verify shared account exists: `staff@siamoon.com`
- Check Firebase project configuration
- Ensure internet connectivity

### "No PIN set for this staff member"
- Run: `node scripts/add-pin-fields.js`
- Manually add PIN field in Firestore console

## 📱 User Experience Flow

```
Login Screen
    ↓ (staff@siamoon.com / staff123)
Profile Selection
    ↓ (Select staff + enter PIN)
Dashboard
    ↓ (Profile → Sign Out)
┌─────────────────────┐
│   Sign Out Options  │
├─────────────────────┤
│ • Switch Profile    │ → Back to Profile Selection
│ • Complete Sign Out │ → Back to Login Screen
└─────────────────────┘
```

## 🎉 Ready to Test!

The implementation provides:
- **Shared Authentication**: All staff use same credentials
- **Individual Profiles**: PIN-protected personal access
- **Flexible Sign-Out**: Switch profiles or complete logout
- **Role-Based Access**: Maintains existing permission system
- **Modern UI**: Glassmorphism design with smooth animations

**Time to test**: ~5 minutes setup + testing scenarios
