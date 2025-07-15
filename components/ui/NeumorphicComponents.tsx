import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';

// Base Neumorphic Card Component
interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'pressed';
  onPress?: () => void;
  disabled?: boolean;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  disabled = false,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getGradientColors = () => {
    if (pressed || variant === 'pressed') {
      return NeumorphicTheme.gradients.cardPressed;
    }
    if (variant === 'elevated') {
      return NeumorphicTheme.gradients.cardElevated;
    }
    return NeumorphicTheme.gradients.cardLight;
  };

  const cardContent = (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.neumorphicCard, style]}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <BlurView intensity={8} style={styles.cardBlur}>
            {children}
          </BlurView>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

// Neumorphic Button Component
interface NeumorphicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const [pressed, setPressed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return NeumorphicTheme.gradients.brandPrimary;
      case 'success':
        return NeumorphicTheme.gradients.success;
      case 'warning':
        return NeumorphicTheme.gradients.warning;
      case 'error':
        return NeumorphicTheme.gradients.error;
      default:
        return NeumorphicTheme.gradients.cardElevated;
    }
  };

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 56;
      default:
        return 48;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      style={[{ opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <View style={[
          styles.neumorphicButton,
          { height: getButtonHeight() },
          style
        ]}>
          <LinearGradient
            colors={getButtonColors()}
            style={[styles.buttonGradient, { height: getButtonHeight() }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonContent}>
              {icon && <View style={styles.buttonIcon}>{icon}</View>}
              <Text style={[
                styles.buttonText,
                { fontSize: getTextSize() },
                textStyle
              ]}>
                {title}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Neumorphic Input Component
interface NeumorphicInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const NeumorphicInput: React.FC<NeumorphicInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  icon,
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.neumorphicInput, style]}>
      <LinearGradient
        colors={focused ? NeumorphicTheme.gradients.cardElevated : NeumorphicTheme.gradients.cardPressed}
        style={styles.inputGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={6} style={styles.inputBlur}>
          <View style={styles.inputContent}>
            {icon && <View style={styles.inputIcon}>{icon}</View>}
            <Text
              style={styles.inputText}
              placeholder={placeholder}
              placeholderTextColor={NeumorphicTheme.colors.text.tertiary}
              value={value}
              onChangeText={onChangeText}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

// Neumorphic Progress Ring Component
interface NeumorphicProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const NeumorphicProgressRing: React.FC<NeumorphicProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = NeumorphicTheme.colors.brand.primary,
  backgroundColor = NeumorphicTheme.colors.surface.primary,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <NeumorphicCard style={styles.progressRingCard}>
        <View style={styles.progressRingContent}>
          {/* SVG would go here in a real implementation */}
          <View style={[
            styles.progressRingCircle,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: (size - strokeWidth) / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            }
          ]}>
            <View style={[
              styles.progressRingFill,
              {
                width: size - strokeWidth * 2,
                height: size - strokeWidth * 2,
                borderRadius: (size - strokeWidth * 2) / 2,
                backgroundColor: color,
                opacity: progress / 100,
              }
            ]} />
          </View>
          {children && (
            <View style={styles.progressRingChildren}>
              {children}
            </View>
          )}
        </View>
      </NeumorphicCard>
    </View>
  );
};

const styles = StyleSheet.create({
  // Neumorphic Card Styles
  neumorphicCard: {
    borderRadius: NeumorphicTheme.borderRadius.lg,
    overflow: 'hidden',
    ...NeumorphicTheme.shadows.elevation.medium,
  },
  cardGradient: {
    flex: 1,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: NeumorphicTheme.colors.border.light,
  },
  cardBlur: {
    flex: 1,
    borderRadius: NeumorphicTheme.borderRadius.lg,
  },

  // Neumorphic Button Styles
  neumorphicButton: {
    borderRadius: NeumorphicTheme.borderRadius.md,
    overflow: 'hidden',
    ...NeumorphicTheme.shadows.elevation.small,
  },
  buttonGradient: {
    borderRadius: NeumorphicTheme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[6],
  },
  buttonIcon: {
    marginRight: NeumorphicTheme.spacing[2],
  },
  buttonText: {
    color: NeumorphicTheme.colors.text.primary,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
  },

  // Neumorphic Input Styles
  neumorphicInput: {
    borderRadius: NeumorphicTheme.borderRadius.md,
    overflow: 'hidden',
    height: NeumorphicTheme.components.input.height,
  },
  inputGradient: {
    flex: 1,
    borderRadius: NeumorphicTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: NeumorphicTheme.colors.border.light,
  },
  inputBlur: {
    flex: 1,
    borderRadius: NeumorphicTheme.borderRadius.md,
    justifyContent: 'center',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: NeumorphicTheme.spacing[4],
  },
  inputIcon: {
    marginRight: NeumorphicTheme.spacing[3],
  },
  inputText: {
    flex: 1,
    color: NeumorphicTheme.colors.text.primary,
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
  },

  // Progress Ring Styles
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRingCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingFill: {
    position: 'absolute',
  },
  progressRingChildren: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default {
  NeumorphicCard,
  NeumorphicButton,
  NeumorphicInput,
  NeumorphicProgressRing,
};
