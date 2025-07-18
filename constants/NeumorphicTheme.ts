/**
 * Sia Moon AI-Inspired Design System
 * Modern dark-themed property management application styling
 * Optimized for professional workflows with AI-enhanced UX
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SiaMoonTheme = {
  // AI-Inspired Color Palette - Dark First Design
  colors: {
    // Background System - Updated for new dark theme
    background: {
      primary: '#0B0F1A',      // Deep navy-black - main background
      secondary: '#111827',     // Secondary surface
      tertiary: '#1C1F2A',     // Surface/card background (elevated surfaces)
      elevated: '#1F2937',     // Secondary surfaces
    },

    // Surface colors for cards and components
    surface: {
      primary: '#1C1F2A',      // Main card background (elevated surface)
      secondary: '#1F2937',     // Secondary surfaces
      elevated: '#374151',     // Elevated cards
      pressed: '#4B5563',      // Pressed state
      border: '#374151',       // Subtle borders
    },

    // Text Hierarchy - Updated for new theme
    text: {
      primary: '#F1F1F1',      // Primary text - soft white for headings
      secondary: '#A1A1AA',    // Secondary text - muted gray for descriptions
      muted: '#71717A',        // Tertiary text - darker gray for subtle text
      disabled: '#4B5563',     // Disabled text
      inverse: '#0B0F1A',      // Inverse text for light backgrounds
    },

    // Brand Colors - Neon green accent system
    brand: {
      primary: '#C6FF00',      // Neon green - primary accent
      primaryHover: '#A3E635',  // Lime green - hover states
      primaryLight: '#D4FF3A',  // Light neon green - light variant
      primaryDark: '#84CC16',   // Darker lime - dark variant
      primaryMuted: 'rgba(198, 255, 0, 0.1)', // Muted backgrounds
    },

    // Semantic Colors - Optimized for dark theme
    semantic: {
      success: '#22c55e',      // Green-500
      successMuted: 'rgba(34, 197, 94, 0.1)',
      warning: '#f59e0b',      // Amber-500
      warningMuted: 'rgba(245, 158, 11, 0.1)',
      error: '#ef4444',        // Red-500
      errorMuted: 'rgba(239, 68, 68, 0.1)',
      info: '#3b82f6',         // Blue-500
      infoMuted: 'rgba(59, 130, 246, 0.1)',
    },

    // Status Colors - Job and task states
    status: {
      pending: '#f59e0b',      // Amber-500
      inProgress: '#3b82f6',   // Blue-500
      completed: '#22c55e',    // Green-500
      cancelled: '#ef4444',    // Red-500
      urgent: '#ef4444',       // Red-500
      draft: '#71717a',        // Zinc-500
    },

    // Priority Colors - Task prioritization
    priority: {
      low: '#22c55e',          // Green-500
      medium: '#f59e0b',       // Amber-500
      high: '#fb923c',         // Orange-400
      urgent: '#ef4444',       // Red-500
    },

    // Border System - Subtle to prominent
    border: {
      subtle: '#374151',       // Subtle borders
      default: '#4B5563',      // Default borders
      strong: '#6B7280',       // Strong borders
      brand: '#C6FF00',        // Brand-colored borders (neon green)
    },
  },

  // Neon Green Gradients - Updated theme spectrum
  gradients: {
    // Primary brand gradients
    primary: ['#C6FF00', '#A3E635'],           // Neon green gradient
    primaryToBlue: ['#C6FF00', '#3b82f6'],     // Neon green to blue
    primaryToCyan: ['#C6FF00', '#06b6d4'],     // Neon green to cyan

    // Background gradients - Updated for new dark theme
    background: ['#0B0F1A', '#111827'],
    backgroundElevated: ['#111827', '#1C1F2A'],
    backgroundHeader: ['#0B0F1A', '#1C1F2A', '#111827'],
    backgroundMain: ['#0B0F1A', '#111827', '#1C1F2A'],

    // Card gradients - Updated glassmorphism effect
    card: ['rgba(28, 31, 42, 0.8)', 'rgba(17, 24, 39, 0.6)'],
    cardElevated: ['rgba(31, 41, 55, 0.9)', 'rgba(28, 31, 42, 0.7)'],
    cardPressed: ['rgba(17, 24, 39, 0.9)', 'rgba(28, 31, 42, 0.8)'],

    // Status gradients - Enhanced visibility
    success: ['#22c55e', '#16a34a'],
    warning: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
    info: ['#3b82f6', '#2563eb'],

    // Special neon-themed gradients
    aiAccent: ['#C6FF00', '#3b82f6', '#06b6d4'],  // Neon green-blue-cyan
    neonGlow: ['#C6FF00', '#A3E635', '#D4FF3A'],  // Neon green glow effect
  },

  // Modern Shadow System - Optimized for dark theme
  shadows: {
    // Card shadows - Subtle depth
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },

    // Elevated shadows - More prominent
    elevated: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },

    // Large shadows - Maximum depth
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
    },

    // Glow effects - AI-inspired
    glow: {
      primary: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
      },
      success: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
      warning: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
      error: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
    },

    // Inner shadows for pressed states
    inner: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 4,
      elevation: -2,
    },
  },
  
  // Border radius system
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // Spacing system (8px grid)
  spacing: {
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
    32: 128,
  },
  
  // Typography System - Inter font with tight spacing
  typography: {
    fontFamily: {
      primary: 'Inter',
      mono: 'SF Mono',
      system: 'System',
    },

    // Font sizes with optimized line heights
    sizes: {
      xs: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
      sm: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
      base: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
      lg: { fontSize: 18, lineHeight: 28, letterSpacing: -0.25 },
      xl: { fontSize: 20, lineHeight: 28, letterSpacing: -0.5 },
      '2xl': { fontSize: 24, lineHeight: 32, letterSpacing: -0.75 },
      '3xl': { fontSize: 30, lineHeight: 36, letterSpacing: -1 },
      '4xl': { fontSize: 36, lineHeight: 40, letterSpacing: -1.25 },
    },

    // Font weights - Inter optimized
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },

    // Semantic text styles
    styles: {
      h1: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -1 },
      h2: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: -0.5 },
      h3: { fontSize: 18, lineHeight: 28, fontWeight: '500', letterSpacing: -0.25 },
      body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
      caption: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
      button: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0 },
    },
  },
  
  // Component dimensions
  components: {
    // Touch targets
    touchTarget: {
      minimum: 44,
      recommended: 48,
      large: 56,
    },
    
    // Cards
    card: {
      padding: 16,
      borderRadius: 16,
      minHeight: 80,
    },
    
    // Buttons
    button: {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    
    // Input fields
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    
    // Navigation
    tabBar: {
      height: 80,
      paddingBottom: 20,
    },
    
    // Headers
    header: {
      height: 60,
      paddingHorizontal: 20,
    },
  },
  
  // Animation System - Smooth and responsive
  animation: {
    // Duration presets
    duration: {
      instant: 0,
      fast: 200,
      normal: 300,
      slow: 500,
      slower: 700,
    },

    // Cubic bezier easing curves
    easing: {
      default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    },

    // Transform presets
    scale: {
      press: 0.95,
      hover: 1.02,
      active: 0.98,
    },

    // Opacity presets
    opacity: {
      hidden: 0,
      visible: 1,
      muted: 0.6,
      disabled: 0.4,
    },
  },
  
  // Layout constants
  layout: {
    screen: {
      width: screenWidth,
      height: screenHeight,
      padding: 20,
    },
    
    grid: {
      columns: 12,
      gutter: 16,
    },
    
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
} as const;

// Export with both names for backward compatibility
export const NeumorphicTheme = SiaMoonTheme;
export type NeumorphicThemeType = typeof SiaMoonTheme;
export type SiaMoonThemeType = typeof SiaMoonTheme;
export default SiaMoonTheme;
