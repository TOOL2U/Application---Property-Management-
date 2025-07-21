/**
 * Shared Job Card Component
 * Reusable job card with consistent styling and behavior
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  getStatusColor, 
  getPriorityColor, 
  getStatusTextKey, 
  getPriorityTextKey,
  getJobTypeIcon,
  getJobTypeTextKey,
  formatJobDate,
  formatAddress,
  formatDuration,
  getJobCardAccessibilityLabel,
  JOB_COLORS,
  COMMON_STYLES,
} from '@/utils/jobUtils';

export interface JobCardData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  jobType: string;
  estimatedDuration?: number;
  scheduledDate?: string | Date;
  scheduledFor?: string | Date;
  location?: any;
  propertyRef?: any;
  propertyId?: string;
}

interface JobCardProps {
  job: JobCardData;
  onPress: (job: JobCardData) => void;
  onActionPress?: (job: JobCardData, action: string) => void;
  showActions?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    icon: string;
    color?: string;
    disabled?: boolean;
  }>;
  style?: ViewStyle;
  compact?: boolean;
  animationDelay?: number;
}

export default function SharedJobCard({
  job,
  onPress,
  onActionPress,
  showActions = true,
  actions = [],
  style,
  compact = false,
  animationDelay = 0,
}: JobCardProps) {
  const { t } = useTranslation();
  
  // Defensive programming - ensure job data is valid
  if (!job || !job.id) {
    console.warn('SharedJobCard: Invalid job data received:', job);
    return null;
  }
  
  const statusColor = getStatusColor(job.status || 'pending');
  const priorityColor = getPriorityColor(job.priority || 'medium');
  const jobIcon = getJobTypeIcon(job.jobType || 'other');
  const statusText = t(getStatusTextKey(job.status || 'pending'));
  const priorityText = t(getPriorityTextKey(job.priority || 'medium'));

  const scheduledDate = job.scheduledDate || job.scheduledFor;
  const location = job.location || job.propertyRef;
  const address = formatAddress(location);

  // Default actions based on job status
  const defaultActions = React.useMemo(() => {
    const actionsMap: Record<string, Array<any>> = {
      assigned: [
        { label: t('jobs.actions.accept'), action: 'accept', icon: 'checkmark-circle', color: '#22c55e' },
        { label: t('jobs.actions.decline'), action: 'decline', icon: 'close-circle', color: '#ef4444' },
      ],
      accepted: [
        { label: t('jobs.actions.start'), action: 'start', icon: 'play-circle', color: '#3b82f6' },
        { label: t('jobs.actions.details'), action: 'details', icon: 'information-circle', color: JOB_COLORS.textSecondary },
      ],
      in_progress: [
        { label: t('jobs.actions.update'), action: 'update', icon: 'camera', color: '#f59e0b' },
        { label: t('jobs.actions.complete'), action: 'complete', icon: 'checkmark-circle', color: '#22c55e' },
      ],
      completed: [],
    };
    return actionsMap[job.status] || [
      { label: t('jobs.actions.details'), action: 'details', icon: 'eye-outline', color: JOB_COLORS.primary },
    ];
  }, [job.status, t]);

  const finalActions = actions.length > 0 ? actions : defaultActions;

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={300}
      delay={animationDelay}
      style={[styles.container, style]}
    >
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact]}
        onPress={() => onPress(job)}
        accessibilityLabel={getJobCardAccessibilityLabel(job)}
        accessibilityRole="button"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconSection}>
            <Ionicons
              name={jobIcon as any}
              size={compact ? 20 : 24}
              color={JOB_COLORS.primary}
            />
          </View>
          
          <View style={styles.titleSection}>
            <Text 
              style={[styles.title, compact && styles.titleCompact]}
              numberOfLines={compact ? 1 : 2}
              ellipsizeMode="tail"
            >
              {job.title}
            </Text>
            
            {!compact && (
              <View style={styles.badgeRow}>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {priorityText}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          {/* Location */}
          <View style={styles.detailRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={JOB_COLORS.textSecondary}
            />
            <Text 
              style={styles.detailText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {address}
            </Text>
          </View>

          {/* Schedule */}
          {scheduledDate && (
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={JOB_COLORS.textSecondary}
              />
              <Text style={styles.detailText}>
                {formatJobDate(scheduledDate, !compact)}
              </Text>
            </View>
          )}

          {/* Duration */}
          {job.estimatedDuration && !compact && (
            <View style={styles.detailRow}>
              <Ionicons
                name="timer-outline"
                size={14}
                color={JOB_COLORS.textSecondary}
              />
              <Text style={styles.detailText}>
                {formatDuration(job.estimatedDuration)}
              </Text>
            </View>
          )}

          {/* Compact status badges */}
          {compact && (
            <View style={styles.compactBadges}>
              <View style={[styles.compactBadge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.compactBadgeText, { color: statusColor }]}>
                  {statusText}
                </Text>
              </View>
              <View style={[styles.compactBadge, { backgroundColor: `${priorityColor}20` }]}>
                <Text style={[styles.compactBadgeText, { color: priorityColor }]}>
                  {priorityText}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        {showActions && finalActions.length > 0 && (
          <View style={styles.actions}>
            {finalActions.map((action, index) => (
              <TouchableOpacity
                key={action.action}
                style={[
                  styles.actionButton,
                  { backgroundColor: `${action.color || JOB_COLORS.primary}20` },
                  action.disabled && styles.actionButtonDisabled,
                ]}
                onPress={() => onActionPress?.(job, action.action)}
                disabled={action.disabled}
                accessibilityLabel={`${action.label} ${job.title}`}
                accessibilityRole="button"
              >
                <Ionicons
                  name={action.icon as any}
                  size={14}
                  color={action.disabled ? JOB_COLORS.textMuted : (action.color || JOB_COLORS.primary)}
                />
                <Text 
                  style={[
                    styles.actionButtonText,
                    { color: action.disabled ? JOB_COLORS.textMuted : (action.color || JOB_COLORS.primary) }
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: COMMON_STYLES.spacing.md,
  },
  card: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.cardPadding,
    borderWidth: 1,
    borderColor: JOB_COLORS.surfaceElevated,
    ...COMMON_STYLES.shadow,
  },
  cardCompact: {
    padding: COMMON_STYLES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: COMMON_STYLES.spacing.md,
  },
  iconSection: {
    marginRight: COMMON_STYLES.spacing.md,
    paddingTop: 2,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    color: JOB_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: COMMON_STYLES.spacing.sm,
    paddingVertical: COMMON_STYLES.spacing.xs,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: COMMON_STYLES.spacing.sm,
    paddingVertical: COMMON_STYLES.spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  details: {
    gap: COMMON_STYLES.spacing.sm,
    marginBottom: COMMON_STYLES.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMMON_STYLES.spacing.sm,
  },
  detailText: {
    color: JOB_COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  compactBadges: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.xs,
    marginTop: COMMON_STYLES.spacing.xs,
  },
  compactBadge: {
    paddingHorizontal: COMMON_STYLES.spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  compactBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRadius: 8,
    gap: COMMON_STYLES.spacing.xs,
    minHeight: COMMON_STYLES.buttonHeight,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
