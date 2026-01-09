import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandTheme } from '../../constants/BrandTheme';
import { Colors, Typography, Spacing, Shadows, ComponentDimensions } from '../../constants/Design';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
    styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[buttonStyles, { padding: 0 }]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, buttonStyles]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={buttonStyles}
      activeOpacity={disabled ? 1 : 0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: ComponentDimensions.button.height,
    paddingHorizontal: ComponentDimensions.button.paddingHorizontal,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`, // 20% opacity
    ...Shadows.button,
  },

  secondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },

  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Sizes
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing[4],
  },

  md: {
    minHeight: ComponentDimensions.button.height,
    paddingHorizontal: ComponentDimensions.button.paddingHorizontal,
  },

  lg: {
    minHeight: 56,
    paddingHorizontal: Spacing[8],
  },

  // States
  disabled: {
    opacity: 0.4,
  },

  fullWidth: {
    width: '100%',
  },

  // Gradient
  gradient: {
    borderRadius: 8,
    paddingHorizontal: ComponentDimensions.button.paddingHorizontal,
    minHeight: ComponentDimensions.button.height,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  text: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: -0.011, // Linear-style tight spacing
  },

  textPrimary: {
    color: Colors.white,
    fontSize: Typography.sizes.base.fontSize,
    lineHeight: Typography.sizes.base.lineHeight,
  },

  textSecondary: {
    color: Colors.white,
    fontSize: Typography.sizes.base.fontSize,
    lineHeight: Typography.sizes.base.lineHeight,
  },

  textOutline: {
    color: Colors.white,
    fontSize: Typography.sizes.base.fontSize,
    lineHeight: Typography.sizes.base.lineHeight,
  },

  textGhost: {
    color: Colors.primary,
    fontSize: Typography.sizes.base.fontSize,
    lineHeight: Typography.sizes.base.lineHeight,
  },

  textSm: {
    fontSize: Typography.sizes.sm.fontSize,
    lineHeight: Typography.sizes.sm.lineHeight,
  },

  textMd: {
    fontSize: Typography.sizes.base.fontSize,
    lineHeight: Typography.sizes.base.lineHeight,
  },

  textLg: {
    fontSize: Typography.sizes.lg.fontSize,
    lineHeight: Typography.sizes.lg.lineHeight,
  },

  textDisabled: {
    opacity: 0.6,
  },

  // Icons
  iconLeft: {
    marginRight: Spacing[2],
  },

  iconRight: {
    marginLeft: Spacing[2],
  },
});
