/**
 * Logout Overlay Component - Brand Kit Style
 * Provides smooth animations during logout/profile switching process
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandTheme } from '@/constants/BrandTheme';

interface LogoutOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LogoutOverlay({ 
  visible, 
  message = 'Signing out...' 
}: LogoutOverlayProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(20, 22, 26, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(20, 22, 26, 0.95)" />

      {/* Logout Content */}
      <View
        style={{
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Icon Container */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 16, // Modern rounded modal
            backgroundColor: BrandTheme.colors.SURFACE_1,
            borderWidth: 2,
            borderColor: BrandTheme.colors.YELLOW,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="log-out-outline" size={32} color={BrandTheme.colors.YELLOW} />
        </View>

        {/* Loading Spinner */}
        <ActivityIndicator 
          size="large" 
          color={BrandTheme.colors.YELLOW}
          style={{ marginBottom: 16 }}
        />

        {/* Message */}
        <Text
          style={{
            color: BrandTheme.colors.TEXT_PRIMARY,
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: BrandTheme.typography.fontFamily.primary,
          }}
        >
          {message}
        </Text>

        <Text
          style={{
            color: BrandTheme.colors.TEXT_SECONDARY,
            fontSize: 14,
            textAlign: 'center',
            fontFamily: BrandTheme.typography.fontFamily.regular,
          }}
        >
          Returning to profile selection...
        </Text>

        {/* Animated Dots */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 24,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 16, // Modern rounded modal
                backgroundColor: BrandTheme.colors.YELLOW,
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      </View>

      {/* Bottom Branding */}
      <View
        style={{
          position: 'absolute',
          bottom: 60,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: BrandTheme.colors.TEXT_SECONDARY,
            fontSize: 12,
            fontFamily: BrandTheme.typography.fontFamily.regular,
          }}
        >
          Sia Moon Property Management
        </Text>
      </View>
    </View>
  );
}
