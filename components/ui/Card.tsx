import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Dimensions } from '../../constants/Design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'gradient' | 'elevated';
  pressable?: boolean;
  onPress?: () => void;
}

export function Card({
  children,
  style,
  padding = Dimensions.cardPadding,
  variant = 'default',
  pressable = false,
  onPress
}: CardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    { padding },
    style,
  ];

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={Colors.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    minHeight: Dimensions.cardMinHeight,
  },

  default: {
    backgroundColor: Colors.cardBackground,
    ...Shadows.card,
  },

  gradient: {
    // Gradient styles applied via LinearGradient
    ...Shadows.card,
  },

  elevated: {
    backgroundColor: Colors.cardBackground,
    ...Shadows.elevated,
  },
});
