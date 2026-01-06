/**
 * Sia Moon Property Management - Brand Kit Design System
 * Based on BookMate Mobile Application Brand Kit
 * Dark Theme with Yellow Accent Implementation
 * Date: January 4, 2026
 */

import { Dimensions } from 'react-native';
import { BrandTheme } from './BrandTheme';

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
// TYPOGRAPHY - Brand Kit Font System (Aileron + BebasNeue + MadeMirage)
// =============================================================================

export const Typography = {
  // Brand Kit Font Family
  fontFamily: {
    primary: 'Aileron-Bold',      // Headers, buttons, emphasis (700)
    regular: 'Aileron-Regular',   // Body text, general content (400)
    light: 'Aileron-Light',       // Subtle text, secondary info (300)
    display: 'BebasNeue-Regular', // Large numbers, statistics
    accent: 'MadeMirage-Regular', // Special headings, branding
    system: '-apple-system, BlinkMacSystemFont, SF Pro Display',
  },

  // Brand Kit Typography Scale
  sizes: {
    xs: { fontSize: 11, lineHeight: 16 },
    sm: { fontSize: 12, lineHeight: 16 },      // Small (brand kit)
    caption: { fontSize: 14, lineHeight: 20 }, // Caption (brand kit)
    base: { fontSize: 16, lineHeight: 24 },    // Body (brand kit)
    lg: { fontSize: 18, lineHeight: 22 },      // Large Title (brand kit)
    xl: { fontSize: 20, lineHeight: 26 },
    '2xl': { fontSize: 24, lineHeight: 30 },
    '3xl': { fontSize: 28, lineHeight: 34 },
    '4xl': { fontSize: 32, lineHeight: 38 },
    '5xl': { fontSize: 36, lineHeight: 44 },
  },

  // Brand Kit Font Weights
  weights: {
    light: '300',     // Aileron-Light
    normal: '400',    // Aileron-Regular  
    medium: '500',
    semibold: '600',  // Button text weight (brand kit)
    bold: '700',      // Aileron-Bold
    extrabold: '800',
  },

  // Brand Kit Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.5,        // Button text spacing (brand kit)
    wider: 0.05,
  },

  // Brand Kit Text Styles
  styles: {
    // Button Text (Brand Kit Spec)
    button: {
      fontFamily: 'Aileron-Bold',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    
    // Headers (Brand Kit Spec)
    heading: {
      fontFamily: 'Aileron-Bold',
      fontWeight: '700',
      color: '#FFFFFF', // TEXT_PRIMARY
      letterSpacing: -0.025,
    },
    
    // Body Text (Brand Kit Spec)
    body: {
      fontFamily: 'Aileron-Regular',
      fontWeight: '400',
      color: '#B3B3B3', // TEXT_SECONDARY
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    
    // Display Text (Large Numbers)
    display: {
      fontFamily: 'BebasNeue-Regular',
      fontWeight: '400',
      letterSpacing: 0,
    },
    
    // Accent Text (Branding)
    accent: {
      fontFamily: 'MadeMirage-Regular',
      fontWeight: '400',
      letterSpacing: 0,
    },
    
    // Captions and Labels
    caption: {
      fontFamily: 'Aileron-Light',
      fontWeight: '300',
      color: '#4D4D4D', // TEXT_MUTED
      letterSpacing: 0.025,
    },
    
    // Subtitles
    subheading: {
      fontFamily: 'Aileron-Regular',
      fontWeight: '600',
      letterSpacing: -0.015,
    },
    
    // Labels
    label: {
      fontFamily: 'Aileron-Regular',
      fontWeight: '600',
      letterSpacing: 0.015,
    },
  },
} as const;

// =============================================================================
// COLORS - Brand Kit Implementation (Dark Theme with Yellow Accent)
// =============================================================================

export const Colors = {
  // Brand Primary Colors (Direct from Brand Kit)
  primary: '#FFF02B',           // Brand Yellow - Primary accent
  primaryHover: '#E6D625',      // Darker yellow for hover
  primaryDark: '#CCC123',       // Dark yellow variant
  primaryLight: '#FFFF5C',      // Light yellow variant

  // Brand Structural Colors
  black: '#000000',             // Pure black for structural elements
  background: '#121212',        // Main background (grey primary)
  backgroundSecondary: '#1A1A1A', // Surface 1 - cards/elevated
  backgroundTertiary: '#2A2A2A',  // Surface 2 - higher elevation
  cardBackground: '#1A1A1A',    // Card background

  // Brand Text Hierarchy
  white: '#FFFFFF',             // Brand white
  neutral950: '#121212',        // Primary background
  neutral900: '#1A1A1A',        // Surface 1
  neutral850: '#2A2A2A',        // Surface 2
  neutral800: '#333333',        // Elevated surface
  neutral700: '#4D4D4D',        // Secondary grey (content blocks)
  neutral600: '#666666',        // Border variations
  neutral500: '#808080',        // Mid-tone
  neutral400: '#999999',        // Light borders
  neutral300: '#B3B3B3',        // Secondary text
  neutral200: '#CCCCCC',        // Light text
  neutral100: '#E5E5E5',        // Very light
  neutral50: '#FFFFFF',         // Primary text (white)

  // Brand Status Colors
  success: '#00FF88',           // Bright green (brand kit)
  warning: '#FFA500',           // Orange (brand kit)
  error: '#FF3366',            // Vibrant red (brand kit)

  // Brand Border System
  borderDefault: '#4D4D4D',     // Primary borders
  borderLight: '#2A2A2A',       // Subtle dividers
  borderStrong: '#666666',      // Strong borders

  // Enhanced Gradients (Brand Kit Colors)
  gradients: {
    primary: ['#FFF02B', '#E6D625', '#CCC123'],
    primarySubtle: ['rgba(255, 240, 43, 0.2)', 'rgba(230, 214, 37, 0.1)', 'rgba(204, 193, 35, 0.05)'],
    background: ['#121212', '#1A1A1A', '#2A2A2A'],
    card: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
    cardElevated: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)'],
    text: ['#FFFFFF', '#B3B3B3', '#4D4D4D'],
    success: ['#00FF88', '#00E67A', '#00CC6B'],
    warning: ['#FFA500', '#E69500', '#CC8500'],
    error: ['#FF3366', '#E62E5C', '#CC2952'],
    brandYellow: ['rgba(255, 240, 43, 0.4)', 'rgba(230, 214, 37, 0.2)', 'rgba(204, 193, 35, 0.1)'],
    glassmorphism: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
  },

  // Brand Glow Effects
  neon: {
    yellow: {
      color: '#FFF02B',
      glow: 'rgba(255, 240, 43, 0.6)',
      shadow: '0 0 20px rgba(255, 240, 43, 0.4)',
    },
    success: {
      color: '#00FF88',
      glow: 'rgba(0, 255, 136, 0.6)',
      shadow: '0 0 20px rgba(0, 255, 136, 0.4)',
    },
    error: {
      color: '#FF3366',
      glow: 'rgba(255, 51, 102, 0.6)',
      shadow: '0 0 20px rgba(255, 51, 102, 0.4)',
    },
    warning: {
      color: '#FFA500',
      glow: 'rgba(255, 165, 0, 0.6)',
      shadow: '0 0 20px rgba(255, 165, 0, 0.4)',
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
// SHADOWS - Brand Kit Yellow Glow Effects + Traditional Shadows
// =============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Brand Kit Yellow Glow Effects
  smallGlow: {
    shadowColor: '#FFF02B', // Brand Yellow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  mediumGlow: {
    shadowColor: '#FFF02B', // Brand Yellow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  largeGlow: {
    shadowColor: '#FFF02B', // Brand Yellow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  yellowGlow: {
    shadowColor: '#FFF02B', // Brand Yellow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // Traditional Black Shadows (Brand Kit Spec)
  blackSmall: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  
  blackMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Legacy shadow names (mapped to brand kit)
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  default: {
    shadowColor: '#FFF02B', // Use yellow for default
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#FFF02B', // Use yellow for large
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },

  // Component-specific shadows (Brand Kit)
  button: {
    shadowColor: '#FFF02B', // Yellow glow for buttons
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  focus: {
    shadowColor: '#FFF02B', // Yellow focus glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Brand status glows
  successGlow: {
    shadowColor: '#00FF88', // Brand success green
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  errorGlow: {
    shadowColor: '#FF3366', // Brand error red
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  warningGlow: {
    shadowColor: '#FFA500', // Brand warning orange
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
// ANIMATION - Brand Kit Timing & Easing
// =============================================================================

export const Animation = {
  // Brand Kit Duration (Linear-inspired)
  duration: {
    instant: 100,
    micro: 150,    // Button press (brand kit)
    fast: 150,
    short: 250,    // Transitions (brand kit) 
    normal: 250,
    medium: 350,   // Screen transitions (brand kit)
    slow: 350,
    long: 500,     // Complex animations (brand kit)
    slower: 500,
    slowest: 750,
  },

  // Brand Kit Easing (Standard easing)
  easing: {
    linear: [0, 0, 1, 1],
    standard: [0.4, 0.0, 0.2, 1] as const,   // Brand kit standard
    decelerate: [0.0, 0.0, 0.2, 1] as const, // Brand kit decelerate
    accelerate: [0.4, 0.0, 1, 1] as const,   // Brand kit accelerate
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

  // Brand Kit Interactive States
  scale: {
    press: 0.96,   // Brand kit button press scale
    hover: 1.02,
    focus: 1.04,
    active: 0.98,
    disabled: 0.95,
  },

  // Button interactions (Brand Kit)
  button: {
    activeOpacity: 0.8, // Brand kit spec
    pressScale: 0.96,
  },

  // Tab animations (Brand Kit)
  tab: {
    iconScale: 1.1,
    colorTransition: 250, // Short duration
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
// THEME-AWARE STATUS CONFIGURATIONS - Brand Kit Colors
// =============================================================================

export const getJobStatusConfig = (colors = Colors) => ({
  pending: {
    color: colors.warning || '#FFA500',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    label: 'Pending',
    icon: 'Clock',
  },
  assigned: {
    color: colors.primary || '#FFF02B',
    backgroundColor: 'rgba(255, 240, 43, 0.1)',
    label: 'Assigned', 
    icon: 'User',
  },
  in_progress: {
    color: colors.primary || '#FFF02B',
    backgroundColor: 'rgba(255, 240, 43, 0.1)',
    label: 'In Progress',
    icon: 'Play',
  },
  completed: {
    color: colors.success || '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    label: 'Completed',
    icon: 'CheckCircle',
  },
  cancelled: {
    color: colors.error || '#FF3366',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    label: 'Cancelled',
    icon: 'XCircle',
  },
});

export const getPriorityConfig = (colors = Colors) => ({
  low: {
    color: colors.success || '#00FF88',
    label: 'Low',
    icon: 'ArrowDown',
  },
  medium: {
    color: colors.warning || '#FFA500',
    label: 'Medium',
    icon: 'Minus',
  },
  high: {
    color: colors.primary || '#FFF02B',
    label: 'High',
    icon: 'ArrowUp',
  },
  urgent: {
    color: colors.error || '#FF3366',
    label: 'Urgent',
    icon: 'AlertTriangle',
  },
});

// =============================================================================
// BRAND KIT INTEGRATION - FINAL EXPORTS
// =============================================================================

// Import brand theme for consistency
export { BrandTheme } from './BrandTheme';

// Status configurations using brand colors
export const StatusConfig = {
  job: getJobStatusConfig(),
  priority: getPriorityConfig(),
};

// Brand-aware design tokens
export const useDesignTokens = () => {
  return {
    Device,
    Typography,
    Spacing,
    BorderRadius,
    Colors,
    Shadows,
    ComponentDimensions,
    Animation,
    Layout,
    Icons,
    StatusConfig,
    colors: Colors,
    theme: 'dark', // Brand kit is dark theme
    isDark: true,
    BrandTheme, // Include brand theme
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
  Colors,
  Shadows,
  BrandTheme,
};
