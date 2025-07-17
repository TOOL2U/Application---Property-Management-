import { uploadJobProofPhoto, UploadJobPhotoResult } from '@/services/firebaseStorage';
import { Alert } from 'react-native';

/**
 * Comprehensive error handling examples for Firebase Storage uploads
 * 
 * This file demonstrates how to handle various error scenarios that can occur
 * during job proof photo uploads and provides user-friendly error messages.
 */

/**
 * Example 1: Basic error handling with user-friendly messages
 */
export async function uploadWithBasicErrorHandling(
  jobId: string,
  imageUri: string
): Promise<UploadJobPhotoResult | null> {
  try {
    const result = await uploadJobProofPhoto(jobId, imageUri);
    console.log('✅ Upload successful:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    if (error instanceof Error) {
      // Show user-friendly error message
      Alert.alert('Upload Failed', error.message);
    } else {
      Alert.alert('Upload Failed', 'An unexpected error occurred. Please try again.');
    }
    
    return null;
  }
}

/**
 * Example 2: Advanced error handling with retry logic
 */
export async function uploadWithRetryLogic(
  jobId: string,
  imageUri: string,
  maxRetries: number = 3
): Promise<UploadJobPhotoResult | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📸 Upload attempt ${attempt}/${maxRetries} for job:`, jobId);
      
      const result = await uploadJobProofPhoto(jobId, imageUri, {
        onProgress: (progress) => {
          console.log(`Attempt ${attempt} - Progress: ${progress.toFixed(1)}%`);
        }
      });
      
      console.log('✅ Upload successful on attempt:', attempt);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Upload attempt ${attempt} failed:`, lastError.message);
      
      // Don't retry for certain types of errors
      if (
        lastError.message.includes('Unsupported file format') ||
        lastError.message.includes('exceeds maximum allowed size') ||
        lastError.message.includes('Insufficient permissions') ||
        lastError.message.includes('quota exceeded')
      ) {
        console.log('🚫 Non-retryable error, stopping attempts');
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed
  if (lastError) {
    Alert.alert(
      'Upload Failed',
      `Failed to upload photo after ${maxRetries} attempts: ${lastError.message}`
    );
  }
  
  return null;
}

/**
 * Example 3: Network-aware error handling
 */
export async function uploadWithNetworkHandling(
  jobId: string,
  imageUri: string
): Promise<UploadJobPhotoResult | null> {
  try {
    // Check network connectivity (you might want to use @react-native-community/netinfo)
    const isConnected = await checkNetworkConnectivity();
    
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    const result = await uploadJobProofPhoto(jobId, imageUri, {
      onProgress: (progress) => {
        console.log(`Network upload progress: ${progress.toFixed(1)}%`);
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Network-aware upload failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        Alert.alert(
          'Network Error',
          'Upload failed due to network issues. Please check your connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => uploadWithNetworkHandling(jobId, imageUri) }
          ]
        );
      } else {
        Alert.alert('Upload Error', error.message);
      }
    }
    
    return null;
  }
}

/**
 * Example 4: Batch upload with individual error handling
 */
export async function uploadMultipleWithErrorHandling(
  jobId: string,
  imageUris: string[]
): Promise<{
  successful: UploadJobPhotoResult[];
  failed: { uri: string; error: string }[];
}> {
  const successful: UploadJobPhotoResult[] = [];
  const failed: { uri: string; error: string }[] = [];
  
  console.log(`📸 Starting batch upload of ${imageUris.length} photos for job:`, jobId);
  
  // Upload photos one by one to handle individual failures
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    
    try {
      console.log(`📸 Uploading photo ${i + 1}/${imageUris.length}`);
      
      const result = await uploadJobProofPhoto(jobId, uri, {
        fileName: `proof_${i + 1}`,
        onProgress: (progress) => {
          console.log(`Photo ${i + 1} progress: ${progress.toFixed(1)}%`);
        }
      });
      
      successful.push(result);
      console.log(`✅ Photo ${i + 1} uploaded successfully`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ uri, error: errorMessage });
      console.error(`❌ Photo ${i + 1} upload failed:`, errorMessage);
    }
  }
  
  // Show summary to user
  if (successful.length > 0 && failed.length === 0) {
    Alert.alert('Success', `All ${successful.length} photos uploaded successfully!`);
  } else if (successful.length > 0 && failed.length > 0) {
    Alert.alert(
      'Partial Success',
      `${successful.length} photos uploaded successfully, ${failed.length} failed. Please try uploading the failed photos again.`
    );
  } else {
    Alert.alert('Upload Failed', 'All photo uploads failed. Please try again.');
  }
  
  return { successful, failed };
}

/**
 * Example 5: Progress tracking with cancellation support
 */
export async function uploadWithCancellation(
  jobId: string,
  imageUri: string,
  onProgress: (progress: number) => void,
  onCancel: () => void
): Promise<UploadJobPhotoResult | null> {
  let isCancelled = false;
  
  // Set up cancellation handler
  const cancelHandler = () => {
    isCancelled = true;
    onCancel();
  };
  
  try {
    const result = await uploadJobProofPhoto(jobId, imageUri, {
      onProgress: (progress, snapshot) => {
        if (isCancelled) {
          // Note: Firebase Storage doesn't support cancellation directly
          // You would need to implement this at a higher level
          throw new Error('Upload cancelled by user');
        }
        onProgress(progress);
      }
    });
    
    if (isCancelled) {
      return null;
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('📋 Upload cancelled by user');
      return null;
    }
    
    console.error('❌ Upload with cancellation failed:', error);
    throw error;
  }
}

/**
 * Utility function to check network connectivity
 * Note: You might want to use @react-native-community/netinfo for more robust checking
 */
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Example error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Upload failed due to network issues. Please check your connection and try again.',
  FILE_TOO_LARGE: 'The selected image is too large. Please choose an image smaller than 10MB.',
  UNSUPPORTED_FORMAT: 'Unsupported file format. Please select a JPG, PNG, or WebP image.',
  PERMISSION_DENIED: 'Upload failed due to insufficient permissions. Please check your authentication.',
  QUOTA_EXCEEDED: 'Storage quota exceeded. Please contact support.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  CANCELLED: 'Upload was cancelled.',
  NO_INTERNET: 'No internet connection. Please check your network and try again.'
};

/**
 * Helper function to get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('timeout')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  } else if (message.includes('exceeds maximum allowed size')) {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  } else if (message.includes('unsupported file format')) {
    return ERROR_MESSAGES.UNSUPPORTED_FORMAT;
  } else if (message.includes('insufficient permissions')) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  } else if (message.includes('quota exceeded')) {
    return ERROR_MESSAGES.QUOTA_EXCEEDED;
  } else if (message.includes('cancelled')) {
    return ERROR_MESSAGES.CANCELLED;
  } else {
    return ERROR_MESSAGES.GENERIC_ERROR;
  }
}
