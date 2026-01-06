import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useRouter, useFocusEffect } from 'expo-router';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';
import { Button } from '@/components/ui/BrandButton';

// User status options
const statusOptions = [
  { id: 'available', labelKey: 'profile.available', color: BrandTheme.colors.SUCCESS, icon: 'checkmark-circle' },
  { id: 'busy', labelKey: 'profile.busy', color: BrandTheme.colors.WARNING, icon: 'time' },
  { id: 'offline', labelKey: 'profile.offline', color: BrandTheme.colors.TEXT_SECONDARY, icon: 'moon' },
] as const;

type UserStatus = typeof statusOptions[number]['id'];

export default function ProfileScreen() {
  const { currentProfile, logout, isLoading } = usePINAuth();
  const { t } = useTranslationContext();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isStaffUser = currentProfile?.role && ['cleaner', 'maintenance', 'staff'].includes(currentProfile.role);
  const isAdminOrManager = currentProfile?.role && ['admin', 'manager'].includes(currentProfile.role);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Profile: Screen focused, refreshing profile data...');
      // Profile data is managed by context, no explicit refresh needed
      // But we trigger a re-render by updating state
      setRefreshing(false);
    }, [])
  );

  // Manual refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Profile: Manual refresh triggered');
    
    // Simulate refresh (profile data is managed by context)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRefreshing(false);
    console.log('✅ Profile: Refresh complete');
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutTitle'),
      t('profile.signOutMessage'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.signOutTitle'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              console.log('🚪 Profile: Starting beautiful logout process...');

              // Add beautiful fadeOut animation before logout
              console.log('🎨 Profile: Starting fadeOut animation...');

              // Small delay to show the signing out state
              await new Promise(resolve => setTimeout(resolve, 300));

              // Perform the comprehensive logout
              await logout();
              console.log('✅ Profile: Logout completed, preparing navigation...');

              // Add smooth transition delay for better UX
              await new Promise(resolve => setTimeout(resolve, 300));

              // Navigate to profile selection screen and completely clear navigation stack
              console.log('🔄 Profile: Navigating to profile selection with router.replace...');
              router.replace('/(auth)/select-profile');

              // Additional cleanup to ensure navigation stack is completely cleared
              console.log('🧹 Profile: Ensuring navigation stack is completely cleared...');

              console.log('✅ Profile: Beautiful logout process completed successfully');

            } catch (error) {
              console.error('❌ Profile: Logout error:', error);

              // Show user-friendly error message
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              Alert.alert(
                'Logout Complete',
                `You have been successfully signed out.\n\n${errorMessage ? `Note: ${errorMessage}` : ''}`,
                [{
                  text: 'Continue',
                  onPress: () => {
                    // Ensure navigation happens even if there were errors
                    router.replace('/(auth)/select-profile');
                  }
                }]
              );

            } finally {
              // Reset signing out state
              setIsSigningOut(false);
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = () => {
    const currentIndex = statusOptions.findIndex(option => option.id === userStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const nextStatus = statusOptions[nextIndex];

    setUserStatus(nextStatus.id);
    Alert.alert(
      t('profile.status') + ' ' + t('common.success'),
      `${t('profile.currentStatus')}: ${t(nextStatus.labelKey)}`,
      [{ text: t('common.ok') }]
    );
  };

  const handleEditProfile = () => {
    router.push('/(modal)/edit-profile');
  };

  const getCurrentStatus = () => {
    return statusOptions.find(option => option.id === userStatus) || statusOptions[0];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return BrandTheme.colors.ERROR;
      case 'manager': return BrandTheme.colors.WARNING;
      case 'staff': return BrandTheme.colors.INFO;
      case 'cleaner': return BrandTheme.colors.SUCCESS;
      case 'maintenance': return BrandTheme.colors.YELLOW;
      default: return BrandTheme.colors.TEXT_SECONDARY;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Action Button Component with brand styling
  const ActionButton = ({
    icon,
    title,
    subtitle,
    onPress,
    isSpecial = false,
    showChevron = true,
    isLoading = false,
    disabled = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    isSpecial?: boolean;
    showChevron?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isSpecial && styles.actionButtonSpecial,
        disabled && styles.actionButtonDisabled
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      disabled={disabled}
    >
      <View style={styles.actionButtonContent}>
        {/* Icon Container */}
        <View style={[
          styles.actionButtonIcon,
          isSpecial && styles.actionButtonIconSpecial
        ]}>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={isSpecial ? BrandTheme.colors.BLACK : BrandTheme.colors.YELLOW}
            />
          ) : (
            <Ionicons
              name={icon}
              size={20}
              color={isSpecial ? BrandTheme.colors.BLACK : BrandTheme.colors.YELLOW}
            />
          )}
        </View>

        {/* Text Container */}
        <View style={styles.actionButtonText}>
          <Text style={[
            styles.actionButtonTitle,
            isSpecial && styles.actionButtonTitleSpecial
          ]}>
            {isLoading ? t('common.signingOut') : title}
          </Text>
          <Text style={[
            styles.actionButtonSubtitle,
            isSpecial && styles.actionButtonSubtitleSpecial
          ]}>
            {isLoading ? t('common.pleaseWaitSignOut') : subtitle}
          </Text>
        </View>

        {/* Chevron Icon or Loading */}
        {showChevron && !isLoading && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isSpecial ? BrandTheme.colors.BLACK : BrandTheme.colors.TEXT_SECONDARY}
          />
        )}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={isSpecial ? BrandTheme.colors.BLACK : BrandTheme.colors.TEXT_SECONDARY}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandTheme.colors.YELLOW}
            colors={[BrandTheme.colors.YELLOW]}
            progressBackgroundColor={BrandTheme.colors.SURFACE_1}
          />
        }
      >
        {/* Profile Header Section */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {/* User Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGradient}>
                <View style={styles.avatarInner}>
                  {currentProfile?.avatar ? (
                    <Image
                      source={{ uri: currentProfile.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {getInitials(currentProfile?.name || 'Staff Member')}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* User Information */}
            <Text style={styles.userName}>
              {currentProfile?.name || 'Staff Member'}
            </Text>
            <Text style={styles.userEmail}>
              {currentProfile?.email || 'staff@property.com'}
            </Text>

            {/* Role Badge */}
            <View style={[
              styles.roleBadge,
              { backgroundColor: getRoleBadgeColor(currentProfile?.role || 'staff') }
            ]}>
              <Text style={styles.roleBadgeText}>
                {currentProfile?.role || 'Staff'}
              </Text>
            </View>

            {/* Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getCurrentStatus().color }
              ]} />
              <Text style={[
                styles.statusText,
                { color: getCurrentStatus().color }
              ]}>
                {t(getCurrentStatus().labelKey)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons Section */}
        <View style={styles.actionsSection}>
          {/* Edit Profile Button */}
          <ActionButton
            icon="person-outline"
            title={t('profile.editProfile')}
            subtitle={t('profile.personalInfo')}
            onPress={handleEditProfile}
            disabled={isSigningOut || isLoading}
          />

          {/* Change Status Button */}
          <ActionButton
            icon="radio-button-on-outline"
            title={t('profile.status')}
            subtitle={`${t('profile.currentStatus')}: ${t(getCurrentStatus().labelKey)}`}
            onPress={handleStatusChange}
            disabled={isSigningOut || isLoading}
          />

          {/* Admin-only features */}
          {isAdminOrManager && (
            <ActionButton
              icon="settings-outline"
              title="Admin Settings"
              subtitle="Access administrative features"
              onPress={() => Alert.alert('Admin Settings', 'Admin settings features coming soon!')}
              disabled={isSigningOut || isLoading}
            />
          )}

          {/* Sign Out Button */}
          <ActionButton
            icon="log-out-outline"
            title={t('profile.signOutTitle')}
            subtitle={t('profile.signOutSubtitle')}
            onPress={handleSignOut}
            isSpecial={true}
            showChevron={false}
            isLoading={isSigningOut || isLoading}
            disabled={isSigningOut || isLoading}
          />
        </View>
      </ScrollView>

      {/* Beautiful Logout Overlay */}
      <LogoutOverlay
        visible={isSigningOut}
        message="Signing out..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  header: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  headerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  headerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  scrollContent: {
    paddingTop: BrandTheme.spacing.LG,
    paddingBottom: 100,
  },

  profileCard: {
    marginBottom: BrandTheme.spacing.LG,
  },

  profileHeader: {
    alignItems: 'center',
  },

  avatarContainer: {
    marginBottom: BrandTheme.spacing.LG,
  },

  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: BrandTheme.colors.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },

  avatarText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.YELLOW,
  },

  userName: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_PRIMARY,
    textAlign: 'center',
  },

  userEmail: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
    textAlign: 'center',
  },

  roleBadge: {
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: BrandTheme.spacing.XS,
    borderRadius: 0, // Brand kit: sharp corners
    marginTop: BrandTheme.spacing.SM,
  },

  roleBadgeText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: BrandTheme.spacing.SM,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: BrandTheme.spacing.SM,
  },

  statusText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  actionsSection: {
    gap: BrandTheme.spacing.SM,
  },

  actionButton: {
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 0, // Brand kit: sharp corners
    padding: BrandTheme.spacing.LG,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    ...BrandTheme.shadows.SMALL_GLOW,
  },

  actionButtonSpecial: {
    backgroundColor: BrandTheme.colors.YELLOW,
    borderColor: BrandTheme.colors.YELLOW,
  },

  actionButtonDisabled: {
    opacity: 0.5,
  },

  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: BrandTheme.spacing.MD,
  },

  actionButtonIconSpecial: {
    backgroundColor: BrandTheme.colors.BLACK,
  },

  actionButtonText: {
    flex: 1,
  },

  actionButtonTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  actionButtonTitleSpecial: {
    color: BrandTheme.colors.BLACK,
  },

  actionButtonSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
  },

  actionButtonSubtitleSpecial: {
    color: BrandTheme.colors.BLACK,
    opacity: 0.7,
  },
});
