# Firebase Storage Integration Guide

## Job Proof Photo Upload System

This guide explains how to integrate the Firebase Storage upload functionality for job completion photos in the Sia Moon Property Management mobile app.

## 📁 File Structure

```
services/
├── firebaseStorage.ts          # Main upload functions
examples/
├── jobPhotoUploadExample.tsx   # Complete UI example
├── firebaseStorageErrorHandling.ts # Error handling examples
docs/
├── firebase-storage-integration.md # This guide
```

## 🚀 Quick Start

### 1. Install Required Dependencies

```bash
npm install expo-image-picker expo-camera
```

### 2. Basic Usage

```typescript
import { uploadJobProofPhoto } from '@/services/firebaseStorage';
import * as ImagePicker from 'expo-image-picker';

// Pick and upload image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
});

if (!result.canceled) {
  try {
    const uploadResult = await uploadJobProofPhoto(
      'job_123',
      result.assets[0].uri
    );
    console.log('Photo uploaded:', uploadResult.downloadUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## 📋 API Reference

### `uploadJobProofPhoto(jobId, imageUri, options?)`

**Parameters:**
- `jobId: string` - Unique job identifier
- `imageUri: string` - Local file URI from expo-image-picker
- `options?: UploadJobPhotoOptions` - Optional configuration

**Options:**
```typescript
interface UploadJobPhotoOptions {
  fileName?: string;                    // Custom filename
  onProgress?: UploadProgressCallback;  // Progress tracking
  maxSizeBytes?: number;               // File size limit (default: 10MB)
}
```

**Returns:**
```typescript
interface UploadJobPhotoResult {
  downloadUrl: string;  // Firebase Storage download URL
  fileName: string;     // Generated filename
  filePath: string;     // Storage path
  fileSize: number;     // File size in bytes
}
```

### `uploadMultipleJobProofPhotos(jobId, imageUris, options?)`

Upload multiple photos in parallel.

**Parameters:**
- `jobId: string` - Job identifier
- `imageUris: string[]` - Array of local file URIs
- `options?: UploadJobPhotoOptions` - Upload options

**Returns:** `Promise<UploadJobPhotoResult[]>`

## 🔧 Integration with Job Completion Workflow

### Step 1: Update Job Type Definition

Add photo URLs to your Job type:

```typescript
// types/job.ts
export interface Job {
  // ... existing fields
  proofPhotos?: string[];           // Array of Firebase Storage URLs
  proofPhotosPaths?: string[];      // Array of storage paths for deletion
  completedAt?: Date;               // Job completion timestamp
  completedBy?: string;             // Staff member who completed the job
}
```

### Step 2: Create Job Completion Component

```typescript
// components/jobs/JobCompletionScreen.tsx
import React, { useState } from 'react';
import { uploadMultipleJobProofPhotos } from '@/services/firebaseStorage';
import { updateJobStatus } from '@/services/jobService';

export const JobCompletionScreen = ({ job }: { job: Job }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const completeJob = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Photos Required', 'Please upload at least one proof photo.');
      return;
    }

    setUploading(true);
    
    try {
      // Upload photos to Firebase Storage
      const uploadResults = await uploadMultipleJobProofPhotos(
        job.id,
        selectedPhotos
      );

      // Update job in Firestore
      await updateJobStatus(job.id, {
        status: 'completed',
        proofPhotos: uploadResults.map(r => r.downloadUrl),
        proofPhotosPaths: uploadResults.map(r => r.filePath),
        completedAt: new Date(),
        completedBy: currentUser.id
      });

      Alert.alert('Success', 'Job completed successfully!');
      
    } catch (error) {
      console.error('Job completion failed:', error);
      Alert.alert('Error', 'Failed to complete job. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ... rest of component
};
```

### Step 3: Update Firestore Job Service

```typescript
// services/jobService.ts
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function updateJobStatus(
  jobId: string,
  updates: Partial<Job>
): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    console.log('✅ Job status updated:', jobId);
  } catch (error) {
    console.error('❌ Failed to update job status:', error);
    throw error;
  }
}
```

## 🔒 Firebase Storage Security Rules

Update your Firebase Storage security rules:

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Job proof photos - only authenticated staff can upload
    match /job_proofs/{jobId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.token.role in ['admin', 'manager', 'staff', 'cleaner', 'maintenance']
        && resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

## 📱 Permissions Setup

Add to your app.json/app.config.js:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app needs access to your photos to upload job completion proof.",
          "cameraPermission": "The app needs access to your camera to take job completion photos."
        }
      ]
    ]
  }
}
```

## 🎯 Best Practices

### 1. Image Optimization
```typescript
const optimizedImageOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,        // Reduce file size
  allowsMultipleSelection: true,
  selectionLimit: 5    // Limit number of photos
};
```

### 2. Progress Tracking
```typescript
const uploadWithProgress = async (jobId: string, imageUri: string) => {
  return uploadJobProofPhoto(jobId, imageUri, {
    onProgress: (progress) => {
      // Update UI progress indicator
      setUploadProgress(progress);
    }
  });
};
```

### 3. Error Handling
```typescript
import { getUserFriendlyErrorMessage } from '@/examples/firebaseStorageErrorHandling';

try {
  await uploadJobProofPhoto(jobId, imageUri);
} catch (error) {
  const friendlyMessage = getUserFriendlyErrorMessage(error);
  Alert.alert('Upload Failed', friendlyMessage);
}
```

### 4. Offline Support
```typescript
// Store failed uploads for retry when online
const storeFailedUpload = async (jobId: string, imageUri: string) => {
  const failedUploads = await AsyncStorage.getItem('failedUploads') || '[]';
  const uploads = JSON.parse(failedUploads);
  uploads.push({ jobId, imageUri, timestamp: Date.now() });
  await AsyncStorage.setItem('failedUploads', JSON.stringify(uploads));
};
```

## 🧪 Testing

### Unit Tests
```typescript
// __tests__/firebaseStorage.test.ts
import { uploadJobProofPhoto } from '@/services/firebaseStorage';

describe('Firebase Storage Upload', () => {
  it('should upload job proof photo successfully', async () => {
    const result = await uploadJobProofPhoto('test_job', 'test_uri');
    expect(result.downloadUrl).toBeDefined();
    expect(result.fileName).toContain('test_job');
  });

  it('should handle invalid file format', async () => {
    await expect(
      uploadJobProofPhoto('test_job', 'invalid.txt')
    ).rejects.toThrow('Unsupported file format');
  });
});
```

### Manual Testing Checklist
- [ ] Upload single photo from camera
- [ ] Upload single photo from library
- [ ] Upload multiple photos
- [ ] Test file size validation (>10MB)
- [ ] Test unsupported file formats
- [ ] Test network error handling
- [ ] Test progress tracking
- [ ] Verify photos appear in Firebase Storage console
- [ ] Test on both iOS and Android

## 🚀 Deployment

1. **Update Firebase Storage Rules**
2. **Test on staging environment**
3. **Deploy to production**
4. **Monitor upload success rates**
5. **Set up error tracking (Sentry, etc.)**

## 📊 Monitoring

Track these metrics:
- Upload success rate
- Average upload time
- File size distribution
- Error frequency by type
- Storage usage growth

## 🔗 Related Documentation

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)
