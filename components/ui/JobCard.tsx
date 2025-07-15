import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDesignTokens } from '@/constants/Design';

interface Job {
  id: string;
  title: string;
  propertyName: string;
  propertyAddress: string;
  serviceType: 'plumbing' | 'hvac' | 'electrical' | 'maintenance' | 'inspection';
  scheduledDate: string;
  scheduledTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  tenantName: string;
  tenantPhone?: string;
  estimatedDuration: string;
  issueDescription?: string;
}

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

const serviceIcons = {
  cleaning: 'sparkles',
  gardening: 'tree',
  maintenance: 'wrench',
  pool: 'waves',
  security: 'shield-check',
  inspection: 'magnify',
  plumbing: 'pipe-wrench',
  hvac: 'air-conditioner',
  electrical: 'lightning-bolt',
};

export default function JobCard({ job, onPress }: JobCardProps) {
  const { colors, StatusConfig, Shadows, BorderRadius, Spacing, Typography } = useDesignTokens();
  
  const styles = createStyles(colors, Shadows, BorderRadius, Spacing, Typography);
  
  const serviceIconName = serviceIcons[job.serviceType] || 'wrench';
  const statusConfig = StatusConfig.job[job.status];
  const priorityConfig = StatusConfig.priority[job.priority];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      {/* Priority Indicator */}
      <View style={[styles.priorityIndicator, { backgroundColor: priorityConfig.color }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.serviceIcon, { backgroundColor: `${priorityConfig.color}20` }]}>
              <Icon name={serviceIconName} size={20} color={priorityConfig.color} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {job.title}
              </Text>
              <Text style={styles.serviceType}>
                {job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.text.tertiary} />
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {job.propertyName}
          </Text>
        </View>

        {/* Schedule Info */}
        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText}>
            {formatDate(job.scheduledDate)} at {job.scheduledTime}
          </Text>
          <Text style={styles.duration}>• {job.estimatedDuration}</Text>
        </View>

        {/* Tenant Info */}
        <View style={styles.infoRow}>
          <Icon name="account" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {job.tenantName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, Shadows: any, BorderRadius: any, Spacing: any, Typography: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    ...Shadows.sm,
  },
  priorityIndicator: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: Spacing[1],
  },
  serviceType: {
    ...Typography.sizes.sm,
    color: colors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  infoText: {
    ...Typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: Spacing[2],
    flex: 1,
  },
  duration: {
    ...Typography.sizes.sm,
    color: colors.text.tertiary,
    marginLeft: Spacing[1],
  },
});
