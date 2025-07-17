/**
 * Staff Profile Debug Component
 * Add this to your app to verify staff profiles are loading correctly
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { staffSyncService } from '@/services/staffSyncService';

export const StaffProfileDebugComponent: React.FC = () => {
  const { staffProfiles, isLoading, error } = usePINAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Update debug info whenever staff profiles change
    const info = `
Last Updated: ${lastUpdate.toLocaleTimeString()}
Loading: ${isLoading}
Error: ${error || 'None'}
Staff Count: ${staffProfiles.length}

Staff Profiles:
${staffProfiles.map((profile, index) => `
${index + 1}. ${profile.name}
   ID: ${profile.id}
   Email: ${profile.email}
   Role: ${profile.role}
   Active: ${profile.isActive}
   Department: ${profile.department}
`).join('')}
    `;
    setDebugInfo(info);
    setLastUpdate(new Date());
  }, [staffProfiles, isLoading, error]);

  const testDirectSync = async () => {
    try {
      console.log('🧪 Testing direct staff sync...');
      const syncResponse = await staffSyncService.fetchStaffProfiles(false);
      
      Alert.alert(
        'Direct Sync Test',
        `Success: ${syncResponse.success}\nProfiles: ${syncResponse.profiles.length}\nError: ${syncResponse.error || 'None'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={{ 
      position: 'absolute', 
      top: 50, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      padding: 10, 
      borderRadius: 5,
      maxWidth: 300,
      maxHeight: 400,
      zIndex: 1000
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 10 }}>
        Staff Debug Info
      </Text>
      
      <TouchableOpacity 
        onPress={testDirectSync}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 10 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test Direct Sync
        </Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 300 }}>
        <Text style={{ 
          color: 'white', 
          fontSize: 10, 
          fontFamily: 'monospace' 
        }}>
          {debugInfo}
        </Text>
      </ScrollView>
    </View>
  );
};

export default StaffProfileDebugComponent;
