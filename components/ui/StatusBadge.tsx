import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_started':
        return {
          text: 'Not Started',
          backgroundColor: '#fef3c7',
          textColor: '#d97706',
        };
      case 'in_progress':
        return {
          text: 'In Progress',
          backgroundColor: '#dbeafe',
          textColor: '#2563eb',
        };
      case 'completed':
        return {
          text: 'Completed',
          backgroundColor: '#dcfce7',
          textColor: '#16a34a',
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          backgroundColor: '#fee2e2',
          textColor: '#dc2626',
        };
      default:
        return {
          text: status,
          backgroundColor: '#f3f4f6',
          textColor: '#6b7280',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: config.backgroundColor },
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: config.textColor },
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
