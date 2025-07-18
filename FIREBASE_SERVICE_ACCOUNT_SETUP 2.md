# Firebase Service Account Setup Guide

## Issue: Firebase Admin SDK Configuration

The `staff-fix.js` script requires Firebase Admin SDK access to create Firebase Auth accounts and update Firestore documents. This guide explains how to set up the required credentials.

## Option 1: Service Account Key File (Recommended)

### Step 1: Download Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **operty-b54dc**
3. Click gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### Step 2: Setup in Project
1. Rename downloaded file to: `firebase-admin-key.json`
2. Place in project root directory (same level as `staff-fix.js`)
3. **IMPORTANT:** Add to `.gitignore` to avoid committing credentials

```bash
# Add to .gitignore
echo "firebase-admin-key.json" >> .gitignore
```

### Step 3: Verify Setup
```bash
# Test the script
node staff-fix.js
```

## Option 2: Environment Variable

### Set Environment Variable:
```bash
# macOS/Linux
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-admin-key.json"

# Or add to your shell profile
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-admin-key.json"' >> ~/.zshrc
source ~/.zshrc
```

## Option 3: Application Default Credentials

If running on Google Cloud or have gcloud CLI configured:
```bash
gcloud auth application-default login
```

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment variables in production**
3. **Rotate keys regularly**
4. **Limit service account permissions to required scopes**

## Required Permissions

The service account needs these Firebase permissions:
- **Firebase Authentication Admin**: Create/manage users
- **Cloud Firestore User**: Read/write Firestore documents
- **Firebase Rules System**: Access security rules if needed

## Troubleshooting

### Error: "ENOENT: no such file or directory"
- Service account key file not found
- Check file path and name: `firebase-admin-key.json`

### Error: "Permission denied"
- Service account lacks required permissions
- Download a new key with proper roles

### Error: "Invalid key file"
- Downloaded file is corrupted
- Download fresh service account key from Firebase Console

### Error: "Project not found"
- Wrong project ID in the key file
- Ensure key is from **operty-b54dc** project

## Verification

Once setup is complete, test with:
```bash
node staff-fix.js
# Should show menu without credential errors
```

## Alternative: Manual Setup

If Firebase Admin setup fails, you can manually:

1. **Create Firebase Auth accounts via Firebase Console**
2. **Copy the UIDs**
3. **Update staff documents in Firestore Console**

This is slower but works without Admin SDK setup.

## Need Help?

If you continue having issues:
1. Check Firebase Console for project access
2. Verify you're an owner/editor of the Firebase project
3. Try downloading a fresh service account key
4. Contact Firebase support if permissions issues persist
