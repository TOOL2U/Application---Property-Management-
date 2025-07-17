import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadBytesResumable,
  UploadTask,
  StorageError 
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Type definitions for Firebase Storage upload functionality
 */
export interface UploadProgressCallback {
  (progress: number, snapshot: any): void;
}

export interface UploadJobPhotoOptions {
  fileName?: string;
  onProgress?: UploadProgressCallback;
  maxSizeBytes?: number;
}

export interface UploadJobPhotoResult {
  downloadUrl: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

/**
 * Supported image formats for job proof photos
 */
const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const STORAGE_PATH_PREFIX = 'job_proofs';

/**
 * Validates image file format and size
 * @param uri - Local file URI
 * @param maxSizeBytes - Maximum allowed file size in bytes
 * @returns Promise<{ isValid: boolean, error?: string, fileSize?: number }>
 */
async function validateImageFile(
  uri: string, 
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
): Promise<{ isValid: boolean; error?: string; fileSize?: number }> {
  try {
    // Extract file extension from URI
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !SUPPORTED_IMAGE_FORMATS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
      };
    }

    // Get file info for size validation
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileSize = blob.size;

    if (fileSize > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      };
    }

    return {
      isValid: true,
      fileSize
    };

  } catch (error) {
    console.error('❌ Error validating image file:', error);
    return {
      isValid: false,
      error: 'Failed to validate image file'
    };
  }
}

/**
 * Converts local image URI to blob for Firebase Storage upload
 * @param uri - Local file URI from expo-image-picker or expo-camera
 * @returns Promise<Blob> - Blob ready for upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  try {
    console.log('🔄 Converting URI to blob:', uri);
    
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('✅ Successfully converted URI to blob, size:', blob.size, 'bytes');
    
    return blob;
  } catch (error) {
    console.error('❌ Error converting URI to blob:', error);
    throw new Error(`Failed to process image file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a unique filename for job proof photo
 * @param jobId - The job identifier
 * @param originalUri - Original file URI to extract extension
 * @param customFileName - Optional custom filename
 * @returns string - Generated filename
 */
function generateFileName(jobId: string, originalUri: string, customFileName?: string): string {
  if (customFileName) {
    return customFileName;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileExtension = originalUri.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `job_${jobId}_proof_${timestamp}.${fileExtension}`;
}

/**
 * Uploads job completion proof photo to Firebase Storage
 * 
 * This function handles the complete workflow of uploading job completion photos
 * including validation, file conversion, upload with progress tracking, and URL generation.
 * 
 * @param jobId - The unique job identifier
 * @param imageUri - Local file URI from expo-image-picker or expo-camera
 * @param options - Optional configuration for upload
 * @returns Promise<UploadJobPhotoResult> - Upload result with download URL and metadata
 * 
 * @example
 * ```typescript
 * import { uploadJobProofPhoto } from '@/services/firebaseStorage';
 * import * as ImagePicker from 'expo-image-picker';
 * 
 * // Pick image and upload
 * const result = await ImagePicker.launchImageLibraryAsync({
 *   mediaTypes: ImagePicker.MediaTypeOptions.Images,
 *   allowsEditing: true,
 *   aspect: [4, 3],
 *   quality: 0.8,
 * });
 * 
 * if (!result.canceled) {
 *   try {
 *     const uploadResult = await uploadJobProofPhoto(
 *       'job_123',
 *       result.assets[0].uri,
 *       {
 *         onProgress: (progress) => {
 *           console.log(`Upload progress: ${progress}%`);
 *         }
 *       }
 *     );
 *     
 *     console.log('Photo uploaded:', uploadResult.downloadUrl);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * }
 * ```
 * 
 * @throws {Error} When validation fails, network issues occur, or Firebase Storage errors
 */
export async function uploadJobProofPhoto(
  jobId: string,
  imageUri: string,
  options: UploadJobPhotoOptions = {}
): Promise<UploadJobPhotoResult> {
  const {
    fileName: customFileName,
    onProgress,
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES
  } = options;

  console.log('📸 Starting job proof photo upload for job:', jobId);
  console.log('📁 Image URI:', imageUri);

  try {
    // Validate input parameters
    if (!jobId || !jobId.trim()) {
      throw new Error('Job ID is required and cannot be empty');
    }

    if (!imageUri || !imageUri.trim()) {
      throw new Error('Image URI is required and cannot be empty');
    }

    // Validate image file
    const validation = await validateImageFile(imageUri, maxSizeBytes);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Image validation failed');
    }

    // Generate filename and storage path
    const fileName = generateFileName(jobId, imageUri, customFileName);
    const storagePath = `${STORAGE_PATH_PREFIX}/${jobId}/${fileName}`;
    
    console.log('📂 Storage path:', storagePath);
    console.log('📄 File name:', fileName);

    // Convert URI to blob
    const imageBlob = await uriToBlob(imageUri);

    // Create Firebase Storage reference
    const storageRef = ref(storage, storagePath);

    // Upload with progress tracking if callback provided
    let uploadTask: UploadTask | null = null;
    
    if (onProgress) {
      uploadTask = uploadBytesResumable(storageRef, imageBlob);
      
      // Monitor upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 Upload progress: ${progress.toFixed(1)}%`);
          onProgress(progress, snapshot);
        },
        (error: StorageError) => {
          console.error('❌ Upload progress error:', error);
        }
      );

      await uploadTask;
    } else {
      // Simple upload without progress tracking
      await uploadBytes(storageRef, imageBlob);
    }

    console.log('✅ File uploaded successfully to Firebase Storage');

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('🔗 Download URL generated:', downloadUrl);

    const result: UploadJobPhotoResult = {
      downloadUrl,
      fileName,
      filePath: storagePath,
      fileSize: validation.fileSize || imageBlob.size
    };

    console.log('🎉 Job proof photo upload completed successfully for job:', jobId);
    return result;

  } catch (error) {
    console.error('❌ Job proof photo upload failed for job:', jobId, error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('Upload failed: Insufficient permissions. Please check your authentication.');
      } else if (error.message.includes('storage/canceled')) {
        throw new Error('Upload was canceled. Please try again.');
      } else if (error.message.includes('storage/unknown')) {
        throw new Error('Upload failed due to a server error. Please try again later.');
      } else if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('Upload failed: Storage quota exceeded. Please contact support.');
      } else if (error.message.includes('network')) {
        throw new Error('Upload failed: Network error. Please check your connection and try again.');
      }
      
      // Re-throw validation and conversion errors as-is
      throw error;
    }
    
    throw new Error('An unexpected error occurred during photo upload. Please try again.');
  }
}

/**
 * Uploads multiple job proof photos in parallel
 * @param jobId - The job identifier
 * @param imageUris - Array of local file URIs
 * @param options - Upload options
 * @returns Promise<UploadJobPhotoResult[]> - Array of upload results
 */
export async function uploadMultipleJobProofPhotos(
  jobId: string,
  imageUris: string[],
  options: UploadJobPhotoOptions = {}
): Promise<UploadJobPhotoResult[]> {
  console.log('📸 Starting multiple job proof photos upload for job:', jobId);
  console.log('📁 Number of images:', imageUris.length);

  if (!imageUris || imageUris.length === 0) {
    throw new Error('At least one image URI is required');
  }

  try {
    const uploadPromises = imageUris.map((uri, index) =>
      uploadJobProofPhoto(jobId, uri, {
        ...options,
        fileName: options.fileName ? `${options.fileName}_${index + 1}` : undefined
      })
    );

    const results = await Promise.all(uploadPromises);
    console.log('🎉 All job proof photos uploaded successfully for job:', jobId);

    return results;
  } catch (error) {
    console.error('❌ Multiple job proof photos upload failed for job:', jobId, error);
    throw error;
  }
}

/**
 * Deletes a job proof photo from Firebase Storage
 * @param filePath - The storage path of the file to delete
 * @returns Promise<void>
 */
export async function deleteJobProofPhoto(filePath: string): Promise<void> {
  console.log('🗑️ Deleting job proof photo:', filePath);

  try {
    const { deleteObject } = await import('firebase/storage');
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log('✅ Job proof photo deleted successfully:', filePath);
  } catch (error) {
    console.error('❌ Failed to delete job proof photo:', filePath, error);
    throw new Error(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
