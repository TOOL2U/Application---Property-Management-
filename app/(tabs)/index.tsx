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

  // Get upcoming jobs (next 3 scheduled jobs with check-in dates)
  const upcomingJobs = useMemo(() => {
    const now = new Date();
    return [...pendingJobs, ...activeJobs]
      .filter(job => {
        if (!job.checkInDate) return false;
        const checkIn = job.checkInDate instanceof Date ? job.checkInDate : new Date(job.checkInDate);
        return checkIn >= now; // Only future check-ins
      })
      .sort((a, b) => {
        const aDate = a.checkInDate instanceof Date ? a.checkInDate : new Date(a.checkInDate!);
        const bDate = b.checkInDate instanceof Date ? b.checkInDate : new Date(b.checkInDate!);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 3); // Show next 3 jobs
  }, [pendingJobs, activeJobs]);

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
    router.push('/(tabs)/jobs-brand' as any);
  };

  // Handle profile selection
  const handleProfilePress = async () => {
    try {
      setIsSwitchingProfile(true);
      await logout();
      // Add small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/(auth)/select-profile');
    } catch (error) {
      console.error('Error switching profile:', error);
      setIsSwitchingProfile(false);
    }
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
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : 'U'}
            </Text>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandTheme.colors.YELLOW}
            colors={[BrandTheme.colors.YELLOW]}
          />
        }
      >
        {/* Dashboard Header - Greeting & Date */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.nameText}>{currentProfile.name}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Quick Stats Overview - 4 Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCardLarge}
            onPress={handleViewJobs}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 240, 43, 0.15)' }]}>
              <Ionicons name="time-outline" size={24} color={BrandTheme.colors.YELLOW} />
            </View>
            <Text style={styles.statNumberLarge}>{pendingJobCount}</Text>
            <Text style={styles.statLabelLarge}>Pending Jobs</Text>
            <Text style={styles.statAction}>Review Now →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCardLarge}
            onPress={handleViewJobs}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <Ionicons name="play-circle-outline" size={24} color="#60A5FA" />
            </View>
            <Text style={styles.statNumberLarge}>{activeJobCount}</Text>
            <Text style={styles.statLabelLarge}>Active Jobs</Text>
            <Text style={styles.statAction}>Continue →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCardLarge}
            onPress={handleViewJobs}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0, 255, 136, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={24} color={BrandTheme.colors.SUCCESS} />
            </View>
            <Text style={styles.statNumberLarge}>{todaysJobCount}</Text>
            <Text style={styles.statLabelLarge}>Today</Text>
            <Text style={styles.statAction}>View Schedule →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCardLarge}
            onPress={handleViewJobs}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 163, 0, 0.15)' }]}>
              <Ionicons name="checkmark-done-outline" size={24} color={BrandTheme.colors.WARNING} />
            </View>
            <Text style={styles.statNumberLarge}>{completedJobs.length}</Text>
            <Text style={styles.statLabelLarge}>Completed</Text>
            <Text style={styles.statAction}>This Period</Text>
          </TouchableOpacity>
        </View>

        {/* Urgent Alerts Banner */}
        {urgentJobs.length > 0 && (
          <TouchableOpacity 
            style={styles.urgentBanner}
            onPress={handleViewJobs}
            activeOpacity={0.9}
          >
            <View style={styles.urgentBannerContent}>
              <View style={styles.urgentBannerLeft}>
                <Ionicons name="warning" size={28} color="#FFF" />
                <View style={styles.urgentBannerText}>
                  <Text style={styles.urgentBannerTitle}>Urgent Attention Required</Text>
                  <Text style={styles.urgentBannerSubtitle}>
                    {urgentJobs.length} high-priority {urgentJobs.length === 1 ? 'job' : 'jobs'} waiting
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Schedule Section */}
        {todaysJobCount > 0 && (
          <View style={styles.dashboardSection}>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="today-outline" size={20} color={BrandTheme.colors.YELLOW} />
                <Text style={styles.dashboardSectionTitle}>Today's Schedule</Text>
              </View>
              {todaysJobCount > 2 && (
                <TouchableOpacity onPress={handleViewJobs}>
                  <Text style={styles.viewAllLink}>View All ({todaysJobCount})</Text>
                </TouchableOpacity>
              )}
            </View>

            {todaysJobs.slice(0, 2).map((job) => {
              const statusColor = getStatusColor(job.status);
              
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                  style={[
                    styles.todayJobCard,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: statusColor,
                      shadowColor: statusColor,
                      shadowOpacity: 0.3,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.todayJobTime}>
                    <Ionicons name="time" size={18} color={statusColor} />
                    <Text style={styles.todayJobTimeText}>{formatTime(job.scheduledDate)}</Text>
                  </View>
                  <View style={styles.todayJobDetails}>
                    <Text style={styles.todayJobTitle} numberOfLines={1}>{job.title}</Text>
                    {job.location?.address && (
                      <Text style={styles.todayJobLocation} numberOfLines={1}>
                        📍 {job.location.address}
                      </Text>
                    )}
                    <View style={styles.todayJobFooter}>
                      <View style={[styles.todayJobStatus, { 
                        backgroundColor: statusColor + '20',
                        borderColor: statusColor
                      }]}>
                        <Text style={[styles.todayJobStatusText, { color: statusColor }]}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      {job.estimatedDuration && (
                        <Text style={styles.todayJobDuration}>⏱ {job.estimatedDuration} min</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={BrandTheme.colors.TEXT_SECONDARY} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Upcoming Check-ins Section */}
        {upcomingJobs.length > 0 && (
          <View style={styles.dashboardSection}>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={20} color={BrandTheme.colors.SUCCESS} />
                <Text style={styles.dashboardSectionTitle}>Upcoming Check-ins</Text>
              </View>
              <TouchableOpacity onPress={handleViewJobs}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>

            {upcomingJobs.slice(0, 3).map((job) => {
              const checkInDate = job.checkInDate instanceof Date ? job.checkInDate : new Date(job.checkInDate!);
              const daysUntil = Math.ceil((checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;
              
              // Get status color for the property indicator
              const getJobStatusColor = (status: string) => {
                switch (status) {
                  case 'assigned':
                  case 'pending':
                    return BrandTheme.colors.YELLOW;
                  case 'in_progress':
                  case 'active':
                    return '#60A5FA'; // Blue
                  case 'accepted':
                    return BrandTheme.colors.SUCCESS;
                  case 'urgent':
                  case 'high':
                    return BrandTheme.colors.ERROR;
                  default:
                    return BrandTheme.colors.YELLOW;
                }
              };
              
              const statusColor = getJobStatusColor(job.status || 'assigned');
              
              return (
                <TouchableOpacity 
                  key={job.id}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                  style={[
                    styles.upcomingCard,
                    { 
                      borderLeftWidth: 4,
                      borderLeftColor: statusColor,
                      shadowColor: statusColor,
                      shadowOpacity: 0.3,
                    }
                  ]}
                  activeOpacity={0.8}
                >
                  {isToday && <View style={[styles.todayIndicator, { backgroundColor: statusColor }]} />}
                  {isTomorrow && <View style={[styles.tomorrowIndicator, { backgroundColor: statusColor }]} />}
                  
                  <View style={styles.upcomingCardHeader}>
                    <View style={styles.upcomingPropertyInfo}>
                      <Ionicons name="home" size={18} color={statusColor} />
                      <Text style={styles.upcomingPropertyName} numberOfLines={1}>
                        {job.propertyName || job.title}
                      </Text>
                    </View>
                    {isToday && (
                      <View style={[styles.todayBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                    {isTomorrow && (
                      <View style={[styles.tomorrowBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.tomorrowBadgeText}>TOMORROW</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.upcomingCardDates}>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColumnLabel}>Check-in</Text>
                      <Text style={styles.dateColumnValue}>
                        {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={BrandTheme.colors.TEXT_SECONDARY} />
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateColumnLabel}>Check-out</Text>
                      <Text style={styles.dateColumnValue}>
                        {job.checkOutDate 
                          ? new Date(job.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'TBD'
                        }
                      </Text>
                    </View>
                    {job.guestCount && (
                      <View style={styles.guestBadge}>
                        <Ionicons name="people" size={12} color={BrandTheme.colors.TEXT_SECONDARY} />
                        <Text style={styles.guestBadgeText}>{job.guestCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State - No jobs today */}
        {todaysJobCount === 0 && upcomingJobs.length === 0 && (
          <View style={styles.emptyStateDashboard}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={BrandTheme.colors.SUCCESS} />
            </View>
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateText}>
              You have no jobs scheduled for today. Check pending jobs or enjoy your free time!
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleViewJobs}
            >
              <Text style={styles.emptyStateButtonText}>View All Jobs</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
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
    fontFamily: BrandTheme.typography.fontFamily.display,
    fontSize: 32,
    fontWeight: 'normal',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.XS,
    letterSpacing: 1,
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

  // Upcoming Jobs Styles
  seeAllText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  upcomingJobCard: {
    marginBottom: BrandTheme.spacing.MD,
  },

  upcomingJobCardInner: {
    padding: BrandTheme.spacing.LG,
    position: 'relative',
  },

  urgencyBadge: {
    position: 'absolute',
    top: BrandTheme.spacing.MD,
    right: BrandTheme.spacing.MD,
    backgroundColor: BrandTheme.colors.YELLOW,
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: BrandTheme.spacing.XS,
    borderRadius: 0,
    zIndex: 10,
  },

  urgencyBadgeText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    letterSpacing: 0.5,
  },

  upcomingJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.MD,
  },

  upcomingJobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    flex: 1,
    marginRight: BrandTheme.spacing.MD,
  },

  upcomingJobTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    flex: 1,
  },

  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    paddingHorizontal: BrandTheme.spacing.SM,
    paddingVertical: BrandTheme.spacing.XS,
    borderRadius: 0,
  },

  durationText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  upcomingJobDetails: {
    gap: BrandTheme.spacing.SM,
  },

  dateRow: {
    flexDirection: 'row',
    gap: BrandTheme.spacing.LG,
  },

  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    flex: 1,
  },

  dateTextContainer: {
    flex: 1,
  },

  dateLabel: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  dateValue: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    marginTop: BrandTheme.spacing.SM,
  },

  locationText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 13,
    color: BrandTheme.colors.TEXT_SECONDARY,
    flex: 1,
  },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
  },

  guestText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 13,
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

  // ============================================================================
  // DASHBOARD REDESIGN STYLES
  // ============================================================================

  // Dashboard Header
  dashboardHeader: {
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingTop: BrandTheme.spacing.XL,
    paddingBottom: BrandTheme.spacing.LG,
    alignItems: 'center',
  },

  nameText: {
    fontFamily: BrandTheme.typography.fontFamily.display,
    fontSize: 36,
    fontWeight: 'normal',
    color: BrandTheme.colors.YELLOW,
    letterSpacing: 2,
    marginTop: 4,
  },

  // Stats Grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: BrandTheme.spacing.MD,
    gap: BrandTheme.spacing.MD,
    marginBottom: BrandTheme.spacing.LG,
  },

  statCardLarge: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: BrandTheme.radius.MD,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    padding: BrandTheme.spacing.LG,
    alignItems: 'center',
    ...BrandTheme.shadows.BLACK_SMALL,
  },

  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.MD,
  },

  statNumberLarge: {
    fontFamily: BrandTheme.typography.fontFamily.display,
    fontSize: 40,
    fontWeight: 'normal',
    color: BrandTheme.colors.TEXT_PRIMARY,
    letterSpacing: 1,
  },

  statLabelLarge: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 13,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: 8,
  },

  statAction: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 11,
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Urgent Banner
  urgentBanner: {
    marginHorizontal: BrandTheme.spacing.LG,
    marginBottom: BrandTheme.spacing.LG,
    backgroundColor: BrandTheme.colors.ERROR,
    borderRadius: BrandTheme.radius.MD,
    overflow: 'hidden',
  },

  urgentBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: BrandTheme.spacing.LG,
  },

  urgentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
    flex: 1,
  },

  urgentBannerText: {
    flex: 1,
  },

  urgentBannerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  urgentBannerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Dashboard Sections
  dashboardSection: {
    marginBottom: BrandTheme.spacing.XXL,
  },

  dashboardSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: BrandTheme.spacing.LG,
    marginBottom: BrandTheme.spacing.MD,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
  },

  dashboardSectionTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  viewAllLink: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.YELLOW,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Today's Job Cards
  todayJobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: BrandTheme.radius.MD,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    padding: BrandTheme.spacing.MD,
    marginHorizontal: BrandTheme.spacing.LG,
    marginBottom: BrandTheme.spacing.MD,
    gap: BrandTheme.spacing.MD,
  },

  todayJobTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: BrandTheme.spacing.MD,
    borderRightWidth: 1,
    borderRightColor: BrandTheme.colors.BORDER,
  },

  todayJobTimeText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  todayJobDetails: {
    flex: 1,
  },

  todayJobTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 15,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: 4,
  },

  todayJobLocation: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: 6,
  },

  todayJobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
  },

  todayJobStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BrandTheme.radius.SM,
    borderWidth: 1,
  },

  todayJobStatusText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  todayJobDuration: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  // Upcoming Check-in Cards
  upcomingCard: {
    position: 'relative',
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: BrandTheme.radius.MD,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    padding: BrandTheme.spacing.MD,
    marginHorizontal: BrandTheme.spacing.LG,
    marginBottom: BrandTheme.spacing.MD,
  },

  todayIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: BrandTheme.colors.SUCCESS,
    borderTopLeftRadius: BrandTheme.radius.MD,
    borderBottomLeftRadius: BrandTheme.radius.MD,
  },

  tomorrowIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: BrandTheme.colors.WARNING,
    borderTopLeftRadius: BrandTheme.radius.MD,
    borderBottomLeftRadius: BrandTheme.radius.MD,
  },

  upcomingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BrandTheme.spacing.MD,
  },

  upcomingPropertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.SM,
    flex: 1,
  },

  upcomingPropertyName: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 15,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    flex: 1,
  },

  todayBadge: {
    backgroundColor: BrandTheme.colors.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BrandTheme.radius.SM,
  },

  todayBadgeText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    letterSpacing: 0.5,
  },

  tomorrowBadge: {
    backgroundColor: BrandTheme.colors.WARNING,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BrandTheme.radius.SM,
  },

  tomorrowBadgeText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    letterSpacing: 0.5,
  },

  upcomingCardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandTheme.spacing.MD,
  },

  dateColumn: {
    flex: 1,
  },

  dateColumnLabel: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  dateColumnValue: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandTheme.colors.SURFACE_2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BrandTheme.radius.SM,
  },

  guestBadgeText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 11,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  // Empty State Dashboard
  emptyStateDashboard: {
    alignItems: 'center',
    paddingVertical: BrandTheme.spacing.XXL * 2,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  emptyStateIcon: {
    marginBottom: BrandTheme.spacing.LG,
  },

  emptyStateTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginBottom: BrandTheme.spacing.SM,
  },

  emptyStateText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 15,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: BrandTheme.spacing.XL,
  },

  emptyStateButton: {
    backgroundColor: BrandTheme.colors.YELLOW,
    paddingHorizontal: BrandTheme.spacing.XL,
    paddingVertical: BrandTheme.spacing.MD,
    borderRadius: BrandTheme.radius.SM,
  },

  emptyStateButtonText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bottomPadding: {
    height: BrandTheme.spacing.XXL,
  },
});
