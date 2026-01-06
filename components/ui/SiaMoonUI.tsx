/**
 * Sia Moon UI Components
 * Modern AI-inspired component library with NativeWind integration
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SiaMoonTheme } from '@/constants/NeumorphicTheme';

// =============================================================================
// CARD COMPONENTS
// =============================================================================

interface SiaMoonCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'pressed' | 'glass';
  onPress?: () => void;
}

export const SiaMoonCard: React.FC<SiaMoonCardProps> = ({
  children,
  className = '',
  style,
  variant = 'default',
  onPress,
}) => {
  const baseClasses = 'rounded-2xl p-4 border';
  
  const variantClasses = {
    default: 'bg-dark-elevated border-dark-border shadow-lg',
    elevated: 'bg-dark-elevated border-dark-border shadow-xl',
    pressed: 'bg-dark-surface border-dark-border',
    glass: 'bg-dark-elevated/80 border-dark-border/50 backdrop-blur-md',
  };

  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
};

// =============================================================================
// BUTTON COMPONENTS
// =============================================================================

interface SiaMoonButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const SiaMoonButton: React.FC<SiaMoonButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'rounded-xl flex-row items-center justify-center';
  
  const sizeClasses = {
    sm: 'px-4 py-2 h-10',
    md: 'px-6 py-3 h-12',
    lg: 'px-8 py-4 h-14',
  };
  
  const variantClasses = {
    primary: 'bg-brand-primary shadow-lg',
    secondary: 'bg-dark-surface border border-dark-border',
    ghost: 'bg-transparent',
    danger: 'bg-error shadow-lg',
  };
  
  const textClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-text-primary font-semibold',
    ghost: 'text-brand-primary font-semibold',
    danger: 'text-white font-semibold',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const opacityClass = disabled ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${opacityClass} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#8b5cf6'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textClasses[variant]} text-base`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// =============================================================================
// GRADIENT BUTTON COMPONENT
// =============================================================================

interface SiaMoonGradientButtonProps extends TouchableOpacityProps {
  title: string;
  gradientColors?: string[];
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const SiaMoonGradientButton: React.FC<SiaMoonGradientButtonProps> = ({
  title,
  gradientColors = ['#8b5cf6', '#7c3aed'],
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-10 px-4',
    md: 'h-12 px-6',
    lg: 'h-14 px-8',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const opacityClass = disabled ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      className={`rounded-xl ${sizeClasses[size]} ${widthClass} ${opacityClass} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        shadowColor: gradientColors[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
      {...props}
    >
      <LinearGradient
        colors={disabled ? ['#374151', '#374151'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 flex-row items-center justify-center rounded-xl"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text className="text-white font-semibold text-base">
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// =============================================================================
// TEXT COMPONENTS
// =============================================================================

interface SiaMoonTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export const SiaMoonText: React.FC<SiaMoonTextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
  style,
  numberOfLines,
}) => {
  const variantClasses = {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-xl font-semibold',
    h3: 'text-lg font-medium',
    body: 'text-base font-normal',
    caption: 'text-sm',
  };

  const colorClasses = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    brand: 'text-brand-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
  };

  return (
    <Text
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
      style={[{ fontFamily: 'Inter' }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

// =============================================================================
// STATUS INDICATOR COMPONENT
// =============================================================================

interface StatusIndicatorProps {
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showText = true,
  className = '',
}) => {
  const statusConfig = {
    pending: { color: '#f59e0b', text: 'Pending', bgClass: 'bg-warning/20' },
    inProgress: { color: '#3b82f6', text: 'In Progress', bgClass: 'bg-info/20' },
    completed: { color: '#22c55e', text: 'Completed', bgClass: 'bg-success/20' },
    cancelled: { color: '#ef4444', text: 'Cancelled', bgClass: 'bg-error/20' },
    urgent: { color: '#ef4444', text: 'Urgent', bgClass: 'bg-error/20' },
  };

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const config = statusConfig[status];

  return (
    <View className={`flex-row items-center rounded-full ${config.bgClass} ${sizeClasses[size]} ${className}`}>
      <View
        className={`rounded-full ${dotSizes[size]} mr-2`}
        style={{ backgroundColor: config.color }}
      />
      {showText && (
        <Text className="text-xs font-medium" style={{ color: config.color }}>
          {config.text}
        </Text>
      )}
    </View>
  );
};
