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
          backgroundColor: 'rgba(245, 158, 11, 0.2)',  // Dark theme compatible
          textColor: '#f59e0b',
        };
      case 'in_progress':
        return {
          text: 'In Progress',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',  // Dark theme compatible
          textColor: '#3b82f6',
        };
      case 'completed':
        return {
          text: 'Completed',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',   // Dark theme compatible
          textColor: '#22c55e',
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',   // Dark theme compatible
          textColor: '#ef4444',
        };
      default:
        return {
          text: status,
          backgroundColor: 'rgba(107, 114, 128, 0.2)',  // Dark theme compatible
          textColor: '#9ca3af',
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
