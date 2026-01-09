import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDesignTokens } from '@/constants/Design';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  gradient?: string[];
  intensity?: number;
  style?: ViewStyle;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  gradient = ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  intensity = 15,
  style,
  borderRadius = 16,
  borderColor = 'rgba(255, 255, 255, 0.1)',
  borderWidth = 1,
}) => {
  const { BorderRadius } = useDesignTokens();

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <LinearGradient
        colors={gradient}
        style={[styles.gradient, { borderRadius }]}
      >
        <BlurView 
          intensity={intensity} 
          style={[
            styles.blur, 
            { 
              borderRadius, 
              borderColor, 
              borderWidth 
            }
          ]}
        >
          {children}
        </BlurView>
      </LinearGradient>
    </View>
  );
};

interface NeonGradientCardProps {
  children: React.ReactNode;
  colors: string[];
  glowColor?: string;
  style?: ViewStyle;
  borderRadius?: number;
}

export const NeonGradientCard: React.FC<NeonGradientCardProps> = ({
  children,
  colors,
  glowColor,
  style,
  borderRadius = 16,
}) => {
  return (
    <View style={[styles.neonContainer, style]}>
      <LinearGradient
        colors={colors}
        style={[
          styles.neonGradient, 
          { 
            borderRadius,
            shadowColor: glowColor || colors[0],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowColor ? 0.3 : 0,
            shadowRadius: glowColor ? 8 : 0,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView 
          intensity={10} 
          style={[styles.neonBlur, { borderRadius }]}
        >
          {children}
        </BlurView>
      </LinearGradient>
    </View>
  );
};

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View 
        style={[
          styles.progressBackground, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]} 
      />
      <View 
        style={[
          styles.progressForeground, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '-90deg' }],
          }
        ]} 
      />
      {children && (
        <View style={styles.progressContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  blur: {
    flex: 1,
  },
  neonContainer: {
    overflow: 'hidden',
  },
  neonGradient: {
    flex: 1,
  },
  neonBlur: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressForeground: {
    position: 'absolute',
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
