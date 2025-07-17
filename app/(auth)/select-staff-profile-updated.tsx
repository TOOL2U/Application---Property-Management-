/**
 * Updated Select Staff Profile Screen
 * Integrates with current PINAuthContext and staffSyncService
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { usePINAuth } from '@/contexts/PINAuthContext';
import { StaffProfile } from '@/services/localStaffService';
import { JOB_COLORS, COMMON_STYLES } from '@/utils/jobUtils';

export default function SelectStaffProfileScreen() {
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [showPINEntry, setShowPINEntry] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  
  const router = useRouter();
  const { 
    staffProfiles, 
    isLoading, 
    error, 
    loginWithPIN, 
    refreshStaffProfiles,
    clearError 
  } = usePINAuth();

  useEffect(() => {
    if (staffProfiles.length === 0 && !isLoading && !error) {
      refreshStaffProfiles();
    }
  }, []);

  const handleStaffSelection = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setShowPINEntry(true);
    setPin('');
    setPinError(null);
  };

  const handlePINSubmit = async () => {
    if (!selectedStaff || pin.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      return;
    }

    setPinLoading(true);
    setPinError(null);

    try {
      const success = await loginWithPIN(selectedStaff.id, pin);
      if (success) {
  router.replace('/');
      } else {
        setPinError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      setPinError('Login failed. Please try again.');
      setPin('');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePINChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setPin(numericText);
      setPinError(null);
      
      // Auto-submit when 4 digits are entered
      if (numericText.length === 4) {
        setTimeout(() => handlePINSubmit(), 100);
      }
    }
  };

  const handlePINCancel = () => {
    setShowPINEntry(false);
    setSelectedStaff(null);
    setPin('');
    setPinError(null);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#ef4444';
      case 'manager':
        return JOB_COLORS.primary;
      case 'cleaner':
        return JOB_COLORS.success;
      case 'maintenance':
        return JOB_COLORS.warning;
      default:
        return JOB_COLORS.textMuted;
    }
  };

  const renderPINDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length ? styles.pinDotFilled : styles.pinDotEmpty
            ]}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={JOB_COLORS.primary} />
          <Text style={styles.loadingText}>Loading Staff Profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Select Profile</Text>
          <Text style={styles.headerSubtitle}>Choose your staff profile to continue</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={refreshStaffProfiles}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Profile Cards */}
            {staffProfiles.map((staff, index) => (
              <Animatable.View
                key={staff.id}
                animation="fadeInUp"
                duration={600}
                delay={index * 100}
                style={styles.profileCardContainer}
              >
                <TouchableOpacity
                  onPress={() => handleStaffSelection(staff)}
                  style={styles.profileCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileCardContent}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {staff.avatar ? (
                        <Image
                          source={{ uri: staff.avatar }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={24} color={JOB_COLORS.primary} />
                        </View>
                      )}
                      
                      {/* Status indicator */}
                      <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                      </View>
                    </View>

                    {/* Staff Info */}
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={[styles.staffRole, { color: getRoleColor(staff.role) }]}>
                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                      </Text>
                      {staff.department && (
                        <Text style={styles.staffDepartment}>{staff.department}</Text>
                      )}
                    </View>

                    {/* Chevron */}
                    <Ionicons name="chevron-forward" size={20} color={JOB_COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))}

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <View style={styles.securityHeader}>
                <Ionicons name="shield-checkmark" size={16} color={JOB_COLORS.primary} />
                <Text style={styles.securityTitle}>Security Notice</Text>
              </View>
              <Text style={styles.securityText}>
                You'll need to enter your 4-digit PIN to access your profile.
                For security, your PIN is never stored on this device.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* PIN Entry Modal */}
      {showPINEntry && selectedStaff && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Staff Info */}
            <View style={styles.modalHeader}>
              {selectedStaff.avatar ? (
                <Image
                  source={{ uri: selectedStaff.avatar }}
                  style={styles.modalAvatar}
                />
              ) : (
                <View style={styles.modalAvatarPlaceholder}>
                  <Ionicons name="person" size={32} color={JOB_COLORS.primary} />
                </View>
              )}
              
              <Text style={styles.modalStaffName}>{selectedStaff.name}</Text>
              <Text style={[styles.modalStaffRole, { color: getRoleColor(selectedStaff.role) }]}>
                {selectedStaff.role.charAt(0).toUpperCase() + selectedStaff.role.slice(1)}
              </Text>
              
              <Text style={styles.pinInstructions}>
                Enter your 4-digit PIN to continue
              </Text>
            </View>

            {/* PIN Input */}
            {renderPINDots()}

            {/* Hidden text input for PIN */}
            <View style={styles.hiddenInputContainer}>
              <TouchableOpacity
                style={styles.hiddenInputTouchable}
                onPress={() => {
                  // Focus would be handled by a proper TextInput
                }}
              >
                <Text style={styles.hiddenInputText}>
                  {pin}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {pinError && (
              <View style={styles.pinErrorContainer}>
                <Text style={styles.pinErrorText}>{pinError}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handlePINCancel}
                style={styles.cancelButton}
                disabled={pinLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePINSubmit}
                style={[styles.submitButton, (pinLoading || pin.length !== 4) && styles.submitButtonDisabled]}
                disabled={pinLoading || pin.length !== 4}
              >
                {pinLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={16} color="white" />
                    <Text style={styles.submitButtonText}>Unlock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JOB_COLORS.background,
    paddingHorizontal: COMMON_STYLES.spacing.lg,
    paddingTop: COMMON_STYLES.spacing.xl,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: JOB_COLORS.textPrimary,
    fontSize: 16,
    marginTop: COMMON_STYLES.spacing.md,
  },
  
  // Header
  header: {
    marginBottom: COMMON_STYLES.spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: JOB_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: JOB_COLORS.textSecondary,
    fontSize: 16,
    marginTop: COMMON_STYLES.spacing.xs,
  },
  
  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Error
  errorContainer: {
    backgroundColor: `${JOB_COLORS.danger}20`,
    borderWidth: 1,
    borderColor: `${JOB_COLORS.danger}30`,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.lg,
    marginBottom: COMMON_STYLES.spacing.xl,
  },
  errorText: {
    color: JOB_COLORS.danger,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: JOB_COLORS.danger,
    paddingVertical: COMMON_STYLES.spacing.md,
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    borderRadius: COMMON_STYLES.borderRadius,
    alignSelf: 'center',
    marginTop: COMMON_STYLES.spacing.lg,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Profile cards
  profileCardContainer: {
    marginBottom: COMMON_STYLES.spacing.md,
  },
  profileCard: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.lg,
    ...COMMON_STYLES.shadow,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${JOB_COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: JOB_COLORS.success,
    borderWidth: 2,
    borderColor: JOB_COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  
  // Staff info
  staffInfo: {
    flex: 1,
    marginLeft: COMMON_STYLES.spacing.lg,
  },
  staffName: {
    color: JOB_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  staffRole: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: COMMON_STYLES.spacing.xs,
  },
  staffDepartment: {
    color: JOB_COLORS.textSecondary,
    fontSize: 12,
    marginTop: COMMON_STYLES.spacing.xs,
  },
  
  // Security notice
  securityNotice: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.lg,
    marginTop: COMMON_STYLES.spacing.xl,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  securityTitle: {
    color: JOB_COLORS.primary,
    fontWeight: '600',
    marginLeft: COMMON_STYLES.spacing.sm,
  },
  securityText: {
    color: JOB_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: COMMON_STYLES.spacing.lg,
  },
  modalContent: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius * 2,
    padding: COMMON_STYLES.spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: COMMON_STYLES.spacing.xxl,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${JOB_COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  modalStaffName: {
    color: JOB_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: COMMON_STYLES.spacing.xs,
  },
  modalStaffRole: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  pinInstructions: {
    color: JOB_COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // PIN input
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: COMMON_STYLES.spacing.lg,
    marginBottom: COMMON_STYLES.spacing.xxl,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pinDotEmpty: {
    borderColor: JOB_COLORS.textMuted,
  },
  pinDotFilled: {
    backgroundColor: JOB_COLORS.primary,
    borderColor: JOB_COLORS.primary,
  },
  
  hiddenInputContainer: {
    position: 'absolute',
    left: -1000,
    opacity: 0,
  },
  hiddenInputTouchable: {
    width: 100,
    height: 40,
  },
  hiddenInputText: {
    color: 'transparent',
  },
  
  // PIN error
  pinErrorContainer: {
    backgroundColor: `${JOB_COLORS.danger}20`,
    borderWidth: 1,
    borderColor: `${JOB_COLORS.danger}30`,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.md,
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  pinErrorText: {
    color: JOB_COLORS.danger,
    textAlign: 'center',
    fontSize: 14,
  },
  
  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: JOB_COLORS.surfaceElevated,
    paddingVertical: COMMON_STYLES.spacing.lg,
    borderRadius: COMMON_STYLES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: COMMON_STYLES.buttonHeight,
  },
  cancelButtonText: {
    color: JOB_COLORS.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: JOB_COLORS.primary,
    paddingVertical: COMMON_STYLES.spacing.lg,
    borderRadius: COMMON_STYLES.borderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: COMMON_STYLES.spacing.sm,
    minHeight: COMMON_STYLES.buttonHeight,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: JOB_COLORS.background,
    fontWeight: '600',
  },
});
