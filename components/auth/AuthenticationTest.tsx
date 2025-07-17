/**
 * Authentication Test Component
 * Verifies sign in and sign out functionality after role-based navigation changes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useStaffAuth } from '@/hooks/useStaffAuth';
import {
  CheckCircle,
  XCircle,
  User,
  LogIn,
  LogOut,
  Shield,
  AlertTriangle,
} from 'lucide-react-native';

export default function AuthenticationTest() {
  const { user, isAuthenticated, signIn, signOut, isLoading, error } = usePINAuth();
  const { hasRole } = useStaffAuth();
  const [testResults, setTestResults] = useState<any[]>([]);

  const testAccounts = [
    { email: 'admin@siamoon.com', password: 'admin123', expectedRole: 'admin', description: 'Admin Account' },
    { email: 'staff@siamoon.com', password: 'password', expectedRole: 'staff', description: 'Staff Account' },
    { email: 'test@example.com', password: 'password', expectedRole: 'manager', description: 'Manager Account' },
  ];

  const runAuthenticationTest = async (account: any) => {
    const testResult = {
      account: account.description,
      email: account.email,
      tests: [] as any[]
    };

    try {
      // Test 1: Sign In
      console.log(`🧪 Testing sign in for ${account.email}`);
      await signIn(account.email, account.password);
      
      if (isAuthenticated && user) {
        testResult.tests.push({
          name: 'Sign In',
          status: 'pass',
          message: `Successfully signed in as ${user.name}`
        });

        // Test 2: Role Verification
        const roleMatch = user.role === account.expectedRole;
        testResult.tests.push({
          name: 'Role Verification',
          status: roleMatch ? 'pass' : 'fail',
          message: `Expected: ${account.expectedRole}, Got: ${user.role}`
        });

        // Test 3: Role-based Navigation
        const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
        const isAdminOrManager = hasRole(['admin', 'manager']);
        const expectedStaffUser = ['cleaner', 'maintenance', 'staff'].includes(account.expectedRole);
        const expectedAdminOrManager = ['admin', 'manager'].includes(account.expectedRole);

        testResult.tests.push({
          name: 'Role-based Navigation',
          status: (isStaffUser === expectedStaffUser && isAdminOrManager === expectedAdminOrManager) ? 'pass' : 'fail',
          message: `Staff User: ${isStaffUser}, Admin/Manager: ${isAdminOrManager}`
        });

        // Test 4: Sign Out
        console.log(`🧪 Testing sign out for ${account.email}`);
        await signOut();
        
        if (!isAuthenticated && !user) {
          testResult.tests.push({
            name: 'Sign Out',
            status: 'pass',
            message: 'Successfully signed out'
          });
        } else {
          testResult.tests.push({
            name: 'Sign Out',
            status: 'fail',
            message: 'Failed to sign out properly'
          });
        }

      } else {
        testResult.tests.push({
          name: 'Sign In',
          status: 'fail',
          message: error || 'Authentication failed'
        });
      }

    } catch (testError) {
      testResult.tests.push({
        name: 'Authentication Test',
        status: 'fail',
        message: testError instanceof Error ? testError.message : 'Unknown error'
      });
    }

    return testResult;
  };

  const runAllTests = async () => {
    setTestResults([]);
    const results = [];

    for (const account of testAccounts) {
      const result = await runAuthenticationTest(account);
      results.push(result);
      setTestResults([...results]);
      
      // Wait a moment between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Show summary
    const totalTests = results.reduce((sum, result) => sum + result.tests.length, 0);
    const passedTests = results.reduce((sum, result) => 
      sum + result.tests.filter(test => test.status === 'pass').length, 0
    );

    Alert.alert(
      'Authentication Test Results',
      `${passedTests}/${totalTests} tests passed\n\nSign in and sign out functionality is ${passedTests === totalTests ? 'working correctly' : 'experiencing issues'}.`,
      [{ text: 'OK' }]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle size={16} color="#22c55e" />;
      case 'fail': return <XCircle size={16} color="#ef4444" />;
      default: return <AlertTriangle size={16} color="#f59e0b" />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Authentication Test</Text>
        <Text style={styles.subtitle}>
          Verify sign in and sign out functionality after role-based navigation changes
        </Text>
      </View>

      {/* Current Status */}
      <View style={styles.statusCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.statusHeader}>
            <User size={20} color="#8b5cf6" />
            <Text style={styles.statusTitle}>Current Authentication Status</Text>
          </View>
          
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Authenticated:</Text>
            <View style={styles.statusValue}>
              {getStatusIcon(isAuthenticated ? 'pass' : 'fail')}
              <Text style={styles.statusText}>{isAuthenticated ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          {user && (
            <>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>User:</Text>
                <Text style={styles.statusText}>{user.name} ({user.email})</Text>
              </View>
              
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Role:</Text>
                <Text style={styles.statusText}>{user.role}</Text>
              </View>
            </>
          )}

          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text style={styles.statusText}>{isLoading ? 'Yes' : 'No'}</Text>
          </View>

          {error && (
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Error:</Text>
              <Text style={[styles.statusText, { color: '#ef4444' }]}>{error}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={runAllTests}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.testButtonGradient}
        >
          <Shield size={20} color="#ffffff" />
          <Text style={styles.testButtonText}>
            {isLoading ? 'Testing...' : 'Run Authentication Tests'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.cardGradient}
              >
                <Text style={styles.resultAccountTitle}>
                  {result.account} ({result.email})
                </Text>
                
                {result.tests.map((test: any, testIndex: number) => (
                  <View key={testIndex} style={styles.testResult}>
                    <View style={styles.testResultHeader}>
                      {getStatusIcon(test.status)}
                      <Text style={styles.testName}>{test.name}</Text>
                    </View>
                    <Text style={styles.testMessage}>{test.message}</Text>
                  </View>
                ))}
              </LinearGradient>
            </View>
          ))}
        </View>
      )}

      {/* Test Accounts Info */}
      <View style={styles.accountsSection}>
        <Text style={styles.accountsTitle}>Available Test Accounts</Text>
        
        {testAccounts.map((account, index) => (
          <View key={index} style={styles.accountCard}>
            <Text style={styles.accountDescription}>{account.description}</Text>
            <Text style={styles.accountEmail}>{account.email}</Text>
            <Text style={styles.accountRole}>Role: {account.expectedRole}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
  },
  testButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resultsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultAccountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  testResult: {
    marginBottom: 8,
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  testMessage: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 24,
  },
  accountsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  accountsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  accountDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 12,
    color: '#8b5cf6',
    marginBottom: 2,
  },
  accountRole: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 40,
  },
});
