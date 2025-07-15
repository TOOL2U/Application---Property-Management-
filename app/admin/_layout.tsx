import React from 'react';
import { Stack } from 'expo-router';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { useDesignTokens } from '@/constants/Design';

const AdminLayoutContent = () => {
  const { loading } = useAdminAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading admin system...
        </Text>
      </View>
    );
  }

  // Only use design tokens after loading is complete
  const { Colors } = useDesignTokens();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
};

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent />
    </AdminAuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a', // Fallback background
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff', // Fallback text color
  },
});
