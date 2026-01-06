import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter, useFocusEffect } from 'expo-router';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import LogoutOverlay from '@/components/auth/LogoutOverlay';
import { useTranslation } from '@/hooks/useTranslation';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';
import { Button } from '@/components/ui/BrandButton';

export default function IndexScreen() {
  const { currentProfile, isAuthenticated, logout } = usePINAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  // Use the useStaffJobs hook to get all job data
  const { 
    pendingJobs, 
    activeJobs, 
    completedJobs,
    jobs,
    refreshJobs, 
    loading: loadingJobs 
  } = useStaffJobs({
    enableRealtime: true,
    enableCache: true,
  });

  // Auto-refresh on screen focus for better UX
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && currentProfile?.id) {
        console.log('🔄 Home Screen: Screen focused, refreshing jobs...');
        refreshJobs();
      }
    }, [isAuthenticated, currentProfile?.id, refreshJobs])
  );

  // Get today's jobs
  const todaysJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...pendingJobs, ...activeJobs].filter(job => {
      if (!job.scheduledDate) return false;
      const jobDate = (job.scheduledDate as any).toDate ? (job.scheduledDate as any).toDate() : new Date(job.scheduledDate);
      jobDate.setHours(0, 0, 0, 0);
      return jobDate.getTime() === today.getTime();
    }).sort((a, b) => {
      const aTime = (a.scheduledDate as any).toDate ? (a.scheduledDate as any).toDate() : new Date(a.scheduledDate);
      const bTime = (b.scheduledDate as any).toDate ? (b.scheduledDate as any).toDate() : new Date(b.scheduledDate);
      return aTime.getTime() - bTime.getTime();
    });
  }, [pendingJobs, activeJobs]);

  // Get urgent jobs (high priority pending jobs)
  const urgentJobs = useMemo(() => {
    return pendingJobs.filter(job => job.priority === 'urgent' || job.priority === 'high');
  }, [pendingJobs]);

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated && currentProfile?.id) {
      await refreshJobs();
    }
    setRefreshing(false);
  };

  // Handle navigation to jobs
  const handleViewJobs = () => {
    router.push('/(tabs)/jobs');
  };

  // Handle profile selection
  const handleProfilePress = () => {
    setIsSwitchingProfile(true);
  };

  // Handle logout
  const handleLogoutConfirm = async () => {
    setIsSwitchingProfile(false);
    await logout();
    router.replace('/(auth)/select-staff-profile');
  };

  const pendingJobCount = pendingJobs?.length || 0;
  const activeJobCount = activeJobs?.length || 0;
  const todaysJobCount = todaysJobs?.length || 0;

  // Format time
  const formatTime = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return 'time-outline';
      case 'in_progress': return 'play-circle';
      case 'accepted': return 'checkmark-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return BrandTheme.colors.YELLOW;
      case 'in_progress': return BrandTheme.colors.WARNING;
      case 'accepted': return BrandTheme.colors.INFO;
      default: return BrandTheme.colors.TEXT_SECONDARY;
    }
  };

  if (!isAuthenticated || !currentProfile) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
      
      {/* Header */}
      <LinearGradient
        colors={[BrandTheme.colors.BLACK, BrandTheme.colors.GREY_PRIMARY]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentProfile.name}</Text>
              <Text style={styles.userRole}>{currentProfile.role}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={BrandTheme.colors.YELLOW} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandTheme.colors.YELLOW}
            colors={[BrandTheme.colors.YELLOW]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()}, {currentProfile.name}!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Urgent Alerts */}
        {urgentJobs.length > 0 && (
          <Card variant="elevated" style={styles.urgentCard}>
            <View style={styles.urgentHeader}>
              <View style={styles.urgentIconContainer}>
                <Ionicons name="alert-circle" size={24} color={BrandTheme.colors.ERROR} />
              </View>
              <View style={styles.urgentContent}>
                <Text style={styles.urgentTitle}>Needs Attention</Text>
                <Text style={styles.urgentCount}>{urgentJobs.length} urgent {urgentJobs.length === 1 ? 'job' : 'jobs'}</Text>
              </View>
              <TouchableOpacity onPress={handleViewJobs}>
                <Ionicons name="arrow-forward" size={24} color={BrandTheme.colors.ERROR} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todaysJobCount > 3 && (
              <TouchableOpacity onPress={handleViewJobs}>
                <Text style={styles.sectionLink}>VIEW ALL</Text>
              </TouchableOpacity>
            )}
          </View>

          {todaysJobCount === 0 ? (
            <Card variant="standard" style={styles.emptyScheduleCard}>
              <View style={styles.emptySchedule}>
                <Ionicons name="calendar-outline" size={48} color={BrandTheme.colors.TEXT_SECONDARY} />
                <Text style={styles.emptyScheduleTitle}>No jobs scheduled today</Text>
                <Text style={styles.emptyScheduleText}>Enjoy your free time!</Text>
              </View>
            </Card>
          ) : (
            todaysJobs.slice(0, 3).map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => router.push(`/jobs/${job.id}`)}
              >
                <Card variant="standard" style={styles.scheduleCard}>
                  <View style={styles.scheduleCardContent}>
                    <View style={styles.scheduleTime}>
                      <Ionicons 
                        name={getStatusIcon(job.status)} 
                        size={24} 
                        color={getStatusColor(job.status)} 
                      />
                      <Text style={styles.timeText}>{formatTime(job.scheduledDate)}</Text>
                    </View>
                    <View style={styles.scheduleDetails}>
                      <Text style={styles.scheduleTitle} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <View style={styles.scheduleMetaRow}>
                        {job.location?.address && (
                          <View style={styles.scheduleMeta}>
                            <Ionicons name="location-outline" size={14} color={BrandTheme.colors.TEXT_SECONDARY} />
                            <Text style={styles.scheduleMetaText} numberOfLines={1}>
                              {job.location.address}
                            </Text>
                          </View>
                        )}
                        {job.priority && (
                          <View style={[styles.priorityPill, { 
                            backgroundColor: job.priority === 'urgent' || job.priority === 'high' 
                              ? BrandTheme.colors.ERROR 
                              : BrandTheme.colors.SUCCESS 
                          }]}>
                            <Text style={styles.priorityText}>
                              {job.priority.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <Card variant="elevated" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="time-outline" size={28} color={BrandTheme.colors.YELLOW} />
                </View>
                <Text style={styles.statNumber}>{pendingJobCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </Card>

            <Card variant="elevated" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="play-circle" size={28} color={BrandTheme.colors.WARNING} />
                </View>
                <Text style={styles.statNumber}>{activeJobCount}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </Card>

            <Card variant="elevated" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="calendar" size={28} color={BrandTheme.colors.INFO} />
                </View>
                <Text style={styles.statNumber}>{todaysJobCount}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleViewJobs}
            >
              <Card variant="elevated" style={styles.actionCardInner}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="briefcase" size={32} color={BrandTheme.colors.YELLOW} />
                </View>
                <Text style={styles.actionTitle}>View Jobs</Text>
                <Text style={styles.actionSubtitle}>All assignments</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Card variant="elevated" style={styles.actionCardInner}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="add-circle" size={32} color={BrandTheme.colors.SUCCESS} />
                </View>
                <Text style={styles.actionTitle}>Start Job</Text>
                <Text style={styles.actionSubtitle}>Begin work</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Card variant="elevated" style={styles.actionCardInner}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="person" size={32} color={BrandTheme.colors.INFO} />
                </View>
                <Text style={styles.actionTitle}>Profile</Text>
                <Text style={styles.actionSubtitle}>Your account</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Card variant="elevated" style={styles.actionCardInner}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="settings" size={32} color={BrandTheme.colors.TEXT_SECONDARY} />
                </View>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionSubtitle}>Preferences</Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Logout Overlay */}
            {/* Logout Overlay */}
      <LogoutOverlay
        visible={isSwitchingProfile}
        message="Switching profile..."
      />
    </SafeAreaView>
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
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  loadingText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  header: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandTheme.colors.YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BrandTheme.spacing.MD,
  },

  avatarText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 2,
  },

  userRole: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textTransform: 'capitalize',
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  greetingSection: {
    paddingVertical: BrandTheme.spacing.XL,
  },

  greetingText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.XS,
  },

  dateText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  urgentCard: {
    marginBottom: BrandTheme.spacing.LG,
    borderLeftWidth: 4,
    borderLeftColor: BrandTheme.colors.ERROR,
  },

  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  urgentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BrandTheme.colors.ERROR}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BrandTheme.spacing.MD,
  },

  urgentContent: {
    flex: 1,
  },

  urgentTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.ERROR,
    marginBottom: 2,
  },

  urgentCount: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  emptyScheduleCard: {
    marginTop: BrandTheme.spacing.SM,
  },

  emptySchedule: {
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XXL,
  },

  emptyScheduleTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: BrandTheme.spacing.MD,
    marginBottom: BrandTheme.spacing.XS,
  },

  emptyScheduleText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  scheduleCard: {
    marginTop: BrandTheme.spacing.SM,
  },

  scheduleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
  },

  scheduleTime: {
    alignItems: 'center',
    minWidth: 70,
  },

  timeText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: 4,
  },

  scheduleDetails: {
    flex: 1,
  },

  scheduleTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 4,
  },

  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
  },

  scheduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },

  scheduleMetaText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
  },

  priorityText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  statsSection: {
    marginBottom: BrandTheme.spacing.XL,
  },

  statsRow: {
    flexDirection: 'row',
    gap: BrandTheme.spacing.MD,
  },

  statCard: {
    flex: 1,
    minHeight: 120,
  },

  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BrandTheme.spacing.MD,
  },

  statIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${BrandTheme.colors.YELLOW}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.SM,
  },

  statNumber: {
    fontFamily: BrandTheme.typography.fontFamily.display,
    fontSize: 32,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.XS,
  },

  statLabel: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandTheme.spacing.MD,
    marginTop: BrandTheme.spacing.MD,
  },

  actionCard: {
    width: '48%',
  },

  actionCardInner: {
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XL,
  },

  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.MD,
  },

  actionTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 4,
  },

  actionSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  section: {
    marginBottom: BrandTheme.spacing.XXL,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.LG,
  },

  sectionTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  sectionLink: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  jobCard: {
    marginBottom: BrandTheme.spacing.MD,
  },

  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: BrandTheme.spacing.SM,
  },

  jobTitle: {
    flex: 1,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginRight: BrandTheme.spacing.SM,
  },

  priorityBadge: {
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: BrandTheme.spacing.XS,
    borderRadius: 0, // Brand kit: sharp corners
  },

  jobDescription: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: BrandTheme.spacing.MD,
  },

  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  jobTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.XS,
  },

  jobTimeText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  viewJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.XS,
  },

  viewJobText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  quickActionButton: {
    flex: 1,
  },

  emptyStateCard: {
    marginVertical: BrandTheme.spacing.XXL,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XXL,
  },

  emptyIconContainer: {
    marginBottom: BrandTheme.spacing.LG,
  },

  emptyTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.SM,
  },

  emptySubtext: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
