/**
 * Villa Property Management - Mobile Design System
 * Dark Theme Compatible Design Tokens
 * Optimized for iPhone 15 (1179 x 2556 px) with webapp style consistency
 */

import { Dimensions } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================================================================
// DEVICE SPECIFICATIONS - iPhone 15 Optimized
// =============================================================================

export const Device = {
  screen: {
    width: screenWidth,
    height: screenHeight,
    isIPhone15: screenWidth === 393 && screenHeight === 852, // Logical pixels
  },
  safeArea: {
    top: 59, // Dynamic Island + status bar
    bottom: 34, // Home indicator
  },
} as const;

// =============================================================================
// TYPOGRAPHY - Inter Font System (theme-independent)
// =============================================================================

export const Typography = {
  // Font Family
  fontFamily: {
    primary: 'Inter',
    system: '-apple-system, BlinkMacSystemFont, SF Pro Display',
  },

  // Enhanced Mobile-Optimized Typography Scale
  sizes: {
    xs: { fontSize: 11, lineHeight: 16 },
    sm: { fontSize: 13, lineHeight: 18 },
    base: { fontSize: 15, lineHeight: 22 },
    lg: { fontSize: 17, lineHeight: 26 },
    xl: { fontSize: 19, lineHeight: 28 },
    '2xl': { fontSize: 22, lineHeight: 30 },
    '3xl': { fontSize: 26, lineHeight: 34 },
    '4xl': { fontSize: 30, lineHeight: 38 },
    '5xl': { fontSize: 36, lineHeight: 44 },
  },

  // Enhanced Font Weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Enhanced Letter Spacing (Linear-inspired)
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
  },

  // Text Styles for Common Use Cases
  styles: {
    heading: {
      fontWeight: '700',
      letterSpacing: -0.025,
    },
    subheading: {
      fontWeight: '600',
      letterSpacing: -0.015,
    },
    body: {
      fontWeight: '400',
      letterSpacing: 0,
    },
    caption: {
      fontWeight: '500',
      letterSpacing: 0.025,
    },
    label: {
      fontWeight: '600',
      letterSpacing: 0.015,
    },
  },
} as const;

// =============================================================================
// COLORS - Linear-inspired Dark-first Design System
// =============================================================================

export const Colors = {
  // Primary Neon Green (Property Management Theme)
  primary: '#C6FF00',
  primaryHover: '#A3E635',
  primaryDark: '#84CC16',
  primaryLight: '#D4FF3A',

  // Grayscale (Dark-first) - Updated backgrounds
  black: '#000000',
  background: '#0B0F1A',        // Primary background (deep navy-black)
  backgroundSecondary: '#1C1F2A', // Surface/card background (elevated surfaces)
  backgroundTertiary: '#1F2937',  // Secondary surfaces
  cardBackground: '#1C1F2A',      // Card background

  // Neutral Scale - Updated for new dark theme
  neutral950: '#0B0F1A',  // Primary background
  neutral900: '#111827',  // Secondary surface
  neutral850: '#1C1F2A',  // Elevated surface
  neutral800: '#1F2937',  // Tertiary surface
  neutral700: '#374151',  // Border color
  neutral600: '#4B5563',  // Disabled text
  neutral500: '#6B7280',  // Muted text
  neutral400: '#71717A',  // Tertiary text
  neutral300: '#A1A1AA',  // Secondary text
  neutral200: '#D1D5DB',  // Light gray
  neutral100: '#E5E7EB',  // Very light gray
  neutral50: '#F1F1F1',   // Primary text (soft white)
  white: '#ffffff',

  // Semantic Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Borders
  borderDefault: '#262626',
  borderLight: '#333333',
  borderStrong: '#404040',

  // Enhanced Gradients (for use in LinearGradient components) - Updated for neon green theme
  gradients: {
    primary: ['#C6FF00', '#A3E635', '#84CC16'],
    primarySubtle: ['rgba(198, 255, 0, 0.2)', 'rgba(163, 230, 53, 0.1)', 'rgba(132, 204, 22, 0.05)'],
    background: ['#0B0F1A', '#111827', '#1C1F2A'],
    card: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
    cardElevated: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)'],
    text: ['#F1F1F1', '#A1A1AA', '#71717A'],
    success: ['#22c55e', '#16a34a', '#15803d'],
    warning: ['#f59e0b', '#d97706', '#b45309'],
    error: ['#ef4444', '#dc2626', '#b91c1c'],
    neonGreen: ['rgba(198, 255, 0, 0.4)', 'rgba(163, 230, 53, 0.2)', 'rgba(132, 204, 22, 0.1)'],
    neonGreen: ['rgba(34, 197, 94, 0.4)', 'rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)'],
    neonBlue: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(29, 78, 216, 0.1)'],
    glassmorphism: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
  },

  // Neon Effects - Updated to use neon green as primary
  neon: {
    green: {
      color: '#C6FF00',
      glow: 'rgba(198, 255, 0, 0.6)',
      shadow: '0 0 20px rgba(198, 255, 0, 0.4)',
    },
    success: {
      color: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.6)',
      shadow: '0 0 20px rgba(34, 197, 94, 0.4)',
    },
    blue: {
      color: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.6)',
      shadow: '0 0 20px rgba(59, 130, 246, 0.4)',
    },
    orange: {
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.6)',
      shadow: '0 0 20px rgba(245, 158, 11, 0.4)',
    },
  },
} as const;

// =============================================================================
// SPACING - Mobile-First 4px Grid System (theme-independent)
// =============================================================================

export const Spacing = {
  0: 0,
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
  
  // Mobile-specific spacing
  mobile: {
    screenPadding: 16,
    cardPadding: 16,
    sectionSpacing: 24,
    itemSpacing: 12,
  },
} as const;

// =============================================================================
// BORDER RADIUS - Consistent with webapp (theme-independent)
// =============================================================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS - Static shadows for components (dark-optimized)
// =============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1.0,
    shadowRadius: 32,
    elevation: 16,
  },
  button: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  cardElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  focus: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  neonPurple: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
  neonGreen: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
  neonBlue: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// =============================================================================
// SHADOWS - Theme-aware elevation system (for advanced usage)
// =============================================================================

export const getShadows = (isDark: boolean) => ({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  default: {
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.4 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.5 : 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.6 : 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  notification: {
    shadowColor: isDark ? '#60a5fa' : '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});

// =============================================================================
// COMPONENT DIMENSIONS - Mobile Optimized (theme-independent)
// =============================================================================

export const ComponentDimensions = {
  // Touch Targets (iOS HIG compliant)
  touchTarget: {
    minimum: 44,
    recommended: 48,
    large: 56,
  },

  // Navigation
  tabBar: {
    height: 83, // 49 + safe area bottom
    iconSize: 24,
  },
  
  header: {
    height: 44,
    paddingHorizontal: 16,
  },

  // Cards and Components
  card: {
    minHeight: 80,
    padding: 16,
    borderRadius: 12,
  },

  // Form Elements
  input: {
    height: 48,
    padding: 16,
    borderRadius: 8,
  },

  button: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  // Modal and Overlays
  modal: {
    borderRadius: 16,
    maxWidth: screenWidth - 32,
    padding: 24,
  },

  // Job Cards (specific to our app)
  jobCard: {
    height: 120,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  // Status Indicators
  statusBadge: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
} as const;

// =============================================================================
// ANIMATION - Smooth iOS-like Transitions (theme-independent)
// =============================================================================

export const Animation = {
  // Enhanced Timing (Linear-inspired)
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 750,
  },

  // Enhanced Easing (Linear + iOS-inspired)
  easing: {
    linear: [0, 0, 1, 1],
    default: [0.25, 0.46, 0.45, 0.94],
    easeOut: [0.0, 0.0, 0.2, 1],
    easeIn: [0.4, 0.0, 1, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    spring: [0.68, -0.55, 0.265, 1.55],
    bounce: [0.175, 0.885, 0.32, 1.275],
    smooth: [0.4, 0, 0.2, 1],
    sharp: [0.4, 0, 0.6, 1],
    emphasized: [0.2, 0, 0, 1],
  },

  // Enhanced Scale transforms
  scale: {
    press: 0.96,
    hover: 1.02,
    focus: 1.04,
    active: 0.98,
    disabled: 0.95,
  },

  // Enhanced transforms
  transforms: {
    slideUp: { translateY: 20, opacity: 0 },
    slideDown: { translateY: -20, opacity: 0 },
    slideLeft: { translateX: 20, opacity: 0 },
    slideRight: { translateX: -20, opacity: 0 },
    scaleIn: { scale: 0.9, opacity: 0 },
    scaleOut: { scale: 1.1, opacity: 0 },
    fade: { opacity: 0 },
  },

  // Stagger delays for list animations
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },
} as const;

// =============================================================================
// LAYOUT CONSTANTS - iPhone 15 Specific (theme-independent)
// =============================================================================

export const Layout = {
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
    contentHeight: screenHeight - Device.safeArea.top - Device.safeArea.bottom - 83, // tabBar height
  },

  // Grid system
  grid: {
    columns: 12,
    gutter: 16,
    margin: 16,
  },

  // Common layouts
  list: {
    itemHeight: 80,
    separatorHeight: 1,
    sectionHeaderHeight: 40,
  },

  // Job-specific layouts
  jobModal: {
    headerHeight: 60,
    actionButtonHeight: 56,
    mapPreviewHeight: 200,
  },
} as const;

// =============================================================================
// ICON CONFIGURATION - Lucide React Native (theme-independent)
// =============================================================================

export const Icons = {
  sizes: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
  },
  
  strokeWidth: {
    thin: 1.5,
    normal: 2,
    thick: 2.5,
  },

  // Job type icons mapping
  jobTypes: {
    cleaning: 'Sparkles',
    gardening: 'Trees',
    maintenance: 'Wrench',
    pool: 'Waves',
    security: 'Shield',
    inspection: 'Search',
  },
} as const;

// =============================================================================
// THEME-AWARE STATUS CONFIGURATIONS
// =============================================================================

export const getStatusConfig = (colors: any) => ({
  job: {
    pending: {
      color: colors.status.pending,
      backgroundColor: colors.warningLight,
      label: 'Pending',
      icon: 'Clock',
    },
    assigned: {
      color: colors.status.inProgress,
      backgroundColor: colors.infoLight,
      label: 'Assigned',
      icon: 'User',
    },
    in_progress: {
      color: colors.status.inProgress,
      backgroundColor: colors.infoLight,
      label: 'In Progress',
      icon: 'Play',
    },
    completed: {
      color: colors.status.completed,
      backgroundColor: colors.successLight,
      label: 'Completed',
      icon: 'CheckCircle',
    },
    cancelled: {
      color: colors.status.cancelled,
      backgroundColor: colors.errorLight,
      label: 'Cancelled',
      icon: 'XCircle',
    },
  },

  priority: {
    low: {
      color: colors.priority.low,
      label: 'Low',
      icon: 'ArrowDown',
    },
    medium: {
      color: colors.priority.medium,
      label: 'Medium',
      icon: 'Minus',
    },
    high: {
      color: colors.priority.high,
      label: 'High',
      icon: 'ArrowUp',
    },
    urgent: {
      color: colors.priority.urgent,
      label: 'Urgent',
      icon: 'AlertTriangle',
    },
  },
});

// =============================================================================
// HOOK FOR THEME-AWARE DESIGN TOKENS
// =============================================================================

export const useDesignTokens = () => {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';

  return {
    Device,
    Typography,
    Spacing,
    BorderRadius,
    Colors,
    Shadows: getShadows(isDark),
    ComponentDimensions,
    Animation,
    Layout,
    Icons,
    StatusConfig: getStatusConfig(colors),
    colors,
    theme,
    isDark,
  };
};

export default {
  Device,
  Typography,
  Spacing,
  BorderRadius,
  ComponentDimensions,
  Animation,
  Layout,
  Icons,
};
