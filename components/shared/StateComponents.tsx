/**
 * Consistent Loading and Error State Components
 * Reusable components for better UX across job screens
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JOB_COLORS, COMMON_STYLES } from '@/utils/jobUtils';

// Loading State Component
interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  size?: 'small' | 'large';
}

export function LoadingState({ 
  message = 'Loading...', 
  style,
  size = 'large' 
}: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={JOB_COLORS.primary} 
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  icon?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  style,
  icon = 'alert-circle-outline',
}: ErrorStateProps) {
  return (
    <View 
      style={[styles.container, style]}
    >
      <Ionicons 
        name={icon as any} 
        size={64} 
        color={JOB_COLORS.textMuted}
        style={styles.errorIcon}
      />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityLabel={retryLabel}
          accessibilityRole="button"
        >
          <Ionicons 
            name="refresh" 
            size={16} 
            color={JOB_COLORS.background}
            style={styles.retryIcon}
          />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Empty State Component
interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'briefcase-outline',
  style,
}: EmptyStateProps) {
  return (
    <View 
      style={[styles.container, style]}
    >
      <Ionicons 
        name={icon as any} 
        size={64} 
        color={JOB_COLORS.textMuted}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Loading Skeleton for Cards
interface LoadingSkeletonProps {
  count?: number;
  style?: ViewStyle;
  cardStyle?: ViewStyle;
}

export function LoadingSkeleton({ 
  count = 3, 
  style,
  cardStyle 
}: LoadingSkeletonProps) {
  return (
    <View style={[styles.skeletonContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          direction="alternate"
          style={[styles.skeletonCard, cardStyle]}
        >
          {/* Header skeleton */}
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonTitleSection}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
          </View>
          
          {/* Details skeleton */}
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonDetailLine} />
            <View style={[styles.skeletonDetailLine, { width: '80%' }]} />
            <View style={[styles.skeletonDetailLine, { width: '60%' }]} />
          </View>
          
          {/* Actions skeleton */}
          <View style={styles.skeletonActions}>
            <View style={styles.skeletonButton} />
            <View style={styles.skeletonButton} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Progress Indicator
interface ProgressIndicatorProps {
  progress: number; // 0-100
  label?: string;
  style?: ViewStyle;
}

export function ProgressIndicator({ 
  progress, 
  label, 
  style 
}: ProgressIndicatorProps) {
  const progressPercentage = Math.max(0, Math.min(100, progress));
  
  return (
    <View style={[styles.progressContainer, style]}>
      {label && <Text style={styles.progressLabel}>{label}</Text>}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercentage}%` }
          ]}
        />
      </View>
      <Text style={styles.progressText}>{progressPercentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    paddingVertical: COMMON_STYLES.spacing.xxl * 2,
  },
  
  // Loading styles
  spinner: {
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  loadingText: {
    color: JOB_COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Error styles
  errorIcon: {
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  errorTitle: {
    color: JOB_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  errorMessage: {
    color: JOB_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: COMMON_STYLES.spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JOB_COLORS.primary,
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRadius: 12,
    minHeight: COMMON_STYLES.buttonHeight,
  },
  retryIcon: {
    marginRight: COMMON_STYLES.spacing.sm,
  },
  retryText: {
    color: JOB_COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Empty state styles
  emptyIcon: {
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  emptyTitle: {
    color: JOB_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  emptyMessage: {
    color: JOB_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: COMMON_STYLES.spacing.xl,
  },
  actionButton: {
    backgroundColor: `${JOB_COLORS.primary}20`,
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${JOB_COLORS.primary}30`,
    minHeight: COMMON_STYLES.buttonHeight,
    justifyContent: 'center',
  },
  actionText: {
    color: JOB_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Skeleton styles
  skeletonContainer: {
    gap: COMMON_STYLES.spacing.md,
  },
  skeletonCard: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.cardPadding,
    borderWidth: 1,
    borderColor: JOB_COLORS.surfaceElevated,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: COMMON_STYLES.spacing.md,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 12,
    marginRight: COMMON_STYLES.spacing.md,
  },
  skeletonTitleSection: {
    flex: 1,
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 8,
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 12,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 6,
  },
  skeletonDetails: {
    gap: COMMON_STYLES.spacing.sm,
    marginBottom: COMMON_STYLES.spacing.md,
  },
  skeletonDetailLine: {
    height: 12,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 6,
    width: '100%',
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.sm,
  },
  skeletonButton: {
    flex: 1,
    height: COMMON_STYLES.buttonHeight,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 8,
  },
  
  // Progress styles
  progressContainer: {
    padding: COMMON_STYLES.spacing.md,
  },
  progressLabel: {
    color: JOB_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: JOB_COLORS.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: JOB_COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    color: JOB_COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
