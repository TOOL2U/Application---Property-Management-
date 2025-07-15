import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { CheckCircle, XCircle, User, Key, Smartphone } from 'lucide-react-native';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Design';
import { useAuth } from '../contexts/AuthContext';
import { Storage } from '../utils/storage';

export default function AuthTest() {
  const { signIn, signOut, user, isLoading } = useAuth();
  const [testEmail, setTestEmail] = useState('demo@villa.com');
  const [testPassword, setTestPassword] = useState('demo123');
  const [testResults, setTestResults] = useState<Array<{ test: string; passed: boolean; message: string }>>([]);

  const runTests = async () => {
    const results: Array<{ test: string; passed: boolean; message: string }> = [];

    // Test 1: Storage availability
    try {
      const storageType = Storage.getStorageType();
      const isAvailable = Storage.isAvailable();
      results.push({
        test: 'Storage System',
        passed: isAvailable,
        message: `Storage type: ${storageType}, Available: ${isAvailable}`,
      });
    } catch (error) {
      results.push({
        test: 'Storage System',
        passed: false,
        message: `Storage error: ${error}`,
      });
    }

    // Test 2: Storage read/write
    try {
      await Storage.setString('test_key', 'test_value');
      const value = await Storage.getString('test_key');
      const passed = value === 'test_value';
      results.push({
        test: 'Storage Read/Write',
        passed,
        message: passed ? 'Storage operations working' : `Expected 'test_value', got '${value}'`,
      });
      await Storage.remove('test_key');
    } catch (error) {
      results.push({
        test: 'Storage Read/Write',
        passed: false,
        message: `Storage R/W error: ${error}`,
      });
    }

    // Test 3: Predefined test users
    const testUsers = [
      { email: 'staff@siamoon.com', password: 'password' },
      { email: 'demo@villa.com', password: 'demo123' },
      { email: 'admin@property.com', password: 'admin' },
      { email: 'test@test.com', password: 'test' },
    ];

    for (const testUser of testUsers) {
      try {
        await signIn(testUser.email, testUser.password);
        if (user) {
          results.push({
            test: `Login: ${testUser.email}`,
            passed: true,
            message: `Successfully logged in as ${user.firstName} ${user.lastName}`,
          });
          await signOut();
        } else {
          results.push({
            test: `Login: ${testUser.email}`,
            passed: false,
            message: 'Login succeeded but user state not updated',
          });
        }
      } catch (error) {
        results.push({
          test: `Login: ${testUser.email}`,
          passed: false,
          message: `Login failed: ${error}`,
        });
      }
    }

    // Test 4: Flexible login (any credentials)
    try {
      await signIn('random@email.com', 'randompassword');
      if (user) {
        results.push({
          test: 'Flexible Login',
          passed: true,
          message: `Flexible login working: ${user.email}`,
        });
        await signOut();
      } else {
        results.push({
          test: 'Flexible Login',
          passed: false,
          message: 'Flexible login failed to set user',
        });
      }
    } catch (error) {
      results.push({
        test: 'Flexible Login',
        passed: false,
        message: `Flexible login error: ${error}`,
      });
    }

    // Test 5: Empty credentials validation
    try {
      await signIn('', '');
      results.push({
        test: 'Empty Credentials',
        passed: false,
        message: 'Should have rejected empty credentials',
      });
    } catch (error) {
      results.push({
        test: 'Empty Credentials',
        passed: true,
        message: 'Correctly rejected empty credentials',
      });
    }

    setTestResults(results);
  };

  const testLogin = async () => {
    if (!testEmail.trim() || !testPassword.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await signIn(testEmail.trim(), testPassword);
      Alert.alert('Success', `Logged in as ${user?.firstName} ${user?.lastName}`);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testLogout = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Logout Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <Smartphone size={32} color={Colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Authentication Test Suite</Text>
            <Text style={styles.subtitle}>Verify login functionality across platforms</Text>
          </View>
        </View>
      </Card>

      {user && (
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <User size={24} color={Colors.primary} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>Role: {user.role}</Text>
            </View>
          </View>
          <Button title="Sign Out" onPress={testLogout} variant="outline" size="sm" />
        </Card>
      )}

      <Card style={styles.testCard}>
        <Text style={styles.cardTitle}>Manual Login Test</Text>
        <Input
          label="Email"
          value={testEmail}
          onChangeText={setTestEmail}
          placeholder="Enter test email"
          type="email"
        />
        <Input
          label="Password"
          value={testPassword}
          onChangeText={setTestPassword}
          placeholder="Enter test password"
          type="password"
        />
        <View style={styles.buttonRow}>
          <Button
            title="Test Login"
            onPress={testLogin}
            loading={isLoading}
            style={styles.testButton}
          />
          <Button
            title="Run All Tests"
            onPress={runTests}
            variant="outline"
            style={styles.testButton}
          />
        </View>
      </Card>

      <Card style={styles.credentialsCard}>
        <Text style={styles.cardTitle}>Test Credentials</Text>
        <Text style={styles.credentialsText}>
          • staff@siamoon.com / password{'\n'}
          • demo@villa.com / demo123{'\n'}
          • admin@property.com / admin{'\n'}
          • test@test.com / test{'\n'}
          • Any email/password combination
        </Text>
      </Card>

      {testResults.length > 0 && (
        <Card style={styles.resultsCard}>
          <Text style={styles.cardTitle}>Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.testResult}>
              {result.passed ? (
                <CheckCircle size={20} color={Colors.success} />
              ) : (
                <XCircle size={20} color={Colors.error} />
              )}
              <View style={styles.testDetails}>
                <Text style={styles.testName}>{result.test}</Text>
                <Text style={[styles.testMessage, { color: result.passed ? Colors.success : Colors.error }]}>
                  {result.message}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing[4],
  },

  headerCard: {
    marginBottom: Spacing[4],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    marginLeft: Spacing[3],
    flex: 1,
  },

  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes['2xl'].fontSize,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing[1],
  },

  subtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    color: Colors.neutral300,
  },

  userCard: {
    marginBottom: Spacing[4],
    backgroundColor: `${Colors.primary}10`,
    borderColor: `${Colors.primary}30`,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },

  userDetails: {
    marginLeft: Spacing[3],
    flex: 1,
  },

  userName: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },

  userEmail: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.neutral300,
  },

  userRole: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.xs.fontSize,
    color: Colors.primary,
    textTransform: 'uppercase',
  },

  testCard: {
    marginBottom: Spacing[4],
  },

  cardTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginBottom: Spacing[4],
  },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },

  testButton: {
    flex: 1,
  },

  credentialsCard: {
    marginBottom: Spacing[4],
    backgroundColor: `${Colors.neutral800}80`,
  },

  credentialsText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.neutral300,
    lineHeight: 20,
  },

  resultsCard: {
    marginBottom: Spacing[4],
  },

  testResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },

  testDetails: {
    marginLeft: Spacing[3],
    flex: 1,
  },

  testName: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    marginBottom: Spacing[1],
  },

  testMessage: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    lineHeight: 18,
  },
});
