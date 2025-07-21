/**
 * Mobile App Design System
 * Consistent theming, colors, typography, and component patterns
 * Use this for ALL new components, pages, tabs, popups, and modals
 */

import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ===== COLOR PALETTE =====
export const colors = {
  // Primary backgrounds
  primary: '#0B0F1A',           // Main app background
  secondary: '#1A1F2E',         // Cards, modals, containers
  tertiary: '#252A3A',          // Elevated elements, gradients
  
  // Accent colors
  accent: '#C6FF00',            // Primary accent (neon green)
  accentSecondary: '#00E5FF',   // Secondary accent (cyan)
  accentTertiary: '#FF6B35',    // Tertiary accent (orange)
  accentQuaternary: '#9C27B0',  // Quaternary accent (purple)
  
  // Text colors
  textPrimary: '#FFFFFF',       // Main text
  textSecondary: '#C1C9D6',     // Secondary text
  textMuted: '#8A92A6',         // Muted text, placeholders
  textDisabled: '#5A6B7A',      // Disabled states
  
  // Border colors
  border: '#2A3A4A',            // Subtle borders
  borderAccent: '#C6FF00',      // Accent borders
  borderDark: '#1A1F2E',        // Dark borders
  
  // Status colors
  success: '#10B981',           // Success states
  warning: '#F59E0B',           // Warning states
  error: '#EF4444',             // Error states
  info: '#00E5FF',              // Info states
  
  // Overlay colors
  overlay: 'rgba(11, 15, 26, 0.9)',
  overlayLight: 'rgba(11, 15, 26, 0.7)',
  
  // Component specific
  cardBackground: '#1A1F2E',
  buttonPrimary: '#C6FF00',
  buttonSecondary: '#2A3A4A',
  inputBackground: '#252A3A',
  inputBorder: '#2A3A4A',
} as const;

// ===== GRADIENTS =====
export const gradients = {
  primary: ['#0B0F1A', '#1A1F2E'],
  secondary: ['#1A1F2E', '#252A3A'],
  accent: ['#C6FF00', '#8BC34A'],
  accentSecondary: ['#00E5FF', '#0091EA'],
  accentTertiary: ['#FF6B35', '#F7931E'],
  accentQuaternary: ['#9C27B0', '#673AB7'],
  overlay: ['rgba(11, 15, 26, 0.9)', 'rgba(26, 31, 46, 0.8)'],
} as const;

// ===== TYPOGRAPHY =====
export const typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  
  // Body text
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Labels and captions
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  
  // Button text
  buttonPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  buttonSecondary: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
} as const;

// ===== SPACING =====
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  massive: 40,
} as const;

// ===== BORDER RADIUS =====
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const;

// ===== COMMON COMPONENT STYLES =====
export const componentStyles = StyleSheet.create({
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  
  contentContainer: {
    flex: 1,
    padding: spacing.xl,
  },
  
  // Cards
  card: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  cardElevated: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Modals
  modalContainer: {
    margin: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  
  modalGradient: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  
  modalContent: {
    padding: spacing.xxl,
  },
  
  // Headers
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  
  headerIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.secondary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  headerTextContainer: {
    flex: 1,
  },
  
  closeButton: {
    padding: spacing.sm,
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  buttonSecondary: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  buttonDisabled: {
    backgroundColor: colors.buttonSecondary,
    opacity: 0.5,
  },
  
  // Input fields
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: colors.accent,
  },
  
  // Lists
  listItem: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Chips/Tags
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  
  chipPrimary: {
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
    borderColor: colors.accent,
  },
  
  chipSecondary: {
    backgroundColor: colors.buttonSecondary,
    borderColor: colors.border,
  },
});

// ===== ICON SIZES =====
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  massive: 64,
} as const;

// ===== ANIMATION DURATIONS =====
export const animations = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// ===== SCREEN DIMENSIONS =====
export const dimensions = {
  screenWidth,
  screenHeight,
  isSmallScreen: screenWidth < 375,
  isMediumScreen: screenWidth >= 375 && screenWidth < 414,
  isLargeScreen: screenWidth >= 414,
} as const;

// ===== COMPONENT PATTERNS =====
export const patterns = {
  // Standard modal structure
  createModalStyles: (additionalStyles?: any) => StyleSheet.create({
    container: {
      ...componentStyles.modalContainer,
      ...additionalStyles?.container,
    },
    gradient: {
      ...componentStyles.modalGradient,
      ...additionalStyles?.gradient,
    },
    content: {
      ...componentStyles.modalContent,
      ...additionalStyles?.content,
    },
    header: {
      ...componentStyles.modalHeader,
      ...additionalStyles?.header,
    },
    iconContainer: {
      ...componentStyles.headerIconContainer,
      ...additionalStyles?.iconContainer,
    },
    headerText: {
      ...componentStyles.headerTextContainer,
      ...additionalStyles?.headerText,
    },
    title: {
      ...typography.h4,
      marginBottom: 4,
      ...additionalStyles?.title,
    },
    subtitle: {
      ...typography.caption,
      ...additionalStyles?.subtitle,
    },
    closeButton: {
      ...componentStyles.closeButton,
      ...additionalStyles?.closeButton,
    },
  }),
  
  // Standard button row
  createButtonRowStyles: (additionalStyles?: any) => StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
      ...additionalStyles?.container,
    },
    primaryButton: {
      ...componentStyles.buttonPrimary,
      flex: 1,
      ...additionalStyles?.primaryButton,
    },
    secondaryButton: {
      ...componentStyles.buttonSecondary,
      flex: 1,
      ...additionalStyles?.secondaryButton,
    },
  }),
} as const;

export default {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  componentStyles,
  iconSizes,
  animations,
  dimensions,
  patterns,
};
