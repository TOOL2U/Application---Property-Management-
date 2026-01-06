/**
 * Sia Moon Property Management - Brand Kit Implementation
 * Based on BookMate Mobile Application Brand Kit
 * Date: January 4, 2026
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================================================================
// BRAND COLORS - Direct Implementation from Brand Kit
// =============================================================================

export const BRAND_COLORS = {
  // Primary Brand Colors
  YELLOW: '#FFF02B',           // Brand primary accent
  BLACK: '#000000',            // Structural color
  GREY_PRIMARY: '#121212',     // Main background
  GREY_SECONDARY: '#4D4D4D',   // Content blocks
  
  // Surface Colors
  SURFACE_1: '#1A1A1A',        // Slightly lighter cards
  SURFACE_2: '#2A2A2A',        // Elevated elements
  
  // Text Hierarchy
  TEXT_PRIMARY: '#FFFFFF',     // High contrast white
  TEXT_SECONDARY: '#B3B3B3',   // Secondary text
  TEXT_MUTED: '#4D4D4D',       // Subtle information
  
  // Status & Feedback Colors
  SUCCESS: '#00FF88',          // Bright green
  ERROR: '#FF3366',           // Vibrant red
  WARNING: '#FFA500',         // Orange
  INFO: '#FFF02B',            // Brand yellow for info
  
  // Border System
  BORDER: '#4D4D4D',          // Primary borders
  BORDER_SUBTLE: '#2A2A2A',   // Subtle dividers
  ACTIVE: '#FFF02B',          // Active state borders
  INACTIVE: '#4D4D4D',        // Inactive elements
} as const;

// =============================================================================
// TYPOGRAPHY SYSTEM - Brand Kit Fonts
// =============================================================================

export const BRAND_TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    primary: 'Aileron-Bold',      // Headers, buttons, emphasis
    regular: 'Aileron-Regular',   // Body text, general content
    light: 'Aileron-Light',       // Subtle text, secondary info
    display: 'BebasNeue-Regular', // Large numbers, statistics
    accent: 'MadeMirage-Regular', // Special headings, branding
  },

  // Type Scale
  sizes: {
    small: { fontSize: 12, lineHeight: 16 },
    caption: { fontSize: 14, lineHeight: 20 },
    body: { fontSize: 16, lineHeight: 24 },
    mediumTitle: { fontSize: 16, lineHeight: 20 },
    smallTitle: { fontSize: 14, lineHeight: 18 },
    largeTitle: { fontSize: 18, lineHeight: 22 },
  },

  // Font Weights
  weights: {
    light: '300',
    regular: '400',
    semibold: '600',
    bold: '700',
  },

  // Text Styling Rules
  buttonText: {
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  headers: {
    fontWeight: 'bold' as const,
    color: BRAND_COLORS.TEXT_PRIMARY,
  },

  body: {
    fontWeight: 'regular' as const,
    color: BRAND_COLORS.TEXT_SECONDARY,
    lineHeight: 1.5,
  },
} as const;

// =============================================================================
// SPACING SYSTEM - Brand Kit Grid
// =============================================================================

export const BRAND_SPACING = {
  XS: 4,   // Micro spacing
  SM: 8,   // Small gaps
  MD: 12,  // Medium spacing
  LG: 16,  // Large spacing, standard
  XL: 20,  // Extra large
  XXL: 24, // Maximum spacing
  
  // Container and grid system
  CONTAINER_PADDING: 16,
  SECTION_SPACING: 24,
  CARD_SPACING: 16,
  ELEMENT_SPACING: 12,
  ICON_SPACING: 8,
} as const;

// =============================================================================
// BORDER RADIUS SYSTEM - Modern Mobile App Rounded Corners
// =============================================================================

export const BRAND_RADIUS = {
  NONE: 0,      // No rounding (legacy)
  XS: 4,        // Minimal rounding - tiny elements
  SM: 8,        // Small rounding - buttons, inputs
  MD: 12,       // Medium rounding - cards, modals
  LG: 16,       // Large rounding - major containers
  XL: 20,       // Extra large - special cards
  XXL: 24,      // Maximum - hero elements
  PILL: 999,    // Fully rounded - pills, badges
  CIRCLE: 9999, // Perfect circle - avatars, icons
} as const;

// =============================================================================
// BRAND SHADOWS - Yellow Glow Effects
// =============================================================================

export const BRAND_SHADOWS = {
  // Yellow Glow Effects
  SMALL_GLOW: {
    shadowColor: BRAND_COLORS.YELLOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  MEDIUM_GLOW: {
    shadowColor: BRAND_COLORS.YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  LARGE_GLOW: {
    shadowColor: BRAND_COLORS.YELLOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  YELLOW_GLOW: {
    shadowColor: BRAND_COLORS.YELLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Traditional Shadows
  BLACK_SMALL: {
    shadowColor: BRAND_COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  BLACK_MEDIUM: {
    shadowColor: BRAND_COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// =============================================================================
// COMPONENT STYLES - Brand Kit Implementation
// =============================================================================

export const BRAND_COMPONENTS = {
  // Button Variants
  button: {
    primary: {
      backgroundColor: BRAND_COLORS.YELLOW,
      color: BRAND_COLORS.BLACK,
      ...BRAND_SHADOWS.YELLOW_GLOW,
      borderRadius: 8, // Modern rounded corners
      ...BRAND_TYPOGRAPHY.buttonText,
      fontFamily: BRAND_TYPOGRAPHY.fontFamily.primary,
    },
    
    secondary: {
      backgroundColor: BRAND_COLORS.SURFACE_2,
      color: BRAND_COLORS.TEXT_PRIMARY,
      borderWidth: 1,
      borderColor: BRAND_COLORS.BORDER,
      borderRadius: 8, // Modern rounded corners
      ...BRAND_SHADOWS.BLACK_SMALL,
      fontFamily: BRAND_TYPOGRAPHY.fontFamily.regular,
    },
    
    outline: {
      backgroundColor: 'transparent',
      color: BRAND_COLORS.YELLOW,
      borderWidth: 2,
      borderColor: BRAND_COLORS.YELLOW,
      borderRadius: 8, // Modern rounded corners
      fontFamily: BRAND_TYPOGRAPHY.fontFamily.regular,
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: BRAND_COLORS.TEXT_SECONDARY,
      borderRadius: 8, // Modern rounded corners
      fontFamily: BRAND_TYPOGRAPHY.fontFamily.regular,
    },
  },

  // Card Variants
  card: {
    standard: {
      backgroundColor: BRAND_COLORS.SURFACE_1,
      borderWidth: 1,
      borderColor: BRAND_COLORS.BORDER,
      borderRadius: 12, // Comfortable rounded corners for cards
      padding: BRAND_SPACING.LG,
      ...BRAND_SHADOWS.BLACK_SMALL,
    },
    
    elevated: {
      backgroundColor: BRAND_COLORS.SURFACE_1,
      borderWidth: 1,
      borderColor: BRAND_COLORS.BORDER,
      borderRadius: 12, // Comfortable rounded corners for cards
      padding: BRAND_SPACING.LG,
      ...BRAND_SHADOWS.BLACK_MEDIUM,
    },
    
    glowEffect: {
      backgroundColor: BRAND_COLORS.SURFACE_1,
      borderWidth: 1,
      borderColor: BRAND_COLORS.YELLOW,
      borderRadius: 12, // Comfortable rounded corners for cards
      padding: BRAND_SPACING.LG,
      ...BRAND_SHADOWS.YELLOW_GLOW,
    },
  },

  // Navigation
  tabBar: {
    backgroundColor: BRAND_COLORS.BLACK,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_SUBTLE,
    activeTintColor: BRAND_COLORS.YELLOW,
    inactiveTintColor: BRAND_COLORS.GREY_SECONDARY,
  },

  // Input Fields
  input: {
    backgroundColor: BRAND_COLORS.SURFACE_1,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER,
    borderRadius: 8, // Smooth rounded corners for inputs
    color: BRAND_COLORS.TEXT_PRIMARY,
    placeholderTextColor: BRAND_COLORS.TEXT_SECONDARY,
    fontFamily: BRAND_TYPOGRAPHY.fontFamily.regular,
    padding: BRAND_SPACING.LG,
    
    // Focus state
    focusedBorderColor: BRAND_COLORS.YELLOW,
  },

  // Modal/Overlay
  modal: {
    backgroundColor: BRAND_COLORS.SURFACE_1,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER,
    borderRadius: 16, // Larger radius for modals
    ...BRAND_SHADOWS.LARGE_GLOW,
  },
} as const;

// =============================================================================
// ANIMATION SYSTEM - Brand Kit Timings
// =============================================================================

export const BRAND_ANIMATION_DURATION = {
  micro: 150,    // Button press
  short: 250,    // Transitions
  medium: 350,   // Screen transitions
  long: 500,     // Complex animations
} as const;

export const BRAND_ANIMATION = {
  // Duration from brand kit (referencing extracted duration const)
  duration: BRAND_ANIMATION_DURATION,

  // Easing
  easing: {
    standard: [0.4, 0.0, 0.2, 1] as const,
    decelerate: [0.0, 0.0, 0.2, 1] as const,
    accelerate: [0.4, 0.0, 1, 1] as const,
  },

  // Interactive States
  button: {
    activeOpacity: 0.8,
    pressScale: 0.96,
  },

  tab: {
    iconScale: 1.1,
    colorTransition: BRAND_ANIMATION_DURATION.short,
  },
} as const;

// =============================================================================
// LAYOUT PATTERNS - Brand Kit Structure
// =============================================================================

export const BRAND_LAYOUT = {
  screen: {
    padding: BRAND_SPACING.LG, // 16px edges
    sectionSpacing: BRAND_SPACING.XXL, // 24px between sections
  },
  
  card: {
    margin: BRAND_SPACING.LG,
    padding: BRAND_SPACING.LG,
  },
  
  modal: {
    margin: BRAND_SPACING.LG,
    padding: BRAND_SPACING.XXL,
  },
} as const;

// =============================================================================
// ICON CONFIGURATION - Per Brand Kit
// =============================================================================

export const BRAND_ICONS = {
  sizes: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 28,
  },
  
  // Default to Ionicons + MaterialIcons as per brand
  library: 'ionicons' as const,
  
  // Color mapping
  colors: {
    active: BRAND_COLORS.YELLOW,
    inactive: BRAND_COLORS.GREY_SECONDARY,
    primary: BRAND_COLORS.TEXT_PRIMARY,
    secondary: BRAND_COLORS.TEXT_SECONDARY,
  },
} as const;

// =============================================================================
// BRAND THEME EXPORT
// =============================================================================

export const BrandTheme = {
  colors: BRAND_COLORS,
  typography: BRAND_TYPOGRAPHY,
  spacing: BRAND_SPACING,
  radius: BRAND_RADIUS,
  shadows: BRAND_SHADOWS,
  components: BRAND_COMPONENTS,
  animation: BRAND_ANIMATION,
  layout: BRAND_LAYOUT,
  icons: BRAND_ICONS,
  
  // Helper functions
  getButtonStyle: (variant: keyof typeof BRAND_COMPONENTS.button) => 
    BRAND_COMPONENTS.button[variant],
    
  getCardStyle: (variant: keyof typeof BRAND_COMPONENTS.card) => 
    BRAND_COMPONENTS.card[variant],
    
  getTextStyle: (type: 'header' | 'body' | 'button') => {
    switch (type) {
      case 'header':
        return BRAND_TYPOGRAPHY.headers;
      case 'body':
        return BRAND_TYPOGRAPHY.body;
      case 'button':
        return BRAND_TYPOGRAPHY.buttonText;
      default:
        return BRAND_TYPOGRAPHY.body;
    }
  },
} as const;

export default BrandTheme;
