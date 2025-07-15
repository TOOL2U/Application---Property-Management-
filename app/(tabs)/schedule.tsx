import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Activity,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  Target,
  Award,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

const { width: screenWidth } = Dimensions.get('window');

// Staff Performance Data
const mockStaffPerformance = {
  staffName: 'Alex Rodriguez',
  staffId: 'STF-001',
  currentStreak: 5,
  todayProgress: 67, // 2 of 3 jobs completed
  weeklyProgress: 89, // 17 of 19 jobs completed
  monthlyProgress: 92, // 87 of 95 jobs completed
  completedToday: 2,
  assignedToday: 3,
  completedThisWeek: 17,
  completedThisMonth: 87,
  averageResponseTime: '12 min',
  averageCompletionTime: '2.3 hrs',
  tenantSatisfactionRating: 4.8,
  certifications: ['HVAC Level 2', 'Plumbing Basic', 'Electrical Safety'],
  specializations: ['Emergency Repairs', 'HVAC Systems', 'Plumbing'],
  recentCompletions: [
    { id: '1', task: 'Emergency plumbing repair - Unit 4B', completedAt: '2h ago', duration: '2.5 hrs', rating: 5, color: '#22c55e' },
    { id: '2', task: 'HVAC filter replacement - Building C', completedAt: '1 day ago', duration: '45 min', rating: 5, color: '#22c55e' },
    { id: '3', task: 'Electrical outlet repair - Unit 7A', completedAt: '2 days ago', duration: '1.2 hrs', rating: 4, color: '#22c55e' },
    { id: '4', task: 'Bathroom faucet replacement - Unit 2C', completedAt: '3 days ago', duration: '1.8 hrs', rating: 5, color: '#22c55e' },
  ]
};

export default function StaffPerformanceScreen() {
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Staff Performance Header
  const StaffPerformanceHeader = () => (
    <View style={styles.performanceHeader}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']}
        style={styles.headerGradient}
      >
        <BlurView intensity={15} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{mockStaffPerformance.staffName}</Text>
              <Text style={styles.staffId}>ID: {mockStaffPerformance.staffId}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Zap size={16} color="#f59e0b" />
              <Text style={styles.streakText}>{mockStaffPerformance.currentStreak} day streak</Text>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );

  // Circular Progress Component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#8b5cf6', label, value }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label: string;
    value: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <View style={styles.progressCircle}>
          <LinearGradient
            colors={[`${color}40`, `${color}20`]}
            style={[styles.progressBackground, { width: size, height: size, borderRadius: size / 2 }]}
          />
          <View style={styles.progressContent}>
            <Text style={[styles.progressValue, { color }]}>{value}</Text>
            <Text style={styles.progressLabel}>{label}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Activity Stat Card Component
  const ActivityStatCard = ({ title, value, icon: Icon, gradient, iconColor, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    gradient: string[];
    iconColor: string;
    subtitle?: string;
  }) => (
    <TouchableOpacity style={styles.activityStatCard}>
      <LinearGradient
        colors={gradient}
        style={styles.activityStatGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={15} style={styles.activityStatBlur}>
          <View style={styles.activityStatContent}>
            <View style={[styles.activityStatIcon, { backgroundColor: `${iconColor}20` }]}>
              <Icon size={20} color={iconColor} />
            </View>
            <Text style={styles.activityStatValue}>{value}</Text>
            <Text style={styles.activityStatTitle}>{title}</Text>
            {subtitle && <Text style={styles.activityStatSubtitle}>{subtitle}</Text>}
          </View>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#111111', '#1a1a1a']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Staff Performance Header */}
        <StaffPerformanceHeader />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Staff Performance Progress */}
          <View style={styles.mainProgressSection}>
            <CircularProgress
              percentage={mockStaffPerformance.weeklyProgress}
              size={160}
              strokeWidth={12}
              color="#8b5cf6"
              label="Weekly Completion"
              value={`${mockStaffPerformance.weeklyProgress}%`}
            />
          </View>

          {/* Activity Stats Grid */}
          <View style={styles.activityStatsGrid}>
            <ActivityStatCard
              title="Today"
              value={`${mockStaffPerformance.completedToday}/${mockStaffPerformance.assignedToday}`}
              icon={CheckCircle}
              gradient={['rgba(34, 197, 94, 0.3)', 'rgba(16, 185, 129, 0.1)']}
              iconColor="#22c55e"
              subtitle="jobs completed"
            />
            <ActivityStatCard
              title="Response Time"
              value={mockStaffPerformance.averageResponseTime}
              icon={Clock}
              gradient={['rgba(245, 158, 11, 0.3)', 'rgba(217, 119, 6, 0.1)']}
              iconColor="#f59e0b"
              subtitle="average"
            />
            <ActivityStatCard
              title="Completion Time"
              value={mockStaffPerformance.averageCompletionTime}
              icon={TrendingUp}
              gradient={['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.1)']}
              iconColor="#8b5cf6"
              subtitle="average"
            />
            <ActivityStatCard
              title="Tenant Rating"
              value={mockStaffPerformance.tenantSatisfactionRating}
              icon={Award}
              gradient={['rgba(6, 182, 212, 0.3)', 'rgba(14, 165, 233, 0.1)']}
              iconColor="#06b6d4"
              subtitle="out of 5"
            />
          </View>

          {/* Progress Bars Section */}
          <View style={styles.progressBarsSection}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarHeader}>
                <Text style={styles.progressBarLabel}>Weekly Progress</Text>
                <Text style={styles.progressBarValue}>{mockStaffPerformance.weeklyProgress}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={[styles.progressBarFill, { width: `${mockStaffPerformance.weeklyProgress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarHeader}>
                <Text style={styles.progressBarLabel}>Monthly Progress</Text>
                <Text style={styles.progressBarValue}>{mockStaffPerformance.monthlyProgress}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={[styles.progressBarFill, { width: `${mockStaffPerformance.monthlyProgress}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Recent Completions */}
          <View style={styles.recentActivitiesSection}>
            <Text style={styles.sectionTitle}>Recent Completions</Text>
            <View style={styles.activitiesList}>
              {mockStaffPerformance.recentCompletions.map((completion) => (
                <TouchableOpacity key={completion.id} style={styles.activityItem}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                    style={styles.activityItemGradient}
                  >
                    <BlurView intensity={10} style={styles.activityItemBlur}>
                      <View style={styles.activityItemContent}>
                        <View style={[styles.activityItemIcon, { backgroundColor: `${completion.color}20` }]}>
                          <Activity size={16} color={completion.color} />
                        </View>
                        <View style={styles.activityItemInfo}>
                          <Text style={styles.activityItemTask}>{completion.task}</Text>
                          <Text style={styles.activityItemTime}>{completion.completedAt} • {completion.duration}</Text>
                        </View>
                        <View style={[styles.activityItemStatus, { backgroundColor: completion.color }]} />
                      </View>
                    </BlurView>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: -0.2,
    marginTop: Spacing[1],
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },

  // Staff Performance Header Styles
  performanceHeader: {
    marginHorizontal: Spacing.mobile.screenPadding,
    marginTop: Spacing[2],
    marginBottom: Spacing[4],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: BorderRadius.lg,
  },
  headerBlur: {
    padding: Spacing[5],
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: Spacing[1],
  },
  staffId: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: -0.1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  streakText: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#f59e0b',
    letterSpacing: -0.1,
  },

  // Main Progress Section
  mainProgressSection: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing.mobile.screenPadding,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    ...Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    letterSpacing: -1,
  },
  progressLabel: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing[1],
    letterSpacing: -0.2,
  },

  // Activity Stats Grid
  activityStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.mobile.screenPadding,
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  activityStatCard: {
    width: (screenWidth - Spacing.mobile.screenPadding * 2 - Spacing[3]) / 2,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  activityStatGradient: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  activityStatBlur: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityStatContent: {
    flex: 1,
    padding: Spacing[4],
    justifyContent: 'space-between',
  },
  activityStatIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStatValue: {
    ...Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  activityStatTitle: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.weights.medium,
    letterSpacing: -0.2,
  },
  activityStatSubtitle: {
    ...Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: -0.1,
  },

  // Progress Bars Section
  progressBarsSection: {
    paddingHorizontal: Spacing.mobile.screenPadding,
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: '#ffffff',
    marginBottom: Spacing[4],
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    marginBottom: Spacing[4],
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  progressBarLabel: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.weights.medium,
    letterSpacing: -0.2,
  },
  progressBarValue: {
    ...Typography.sizes.sm,
    color: '#ffffff',
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },

  // Recent Activities Section
  recentActivitiesSection: {
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingBottom: Spacing[8],
  },
  activitiesList: {
    gap: Spacing[3],
  },
  activityItem: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  activityItemGradient: {
    borderRadius: BorderRadius.md,
  },
  activityItemBlur: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    gap: Spacing[3],
  },
  activityItemIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemTask: {
    ...Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  activityItemTime: {
    ...Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  activityItemStatus: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
});
