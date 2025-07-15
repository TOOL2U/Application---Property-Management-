import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDesignTokens } from '@/constants/Design';
import { GlassCard, StatCard, ProgressRing } from '@/components/ui/SiaMoonComponents';

const { width: screenWidth } = Dimensions.get('window');

// Property Management Staff Performance Data
const mockStaffPerformance = {
  maintenanceCompleted: 34,
  inspectionsCompleted: 12,
  tenantSatisfactionRating: 4.7,
  averageResponseTime: '2.3 hours',
  efficiency: 89,
  weeklyMaintenanceProgress: [
    { day: 'Mon', completed: 6, total: 8, type: 'maintenance' },
    { day: 'Tue', completed: 4, total: 5, type: 'maintenance' },
    { day: 'Wed', completed: 7, total: 9, type: 'maintenance' },
    { day: 'Thu', completed: 5, total: 7, type: 'maintenance' },
    { day: 'Fri', completed: 3, total: 4, type: 'maintenance' },
    { day: 'Sat', completed: 2, total: 3, type: 'maintenance' },
    { day: 'Sun', completed: 1, total: 2, type: 'maintenance' },
  ],
  monthlyTargetProgress: 82,
  specializations: ['Plumbing', 'HVAC', 'Electrical'],
  certifications: ['EPA 608', 'OSHA 10', 'Property Management License'],
  recentActivities: [
    { id: '1', type: 'completed', description: 'Fixed AC unit - Oceanview Apt 4B', time: '30 min ago', priority: 'urgent' },
    { id: '2', type: 'started', description: 'Plumbing repair - Sunset Gardens C2', time: '1 hour ago', priority: 'high' },
    { id: '3', type: 'scheduled', description: 'HVAC inspection - Downtown Lofts 8A', time: '2 hours ago', priority: 'medium' },
  ]
};

export default function MaintenanceScreen() {
  const { colors, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);

  // Calculate weekly completion rate
  const weeklyCompletionRate = useMemo(() => {
    const totalCompleted = mockStaffPerformance.weeklyMaintenanceProgress.reduce((sum, day) => sum + day.completed, 0);
    const totalAssigned = mockStaffPerformance.weeklyMaintenanceProgress.reduce((sum, day) => sum + day.total, 0);
    return Math.round((totalCompleted / totalAssigned) * 100);
  }, []);

  // Main Progress Circle Component
  const MainProgressCircle = () => (
    <GlassCard
      style={styles.mainProgressCard}
      gradient={['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.1)']}
      intensity={20}
    >
      <View style={styles.mainProgressContent}>
        <Text style={styles.progressTitle}>Weekly Performance</Text>
        <View style={styles.progressRingContainer}>
          <ProgressRing size={160} progress={weeklyCompletionRate} color="#8b5cf6" strokeWidth={8}>
            <View style={styles.progressCenter}>
              <Text style={styles.progressPercentage}>{weeklyCompletionRate}%</Text>
              <Text style={styles.progressLabel}>Completion Rate</Text>
              <Text style={styles.progressSubtext}>
                {mockStaffPerformance.weeklyMaintenanceProgress.reduce((sum, day) => sum + day.completed, 0)} of{' '}
                {mockStaffPerformance.weeklyMaintenanceProgress.reduce((sum, day) => sum + day.total, 0)} tasks
              </Text>
            </View>
          </ProgressRing>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#111111', '#1a1a1a']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header with Glassmorphism */}
        <BlurView intensity={20} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Staff Performance</Text>
            <Text style={styles.subtitle}>Maintenance & Property Management</Text>
          </View>
          <View style={styles.headerIcon}>
            <Icon name="account-hard-hat" size={24} color="#8b5cf6" />
          </View>
        </BlurView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Main Progress Circle */}
          <View style={styles.mainProgressSection}>
            <MainProgressCircle />
          </View>

          {/* Performance Statistics Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Maintenance Jobs"
              value={mockStaffPerformance.maintenanceCompleted}
              icon="wrench"
              color="#22c55e"
              trend={12}
            />
            <StatCard
              title="Inspections"
              value={mockStaffPerformance.inspectionsCompleted}
              icon="clipboard-check"
              color="#3b82f6"
              trend={8}
            />
            <StatCard
              title="Tenant Rating"
              value={mockStaffPerformance.tenantSatisfactionRating}
              icon="star"
              color="#f59e0b"
              trend={5}
            />
            <StatCard
              title="Response Time"
              value={mockStaffPerformance.averageResponseTime}
              icon="clock-fast"
              color="#ef4444"
              trend={-15}
            />
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },

  // Main Progress Section
  mainProgressSection: {
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingTop: Spacing[6],
  },
  mainProgressCard: {
    padding: Spacing[6],
    alignItems: 'center',
  },
  mainProgressContent: {
    alignItems: 'center',
    width: '100%',
  },
  progressTitle: {
    ...Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: '#ffffff',
    marginBottom: Spacing[4],
    letterSpacing: -0.3,
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing[4],
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressPercentage: {
    ...Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: '#8b5cf6',
    letterSpacing: -1,
  },
  progressLabel: {
    ...Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing[1],
    letterSpacing: -0.2,
  },
  progressSubtext: {
    ...Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: Spacing[1],
    letterSpacing: -0.1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.mobile.screenPadding,
    paddingTop: Spacing[6],
    gap: Spacing[3],
  },
});
