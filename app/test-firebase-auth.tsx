/**
 * Firebase Authentication Test Component
 * Comprehensive testing of Firebase Auth initialization and functionality
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { auth, db, rtdb, storage, performFirebaseHealthCheck } from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestFirebaseAuth() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    // Monitor auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      console.log('🔐 Auth state changed:', user ? 'Signed in' : 'Signed out');
    });

    return () => unsubscribe();
  }, []);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runFirebaseTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Firebase App Initialization
    addTestResult({
      name: 'Firebase App Initialization',
      status: 'pending',
      message: 'Testing Firebase app...'
    });

    try {
      if (auth && auth.app) {
        addTestResult({
          name: 'Firebase App Initialization',
          status: 'success',
          message: `App initialized: ${auth.app.name}`,
          details: {
            projectId: auth.app.options.projectId,
            authDomain: auth.app.options.authDomain,
          }
        });
      } else {
        throw new Error('Firebase app not initialized');
      }
    } catch (error) {
      addTestResult({
        name: 'Firebase App Initialization',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Firebase Auth Service
    addTestResult({
      name: 'Firebase Auth Service',
      status: 'pending',
      message: 'Testing Auth service...'
    });

    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        addTestResult({
          name: 'Firebase Auth Service',
          status: 'success',
          message: 'Auth service is functional',
          details: {
            currentUser: auth.currentUser ? 'Signed in' : 'Not signed in',
            platform: Platform.OS
          }
        });
      } else {
        throw new Error('Auth service not available');
      }
    } catch (error) {
      addTestResult({
        name: 'Firebase Auth Service',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Anonymous Sign In
    addTestResult({
      name: 'Anonymous Authentication',
      status: 'pending',
      message: 'Testing anonymous sign in...'
    });

    try {
      const userCredential = await signInAnonymously(auth);
      addTestResult({
        name: 'Anonymous Authentication',
        status: 'success',
        message: 'Anonymous sign in successful',
        details: {
          uid: userCredential.user.uid,
          isAnonymous: userCredential.user.isAnonymous
        }
      });
    } catch (error) {
      addTestResult({
        name: 'Anonymous Authentication',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Firestore Connection
    addTestResult({
      name: 'Firestore Connection',
      status: 'pending',
      message: 'Testing Firestore...'
    });

    try {
      if (db) {
        addTestResult({
          name: 'Firestore Connection',
          status: 'success',
          message: 'Firestore initialized successfully',
          details: {
            app: db.app.name,
            type: 'Firestore'
          }
        });
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (error) {
      addTestResult({
        name: 'Firestore Connection',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Health Check
    addTestResult({
      name: 'Firebase Health Check',
      status: 'pending',
      message: 'Running comprehensive health check...'
    });

    try {
      const isHealthy = await performFirebaseHealthCheck();
      addTestResult({
        name: 'Firebase Health Check',
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'All services healthy' : 'Some services unhealthy',
        details: {
          auth: !!auth,
          firestore: !!db,
          realtimeDb: !!rtdb,
          storage: !!storage
        }
      });
    } catch (error) {
      addTestResult({
        name: 'Firebase Health Check',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setIsRunning(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sign out failed');
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0a0a' }}>
      <StatusBar style="light" />
      
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="mb-8">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              🔥 Firebase Auth Test
            </Text>
            <Text className="text-gray-300 text-center">
              Comprehensive Firebase authentication testing
            </Text>
          </View>

          {/* Auth Status */}
          <View className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <Text className="text-white text-lg font-semibold mb-2">
              Authentication Status
            </Text>
            <Text className="text-gray-300">
              User: {authUser ? `${authUser.uid} (${authUser.isAnonymous ? 'Anonymous' : 'Authenticated'})` : 'Not signed in'}
            </Text>
            <Text className="text-gray-300">
              Platform: {Platform.OS}
            </Text>
          </View>

          {/* Test Controls */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={runFirebaseTests}
              disabled={isRunning}
              className="flex-1 bg-purple-500 p-4 rounded-2xl"
              style={{ opacity: isRunning ? 0.6 : 1 }}
            >
              <Text className="text-white text-center font-semibold">
                {isRunning ? 'Running Tests...' : 'Run Firebase Tests'}
              </Text>
            </TouchableOpacity>

            {authUser && (
              <TouchableOpacity
                onPress={handleSignOut}
                className="bg-red-500 p-4 rounded-2xl"
              >
                <Text className="text-white text-center font-semibold">
                  Sign Out
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Test Results */}
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">
              Test Results ({testResults.length})
            </Text>
            
            {testResults.map((result, index) => (
              <View 
                key={index} 
                className="mb-3 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">
                    {getStatusIcon(result.status)}
                  </Text>
                  <Text className="text-white font-semibold flex-1">
                    {result.name}
                  </Text>
                  <View 
                    className="px-2 py-1 rounded-lg"
                    style={{ backgroundColor: `${getStatusColor(result.status)}20` }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: getStatusColor(result.status) }}
                    >
                      {result.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-gray-300 text-sm mb-2">
                  {result.message}
                </Text>
                
                {result.details && (
                  <View className="bg-black/30 p-2 rounded-lg">
                    <Text className="text-gray-400 text-xs font-mono">
                      {JSON.stringify(result.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {testResults.length === 0 && (
              <View className="p-8 bg-white/5 rounded-xl border border-white/10 items-center">
                <Text className="text-gray-400 text-center">
                  No tests run yet. Click "Run Firebase Tests" to start.
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
