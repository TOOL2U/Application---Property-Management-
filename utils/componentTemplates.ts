/**
 * Component Creation Templates
 * Use these templates for all new components to ensure design consistency
 */

// ===== MODAL COMPONENT TEMPLATE =====
export const MODAL_TEMPLATE = `
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, patterns } from '@/utils/designSystem';

interface YourModalProps {
  visible: boolean;
  onDismiss: () => void;
  // Add your specific props here
}

export const YourModal: React.FC<YourModalProps> = ({
  visible,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(false);
  
  // Create modal styles using the design system
  const styles = patterns.createModalStyles();
  const buttonStyles = patterns.createButtonRowStyles();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <LinearGradient colors={gradients.primary} style={styles.gradient}>
          <SafeAreaView style={styles.gradient}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="your-icon" size={24} color={colors.accent} />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title}>Your Modal Title</Text>
                    <Text style={styles.subtitle}>Subtitle here</Text>
                  </View>
                  <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Your content goes here */}
                
                {/* Action Buttons */}
                <View style={buttonStyles.container}>
                  <TouchableOpacity
                    onPress={onDismiss}
                    style={buttonStyles.secondaryButton}
                    disabled={loading}
                  >
                    <Text style={{ ...typography.buttonSecondary }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {/* Your action */}}
                    style={buttonStyles.primaryButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={{ ...typography.buttonPrimary }}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </Portal>
  );
};
`;

// ===== TAB SCREEN TEMPLATE =====
export const TAB_SCREEN_TEMPLATE = `
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, componentStyles, spacing } from '@/utils/designSystem';

export default function YourTabScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Your refresh logic here
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={componentStyles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={typography.h2}>Your Screen Title</Text>
              <Text style={styles.headerSubtitle}>Screen description</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={refreshing ? colors.textMuted : colors.accent} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={componentStyles.contentContainer}>
          {/* Your content goes here */}
          <View style={componentStyles.card}>
            <Text style={typography.h5}>Card Title</Text>
            <Text style={typography.body2}>Card content</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    gap: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.accent,
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollContainer: {
    flex: 1,
  },
};
`;

// ===== CARD COMPONENT TEMPLATE =====
export const CARD_COMPONENT_TEMPLATE = `
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, componentStyles, spacing } from '@/utils/designSystem';

interface YourCardProps {
  title: string;
  description?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  // Add your specific props here
}

export const YourCard: React.FC<YourCardProps> = ({
  title,
  description,
  onPress,
  icon,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent onPress={onPress} style={componentStyles.card}>
      <View style={styles.cardHeader}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={colors.accent} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={typography.h6}>{title}</Text>
          {description && (
            <Text style={typography.body2}>{description}</Text>
          )}
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </CardComponent>
  );
};

const styles = {
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: \`rgba(\${colors.accent.slice(1)}, 0.1)\`,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
};
`;

// ===== DESIGN CHECKLIST =====
export const DESIGN_CHECKLIST = `
# Design System Checklist for New Components

## ✅ Colors
- [ ] Use colors from designSystem.ts (colors.primary, colors.accent, etc.)
- [ ] No hardcoded hex colors or Tailwind classes
- [ ] Consistent text colors (textPrimary, textSecondary, textMuted)
- [ ] Proper background colors (primary, secondary, tertiary)

## ✅ Gradients
- [ ] Use predefined gradients (gradients.primary, gradients.accent, etc.)
- [ ] LinearGradient for backgrounds and elevated elements

## ✅ Typography
- [ ] Use typography styles (typography.h1-h6, body1, body2, etc.)
- [ ] Consistent font weights and sizes
- [ ] Proper line heights for readability

## ✅ Spacing
- [ ] Use spacing constants (spacing.xs, spacing.sm, etc.)
- [ ] Consistent padding and margins
- [ ] Proper gaps between elements

## ✅ Border Radius
- [ ] Use borderRadius constants (borderRadius.sm, borderRadius.lg, etc.)
- [ ] Consistent rounded corners

## ✅ Icons
- [ ] Use Ionicons for consistency
- [ ] Use iconSizes constants
- [ ] Proper icon colors matching theme

## ✅ Components
- [ ] Use componentStyles for common patterns
- [ ] Modal structure follows standard pattern
- [ ] Buttons use standard styles
- [ ] Cards use consistent styling

## ✅ Layout
- [ ] SafeAreaView for screen-level components
- [ ] Proper ScrollView with RefreshControl
- [ ] StatusBar with light-content and dark background
- [ ] LinearGradient backgrounds

## ✅ Interactions
- [ ] Loading states with ActivityIndicator
- [ ] Disabled states properly styled
- [ ] Proper touch feedback (activeOpacity)
- [ ] Error handling and display

## ✅ Accessibility
- [ ] Proper contrast ratios
- [ ] Meaningful text content
- [ ] Touch targets at least 44px
- [ ] Screen reader friendly
`;

export default {
  MODAL_TEMPLATE,
  TAB_SCREEN_TEMPLATE,
  CARD_COMPONENT_TEMPLATE,
  DESIGN_CHECKLIST,
};
