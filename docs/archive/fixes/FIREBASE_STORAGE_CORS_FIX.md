# Firebase Storage Upload Error - Troubleshooting Guide

## Current Error
```
ERROR ❌ JobService: Error uploading photo: 
[FirebaseError: Firebase Storage: An unknown error occurred, 
please check the error payload for server response. (storage/unknown)]
```

## Root Cause Analysis

The `storage/unknown` error typically indicates one of these issues:

### 1. CORS Configuration Missing ⚠️
Firebase Storage requires CORS configuration for web/mobile uploads.

### 2. Storage Bucket Not Properly Initialized
The bucket might exist but not be fully configured.

### 3. Authentication Token Issue
The auth token might not be properly attached to the request.

---

## Diagnostic Steps

### Step 1: Verify Storage Bucket Configuration

1. **Go to Firebase Console Storage**
   - URL: https://console.firebase.google.com/project/operty-b54dc/storage

2. **Check Bucket Name**
   - Should be: `operty-b54dc.appspot.com`
   - Verify it matches the `.env.local` file

3. **Check Location**
   - Note the region (e.g., `us-central1`)
   - Cannot be changed after creation

### Step 2: Configure CORS (Critical!)

Firebase Storage needs CORS configuration to allow uploads from mobile apps.

**Option A: Using gsutil (Recommended)**

1. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from:
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project operty-b54dc
   ```

3. **Create CORS Configuration File**
   
   Create file `cors.json`:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Authorization"]
     }
   ]
   ```

4. **Apply CORS Configuration**
   ```bash
   gsutil cors set cors.json gs://operty-b54dc.appspot.com
   ```

5. **Verify CORS Configuration**
   ```bash
   gsutil cors get gs://operty-b54dc.appspot.com
   ```

**Option B: Using Firebase Console**

Unfortunately, CORS cannot be configured directly in Firebase Console. You must use gsutil.

### Step 3: Verify Storage Rules

1. **Check Rules in Console**
   - Go to: https://console.firebase.google.com/project/operty-b54dc/storage/rules
   
2. **Verify Rules Are Active**
   - Should show green checkmark
   - Last updated: Recent timestamp

3. **Test Rules**
   - Use "Rules Playground" in console
   - Test path: `/job_photos/testjob/test.jpg`
   - Operation: `create`
   - Should show "Allowed"

### Step 4: Check Authentication

1. **Verify User is Logged In**
   - Check console logs for auth state
   - Should see user UID in logs

2. **Check Auth Token**
   - Token should be automatically attached
   - Firebase SDK handles this

### Step 5: Test with Simpler Path

Try uploading to root level first:

**Temporary Test Code** (for debugging):
```typescript
// In jobService.ts, temporarily change path:
const photoRef = ref(storageInstance, filename);  // Root level
// Instead of:
// const photoRef = ref(storageInstance, `job_photos/${jobId}/${filename}`);
```

---

## Quick Fix: CORS Configuration

### Create CORS File

Create `cors.json` in project root:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "X-Goog-Upload-Protocol",
      "X-Goog-Upload-Content-Length",
      "X-Goog-Upload-Content-Type"
    ]
  }
]
```

### Apply CORS

```bash
# Install gcloud CLI (if not installed)
brew install google-cloud-sdk

# Authenticate
gcloud auth login

# Set project
gcloud config set project operty-b54dc

# Apply CORS
gsutil cors set cors.json gs://operty-b54dc.appspot.com

# Verify
gsutil cors get gs://operty-b54dc.appspot.com
```

---

## Alternative: Use Different Storage Path

If CORS is the issue, try using Firebase Storage REST API directly:

### Update Storage Initialization

Add to `lib/firebase.ts`:

```typescript
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

export const uploadPhotoWithProgress = async (
  storage: FirebaseStorage,
  path: string,
  blob: Blob,
  metadata: any,
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadURL, snapshot: uploadTask.snapshot });
      }
    );
  });
};
```

---

## Debugging Enhanced

### Check App Configuration

Run this in mobile app console:

```javascript
// In app startup or job service
console.log('Firebase Config:', {
  projectId: app.options.projectId,
  storageBucket: app.options.storageBucket,
  authDomain: app.options.authDomain,
});
```

### Check Storage Instance

```javascript
console.log('Storage Instance:', {
  bucket: storage.bucket,
  maxOperationRetryTime: storage.maxOperationRetryTime,
  maxUploadRetryTime: storage.maxUploadRetryTime,
});
```

### Test Upload with Minimal Code

```javascript
const testUpload = async () => {
  try {
    const storage = getStorage();
    const testRef = ref(storage, 'test.txt');
    const blob = new Blob(['Hello World'], { type: 'text/plain' });
    await uploadBytes(testRef, blob);
    console.log('✅ Test upload successful');
  } catch (error) {
    console.error('❌ Test upload failed:', error);
  }
};
```

---

## Common Solutions

### Solution 1: CORS Configuration (Most Likely)
```bash
gsutil cors set cors.json gs://operty-b54dc.appspot.com
```

### Solution 2: Update Storage Rules to Allow Root
```javascript
match /{allPaths=**} {
  allow read, write: if request.auth != null 
                     && request.resource.contentType.matches('image/.*')
                     && request.resource.size < 10 * 1024 * 1024;
}
```

### Solution 3: Use Resumable Upload
Change `uploadBytes` to `uploadBytesResumable` for better error handling.

### Solution 4: Check Region
Ensure storage bucket region matches your Firebase project region.

---

## Next Steps

1. ⏳ **Apply CORS configuration** (most likely fix)
2. ⏳ **Test upload again**
3. ⏳ **Check enhanced error logs**
4. ⏳ **Try simpler path if needed**

---

## Expected Logs After Fix

```
LOG  📁 JobService: Creating storage reference for: job_xxx_completion_xxx.jpg
LOG  🪣 JobService: Storage bucket: operty-b54dc.appspot.com
LOG  📂 JobService: Full storage path: job_photos/EBZ0pKiU6gI0X39caHPt/job_xxx.jpg
LOG  🌐 JobService: Fetching image from URI...
LOG  📊 JobService: Image blob created, size: 2590850
LOG  📊 JobService: Image blob type: image/jpeg
LOG  ⬆️ JobService: Uploading to Firebase Storage...
LOG  📦 JobService: Upload metadata: {...}
LOG  🔗 JobService: Getting download URL...
LOG  📝 JobService: Adding photo document to Firestore...
LOG  ✅ JobService: Photo uploaded successfully
```

---

## Support Resources

- **Firebase Storage CORS**: https://firebase.google.com/docs/storage/web/download-files#cors_configuration
- **gcloud SDK Install**: https://cloud.google.com/sdk/docs/install
- **Firebase Console**: https://console.firebase.google.com/project/operty-b54dc/storage

---

**Most Likely Fix**: CORS configuration
**Time to Fix**: 5-10 minutes
**Priority**: Critical
