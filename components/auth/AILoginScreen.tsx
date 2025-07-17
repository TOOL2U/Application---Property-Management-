import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput as RNTextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap, Shield } from 'lucide-react-native';
import { AITheme } from '@/constants/AITheme';

const { width, height } = Dimensions.get('window');

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Modern AI-inspired input component
const AIInput = ({ 
  icon: Icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = 'default',
  error,
  rightIcon
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  error?: string;
  rightIcon?: React.ReactNode;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      className="mb-4"
    >
      <View className={`
        relative overflow-hidden rounded-2xl
        ${error ? 'border border-red-500/30' : ''}
        ${isFocused ? 'border border-purple-500/50' : ''}
      `}>
        <BlurView intensity={12} className="absolute inset-0" />
        <LinearGradient
          colors={isFocused ? [AITheme.colors.surface.elevated, AITheme.colors.surface.secondary] : AITheme.gradients.surface as [string, string]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row items-center px-4 py-3 h-14">
            <Icon size={20} color={isFocused ? AITheme.colors.brand.primary : AITheme.colors.text.muted} />
            <RNTextInput
              className="flex-1 ml-3 text-base font-medium text-white"
              placeholder={placeholder}
              placeholderTextColor={AITheme.colors.text.muted}
              value={value}
              onChangeText={onChangeText}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                fontFamily: AITheme.typography.fonts.primary,
                fontSize: 16,
                color: AITheme.colors.text.primary,
              }}
            />
            {rightIcon}
          </View>
        </LinearGradient>
      </View>
      {error && (
        <Animatable.Text
          animation="fadeInLeft"
          className="text-red-400 text-sm mt-1 ml-1 font-medium"
        >
          {error}
        </Animatable.Text>
      )}
    </Animatable.View>
  );
};

// Modern AI-inspired button component
const AIButton = ({ 
  title, 
  onPress, 
  loading = false, 
  variant = 'primary',
  disabled = false,
  icon: Icon
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: any;
}) => {
  const getGradientColors = (): [string, string] => {
    if (disabled) return [AITheme.colors.surface.secondary, AITheme.colors.surface.primary];
    switch (variant) {
      case 'primary':
        return AITheme.gradients.primary as [string, string];
      case 'secondary':
        return AITheme.gradients.surface as [string, string];
      default:
        return AITheme.gradients.surface as [string, string];
    }
  };

  const getTextColor = () => {
    if (disabled) return AITheme.colors.text.muted;
    return variant === 'primary' ? AITheme.colors.text.primary : AITheme.colors.text.secondary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        overflow-hidden rounded-2xl
        ${disabled ? 'opacity-50' : ''}
        ${variant === 'primary' ? 'shadow-lg shadow-purple-500/20' : ''}
      `}
    >
      <BlurView intensity={variant === 'primary' ? 8 : 12} className="absolute inset-0" />
      <LinearGradient
        colors={getGradientColors()}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row items-center justify-center px-6 py-4 h-14">
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <>
              {Icon && <Icon size={20} color={getTextColor()} />}
              <Text
                className={`font-semibold text-base ${Icon ? 'ml-2' : ''}`}
                style={{
                  fontFamily: AITheme.typography.fonts.primary,
                  color: getTextColor(),
                }}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function AILoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signInShared, isLoading, error, clearError, isAuthenticated } = usePINAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
    setErrors({});
  }, [email, password]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if using shared credentials
      const isSharedLogin = email.trim().toLowerCase() === 'staff@siamoon.com' && password === 'staff123';

      if (isSharedLogin) {
        // Use shared authentication flow
        await signInShared();

        // Navigate to profile selection
        router.replace('/(auth)/select-profile');

        Alert.alert(
          'Authentication Successful',
          'Please select your profile to continue.',
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        // Regular login flow
        await signIn(email.trim(), password);

        // Success - navigation will be handled by auth context
        Alert.alert(
          'Login Successful',
          'Welcome back! Redirecting to dashboard...',
          [{ text: 'Continue', style: 'default' }]
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/user-not-found') {
        setErrors({ general: 'No account found with this email address' });
      } else if (err.code === 'auth/wrong-password') {
        setErrors({ general: 'Incorrect password' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ general: 'Invalid email address' });
      } else if (err.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many failed attempts. Please try again later.' });
      } else {
        setErrors({ general: err.message || 'Login failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail('staff@siamoon.com');
    setPassword('staff123');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: AITheme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={AITheme.colors.background.primary} />
      
      {/* Enhanced Dark-to-Blue Gradient Background */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={[
            '#000000', // Pure black at top
            '#0a0a0a', // Very dark gray
            '#1a1a2e', // Dark blue-gray
            '#16213e', // Darker blue
            '#0f3460', // Deep blue
          ]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Secondary gradient overlay for depth */}
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.1)', // Purple overlay
            'transparent',
            'rgba(59, 130, 246, 0.15)', // Blue overlay
          ]}
          className="absolute inset-0"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Enhanced animated glow effects */}
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={4000}
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-500/10"
          style={{ shadowColor: '#8b5cf6', shadowRadius: 50, shadowOpacity: 0.3 }}
        />
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={6000}
          delay={2000}
          className="absolute top-40 right-10 w-40 h-40 rounded-full bg-blue-500/10"
          style={{ shadowColor: '#3b82f6', shadowRadius: 60, shadowOpacity: 0.3 }}
        />
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={5000}
          delay={1000}
          className="absolute bottom-40 left-20 w-36 h-36 rounded-full bg-cyan-500/10"
          style={{ shadowColor: '#06b6d4', shadowRadius: 55, shadowOpacity: 0.3 }}
        />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            className="flex-1 px-6" 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View className="flex-1 justify-center min-h-[80vh]">
              <Animatable.View
                animation="fadeInDown"
                duration={800}
                delay={200}
                className="items-center mb-12"
              >
                {/* Logo/Icon */}
                <View className="mb-8">
                  <View className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center">
                    <Sparkles size={32} color={AITheme.colors.text.primary} />
                  </View>
                </View>

                {/* Title */}
                <Text
                  className="text-4xl font-bold text-center mb-2"
                  style={{
                    fontFamily: AITheme.typography.fonts.primary,
                    color: AITheme.colors.text.primary,
                  }}
                >
                  Welcome Back
                </Text>

                {/* Subtitle */}
                <Text
                  className="text-lg text-center opacity-80"
                  style={{
                    fontFamily: AITheme.typography.fonts.primary,
                    color: AITheme.colors.text.secondary,
                  }}
                >
                  Sign in to your AI-powered property management
                </Text>
              </Animatable.View>

              {/* Login Form */}
              <Animatable.View
                animation="fadeInUp"
                duration={800}
                delay={400}
                className="space-y-6"
              >
                {/* General Error Display */}
                {(errors.general || error) && (
                  <Animatable.View
                    animation="shake"
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                  >
                    <Text className="text-red-400 text-center font-medium">
                      {errors.general || error}
                    </Text>
                  </Animatable.View>
                )}

                {/* Email Input */}
                <AIInput
                  icon={Mail}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  error={errors.email}
                />

                {/* Password Input */}
                <AIInput
                  icon={Lock}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={AITheme.colors.text.muted} />
                      ) : (
                        <Eye size={20} color={AITheme.colors.text.muted} />
                      )}
                    </TouchableOpacity>
                  }
                />

                {/* Login Button */}
                <Animatable.View
                  animation="fadeInUp"
                  duration={600}
                  delay={600}
                  className="mt-8"
                >
                  <AIButton
                    title="Sign In"
                    onPress={handleLogin}
                    loading={isSubmitting || isLoading}
                    icon={Shield}
                    variant="primary"
                  />
                </Animatable.View>

                {/* Quick Login Button */}
                <Animatable.View
                  animation="fadeInUp"
                  duration={600}
                  delay={700}
                  className="mt-4"
                >
                  <AIButton
                    title="Quick Demo Login"
                    onPress={handleQuickLogin}
                    icon={Zap}
                    variant="secondary"
                  />
                </Animatable.View>

                {/* Footer */}
                <Animatable.View
                  animation="fadeInUp"
                  duration={600}
                  delay={800}
                  className="mt-12 items-center"
                >
                  <Text
                    className="text-sm opacity-60 text-center"
                    style={{
                      fontFamily: AITheme.typography.fonts.primary,
                      color: AITheme.colors.text.tertiary,
                    }}
                  >
                    AI-Powered Property Management System
                  </Text>
                </Animatable.View>
              </Animatable.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
