/**
 * Test Staff Setup Screen
 * Utility screen to add test staff profiles to Firestore
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { Users, Plus, Trash2, Database } from 'lucide-react-native';

import { addTestStaffProfiles, removeTestStaffProfiles } from '@/scripts/addTestStaffProfiles';

export default function TestStaffSetupScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleAddProfiles = async () => {
    try {
      setLoading(true);
      setStatus('Adding test staff profiles...');
      
      await addTestStaffProfiles();
      
      setStatus('✅ Test staff profiles added successfully!');
      Alert.alert(
        'Success',
        'Test staff profiles have been added to Firestore. You can now test the staff login system.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error adding profiles:', error);
      setStatus('❌ Failed to add test staff profiles');
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add test staff profiles',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfiles = async () => {
    Alert.alert(
      'Remove Test Profiles',
      'Are you sure you want to remove all test staff profiles? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setStatus('Removing test staff profiles...');
              
              await removeTestStaffProfiles();
              
              setStatus('✅ Test staff profiles removed successfully!');
              Alert.alert('Success', 'Test staff profiles have been removed from Firestore.');
            } catch (error) {
              console.error('❌ Error removing profiles:', error);
              setStatus('❌ Failed to remove test staff profiles');
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to remove test staff profiles'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const testProfiles = [
    { name: 'Sarah Johnson', role: 'admin', pin: '1234', department: 'Management' },
    { name: 'Mike Chen', role: 'manager', pin: '5678', department: 'Operations' },
    { name: 'Maria Rodriguez', role: 'cleaner', pin: '9876', department: 'Housekeeping' },
    { name: 'James Wilson', role: 'cleaner', pin: '5432', department: 'Housekeeping' },
    { name: 'David Kim', role: 'maintenance', pin: '1111', department: 'Maintenance' },
    { name: 'Lisa Thompson', role: 'staff', pin: '2222', department: 'General' }
  ];

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return '#ef4444';
      case 'manager': return '#8b5cf6';
      case 'cleaner': return '#10b981';
      case 'maintenance': return '#f59e0b';
      default: return '#6b7280';
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
        {/* Header */}
        <Animatable.View
          animation="slideInDown"
          duration={600}
          className="px-6 py-4"
        >
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl bg-purple-500/20 items-center justify-center mr-4">
              <Database size={24} color="#8b5cf6" />
            </View>
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight">
                Staff Setup
              </Text>
              <Text className="text-gray-400 text-base">
                Manage test staff profiles
              </Text>
            </View>
          </View>
        </Animatable.View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Action Buttons */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={200}
            className="mb-8"
          >
            <View className="flex-row gap-4 mb-4">
              <TouchableOpacity
                onPress={handleAddProfiles}
                disabled={loading}
                className="flex-1 overflow-hidden rounded-2xl border border-green-500/30"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  className="py-4 px-6"
                >
                  <View className="flex-row items-center justify-center">
                    {loading ? (
                      <Animatable.View animation="rotate" iterationCount="infinite">
                        <Ionicons name="refresh" size={20} color="white" />
                      </Animatable.View>
                    ) : (
                      <Plus size={20} color="white" />
                    )}
                    <Text className="text-white font-semibold ml-2">
                      Add Profiles
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRemoveProfiles}
                disabled={loading}
                className="flex-1 overflow-hidden rounded-2xl border border-red-500/30"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  className="py-4 px-6"
                >
                  <View className="flex-row items-center justify-center">
                    <Trash2 size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Remove All
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Status */}
            {status && (
              <Animatable.View
                animation="fadeIn"
                className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4"
              >
                <Text className="text-blue-400 text-center font-medium">
                  {status}
                </Text>
              </Animatable.View>
            )}
          </Animatable.View>

          {/* Test Profiles List */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={400}
            className="mb-8"
          >
            <Text className="text-white text-xl font-bold mb-4">
              Test Staff Profiles
            </Text>
            
            <View className="space-y-3">
              {testProfiles.map((profile, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeInUp"
                  duration={600}
                  delay={500 + index * 100}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-purple-500/20 items-center justify-center mr-4">
                      <Users size={20} color="#8b5cf6" />
                    </View>
                    
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-1">
                        {profile.name}
                      </Text>
                      <View className="flex-row items-center">
                        <View 
                          className="px-2 py-1 rounded-lg mr-2"
                          style={{ backgroundColor: `${getRoleColor(profile.role)}20` }}
                        >
                          <Text 
                            className="text-xs font-medium capitalize"
                            style={{ color: getRoleColor(profile.role) }}
                          >
                            {profile.role}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          {profile.department}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-end">
                      <Text className="text-gray-400 text-xs mb-1">PIN</Text>
                      <Text className="text-purple-400 font-mono font-bold">
                        {profile.pin}
                      </Text>
                    </View>
                  </View>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Instructions */}
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={800}
            className="mb-8"
          >
            <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <Text className="text-yellow-400 font-medium mb-2">
                📋 Instructions
              </Text>
              <Text className="text-gray-300 text-sm leading-5">
                1. Click "Add Profiles" to create test staff accounts in Firestore{'\n'}
                2. Use the shared login: staff@siamoon.com / staff123{'\n'}
                3. Select any staff profile and use their PIN to test the system{'\n'}
                4. Click "Remove All" to clean up test data when done
              </Text>
            </View>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
