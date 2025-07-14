/**
 * Villa Property Management - Design System
 * Matches the Linear-inspired brand identity from the web application
 */

// =============================================================================
// COLORS - Dark-first premium design system
// =============================================================================

export const Colors = {
  // Primary Purple (Linear-inspired)
  primary: '#8b5cf6',
  primaryHover: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#a78bfa',

  // Grayscale (Dark-first)
  black: '#000000',
  background: '#0a0a0a',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1a1a1a',
  cardBackground: '#111111',

  // Neutral Scale
  neutral950: '#0a0a0a',
  neutral900: '#111111',
  neutral850: '#1a1a1a',
  neutral800: '#1f1f1f',
  neutral700: '#2a2a2a',
  neutral600: '#404040',
  neutral500: '#525252',
  neutral400: '#737373',
  neutral300: '#a3a3a3',
  neutral200: '#d4d4d4',
  neutral100: '#e5e5e5',
  neutral50: '#f5f5f5',
  white: '#ffffff',

  // Semantic Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Borders
  borderDefault: '#262626',
  borderLight: '#333333',
  borderStrong: '#404040',

  // Gradients (for use in LinearGradient components)
  gradients: {
    primary: ['#8b5cf6', '#7c3aed'],
    background: ['#0a0a0a', '#1a1a1a'],
    card: ['#111111', '#1a1a1a'],
    text: ['#ffffff', '#a3a3a3'],
  },
} as const;

// =============================================================================
// TYPOGRAPHY - Inter font with Linear-style spacing
// =============================================================================

export const Typography = {
  // Font Family
  fontFamily: {
    primary: 'Inter',
    fallback: '-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
  },

  // Font Features (for web)
  fontFeatures: "'cv02', 'cv03', 'cv04', 'cv11'",
  fontVariant: 'tabular-nums',

  // Typography Scale
  sizes: {
    xs: { fontSize: 12, lineHeight: 16, letterSpacing: 0.025 },
    sm: { fontSize: 14, lineHeight: 20, letterSpacing: 0.025 },
    base: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
    lg: { fontSize: 18, lineHeight: 28, letterSpacing: -0.025 },
    xl: { fontSize: 20, lineHeight: 28, letterSpacing: -0.025 },
    '2xl': { fontSize: 24, lineHeight: 32, letterSpacing: -0.025 },
    '3xl': { fontSize: 30, lineHeight: 36, letterSpacing: -0.025 },
    '4xl': { fontSize: 36, lineHeight: 40, letterSpacing: -0.025 },
    '5xl': { fontSize: 48, lineHeight: 52, letterSpacing: -0.025 },
  },

  // Font Weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// =============================================================================
// SPACING - 8px base grid system
// =============================================================================

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const BorderRadius = {
  small: 4,
  default: 8,
  medium: 12,
  large: 16,
  xl: 24,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS - Premium depth system
// =============================================================================

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8, // Android
  },
  button: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 12,
  },
  focus: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
} as const;

// =============================================================================
// ANIMATION - Linear-inspired easing and timing
// =============================================================================

export const Animation = {
  // Easing
  easing: {
    default: [0.25, 0.46, 0.45, 0.94], // cubic-bezier
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
  },

  // Duration
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Common transforms
  transforms: {
    hoverUp: { translateY: -2 },
    pressDown: { scale: 0.98 },
    slideUp: { translateY: 20 },
  },
} as const;

// =============================================================================
// TOUCH TARGETS - Mobile-optimized sizes
// =============================================================================

export const TouchTargets = {
  minimum: 44,
  recommended: 48,
  spacing: 8,
} as const;

// =============================================================================
// COMPONENT DIMENSIONS
// =============================================================================

export const Dimensions = {
  // Navigation
  tabBarHeight: 54,
  topNavHeight: 44,
  
  // Cards
  cardPadding: 24,
  cardMinHeight: 120,
  
  // Inputs
  inputHeight: 44,
  inputPadding: 16,
  
  // Buttons
  buttonHeight: 48,
  buttonPadding: 24,
  
  // Modal
  modalBorderRadius: 16,
  sheetHandle: { width: 32, height: 4 },
} as const;

// =============================================================================
// ICON SIZES - Lucide React compatible
// =============================================================================

export const IconSizes = {
  xs: 12,
  sm: 16,
  base: 20,
  lg: 24,
  xl: 32,
} as const;

// =============================================================================
// OPACITY LEVELS
// =============================================================================

export const Opacity = {
  disabled: 0.4,
  secondary: 0.6,
  overlay: 0.8,
  backdrop: 0.5,
} as const;

// =============================================================================
// BREAKPOINTS (for responsive design)
// =============================================================================

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  TouchTargets,
  Dimensions,
  IconSizes,
  Opacity,
  Breakpoints,
};
