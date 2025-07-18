interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    bytes: number;
  };
}

interface UploadOptions {
  folder?: string;
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  transformation?: string;
  tags?: string[];
  context?: Record<string, string>;
}

class CloudinaryService {
  private config: CloudinaryConfig;
  private uploadQueue: Array<{
    file: string;
    options: UploadOptions;
    resolve: (result: UploadResult) => void;
    reject: (error: any) => void;
    retryCount: number;
  }> = [];
  
  private isProcessing: boolean = false;
  private maxRetries: number = 3;

  constructor() {
    this.config = {
      cloudName: 'doez7m1hy',
      apiKey: '316689738793838',
      uploadPreset: 'property_management_staff_profile', // Use the correct preset directly
    };

    console.log('☁️ Cloudinary Service initialized:', {
      cloudName: this.config.cloudName,
      hasApiKey: !!this.config.apiKey,
      uploadPreset: this.config.uploadPreset,
    });

    if (!this.config.cloudName || !this.config.uploadPreset) {
      console.error('❌ Missing required Cloudinary configuration');
    }
  }

  /**
   * Compress image before upload
   */
  private async compressImage(imageUri: string, quality: number = 0.8): Promise<string> {
    try {
      // Check if we're in a web environment with document support
      const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

      if (isWeb) {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            // Calculate new dimensions (max 1920x1080)
            const maxWidth = 1920;
            const maxHeight = 1080;
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          };

          img.onerror = reject;
          img.src = imageUri;
        });
      }

      // For React Native, use expo-image-manipulator if available
      try {
        // Dynamic import with better error handling
        const ImageManipulator = require('expo-image-manipulator');

        if (ImageManipulator && ImageManipulator.manipulateAsync) {
          console.log('📱 React Native: Compressing image with expo-image-manipulator');

          const result = await ImageManipulator.manipulateAsync(imageUri, [
            { resize: { width: 1920 } }, // Resize to max width, maintain aspect ratio
          ], {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          });

          console.log('✅ Image compressed successfully');
          return result.uri;
        } else {
          console.log('📱 expo-image-manipulator methods not available');
          return imageUri;
        }
      } catch (importError) {
        console.log('📱 expo-image-manipulator not available, using original image');
        return imageUri;
      }
    } catch (error) {
      console.warn('⚠️ Image compression failed, using original:', error);
      return imageUri;
    }
  }

  /**
   * Upload single image to Cloudinary
   */
  async uploadImage(imageUri: string, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      console.log('📤 Starting image upload to Cloudinary...');

      // Compress image if needed
      const compressedUri = await this.compressImage(imageUri, 0.8);

      // Prepare form data
      const formData = new FormData();
      
      // Handle different image sources
      const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

      if (compressedUri.startsWith('data:')) {
        // Data URL (base64)
        formData.append('file', compressedUri);
      } else {
        // File URI - create blob for web or use direct URI for React Native
        if (isWeb) {
          const response = await fetch(compressedUri);
          const blob = await response.blob();
          formData.append('file', blob);
        } else {
          // React Native FormData format
          formData.append('file', {
            uri: compressedUri,
            type: 'image/jpeg',
            name: `upload_${Date.now()}.jpg`,
          } as any);
        }
      }

      formData.append('upload_preset', this.config.uploadPreset);
      formData.append('cloud_name', this.config.cloudName);

      // Add only allowed parameters for unsigned upload
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      // Note: quality and format are NOT allowed for unsigned uploads
      // These must be configured in the upload preset on Cloudinary dashboard

      if (options.context) {
        formData.append('context', Object.entries(options.context)
          .map(([key, value]) => `${key}=${value}`)
          .join('|'));
      }

      // Add timestamp and signature for security
      const timestamp = Math.round(Date.now() / 1000);
      formData.append('timestamp', timestamp.toString());

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;

      console.log('🌐 Uploading to Cloudinary URL:', uploadUrl);
      console.log('📦 Upload preset:', this.config.uploadPreset);
      console.log('🌐 Cloud name:', this.config.cloudName);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let the browser set it with boundary
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      const result = await response.json();
      console.log('📄 Response data:', result);

      if (!response.ok) {
        console.error('❌ Cloudinary upload failed:', result);

        // Handle specific error cases
        if (result.error?.message?.includes('Upload preset not found')) {
          throw new Error('Upload configuration error. Please contact support.');
        } else if (result.error?.message?.includes('Invalid image file')) {
          throw new Error('Invalid image format. Please try a different photo.');
        } else {
          throw new Error(result.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
        }
      }

      console.log('✅ Image uploaded successfully:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        metadata: {
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      };

    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple images with queue management
   */
  async uploadMultipleImages(
    imageUris: string[], 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    console.log(`📤 Uploading ${imageUris.length} images to Cloudinary...`);

    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadImage(uri, {
        ...options,
        tags: [...(options.tags || []), `batch_${Date.now()}`, `index_${index}`],
      })
    );

    try {
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success).length;
      console.log(`✅ Uploaded ${successful}/${imageUris.length} images successfully`);
      return results;
    } catch (error) {
      console.error('❌ Batch upload failed:', error);
      return imageUris.map(() => ({
        success: false,
        error: 'Batch upload failed',
      }));
    }
  }

  /**
   * Upload with retry logic
   */
  async uploadWithRetry(imageUri: string, options: UploadOptions = {}): Promise<UploadResult> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${this.maxRetries}`);
        const result = await this.uploadImage(imageUri, options);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Upload attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `Upload failed after ${this.maxRetries} attempts: ${lastError}`,
    };
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`;
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', this.config.apiKey);
      
      // In production, you'd need to sign this request
      const timestamp = Math.round(Date.now() / 1000);
      formData.append('timestamp', timestamp.toString());

      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.result === 'ok') {
        console.log('✅ Image deleted successfully:', publicId);
        return { success: true };
      } else {
        throw new Error(result.error?.message || 'Delete failed');
      }
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Generate optimized URL for existing image
   */
  generateOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  } = {}): string {
    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;
    
    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.crop) transformations.push(`c_${options.crop}`);

    const transformationString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
    
    return `${baseUrl}${transformationString}/${publicId}`;
  }

  /**
   * Get upload configuration
   */
  getConfig(): CloudinaryConfig {
    return { ...this.config };
  }

  /**
   * Get the main app logo (white vector)
   */
  getLogoUrl(options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: string | number;
  } = {}): string {
    const logoId = 'logo-white-vector-3svg_dmz2pf';
    
    return this.generateOptimizedUrl(logoId, {
      format: options.format as any || 'auto',
      quality: options.quality as any || 'auto',
      width: options.width,
      height: options.height,
    });
  }

  /**
   * Get logo for different use cases
   */
  getLogos() {
    const logoId = 'logo-white-vector-3svg_dmz2pf';
    
    return {
      // Main app icon (1024x1024)
      appIcon: this.generateOptimizedUrl(logoId, {
        width: 1024,
        height: 1024,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Adaptive icon (Android - 1024x1024)
      adaptiveIcon: this.generateOptimizedUrl(logoId, {
        width: 1024,
        height: 1024,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Favicon (32x32)
      favicon: this.generateOptimizedUrl(logoId, {
        width: 32,
        height: 32,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Large favicon (192x192)
      faviconLarge: this.generateOptimizedUrl(logoId, {
        width: 192,
        height: 192,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Splash screen (600x600)
      splash: this.generateOptimizedUrl(logoId, {
        width: 600,
        height: 600,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Navigation/Header logo
      header: this.generateOptimizedUrl(logoId, {
        width: 200,
        height: 60,
        format: 'auto',
        quality: 'auto',
        crop: 'fit',
      }),
      
      // Small logo for notifications
      notification: this.generateOptimizedUrl(logoId, {
        width: 64,
        height: 64,
        format: 'png',
        quality: 'auto',
        crop: 'fill',
      }),
      
      // Original SVG (no transformations)
      original: `https://res.cloudinary.com/doez7m1hy/image/upload/${logoId}`,
    };
  }

  /**
   * Test connection to Cloudinary
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a small 1x1 pixel image
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const result = await this.uploadImage(testImage, {
        folder: 'test',
        tags: ['connection_test'],
      });

      if (result.success && result.publicId) {
        // Clean up test image
        await this.deleteImage(result.publicId);
        console.log('✅ Cloudinary connection test successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Cloudinary connection test failed:', error);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;

// Export types
export type { UploadResult, UploadOptions };
