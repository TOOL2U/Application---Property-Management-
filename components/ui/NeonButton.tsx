import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDesignTokens } from '@/constants/Design';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  glow?: boolean;
  pulse?: boolean;
}

const variantConfig = {
  primary: {
    colors: ['#8b5cf6', '#7c3aed'],
    glowColor: '#8b5cf6',
    textColor: '#ffffff',
  },
  secondary: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    glowColor: 'rgba(255, 255, 255, 0.3)',
    textColor: '#ffffff',
  },
  success: {
    colors: ['#22c55e', '#16a34a'],
    glowColor: '#22c55e',
    textColor: '#ffffff',
  },
  warning: {
    colors: ['#f59e0b', '#d97706'],
    glowColor: '#f59e0b',
    textColor: '#ffffff',
  },
  danger: {
    colors: ['#ef4444', '#dc2626'],
    glowColor: '#ef4444',
    textColor: '#ffffff',
  },
};

const sizeConfig = {
  sm: {
    height: 40,
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 16,
  },
  md: {
    height: 48,
    paddingHorizontal: 20,
    fontSize: 16,
    iconSize: 18,
  },
  lg: {
    height: 56,
    paddingHorizontal: 24,
    fontSize: 18,
    iconSize: 20,
  },
};

export const NeonButton: React.FC<NeonButtonProps> = ({
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
  glow = true,
  pulse = false,
}) => {
  const { Typography, BorderRadius, Spacing } = useDesignTokens();
  const config = variantConfig[variant];
  const sizeConf = sizeConfig[size];

  const pulseAnimation = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (pulse && !disabled && !loading) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [pulse, disabled, loading]);

  const buttonStyles = [
    styles.button,
    {
      height: sizeConf.height,
      paddingHorizontal: sizeConf.paddingHorizontal,
      borderRadius: BorderRadius.md,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const gradientStyles = [
    styles.gradient,
    {
      borderRadius: BorderRadius.md,
      shadowColor: glow ? config.glowColor : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glow && !disabled ? 0.4 : 0,
      shadowRadius: glow && !disabled ? 8 : 0,
    },
  ];

  const textStyles = [
    styles.text,
    {
      fontSize: sizeConf.fontSize,
      color: config.textColor,
      fontWeight: Typography.weights.semibold,
      letterSpacing: -0.2,
    },
    disabled && styles.textDisabled,
    textStyle,
  ];

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnimation }] }]}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] : config.colors}
          style={gradientStyles}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BlurView intensity={5} style={styles.blur}>
            <View style={styles.content}>
              {icon && iconPosition === 'left' && (
                <View style={[styles.icon, { marginRight: Spacing[2] }]}>
                  {icon}
                </View>
              )}
              <Text style={textStyles}>
                {loading ? 'Loading...' : title}
              </Text>
              {icon && iconPosition === 'right' && (
                <View style={[styles.icon, { marginLeft: Spacing[2] }]}>
                  {icon}
                </View>
              )}
            </View>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  blur: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
