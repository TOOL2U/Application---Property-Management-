import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Notification } from 'expo-notifications';
import { X, Bell } from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';

interface NotificationBannerProps {
  notification: Notification;
  onDismiss: () => void;
  onPress?: () => void;
}

export default function NotificationBanner({ 
  notification, 
  onDismiss, 
  onPress 
}: NotificationBannerProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [fadeAnim] = useState(new Animated.Value(0));
  const { colors, Typography, Spacing, BorderRadius, Shadows } = useDesignTokens();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: Spacing.mobile.screenPadding,
      right: Spacing.mobile.screenPadding,
      zIndex: 1000,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing[4],
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      ...Shadows.default,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.default,
      backgroundColor: `${colors.primary}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing[3],
    },
    textContainer: {
      flex: 1,
      marginRight: Spacing[2],
    },
    title: {
      ...Typography.sizes.base,
      fontWeight: Typography.weights.semibold,
      color: colors.text.primary,
      marginBottom: Spacing[1],
    },
    body: {
      ...Typography.sizes.sm,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    dismissButton: {
      padding: Spacing[1],
    },
  });

  useEffect(() => {
    // Slide down and fade in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    handleDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Bell size={20} color={colors.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.request.content.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.request.content.body}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleDismiss} 
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
