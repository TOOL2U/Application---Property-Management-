import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { 
  uploadJobProofPhoto, 
  uploadMultipleJobProofPhotos,
  UploadJobPhotoResult 
} from '@/services/firebaseStorage';
import { Job } from '@/types/job';

interface JobPhotoUploadExampleProps {
  job: Job;
  onPhotosUploaded: (photoUrls: string[]) => void;
}

/**
 * Example component demonstrating job proof photo upload functionality
 * 
 * This component shows how to integrate the Firebase Storage upload function
 * with expo-image-picker and expo-camera for job completion workflows.
 */
export const JobPhotoUploadExample: React.FC<JobPhotoUploadExampleProps> = ({
  job,
  onPhotosUploaded
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadJobPhotoResult[]>([]);

  /**
   * Request camera and media library permissions
   */
  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to upload job completion photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  /**
   * Launch image picker to select photos from library
   */
  const pickImagesFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        selectionLimit: 5, // Limit to 5 photos
      });

      if (!result.canceled) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  /**
   * Launch camera to take a new photo
   */
  const takePhotoWithCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  /**
   * Upload single photo with progress tracking
   */
  const uploadSinglePhoto = async (imageUri: string) => {
    try {
      const result = await uploadJobProofPhoto(job.id, imageUri, {
        onProgress: (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
        },
        maxSizeBytes: 10 * 1024 * 1024, // 10MB limit
      });

      console.log('✅ Single photo uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Single photo upload failed:', error);
      throw error;
    }
  };

  /**
   * Upload all selected photos
   */
  const uploadAllPhotos = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Option 1: Upload multiple photos in parallel
      const results = await uploadMultipleJobProofPhotos(job.id, selectedImages, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      setUploadedPhotos(results);
      const photoUrls = results.map(result => result.downloadUrl);
      onPhotosUploaded(photoUrls);

      Alert.alert(
        'Success',
        `${results.length} photo(s) uploaded successfully!`,
        [{ text: 'OK' }]
      );

      // Clear selected images after successful upload
      setSelectedImages([]);

    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Remove selected image
   */
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Show action sheet for photo selection
   */
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhotoWithCamera },
        { text: 'Photo Library', onPress: pickImagesFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg p-4">
      {/* Job Info Header */}
      <View className="bg-dark-surface rounded-lg p-4 mb-4">
        <Text className="text-white text-lg font-bold mb-2">
          Job Completion Photos
        </Text>
        <Text className="text-gray-400 text-sm mb-1">
          Job: {job.title}
        </Text>
        <Text className="text-gray-500 text-xs">
          Upload photos to prove job completion
        </Text>
      </View>

      {/* Photo Selection Buttons */}
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          className="flex-1 bg-primary-500 rounded-lg p-3 active:bg-primary-600"
          onPress={showPhotoOptions}
          disabled={uploading}
        >
          <Text className="text-white text-center font-medium">
            Add Photos
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <TouchableOpacity
            className="flex-1 bg-green-500 rounded-lg p-3 active:bg-green-600"
            onPress={uploadAllPhotos}
            disabled={uploading}
          >
            <Text className="text-white text-center font-medium">
              {uploading ? 'Uploading...' : `Upload ${selectedImages.length} Photo(s)`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Progress */}
      {uploading && (
        <View className="bg-dark-surface rounded-lg p-4 mb-4">
          <Text className="text-white text-sm mb-2">
            Uploading... {uploadProgress.toFixed(1)}%
          </Text>
          <View className="bg-dark-card rounded-full h-2">
            <View 
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
        </View>
      )}

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <View className="mb-4">
          <Text className="text-white text-base font-semibold mb-3">
            Selected Photos ({selectedImages.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {selectedImages.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-20 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    onPress={() => removeSelectedImage(index)}
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Uploaded Photos */}
      {uploadedPhotos.length > 0 && (
        <View>
          <Text className="text-white text-base font-semibold mb-3">
            Uploaded Photos ({uploadedPhotos.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {uploadedPhotos.map((photo, index) => (
                <View key={index} className="items-center">
                  <Image
                    source={{ uri: photo.downloadUrl }}
                    className="w-20 h-20 rounded-lg mb-1"
                    resizeMode="cover"
                  />
                  <Text className="text-gray-400 text-xs text-center">
                    {(photo.fileSize / 1024).toFixed(0)}KB
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Loading Indicator */}
      {uploading && (
        <View className="items-center py-4">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      )}
    </ScrollView>
  );
};

export default JobPhotoUploadExample;
