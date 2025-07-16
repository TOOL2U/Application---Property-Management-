/**
 * Bookings Tab Screen
 * Shows all bookings for admin users, restricted access for staff
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AllBookingsView from '@/components/admin/AllBookingsView';

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <AllBookingsView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
