import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandTheme } from '../../constants/BrandTheme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  icon,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  autoFocus = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  const containerStyles = [
    styles.container,
    style,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    disabled && styles.inputContainerDisabled,
  ];

  const textInputStyles = [
    styles.textInput,
    multiline && styles.textInputMultiline,
    inputStyle,
  ];

  const getKeyboardType = () => {
    switch (type) {
      case 'email': return 'email-address';
      case 'number': return 'numeric';
      default: return keyboardType;
    }
  };

  const getAutoCapitalize = () => {
    if (type === 'email') return 'none';
    return autoCapitalize;
  };

  return (
    <View style={containerStyles}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyles}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <TextInput
          style={textInputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={BrandTheme.colors.TEXT_MUTED}
          secureTextEntry={isPassword && !isPasswordVisible}
          editable={!disabled}
          autoFocus={autoFocus}
          autoCapitalize={getAutoCapitalize()}
          keyboardType={getKeyboardType()}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={BrandTheme.colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: BrandTheme.spacing.LG,
  },

  label: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: BrandTheme.spacing.SM,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    borderRadius: BrandTheme.radius.SM, // Modern rounded corners (8px)
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    minHeight: 44,
  },

  inputContainerFocused: {
    borderColor: BrandTheme.colors.YELLOW,
    ...BrandTheme.shadows.SMALL_GLOW,
  },

  inputContainerError: {
    borderColor: BrandTheme.colors.ERROR,
  },

  inputContainerDisabled: {
    opacity: 0.5,
    backgroundColor: BrandTheme.colors.GREY_SECONDARY,
  },

  textInput: {
    flex: 1,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 16,
    color: BrandTheme.colors.TEXT_PRIMARY,
    padding: 0, // Remove default padding
    margin: 0, // Remove default margin
  },

  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  iconContainer: {
    marginRight: BrandTheme.spacing.SM,
  },

  passwordToggle: {
    marginLeft: BrandTheme.spacing.SM,
    padding: BrandTheme.spacing.XS,
  },

  errorText: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.ERROR,
    marginTop: BrandTheme.spacing.XS,
  },
});

export default Input;
