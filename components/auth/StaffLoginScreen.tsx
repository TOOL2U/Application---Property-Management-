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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SiaMoonCard, SiaMoonButton, SiaMoonGradientButton, SiaMoonText } from '@/components/ui/SiaMoonUI';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function StaffLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signInShared, isLoading, error, clearError, isAuthenticated } = useAuth();
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
        // Use individual authentication flow (legacy)
        await signIn(email.trim().toLowerCase(), password);

        // Success - navigation will be handled by useEffect
        Alert.alert(
          'Login Successful',
          'Welcome to Sia Moon Property Management!',
          [{ text: 'Continue', style: 'default' }]
        );
      }

    } catch (error) {
      console.error('Login error:', error);

      // Handle specific error types
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      if (errorMessage.includes('Too many failed attempts')) {
        Alert.alert(
          'Account Temporarily Locked',
          'Too many failed login attempts. Please try again in 15 minutes.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (errorMessage.includes('Invalid email or password')) {
        setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' });
      } else if (errorMessage.includes('Network error')) {
        setErrors({ general: 'Network error. Please check your internet connection and try again.' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email.trim() && password.trim() && Object.keys(errors).length === 0;
  const isButtonDisabled = isSubmitting || isLoading || !isFormValid;

  return (
    <View className="flex-1 bg-dark-bg">
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a', '#8b5cf6']}
        locations={[0, 0.7, 1]}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <Animatable.View
                animation="fadeInDown"
                duration={1000}
                className="items-center mb-12"
              >
                <View className="w-24 h-24 rounded-3xl items-center justify-center mb-8"
                  style={{
                    shadowColor: '#8b5cf6',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    className="w-full h-full rounded-3xl items-center justify-center"
                  >
                    <Sparkles size={32} color="white" />
                  </LinearGradient>
                </View>

                <Text className="text-3xl font-bold tracking-tight text-white text-center mb-2">
                  Sia Moon Property
                </Text>
                <Text className="text-base text-text-secondary text-center">
                  AI-Powered Staff Management
                </Text>
              </Animatable.View>

              {/* Login Form */}
              <Animatable.View
                animation="fadeInUp"
                duration={800}
                delay={300}
              >
                <SiaMoonCard variant="glass" className="mb-6"
                  style={{
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  {/* Email Input */}
                  <View className="mb-4">
                    <SiaMoonText variant="caption" color="secondary" className="mb-2 ml-1">
                      Email Address
                    </SiaMoonText>
                    <View className={`flex-row items-center bg-dark-surface rounded-xl border ${errors.email ? 'border-error' : 'border-dark-border'} px-4 py-3`}>
                      <Mail size={20} color={errors.email ? '#ef4444' : '#71717a'} />
                      <RNTextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email address"
                        placeholderTextColor="#71717a"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting && !isLoading}
                        className="flex-1 ml-3 text-text-primary text-base"
                        style={{ fontFamily: 'Inter' }}
                      />
                    </View>
                    {errors.email && (
                      <Text className="text-error text-xs mt-1 ml-1">{errors.email}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View className="mb-6">
                    <SiaMoonText variant="caption" color="secondary" className="mb-2 ml-1">
                      Password
                    </SiaMoonText>
                    <View className={`flex-row items-center bg-dark-surface rounded-xl border ${errors.password ? 'border-error' : 'border-dark-border'} px-4 py-3`}>
                      <Lock size={20} color={errors.password ? '#ef4444' : '#71717a'} />
                      <RNTextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor="#71717a"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting && !isLoading}
                        className="flex-1 ml-3 text-text-primary text-base"
                        style={{ fontFamily: 'Inter' }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-2 p-1"
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#71717a" />
                        ) : (
                          <Eye size={20} color="#71717a" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text className="text-error text-xs mt-1 ml-1">{errors.password}</Text>
                    )}
                  </View>
                  {/* General Error */}
                  {(errors.general || error) && (
                    <View className="flex-row items-center bg-error/20 border border-error/30 rounded-xl p-3 mb-4">
                      <View className="w-5 h-5 rounded-full bg-error items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">!</Text>
                      </View>
                      <SiaMoonText variant="caption" color="error" className="flex-1">
                        {errors.general || error}
                      </SiaMoonText>
                    </View>
                  )}

                  {/* Login Button */}
                  <SiaMoonGradientButton
                    title={(isSubmitting || isLoading) ? 'Signing In...' : 'Sign In'}
                    onPress={handleLogin}
                    disabled={isButtonDisabled}
                    loading={isSubmitting || isLoading}
                    fullWidth
                    size="lg"
                    gradientColors={['#8b5cf6', '#7c3aed']}
                  />
                </SiaMoonCard>

                {/* Help Text */}
                <View className="items-center mt-6">
                  <SiaMoonText variant="caption" color="muted" className="mb-3 text-center">
                    Having trouble signing in?
                  </SiaMoonText>
                  <TouchableOpacity
                    onPress={() => Alert.alert(
                      'Contact Support',
                      'Please contact your administrator for assistance with your account.',
                      [{ text: 'OK', style: 'default' }]
                    )}
                    className="px-4 py-2 rounded-lg bg-dark-surface/50 border border-dark-border"
                  >
                    <SiaMoonText variant="caption" color="brand" className="font-medium">
                      Contact Support
                    </SiaMoonText>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}


