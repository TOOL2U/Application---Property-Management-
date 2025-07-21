import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAdminAuth } from "@/contexts/PINAuthContext";
import { useDesignTokens } from '@/constants/Design';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signOut } = useAdminAuth();
  const router = useRouter();
  const { Colors, Typography, Spacing, BorderRadius, Shadows, colors } = useDesignTokens();

  // Clear any existing admin session when login screen loads
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await signOut();
        console.log('Cleared existing admin session');
      } catch (error) {
        // Ignore errors when clearing session on login screen
        console.log('No existing session to clear');
      }
    };

    clearExistingSession();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/admin/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    backgroundGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.mobile.screenPadding,
    },
    loginCard: {
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      marginHorizontal: Spacing[4],
    },
    cardContent: {
      padding: Spacing[8],
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing[8],
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing[4],
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      ...Typography.sizes['3xl'],
      ...Typography.styles.heading,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: Spacing[2],
    },
    subtitle: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    form: {
      width: '100%',
      gap: Spacing[4],
    },
    inputContainer: {
      position: 'relative',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: Spacing[4],
      height: 56,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    inputIcon: {
      marginRight: Spacing[3],
    },
    input: {
      flex: 1,
      ...Typography.sizes.base,
      color: colors.text.primary,
      height: '100%',
    },
    eyeButton: {
      padding: Spacing[2],
    },
    loginButton: {
      height: 56,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      marginTop: Spacing[4],
      ...Shadows.default,
    },
    loginButtonGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    loginButtonText: {
      ...Typography.sizes.lg,
      fontWeight: '600',
      color: colors.text.inverse,
      marginLeft: Spacing[2],
    },
    loadingText: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: Spacing[4],
    },
    switchAccountButton: {
      marginTop: Spacing[6],
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[4],
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    switchAccountText: {
      ...Typography.sizes.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#111111', '#1a1a1a']}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ justifyContent: 'center', minHeight: '100%' }}
            keyboardShouldPersistTaps="handled"
          >
            <BlurView intensity={24} style={styles.loginCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardContent}
              >
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Shield size={40} color={Colors.primary} />
                  </View>
                  <Text style={styles.title}>Admin Access</Text>
                  <Text style={styles.subtitle}>
                    Sign in to manage Sia Moon Property
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper]}>
                      <Mail size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Admin Email"
                        placeholderTextColor={Colors.text.secondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper]}>
                      <Lock size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={Colors.text.secondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color={Colors.text.secondary} />
                        ) : (
                          <Eye size={20} color={Colors.text.secondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark || colors.primary]}
                      style={styles.loginButtonGradient}
                    >
                      <Shield size={20} color={Colors.text.inverse} />
                      <Text style={styles.loginButtonText}>
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {loading && (
                    <Text style={styles.loadingText}>
                      Verifying admin credentials...
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.switchAccountButton}
                    onPress={async () => {
                      try {
                        await signOut();
                        setEmail('');
                        setPassword('');
                        Alert.alert('Session Cleared', 'You can now sign in with a different account');
                      } catch (error) {
                        console.log('Session already cleared');
                      }
                    }}
                  >
                    <Text style={styles.switchAccountText}>
                      Switch Account / Clear Session
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
