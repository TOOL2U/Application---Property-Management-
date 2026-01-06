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
import { BrandTheme } from '../../constants/BrandTheme';

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

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? BrandTheme.colors.BLACK : BrandTheme.colors.TEXT_PRIMARY} 
          />
          <Text style={[textStyles, { marginLeft: 8 }]}>Loading...</Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={styles.content}>
          {iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && icon}
        </View>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={BrandTheme.animation.button.activeOpacity}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base styles
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BrandTheme.radius.SM, // Modern rounded corners (8px)
    flexDirection: 'row',
  },

  // Variant styles (Brand Kit Implementation)
  primary: {
    backgroundColor: BrandTheme.colors.YELLOW,
    ...BrandTheme.shadows.YELLOW_GLOW,
    borderWidth: 0,
  },

  secondary: {
    backgroundColor: BrandTheme.colors.SURFACE_2,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    ...BrandTheme.shadows.BLACK_SMALL,
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: BrandTheme.colors.YELLOW,
  },

  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Size styles
  sm: {
    height: 36,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  md: {
    height: 44,
    paddingHorizontal: BrandTheme.spacing.XL,
  },

  lg: {
    height: 52,
    paddingHorizontal: BrandTheme.spacing.XXL,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  fullWidth: {
    width: '100%',
  },

  // Text styles (Brand Kit Typography)
  text: {
    fontFamily: BrandTheme.typography.fontFamily.primary, // Aileron-Bold
    fontWeight: '600',
    textTransform: 'uppercase', // Brand kit spec
    letterSpacing: 0.5, // Brand kit spec
  },

  textPrimary: {
    color: BrandTheme.colors.BLACK, // Black text on yellow
  },

  textSecondary: {
    color: BrandTheme.colors.TEXT_PRIMARY, // White text
  },

  textOutline: {
    color: BrandTheme.colors.YELLOW, // Yellow text
  },

  textGhost: {
    color: BrandTheme.colors.TEXT_SECONDARY, // Secondary text
  },

  textSm: {
    fontSize: 14,
  },

  textMd: {
    fontSize: 16,
  },

  textLg: {
    fontSize: 18,
  },

  textDisabled: {
    opacity: 0.6,
  },

  // Content layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BrandTheme.spacing.SM,
  },
});

export default Button;
