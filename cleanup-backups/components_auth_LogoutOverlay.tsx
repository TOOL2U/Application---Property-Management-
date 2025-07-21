/**
 * Logout Overlay Component - Beautiful AIS Telecom Style
 * Provides smooth fadeOut animations during logout process
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

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
    <Animatable.View
      animation="fadeIn"
      duration={600}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(11, 15, 26, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(11, 15, 26, 0.95)" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(11, 15, 26, 0.9)',
          'rgba(28, 31, 42, 0.9)',
          'rgba(11, 15, 26, 0.9)',
        ]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Logout Content */}
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        delay={200}
        style={{
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        {/* Icon Container */}
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={2000}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(198, 255, 0, 0.1)',
            borderWidth: 2,
            borderColor: '#C6FF00',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="log-out-outline" size={32} color="#C6FF00" />
        </Animatable.View>

        {/* Loading Spinner */}
        <ActivityIndicator 
          size="large" 
          color="#C6FF00" 
          style={{ marginBottom: 16 }}
        />

        {/* Message */}
        <Text
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'Urbanist',
          }}
        >
          {message}
        </Text>

        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 14,
            textAlign: 'center',
            fontFamily: 'Inter',
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
            <Animatable.View
              key={index}
              animation="fadeInOut"
              iterationCount="infinite"
              duration={1500}
              delay={index * 200}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#C6FF00',
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      </Animatable.View>

      {/* Bottom Branding */}
      <Animatable.View
        animation="fadeInUp"
        duration={600}
        delay={400}
        style={{
          position: 'absolute',
          bottom: 60,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: '#6B7280',
            fontSize: 12,
            fontFamily: 'Inter',
          }}
        >
          AIS Property Management
        </Text>
      </Animatable.View>
    </Animatable.View>
  );
}

// Custom animation definitions for smooth logout experience
const fadeInOut = {
  0: { opacity: 0.3 },
  0.5: { opacity: 1 },
  1: { opacity: 0.3 },
};

// Register custom animation
if (Animatable && Animatable.initializeRegistryWithDefinitions) {
  Animatable.initializeRegistryWithDefinitions({
    fadeInOut,
  });
}
