/**
 * Assign Staff Tab Screen
 * Allows admin users to assign staff to jobs, restricted access for staff
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AssignStaffView from '@/components/admin/AssignStaffView';

export default function AssignStaffScreen() {
  return (
    <View style={styles.container}>
      <AssignStaffView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
