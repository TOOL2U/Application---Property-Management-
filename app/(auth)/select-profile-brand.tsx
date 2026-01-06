/**
 * Staff Profile Selection Screen - Brand Kit Style
 * Beautiful card-based design with brand yellow accents and consistent styling
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { StaffProfile } from '@/services/localStaffService';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';
import { Button } from '@/components/ui/BrandButton';

const { width: screenWidth } = Dimensions.get('window');

export default function SelectProfileScreen() {
  const router = useRouter();
  const {
    staffProfiles,
    getStaffProfiles,
    isLoading,
    hasProfilePIN,
    refreshStaffProfiles
  } = usePINAuth();

  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('📱 SelectProfile: Component mounted, loading profiles...');
    loadProfiles();
  }, []);

  useEffect(() => {
    console.log('📱 SelectProfile: staffProfiles state changed:', {
      count: staffProfiles.length,
      profiles: staffProfiles.map(p => ({ id: p.id, name: p.name, email: p.email }))
    });
  }, [staffProfiles]);

  const loadProfiles = async () => {
    console.log('📱 SelectProfile: loadProfiles called');
    try {
      await getStaffProfiles();
      console.log('📱 SelectProfile: getStaffProfiles completed');
    } catch (error) {
      console.error('📱 SelectProfile: Error loading profiles:', error);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 SelectProfile: Manual refresh triggered');
    setIsRefreshing(true);
    try {
      await refreshStaffProfiles();
      console.log('✅ SelectProfile: Refresh completed');
    } catch (error) {
      console.error('❌ SelectProfile: Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileSelect = async (profile: StaffProfile) => {
    console.log('👆 SelectProfile: Profile selected:', profile.id, profile.name);
    setLoadingProfileId(profile.id);

    try {
      // Check if profile has a PIN set
      const hasPIN = await hasProfilePIN(profile.id);
      
      if (hasPIN) {
        console.log('🔐 SelectProfile: Profile has PIN, navigating to PIN entry');
        router.push({
          pathname: '/(auth)/enter-pin',
          params: {
            profileId: profile.id,
            profileName: profile.name,
            profileRole: profile.role,
          }
        });
      } else {
        console.log('⚙️ SelectProfile: Profile has no PIN, navigating to setup');
        router.push({
          pathname: '/(auth)/enter-pin',
          params: {
            profileId: profile.id,
            profileName: profile.name,
            profileRole: profile.role,
            setupMode: 'true',
          }
        });
      }
    } catch (error) {
      console.error('❌ SelectProfile: Profile selection failed:', error);
    } finally {
      setLoadingProfileId(null);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    const roleColors: { [key: string]: string } = {
      admin: BrandTheme.colors.ERROR,
      manager: BrandTheme.colors.WARNING,
      staff: BrandTheme.colors.YELLOW,
      cleaner: BrandTheme.colors.SUCCESS,
      maintenance: BrandTheme.colors.INFO,
      housekeeper: BrandTheme.colors.SUCCESS,
      concierge: BrandTheme.colors.WARNING,
    };
    return roleColors[role] || BrandTheme.colors.GREY_SECONDARY;
  };

  if (isLoading && staffProfiles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
          <Text style={styles.loadingText}>Loading staff accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
      <SafeAreaView style={styles.safeArea}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Select Profile
            </Text>
            <Text style={styles.headerSubtitle}>
              Choose your staff profile to continue
            </Text>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={styles.refreshButton}
          >
            <Ionicons
              name={isRefreshing ? "hourglass" : "refresh"}
              size={20}
              color={isRefreshing ? BrandTheme.colors.GREY_SECONDARY : BrandTheme.colors.YELLOW}
            />
          </TouchableOpacity>
        </View>

        {/* Staff Profiles List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {staffProfiles.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={BrandTheme.colors.GREY_SECONDARY} />
                <Text style={styles.emptyTitle}>No Staff Profiles</Text>
                <Text style={styles.emptySubtitle}>
                  No staff profiles found. Please contact your administrator to set up staff accounts.
                </Text>
                <Button
                  title="Refresh"
                  variant="secondary"
                  onPress={handleRefresh}
                  style={styles.refreshButtonLarge}
                />
              </View>
            </Card>
          ) : (
            staffProfiles.map((profile, index) => (
              <Card key={profile.id} style={styles.profileCard}>
                <TouchableOpacity
                  onPress={() => handleProfileSelect(profile)}
                  disabled={loadingProfileId === profile.id}
                  style={styles.profileTouchable}
                >
                  <View style={styles.profileContent}>
                    {/* Profile Avatar */}
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {profile.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{profile.name}</Text>
                      <Text style={styles.profileEmail}>{profile.email}</Text>
                      
                      {/* Role Badge */}
                      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(profile.role) + '20' }]}>
                        <Text style={[styles.roleText, { color: getRoleBadgeColor(profile.role) }]}>
                          {profile.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Loading or Arrow */}
                    <View style={styles.profileAction}>
                      {loadingProfileId === profile.id ? (
                        <ActivityIndicator size="small" color={BrandTheme.colors.YELLOW} />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={24}
                          color={BrandTheme.colors.YELLOW}
                        />
                      )}
                    </View>
                  </View>

                  {/* Security Indicator */}
                  <View style={styles.securityIndicator}>
                    <Ionicons
                      name="shield-checkmark"
                      size={16}
                      color={BrandTheme.colors.SUCCESS}
                    />
                    <Text style={styles.securityText}>Secure Access</Text>
                  </View>
                </TouchableOpacity>
              </Card>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: BrandTheme.spacing.MD,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingTop: BrandTheme.spacing.XL,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.XL,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: BrandTheme.spacing.XS,
  },

  headerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
  },

  refreshButton: {
    padding: BrandTheme.spacing.SM,
    borderRadius: 8,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: BrandTheme.spacing.XL,
  },

  emptyCard: {
    marginTop: BrandTheme.spacing.XXL,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XXL,
  },

  emptyTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: BrandTheme.spacing.MD,
    marginBottom: BrandTheme.spacing.SM,
  },

  emptySubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: BrandTheme.spacing.LG,
  },

  refreshButtonLarge: {
    marginTop: BrandTheme.spacing.MD,
  },

  profileCard: {
    marginBottom: BrandTheme.spacing.LG,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  profileTouchable: {
    padding: BrandTheme.spacing.LG,
  },

  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.SM,
  },

  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandTheme.colors.YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BrandTheme.spacing.MD,
  },

  profileAvatarText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 2,
  },

  profileEmail: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: BrandTheme.spacing.SM,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },

  roleText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  profileAction: {
    padding: BrandTheme.spacing.SM,
  },

  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: BrandTheme.spacing.SM,
    borderTopWidth: 1,
    borderTopColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  securityText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.SUCCESS,
    marginLeft: BrandTheme.spacing.XS,
  },
});
