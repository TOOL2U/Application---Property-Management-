import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Dimensions, Shadows } from '../../constants/Design';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  type?: 'text' | 'email' | 'password' | 'number';
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Input({
  label,
  error,
  containerStyle,
  type = 'text',
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const getSecureTextEntry = () => {
    return type === 'password' && !showPassword;
  };

  const inputStyles = [
    styles.base,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    error && styles.error,
    (icon || type === 'password') && iconPosition === 'left' && styles.withLeftIcon,
    (icon || type === 'password') && iconPosition === 'right' && styles.withRightIcon,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>
            {icon}
          </View>
        )}

        <TextInput
          style={inputStyles}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={false}
          placeholderTextColor={Colors.neutral400}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {type === 'password' && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.neutral400} />
            ) : (
              <Eye size={20} color={Colors.neutral400} />
            )}
          </TouchableOpacity>
        )}

        {icon && iconPosition === 'right' && type !== 'password' && (
          <TouchableOpacity style={styles.iconRight}>
            {icon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },

  label: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    marginBottom: Spacing[2],
    letterSpacing: -0.011,
  },

  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  base: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.default,
    paddingHorizontal: Dimensions.inputPadding,
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    color: Colors.white,
    letterSpacing: -0.011,
  },

  default: {
    backgroundColor: Colors.backgroundTertiary,
    borderColor: Colors.borderDefault,
    minHeight: Dimensions.inputHeight,
  },

  filled: {
    backgroundColor: Colors.neutral800,
    borderColor: Colors.borderLight,
    minHeight: Dimensions.inputHeight,
  },

  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing[3],
    fontSize: Typography.sizes.sm.fontSize,
  },

  md: {
    minHeight: Dimensions.inputHeight,
    paddingHorizontal: Dimensions.inputPadding,
    fontSize: Typography.sizes.base.fontSize,
  },

  lg: {
    minHeight: 52,
    paddingHorizontal: Spacing[5],
    fontSize: Typography.sizes.lg.fontSize,
  },

  focused: {
    borderColor: Colors.primary,
    ...Shadows.focus,
  },

  error: {
    borderColor: Colors.error,
  },

  withLeftIcon: {
    paddingLeft: 44,
  },

  withRightIcon: {
    paddingRight: 44,
  },

  iconLeft: {
    position: 'absolute',
    left: Spacing[3],
    zIndex: 1,
  },

  iconRight: {
    position: 'absolute',
    right: Spacing[3],
    zIndex: 1,
  },

  eyeButton: {
    position: 'absolute',
    right: Spacing[3],
    padding: Spacing[1],
  },

  errorText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.error,
    marginTop: Spacing[1],
    letterSpacing: -0.011,
  },
});
