import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import { cloudinaryService } from '@/services/cloudinaryService';
import { updateStaffProfile } from '@/services/staffProfileService';

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  emergencyContact: string;
  emergencyPhone: string;
  photo?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export default function EditProfileScreen() {
  const { currentProfile, refreshStaffProfiles } = usePINAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    department: '',
    emergencyContact: '',
    emergencyPhone: '',
    photo: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Role-based permissions
  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);

  // Initialize form with current profile data
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        email: currentProfile.email || '',
        phone: currentProfile.phone || '',
        department: currentProfile.department || '',
        emergencyContact: currentProfile.emergencyContact || '',
        emergencyPhone: currentProfile.emergencyPhone || '',
        photo: currentProfile.avatar || undefined,
      });
    }
  }, [currentProfile]);

  // Track unsaved changes
  useEffect(() => {
    if (currentProfile) {
      const hasChanges =
        formData.name !== (currentProfile.name || '') ||
        formData.email !== (currentProfile.email || '') ||
        formData.phone !== (currentProfile.phone || '') ||
        formData.department !== (currentProfile.department || '') ||
        formData.emergencyContact !== (currentProfile.emergencyContact || '') ||
        formData.emergencyPhone !== (currentProfile.emergencyPhone || '') ||
        formData.photo !== (currentProfile.avatar || undefined);

      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, currentProfile]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.emergencyPhone && !validatePhone(formData.emergencyPhone)) {
      newErrors.emergencyPhone = 'Please enter a valid emergency phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Photo upload functionality
  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const selectPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Photo',
      'Choose how you want to select your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async (imageUri: string) => {
    setIsUploadingPhoto(true);
    try {
      const result = await cloudinaryService.uploadImage(imageUri, {
        folder: 'staff_profiles',
        quality: 80,
        format: 'jpg',
        tags: ['profile', 'staff'],
      });

      setFormData(prev => ({ ...prev, photo: result.url }));
      console.log('✅ Profile photo uploaded successfully');
    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    if (!currentProfile) {
      Alert.alert('Error', 'No profile data available.');
      return;
    }

    setIsLoading(true);
    try {
      // Update profile data - only send the fields that should be updated
      const updatedProfile = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        emergencyPhone: formData.emergencyPhone.trim(),
        avatar: formData.photo,
      };

      await updateStaffProfile(currentProfile.id, updatedProfile);
      await refreshStaffProfiles();

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation with unsaved changes
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!currentProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F1A' }}>
        <ActivityIndicator size="large" color="#C6FF00" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={600}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#1E2A3A',
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(198, 255, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#C6FF00" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                fontFamily: 'Urbanist'
              }}>
                Edit Profile
              </Text>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                fontFamily: 'Inter'
              }}>
                Update your personal information
              </Text>
            </View>

            {hasUnsavedChanges && (
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#C6FF00',
              }} />
            )}
          </Animatable.View>

          {/* Form Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Photo Section */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={200}
              style={{
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <TouchableOpacity
                onPress={selectPhoto}
                disabled={isUploadingPhoto}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: '#1C1F2A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#C6FF00',
                  marginBottom: 16,
                  overflow: 'hidden',
                }}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="large" color="#C6FF00" />
                ) : formData.photo ? (
                  <Image
                    source={{ uri: formData.photo }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="camera" size={40} color="#C6FF00" />
                )}
              </TouchableOpacity>

              <Text style={{
                color: '#C6FF00',
                fontSize: 16,
                fontWeight: '600',
                fontFamily: 'Urbanist'
              }}>
                {isUploadingPhoto ? 'Uploading...' : 'Tap to change photo'}
              </Text>
            </Animatable.View>

            {/* Form Fields */}
            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={400}
            >
              {/* Name Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  fontFamily: 'Urbanist'
                }}>
                  Full Name *
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, name: text }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#666666"
                  style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'Inter',
                    borderWidth: errors.name ? 1 : 0,
                    borderColor: errors.name ? '#ef4444' : 'transparent',
                  }}
                />
                {errors.name && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {errors.name}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  fontFamily: 'Urbanist'
                }}>
                  Email Address *
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter your email address"
                  placeholderTextColor="#666666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'Inter',
                    borderWidth: errors.email ? 1 : 0,
                    borderColor: errors.email ? '#ef4444' : 'transparent',
                  }}
                />
                {errors.email && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  fontFamily: 'Urbanist'
                }}>
                  Phone Number
                </Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, phone: text }));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#666666"
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'Inter',
                    borderWidth: errors.phone ? 1 : 0,
                    borderColor: errors.phone ? '#ef4444' : 'transparent',
                  }}
                />
                {errors.phone && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {errors.phone}
                  </Text>
                )}
              </View>

              {/* Role Field (Display Only for Staff) */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  fontFamily: 'Urbanist'
                }}>
                  Job Title / Role
                </Text>
                <View style={{
                  backgroundColor: '#1C1F2A',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: isStaffUser ? '#9CA3AF' : 'white',
                    fontSize: 16,
                    fontFamily: 'Inter',
                    flex: 1,
                  }}>
                    {currentProfile.role.charAt(0).toUpperCase() + currentProfile.role.slice(1)}
                  </Text>
                  {isStaffUser && (
                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                  )}
                </View>
                {isStaffUser && (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                    Contact your administrator to change your role
                  </Text>
                )}
              </View>

              {/* Department Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  fontFamily: 'Urbanist'
                }}>
                  Department / Team
                </Text>
                <TextInput
                  value={formData.department}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                  placeholder="Enter your department or team"
                  placeholderTextColor="#666666"
                  style={{
                    backgroundColor: '#1C1F2A',
                    borderRadius: 12,
                    padding: 16,
                    color: 'white',
                    fontSize: 16,
                    fontFamily: 'Inter',
                  }}
                />
              </View>
            </Animatable.View>
          </ScrollView>

          {/* Save Button */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={600}
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#1E2A3A',
            }}
          >
            <TouchableOpacity
              onPress={saveProfile}
              disabled={isLoading || !hasUnsavedChanges}
              style={{
                backgroundColor: hasUnsavedChanges ? '#C6FF00' : '#666666',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0B0F1A" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#0B0F1A"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={{
                color: '#0B0F1A',
                fontSize: 16,
                fontWeight: '600',
                fontFamily: 'Urbanist'
              }}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {!hasUnsavedChanges && (
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
                fontFamily: 'Inter'
              }}>
                No changes to save
              </Text>
            )}
          </Animatable.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
