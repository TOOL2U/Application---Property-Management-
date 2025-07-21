import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Card, Button as PaperButton, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDesignTokens } from '@/constants/Design';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  gradient?: string[];
  intensity?: number;
  variant?: 'default' | 'elevated' | 'subtle' | 'prominent';
  borderRadius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  gradient,
  intensity,
  variant = 'default',
  borderRadius = 18,
}) => {
  const { Shadows, Colors } = useDesignTokens();

  // Define variant-specific properties
  const variantConfig = {
    default: {
      gradient: gradient || Colors.gradients.glassmorphism,
      intensity: intensity || 18,
      shadow: Shadows.card,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1.5,
    },
    elevated: {
      gradient: gradient || ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)'],
      intensity: intensity || 22,
      shadow: Shadows.cardElevated,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 2,
    },
    subtle: {
      gradient: gradient || ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
      intensity: intensity || 12,
      shadow: Shadows.sm,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    },
    prominent: {
      gradient: gradient || ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.06)'],
      intensity: intensity || 25,
      shadow: Shadows.xl,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 2.5,
    },
  };

  const config = variantConfig[variant];

  return (
    <View style={[
      styles.glassCard,
      config.shadow,
      { borderRadius },
      style
    ]}>
      <LinearGradient
        colors={config.gradient}
        style={[styles.gradientFill, { borderRadius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={config.intensity} style={[styles.blurFill, { borderRadius }]}>
          <View style={[
            styles.glassCardInner,
            {
              borderRadius,
              borderColor: config.borderColor,
              borderWidth: config.borderWidth,
            }
          ]}>
            {children}
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  className?: string;
  disabled?: boolean;
  glow?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
  glow = true,
}) => {
  const { Spacing, BorderRadius, Typography } = useDesignTokens();

  const variantColors = {
    primary: ['#8b5cf6', '#7c3aed'],
    secondary: ['#374151', '#4b5563'],
    success: ['#22c55e', '#16a34a'],
    warning: ['#f59e0b', '#d97706'],
    danger: ['#ef4444', '#dc2626'],
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
    md: { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 },
    lg: { paddingHorizontal: 32, paddingVertical: 16, fontSize: 18 },
  };

  const buttonStyle = [
    styles.neonButton,
    sizeStyles[size],
    disabled && { opacity: 0.5 },
    glow && !disabled && styles.neonGlow,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={disabled ? variantColors.secondary : variantColors[variant]}
        style={styles.gradientFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={5} style={styles.blurFill}>
          <View style={styles.neonButtonContent}>
            {icon && (
              <Icon name={icon} size={20} color="white" style={{ marginRight: 8 }} />
            )}
            <Text style={[styles.neonButtonText, { fontSize: sizeStyles[size].fontSize }]}>
              {title}
            </Text>
          </View>
        </BlurView>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: number;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  className = '',
}) => {
  const { Spacing, BorderRadius, Typography } = useDesignTokens();

  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statCardIcon, { backgroundColor: `${color}20` }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={styles.statCardTrend}>
            <Icon
              name={trend > 0 ? "trending-up" : "trending-down"}
              size={16}
              color={trend > 0 ? "#22c55e" : "#ef4444"}
            />
            <Text style={[styles.statCardTrendText, { color: trend > 0 ? "#22c55e" : "#ef4444" }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statCardValue}>
        {value}
      </Text>
      <Text style={styles.statCardTitle}>
        {title}
      </Text>
    </GlassCard>
  );
};

interface ProgressRingProps {
  size: number;
  progress: number;
  color: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size,
  progress,
  color,
  strokeWidth = 8,
  children,
}) => {
  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View
        style={[
          styles.progressRingBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }
        ]}
      />
      <View
        style={[
          styles.progressRingForeground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${(progress / 100) * 360}deg` }],
          }
        ]}
      />
      {children && (
        <View style={styles.progressRingContent}>
          {children}
        </View>
      )}
    </View>
  );
};

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  time,
  icon,
  color,
  onPress,
}) => {
  const { Spacing, Typography } = useDesignTokens();

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.activityItemContainer}>
      <GlassCard style={styles.activityItem}>
        <View style={styles.activityItemContent}>
          <View style={[styles.activityItemIcon, { backgroundColor: `${color}20` }]}>
            <Icon name={icon} size={20} color={color} />
          </View>
          <View style={styles.activityItemInfo}>
            <Text style={styles.activityItemTitle}>
              {title}
            </Text>
            <Text style={styles.activityItemSubtitle}>
              {subtitle}
            </Text>
          </View>
          <Text style={styles.activityItemTime}>
            {time}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientFill: {
    flex: 1,
  },
  blurFill: {
    flex: 1,
  },

  // Enhanced Glass Card Styles with Advanced Glassmorphism
  glassCard: {
    borderRadius: 18,
    overflow: 'hidden',
    // Enhanced shadow for better depth perception
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glassCardInner: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    // Add subtle inner glow effect
    shadowColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },

  // Enhanced Neon Button Styles with Professional Polish
  neonButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  neonGlow: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  neonButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  neonButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Enhanced Stat Card Styles with Better Visual Hierarchy
  statCard: {
    padding: 20,
    minHeight: 120,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statCardTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: -0.1,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statCardTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: -0.3,
    fontWeight: '500',
  },

  // Progress Ring Styles
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRingBackground: {
    position: 'absolute',
  },
  progressRingForeground: {
    position: 'absolute',
  },
  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Activity Item Styles
  activityItemContainer: {
    marginBottom: 12,
  },
  activityItem: {
    padding: 16,
  },
  activityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  activityItemSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: -0.1,
  },
  activityItemTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
