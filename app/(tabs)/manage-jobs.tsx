/**
 * Manage Jobs Tab Screen
 * Allows admin users to create and manage all jobs, restricted access for staff
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ManageJobsView from '@/components/admin/ManageJobsView';

export default function ManageJobsScreen() {
  return (
    <View style={styles.container}>
      <ManageJobsView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
