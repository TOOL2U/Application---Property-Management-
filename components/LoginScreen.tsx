import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Design';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoginError(null);
    try {
      await signIn(email.trim(), password);
      console.log('✅ Login successful!');
      // Navigation will be handled by the auth state change
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
      console.error('❌ Login failed:', errorMessage);
    }
  };

  const handleDemoLogin = async () => {
    setLoginError(null);
    try {
      // Use one of the predefined demo accounts
      await signIn('demo@villa.com', 'demo123');
      console.log('✅ Demo login successful!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Demo login failed';
      setLoginError(errorMessage);
      Alert.alert('Demo Login Failed', errorMessage);
      console.error('❌ Demo login failed:', errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={Colors.gradients.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Villa Management</Text>
            <Text style={styles.subtitle}>Staff Portal</Text>
          </View>

          <Card variant="elevated" style={styles.formCard}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              type="email"
              editable={!isLoading}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              type="password"
              editable={!isLoading}
            />

            {loginError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <Button
              title="Try Demo"
              onPress={handleDemoLogin}
              variant="outline"
              disabled={isLoading}
              fullWidth
              style={styles.demoButton}
            />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Premium villa property management system
            </Text>
            <Text style={styles.footerSubtext}>
              Connect to your web app via API configuration
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
  },

  header: {
    alignItems: 'center',
    marginBottom: Spacing[12],
  },

  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes['4xl'].fontSize,
    lineHeight: Typography.sizes['4xl'].lineHeight,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing[2],
    letterSpacing: -0.025,
    textAlign: 'center',
  },

  subtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    lineHeight: Typography.sizes.lg.lineHeight,
    fontWeight: Typography.weights.medium,
    color: Colors.neutral300,
    letterSpacing: -0.011,
    textAlign: 'center',
  },

  formCard: {
    marginBottom: Spacing[8],
  },

  errorContainer: {
    backgroundColor: `${Colors.error}15`, // 15% opacity
    borderWidth: 1,
    borderColor: `${Colors.error}30`, // 30% opacity
    borderRadius: BorderRadius.default,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },

  errorText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.error,
    textAlign: 'center',
    letterSpacing: -0.011,
  },

  loginButton: {
    marginBottom: Spacing[3],
  },

  demoButton: {
    marginBottom: 0,
  },

  footer: {
    alignItems: 'center',
  },

  footerText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.neutral400,
    textAlign: 'center',
    marginBottom: Spacing[1],
    letterSpacing: -0.011,
  },

  footerSubtext: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.xs.fontSize,
    color: Colors.neutral500,
    textAlign: 'center',
    letterSpacing: -0.011,
  },
});
