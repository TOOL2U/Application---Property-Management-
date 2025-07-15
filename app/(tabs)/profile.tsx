import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { useJobNotifications } from '@/hooks/useJobNotifications';
import {
  User,
  Bell,
  MapPin,
  Settings,
  LogOut,
  Phone,
  Mail,
  Shield,
  ChevronRight,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Zap,
} from 'lucide-react-native';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';
import { NeumorphicCard, NeumorphicButton } from '@/components/ui/NeumorphicComponents';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

// Property Management Staff Profile Data
const mockStaffProfile = {
  maintenanceJobsCompleted: 127,
  inspectionsCompleted: 34,
  tenantSatisfactionRating: 4.6,
  averageResponseTime: '2.1 hours',
  efficiency: 91,
  specializations: ['Plumbing', 'HVAC Systems', 'Electrical Repair', 'General Maintenance'],
  certifications: [
    { name: 'EPA 608 Certification', issueDate: '2023-03-15', expiryDate: '2026-03-15' },
    { name: 'OSHA 10-Hour Safety', issueDate: '2023-01-20', expiryDate: '2026-01-20' },
    { name: 'Property Management License', issueDate: '2022-08-10', expiryDate: '2025-08-10' },
    { name: 'HVAC Technician License', issueDate: '2022-05-05', expiryDate: '2025-05-05' }
  ],
  monthlyPerformance: {
    maintenanceCompleted: 23,
    emergencyResponseTime: '1.8 hours',
    tenantCompliments: 8,
    workOrdersOnTime: 21
  }
};

export default function ProfileScreen() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { expoPushToken, simulateJobNotification } = useJobNotifications();
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();
  
  // Combined loading state
  const isLoading = authLoading || localLoading;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign back in with either a staff or admin account.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting sign out process from profile screen...');
              setLocalLoading(true);
              
              // Perform sign out
              await signOut();
              
              console.log('✅ Sign out completed successfully');
              
              // Navigate to login screen after successful sign out
              // Using replace to prevent going back to the authenticated area
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('❌ Sign out error:', error);
              Alert.alert(
                'Sign Out Error',
                'There was an error signing out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLocalLoading(false);
            }
          }
        },
      ]
    );
  };

  const ProfileSection = ({ title, children }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const ProfileItem = ({ 
    icon: Icon, 
    label, 
    value, 
    onPress, 
    showChevron = false 
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          <Icon size={20} color={NeumorphicTheme.colors.text.secondary} />
        </View>
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          {value && (
            <Text style={styles.profileItemValue}>{value}</Text>
          )}
        </View>
      </View>
      {showChevron && (
        <ChevronRight size={16} color={NeumorphicTheme.colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color, trend }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    trend?: number;
  }) => (
    <NeumorphicCard style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <View style={[styles.statIconInner, { backgroundColor: color }]} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
        {trend && (
          <View style={styles.statTrend}>
            <TrendingUp size={12} color={trend > 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error} />
            <Text style={[styles.statTrendText, { color: trend > 0 ? NeumorphicTheme.colors.semantic.success : NeumorphicTheme.colors.semantic.error }]}>
              {trend > 0 ? '+' : ''}{trend}%
            </Text>
          </View>
        )}
      </View>
    </NeumorphicCard>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={NeumorphicTheme.gradients.backgroundMain}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header with Glassmorphism */}
        <BlurView intensity={20} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account</Text>
          </View>
          <View style={styles.headerIcon}>
            <User size={24} color={NeumorphicTheme.colors.brand.primary} />
          </View>
        </BlurView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Enhanced User Card */}
          <NeumorphicCard style={styles.userCard}>
            <View style={styles.userCardContent}>
              <LinearGradient
                colors={NeumorphicTheme.gradients.brandPrimary}
                style={styles.avatarGradient}
              >
                <User size={32} color="#ffffff" />
              </LinearGradient>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.firstName || 'Sia'} {user?.lastName || 'Moon'}
                </Text>
                <Text style={styles.userRole}>
                  {user?.role === 'admin' ? 'Administrator' : 'Property Manager'}
                </Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.userStatus}>Active</Text>
                </View>
              </View>
            </View>
          </NeumorphicCard>

          {/* Property Management Performance Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCardContainer}>
              <StatCard
                title="Maintenance Jobs"
                value={mockStaffProfile.maintenanceJobsCompleted}
                icon="wrench"
                color={NeumorphicTheme.colors.semantic.success}
                trend={15}
              />
            </View>
            <View style={styles.statCardContainer}>
              <StatCard
                title="Inspections"
                value={mockStaffProfile.inspectionsCompleted}
                icon="clipboard-check"
                color={NeumorphicTheme.colors.semantic.info}
                trend={8}
              />
            </View>
            <View style={styles.statCardContainer}>
              <StatCard
                title="Tenant Rating"
                value={mockStaffProfile.tenantSatisfactionRating}
                icon="star"
                color={NeumorphicTheme.colors.semantic.warning}
                trend={5}
              />
            </View>
            <View style={styles.statCardContainer}>
              <StatCard
                title="Response Time"
                value={mockStaffProfile.averageResponseTime}
                icon="clock-fast"
                color={NeumorphicTheme.colors.semantic.error}
                trend={-12}
              />
            </View>
          </View>

          {/* Specializations Section */}
          <NeumorphicCard style={styles.specializationsCard}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.specializationsList}>
              {mockStaffProfile.specializations.map((spec, index) => (
                <View key={index} style={styles.specializationChip}>
                  <Text style={styles.specializationText}>{spec}</Text>
                </View>
              ))}
            </View>
          </NeumorphicCard>

          {/* Certifications Section */}
          <NeumorphicCard style={styles.certificationsCard}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.certificationsList}>
              {mockStaffProfile.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <View style={styles.certificationHeader}>
                    <Text style={styles.certificationName}>{cert.name}</Text>
                    <View style={styles.certificationStatus}>
                      <Text style={styles.certificationStatusText}>Valid</Text>
                    </View>
                  </View>
                  <Text style={styles.certificationExpiry}>
                    Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </NeumorphicCard>

          {/* Contact Information */}
          <NeumorphicCard style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <ProfileItem
              icon={Mail}
              label="Email"
              value={user?.email || 'sia.moon@property.com'}
            />
            <ProfileItem
              icon={Phone}
              label="Phone"
              value="+1 (555) 123-4567"
            />
          </NeumorphicCard>

          {/* App Settings */}
          <NeumorphicCard style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <ProfileItem
              icon={Bell}
              label="Notifications"
              value={expoPushToken ? "Enabled" : "Disabled"}
              onPress={() => {
                Alert.alert(
                  'Notifications',
                  expoPushToken
                    ? 'Push notifications are enabled'
                    : 'Push notifications are disabled. Please enable them in your device settings.',
                  [{ text: 'OK' }]
                );
              }}
              showChevron
            />
            <ProfileItem
              icon={MapPin}
              label="Location Services"
              value="Enabled"
              onPress={() => {
                Alert.alert(
                  'Location Services',
                  'Location access is required for navigation to job sites.',
                  [{ text: 'OK' }]
                );
              }}
              showChevron
            />
          </NeumorphicCard>

          {/* Developer Tools */}
          <NeumorphicCard style={styles.developerCard}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>
            <ProfileItem
              icon={Settings}
              label="Test Notification"
              onPress={simulateJobNotification}
              showChevron
            />
            <ProfileItem
              icon={Shield}
              label="Push Token"
              value={expoPushToken ? "Active" : "Not Available"}
              onPress={() => {
                if (expoPushToken) {
                  Alert.alert(
                    'Push Token',
                    expoPushToken.substring(0, 50) + '...',
                    [{ text: 'OK' }]
                  );
                }
              }}
              showChevron
            />
            <ProfileItem
              icon={User}
              label="Account Type"
              value={user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
            />
          </NeumorphicCard>

          {/* Enhanced Sign Out Button */}
          <View style={styles.signOutSection}>
            <NeumorphicButton
              title={isLoading ? "Signing Out..." : "Sign Out"}
              onPress={handleSignOut}
              variant="error"
              size="large"
              disabled={isLoading}
              icon={<LogOut size={20} color="#ffffff" />}
              style={styles.signOutButton}
            />
            {isLoading && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator 
                  size="small" 
                  color={NeumorphicTheme.colors.semantic.error} 
                />
              </View>
            )}
            <Text style={styles.signOutHint}>
              You can sign back in with staff or admin credentials
            </Text>
            <View style={styles.accountOptions}>
              <Text style={styles.accountOptionsTitle}>Test Accounts:</Text>
              <Text style={styles.accountOption}>• Staff: staff@siamoon.com / password</Text>
              <Text style={styles.accountOption}>• Admin: admin@siamoon.com / admin</Text>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Sia Moon Property Management</Text>
            <Text style={styles.appInfoText}>Mobile App v2.0.0</Text>
            <Text style={styles.appInfoText}>
              Current User: {user?.email || 'Not logged in'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[5],
    paddingTop: NeumorphicTheme.spacing[4],
    paddingBottom: NeumorphicTheme.spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    letterSpacing: -0.2,
    marginTop: NeumorphicTheme.spacing[1],
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: NeumorphicTheme.borderRadius.md,
    backgroundColor: `${NeumorphicTheme.colors.brand.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${NeumorphicTheme.colors.brand.primary}30`,
  },

  // Enhanced User Card
  userCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[6],
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: NeumorphicTheme.spacing[4],
    ...NeumorphicTheme.shadows.glow.brand,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: NeumorphicTheme.typography.sizes.xl.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
    letterSpacing: -0.3,
  },
  userRole: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    marginBottom: NeumorphicTheme.spacing[2],
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${NeumorphicTheme.colors.semantic.success}20`,
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NeumorphicTheme.colors.semantic.success,
    marginRight: NeumorphicTheme.spacing[1],
  },
  userStatus: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    color: NeumorphicTheme.colors.semantic.success,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    letterSpacing: -0.1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: NeumorphicTheme.spacing[5],
    paddingTop: NeumorphicTheme.spacing[6],
    gap: NeumorphicTheme.spacing[3],
  },
  statCardContainer: {
    width: (screenWidth - NeumorphicTheme.spacing[5] * 2 - NeumorphicTheme.spacing[3]) / 2,
  },
  statCard: {
    padding: NeumorphicTheme.spacing[4],
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: NeumorphicTheme.spacing[2],
  },
  statIconInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statValue: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
  },
  statLabel: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: NeumorphicTheme.spacing[1],
    gap: NeumorphicTheme.spacing[1],
  },
  statTrendText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },

  // Cards
  specializationsCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[4],
  },
  certificationsCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[4],
  },
  contactCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[4],
  },
  settingsCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[4],
  },
  developerCard: {
    marginHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    padding: NeumorphicTheme.spacing[4],
  },

  // Specializations
  specializationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: NeumorphicTheme.spacing[2],
    marginTop: NeumorphicTheme.spacing[3],
  },
  specializationChip: {
    backgroundColor: `${NeumorphicTheme.colors.brand.primary}20`,
    paddingHorizontal: NeumorphicTheme.spacing[3],
    paddingVertical: NeumorphicTheme.spacing[2],
    borderRadius: NeumorphicTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${NeumorphicTheme.colors.brand.primary}30`,
  },
  specializationText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.brand.primary,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    letterSpacing: -0.1,
  },

  // Certifications
  certificationsList: {
    marginTop: NeumorphicTheme.spacing[3],
    gap: NeumorphicTheme.spacing[3],
  },
  certificationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: NeumorphicTheme.spacing[3],
    borderRadius: NeumorphicTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: NeumorphicTheme.spacing[1],
  },
  certificationName: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.primary,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    letterSpacing: -0.2,
    flex: 1,
  },
  certificationStatus: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.success}20`,
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
  },
  certificationStatusText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    color: NeumorphicTheme.colors.semantic.success,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
  certificationExpiry: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    letterSpacing: -0.1,
  },

  // Profile Items
  sectionTitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[3],
    letterSpacing: -0.2,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: NeumorphicTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: NeumorphicTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: NeumorphicTheme.spacing[3],
  },
  profileItemText: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[1],
    letterSpacing: -0.2,
  },
  profileItemValue: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    letterSpacing: -0.1,
  },

  // Sign Out Section
  signOutSection: {
    paddingHorizontal: NeumorphicTheme.spacing[5],
    marginTop: NeumorphicTheme.spacing[6],
    marginBottom: NeumorphicTheme.spacing[6],
  },
  signOutButton: {
    marginBottom: NeumorphicTheme.spacing[3],
  },
  loadingIndicator: {
    alignItems: 'center',
    marginBottom: NeumorphicTheme.spacing[3],
  },
  signOutHint: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: -0.1,
    marginBottom: NeumorphicTheme.spacing[4],
  },
  accountOptions: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: NeumorphicTheme.spacing[4],
    borderRadius: NeumorphicTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountOptionsTitle: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.text.secondary,
    marginBottom: NeumorphicTheme.spacing[2],
  },
  accountOption: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    marginBottom: NeumorphicTheme.spacing[1],
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: NeumorphicTheme.spacing[6],
    paddingHorizontal: NeumorphicTheme.spacing[5],
  },
  appInfoText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.quaternary,
    textAlign: 'center',
    letterSpacing: -0.1,
    marginBottom: NeumorphicTheme.spacing[1],
  },
});
