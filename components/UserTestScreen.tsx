import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { NeumorphicTheme } from '@/constants/NeumorphicTheme';
import { authService } from '@/services/authService';
import { testUserAuthentication, testLogin } from '@/utils/testUtils';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserTestScreen() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('shaun@siamoon.com');
  const [password, setPassword] = useState('admin123'); // Default password for staff_accounts test

  const addTestResult = (test: string, success: boolean, data?: any, error?: string) => {
    const result = {
      id: Date.now(),
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    try {
      // Check Firebase production environment
      addTestResult('Firebase Environment Check', true, {
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        environment: 'production'
      });

      // Test Firestore connection with a simple read operation
      const staffAccountsRef = collection(db, 'staff accounts');
      const snapshot = await getDocs(staffAccountsRef);
      
      addTestResult('Firebase Production Connection', true, {
        message: 'Successfully connected to production Firebase',
        collectionExists: true,
        documentsCount: snapshot.size
      });
    } catch (error: any) {
      addTestResult('Firebase Production Connection', false, null, error.message);
    }
    setIsLoading(false);
  };

  const testFindUserById = async () => {
    setIsLoading(true);
    const userId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';

    try {
      addTestResult('Testing find user by ID...', true);

      // Try to get user by document ID
      const userRef = doc(db, 'staff accounts', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        addTestResult('Find User by ID', true, userData);
        console.log('User found:', userData);
      } else {
        addTestResult('Find User by ID', false, null, 'User document not found');
      }
    } catch (error) {
      addTestResult('Find User by ID', false, null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsLoading(false);
  };

  const testFindUserByEmail = async () => {
    setIsLoading(true);
    
    try {
      addTestResult('Testing find user by email...', true);
      
      // Query for user by email
      const staffAccountsRef = collection(db, 'staff accounts');
      const q = query(staffAccountsRef, where('email', '==', email.toLowerCase().trim()));
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        addTestResult('Find User by Email', true, users);
        console.log('Users found:', users);
      } else {
        addTestResult('Find User by Email', false, null, 'No users found with that email');
      }
    } catch (error) {
      addTestResult('Find User by Email', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
    
    setIsLoading(false);
  };

  const testListAllUsers = async () => {
    setIsLoading(true);
    
    try {
      addTestResult('Testing list all users...', true);
      
      // Get all staff accounts
      const staffAccountsRef = collection(db, 'staff accounts');
      const querySnapshot = await getDocs(staffAccountsRef);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      addTestResult('List All Users', true, users, `Found ${users.length} users`);
      console.log('All users:', users);
    } catch (error) {
      addTestResult('List All Users', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
    
    setIsLoading(false);
  };

  const testAuthentication = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      addTestResult('Testing staff_accounts authentication...', true);

      const result = await authService.authenticateUser(email, password);

      if (result.success && result.user) {
        addTestResult('Staff Authentication', true, {
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          department: result.user.department,
          phone: result.user.phone,
          address: result.user.address,
          isActive: result.user.isActive
        });
        Alert.alert('Success!', `Logged in as ${result.user.name} (${result.user.role})`);
        console.log('✅ Staff authentication successful:', result.user);
      } else {
        addTestResult('Staff Authentication', false, null, result.error);
        Alert.alert('Login Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      addTestResult('Staff Authentication', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
    
    setIsLoading(false);
  };

  const testSpecificUser = async () => {
    setIsLoading(true);
    const targetUserId = 'VPPtbGl8WhMicZURHOgQ9BUzJd02';
    const targetEmail = 'test@exam.com';
    
    try {
      addTestResult('Testing Shaun Ducker user...', true);
      
      // Use the new test utility
      const results = await testUserAuthentication(targetUserId, targetEmail);
      
      if (results.userFoundById || results.userFoundByEmail) {
        addTestResult('✅ Shaun Ducker User Found', true, results.userData);
        
        if (results.userData) {
          // Test authentication with common passwords
          const commonPasswords = ['password123', 'admin123', 'test123', 'password', '123456', 'admin', 'test', 'qwerty'];
          
          for (const testPassword of commonPasswords) {
            try {
              const loginResult = await testLogin(targetEmail, testPassword);
              if (loginResult.success) {
                addTestResult('🎉 LOGIN SUCCESS!', true, { 
                  password: testPassword, 
                  user: loginResult.user 
                });
                Alert.alert('Success!', `Login successful with password: "${testPassword}"`);
                setPassword(testPassword); // Set the working password
                setIsLoading(false);
                return;
              }
            } catch (error) {
              // Continue to next password
            }
          }
          
          addTestResult('Password Test Failed', false, null, 'None of the common passwords worked. You may need to set/reset the password.');
        }
      } else {
        addTestResult('❌ Shaun Ducker User Not Found', false, null, 'User not found by ID or email');
        
        // Show all users for debugging
        if (results.allUsers.length > 0) {
          addTestResult('Available Users', true, results.allUsers, `Found ${results.allUsers.length} users in database`);
        }
      }
      
      if (results.errors.length > 0) {
        addTestResult('Errors During Test', false, results.errors);
      }
      
    } catch (error) {
      addTestResult('Specific User Test Error', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showResultDetails = (result: any) => {
    const details = [
      `Test: ${result.test}`,
      `Status: ${result.success ? '✅ Success' : '❌ Failed'}`,
      `Time: ${new Date(result.timestamp).toLocaleTimeString()}`,
    ];

    if (result.error) {
      details.push(`Error: ${result.error}`);
    }

    if (result.data) {
      details.push(`Data: ${JSON.stringify(result.data, null, 2)}`);
    }

    Alert.alert('Test Result Details', details.join('\n\n'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>User Authentication Test</Text>
        <Text style={styles.subtitle}>Test Firebase user authentication and data</Text>

        {/* User Details Card */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>Production Firebase - Staff Accounts</Text>
          <Text style={styles.userInfo}>
            <Text style={styles.bold}>Environment:</Text> Production (Live Firebase){'\n'}
            <Text style={styles.bold}>Collection:</Text> staff_accounts{'\n'}
            <Text style={styles.bold}>Email:</Text> shaun@siamoon.com{'\n'}
            <Text style={styles.bold}>Password:</Text> admin123{'\n'}
            <Text style={styles.bold}>Role:</Text> admin{'\n'}
            <Text style={styles.bold}>Name:</Text> Shaun Ducker{'\n'}
            <Text style={styles.bold}>Phone:</Text> 0933880630
          </Text>
          <Text style={[styles.userInfo, { marginTop: 10, fontSize: 12, color: NeumorphicTheme.colors.text.tertiary }]}>
            Alternative: test@exam.com / password123 (staff role)
          </Text>
        </Card>

        {/* Test Login Card */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>Test Login</Text>
          
          <Text style={styles.inputLabel}>Email:</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.inputLabel}>Password:</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testAuthentication}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Login</Text>
          </TouchableOpacity>
        </Card>

        {/* Firebase Tests Card */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>Firebase Tests</Text>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testFirebaseConnection}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Firebase Production</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testFindUserById}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Find User by ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testFindUserByEmail}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Find User by Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testListAllUsers}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>List All Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, isLoading && styles.disabledButton]}
            onPress={testSpecificUser}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test Specific User</Text>
          </TouchableOpacity>

          {testResults.length > 0 && (
            <TouchableOpacity
              style={[styles.testButton, styles.clearButton]}
              onPress={clearResults}
            >
              <Text style={[styles.testButtonText, styles.clearButtonText]}>Clear Results</Text>
            </TouchableOpacity>
          )}
        </Card>

        {testResults.length > 0 && (
          <Card style={styles.resultsCard}>
            <Text style={styles.cardTitle}>Test Results</Text>
            {testResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={[
                  styles.resultItem,
                  result.success ? styles.successResult : styles.errorResult
                ]}
                onPress={() => showResultDetails(result)}
              >
                <Text style={styles.resultText}>
                  {result.success ? '✅' : '❌'} {result.test}
                </Text>
                <Text style={styles.resultTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
                {result.error && (
                  <Text style={styles.resultError} numberOfLines={2}>
                    {result.error}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>What This Tests</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Find by ID:</Text> Searches for the exact user document{'\n'}
            • <Text style={styles.bold}>Find by Email:</Text> Queries users by email address{'\n'}
            • <Text style={styles.bold}>List All:</Text> Shows all users in the collection{'\n'}
            • <Text style={styles.bold}>Test Login:</Text> Attempts to authenticate with email/password
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphicTheme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: NeumorphicTheme.spacing[4],
    paddingBottom: NeumorphicTheme.spacing[8],
  },
  title: {
    fontSize: NeumorphicTheme.typography.sizes['2xl'].fontSize,
    fontWeight: NeumorphicTheme.typography.weights.bold,
    color: NeumorphicTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: NeumorphicTheme.spacing[2],
  },
  subtitle: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: NeumorphicTheme.spacing[6],
  },
  testCard: {
    padding: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[4],
  },
  resultsCard: {
    padding: NeumorphicTheme.spacing[4],
    marginBottom: NeumorphicTheme.spacing[4],
  },
  infoCard: {
    padding: NeumorphicTheme.spacing[4],
    backgroundColor: NeumorphicTheme.colors.background.tertiary,
  },
  cardTitle: {
    fontSize: NeumorphicTheme.typography.sizes.lg.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[4],
  },
  userInfo: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.text.primary,
    marginBottom: NeumorphicTheme.spacing[2],
    marginTop: NeumorphicTheme.spacing[2],
  },
  textInput: {
    borderWidth: 1,
    borderColor: NeumorphicTheme.colors.background.tertiary,
    borderRadius: NeumorphicTheme.borderRadius.md,
    padding: NeumorphicTheme.spacing[3],
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    color: NeumorphicTheme.colors.text.primary,
    backgroundColor: NeumorphicTheme.colors.background.secondary,
    marginBottom: NeumorphicTheme.spacing[3],
  },
  testButton: {
    backgroundColor: NeumorphicTheme.colors.brand.primary,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    padding: NeumorphicTheme.spacing[3],
    marginBottom: NeumorphicTheme.spacing[3],
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: NeumorphicTheme.colors.semantic.warning,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },
  clearButtonText: {
    color: '#ffffff',
  },
  resultItem: {
    padding: NeumorphicTheme.spacing[3],
    borderRadius: NeumorphicTheme.borderRadius.md,
    marginBottom: NeumorphicTheme.spacing[2],
    borderLeftWidth: 4,
  },
  successResult: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.success}10`,
    borderLeftColor: NeumorphicTheme.colors.semantic.success,
  },
  errorResult: {
    backgroundColor: `${NeumorphicTheme.colors.semantic.error}10`,
    borderLeftColor: NeumorphicTheme.colors.semantic.error,
  },
  resultText: {
    fontSize: NeumorphicTheme.typography.sizes.base.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
    color: NeumorphicTheme.colors.text.primary,
  },
  resultTime: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
    marginTop: NeumorphicTheme.spacing[1],
  },
  resultError: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.semantic.error,
    marginTop: NeumorphicTheme.spacing[1],
  },
  infoText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    color: NeumorphicTheme.colors.text.secondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: NeumorphicTheme.typography.weights.semibold,
    color: NeumorphicTheme.colors.text.primary,
  },
});
