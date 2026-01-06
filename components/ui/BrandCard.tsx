import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BrandTheme } from '../../constants/BrandTheme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'standard' | 'elevated' | 'glowEffect';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'standard',
  padding = 'lg',
  style,
}: CardProps) {
  const getPaddingStyle = () => {
    switch (padding) {
      case 'none': return styles.paddingNone;
      case 'sm': return styles.paddingSm;
      case 'md': return styles.paddingMd;
      case 'lg': return styles.paddingLg;
      default: return styles.paddingLg;
    }
  };

  const cardStyles = [
    styles.base,
    styles[variant],
    getPaddingStyle(),
    style,
  ];

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Base card styles (Brand Kit)
  base: {
    borderRadius: 0, // Brand kit: sharp corners
  },

  // Variant styles (Brand Kit Implementation)
  standard: {
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    ...BrandTheme.shadows.BLACK_SMALL,
  },

  elevated: {
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    ...BrandTheme.shadows.BLACK_MEDIUM,
  },

  glowEffect: {
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
    ...BrandTheme.shadows.YELLOW_GLOW,
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },

  paddingSm: {
    padding: BrandTheme.spacing.SM,
  },

  paddingMd: {
    padding: BrandTheme.spacing.MD,
  },

  paddingLg: {
    padding: BrandTheme.spacing.LG,
  },
});

export default Card;
