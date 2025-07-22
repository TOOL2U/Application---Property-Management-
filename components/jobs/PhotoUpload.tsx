/**
 * Photo Upload Component
 * Handles photo capture, verification, and upload for job requirements
 * Updated with dark theme design system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { PhotoRequirement, photoVerificationService } from '@/services/photoVerificationService';
import { usePINAuth } from '@/contexts/PINAuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoUploadProps {
  jobId: string;
  requirement: PhotoRequirement;
  visible: boolean;
  onDismiss: () => void;
  onPhotoUploaded: (requirementId: string, photoUri: string, location?: { latitude: number; longitude: number }) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  jobId,
  requirement,
  visible,
  onDismiss,
  onPhotoUploaded,
}) => {
  const { currentProfile } = usePINAuth();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number } | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Request permissions when modal opens
  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos');
        return;
      }

      // Request location permissions
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocationData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.warn('⚠️ Could not get location:', error);
      // Continue without location data
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        
        // Analyze photo quality (placeholder)
        const verification = await photoVerificationService.analyzePhotoQuality(
          result.assets[0].uri,
          requirement
        );
        setVerificationResult(verification);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        
        // Analyze photo quality (placeholder)
        const verification = await photoVerificationService.analyzePhotoQuality(
          result.assets[0].uri,
          requirement
        );
        setVerificationResult(verification);
      }
    } catch (error) {
      console.error('❌ Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage || !currentProfile) return;

    try {
      setLoading(true);

      // Here you would typically upload to Firebase Storage
      // For now, we'll just use the local URI

      // Call parent callback
      onPhotoUploaded(requirement.id, selectedImage, locationData || undefined);
      
      // Close modal
      onDismiss();
      
      // Reset state
      setSelectedImage(null);
      setVerificationResult(null);

    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'How would you like to add a photo?',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: selectFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getRequirementIcon = () => {
    if (requirement.description.toLowerCase().includes('before')) return 'eye-outline';
    if (requirement.description.toLowerCase().includes('after') || requirement.description.toLowerCase().includes('completed')) return 'checkmark-circle-outline';
    if (requirement.description.toLowerCase().includes('tools') || requirement.description.toLowerCase().includes('equipment')) return 'construct-outline';
    if (requirement.description.toLowerCase().includes('clean')) return 'brush-outline';
    return 'camera-outline';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <LinearGradient colors={['#0B0F1A', '#1A1F2E']} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={getRequirementIcon()} size={24} color="#C6FF00" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>Add Photo</Text>
                    <Text style={styles.subtitle}>
                      {requirement.isRequired ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#8A92A6" />
                  </TouchableOpacity>
                </View>

                {/* Requirement Details */}
                <View style={styles.card}>
                  <View style={styles.requirementHeader}>
                    <Text style={styles.requirementTitle}>Photo Requirement</Text>
                    <View style={[styles.chip, { 
                      backgroundColor: requirement.isRequired ? '#2A1F1E' : '#1E2A3A',
                      borderColor: requirement.isRequired ? '#EF4444' : '#C6FF00',
                    }]}>
                      <Text style={[styles.chipText, { 
                        color: requirement.isRequired ? '#EF4444' : '#C6FF00' 
                      }]}>
                        {requirement.isRequired ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requirementDescription}>{requirement.description}</Text>
                </View>

                {/* Photo Preview */}
                {selectedImage ? (
                  <View style={styles.card}>
                    <Text style={styles.previewTitle}>Photo Preview</Text>
                    <Image
                      source={{ uri: selectedImage }}
                      style={[styles.photoPreview, {
                        width: screenWidth - 88,
                        height: (screenWidth - 88) * 0.75,
                      }]}
                      resizeMode="cover"
                    />
                    
                    {/* Verification Results */}
                    {verificationResult && (
                      <View style={styles.verificationContainer}>
                        <View style={styles.verificationHeader}>
                          <Ionicons 
                            name={verificationResult.isValid ? "checkmark-circle" : "warning"} 
                            size={16} 
                            color={verificationResult.isValid ? "#10B981" : "#F59E0B"} 
                          />
                          <Text style={[styles.verificationText, { 
                            color: verificationResult.isValid ? "#10B981" : "#F59E0B" 
                          }]}>
                            {verificationResult.isValid ? 'Photo looks good!' : 'Photo needs attention'}
                          </Text>
                        </View>
                        
                        {verificationResult.suggestions?.length > 0 && (
                          <View>
                            {verificationResult.suggestions.map((suggestion: string, index: number) => (
                              <Text key={index} style={styles.suggestion}>
                                • {suggestion}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Location Info */}
                    {locationData && (
                      <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color="#8A92A6" />
                        <Text style={styles.locationText}>
                          Location captured: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity onPress={showPhotoOptions} style={styles.retakeButton}>
                      <Text style={styles.retakeButtonText}>Retake Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Photo Capture Options */
                  <View style={styles.card}>
                    <View style={styles.emptyStateContainer}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons name="camera-outline" size={40} color="#8A92A6" />
                      </View>
                      <Text style={styles.emptyTitle}>No Photo Added</Text>
                      <Text style={styles.emptyDescription}>
                        Take a photo or select one from your gallery to document this requirement.
                      </Text>
                      
                      <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={takePhoto} style={styles.cameraButton}>
                          <Ionicons name="camera" size={20} color="#0B0F1A" />
                          <Text style={styles.cameraButtonText}>Take Photo</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={selectFromGallery} style={styles.galleryButton}>
                          <Ionicons name="images" size={20} color="#C1C9D6" />
                          <Text style={styles.galleryButtonText}>Gallery</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity
                    onPress={onDismiss}
                    style={styles.cancelButton}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={uploadPhoto}
                    style={[
                      styles.saveButton,
                      selectedImage ? styles.saveButtonEnabled : styles.saveButtonDisabled
                    ]}
                    disabled={!selectedImage || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0B0F1A" />
                    ) : (
                      <Text style={selectedImage ? styles.saveButtonTextEnabled : styles.saveButtonTextDisabled}>
                        Save Photo
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#1A1F2E',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A92A6',
  },
  closeButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requirementDescription: {
    fontSize: 14,
    color: '#C1C9D6',
    lineHeight: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  photoPreview: {
    borderRadius: 12,
    marginBottom: 16,
  },
  verificationContainer: {
    marginBottom: 16,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  suggestion: {
    fontSize: 12,
    color: '#8A92A6',
    marginLeft: 20,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#8A92A6',
    marginLeft: 8,
  },
  retakeButton: {
    backgroundColor: '#2A3A4A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#C1C9D6',
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#2A3A4A',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8A92A6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#C6FF00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
    marginLeft: 8,
  },
  galleryButton: {
    backgroundColor: '#2A3A4A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#C1C9D6',
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A3A4A',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#C1C9D6',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonEnabled: {
    backgroundColor: '#C6FF00',
  },
  saveButtonDisabled: {
    backgroundColor: '#2A3A4A',
  },
  saveButtonTextEnabled: {
    color: '#0B0F1A',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#5A6B7A',
    fontWeight: '500',
  },
});
