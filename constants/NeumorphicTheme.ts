/**
 * Neumorphic Dark Theme Design System
 * Professional property management application styling
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const NeumorphicTheme = {
  // Color Palette - Dark Neumorphic
  colors: {
    // Background layers
    background: {
      primary: '#0a0a0a',
      secondary: '#111111',
      tertiary: '#1a1a1a',
      elevated: '#1f1f1f',
    },
    
    // Surface colors for cards and components
    surface: {
      primary: 'rgba(255, 255, 255, 0.08)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      elevated: 'rgba(255, 255, 255, 0.12)',
      pressed: 'rgba(255, 255, 255, 0.15)',
    },
    
    // Text hierarchy
    text: {
      primary: '#ffffff',
      secondary: '#e5e5e5',
      tertiary: '#9ca3af',
      quaternary: '#6b7280',
      disabled: '#4b5563',
    },
    
    // Brand colors
    brand: {
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryLight: '#a78bfa',
      primaryDark: '#6d28d9',
    },
    
    // Semantic colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Status colors
    status: {
      pending: '#f59e0b',
      inProgress: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
      urgent: '#ef4444',
    },
    
    // Priority colors
    priority: {
      low: '#10b981',
      medium: '#8b5cf6',
      high: '#f59e0b',
      urgent: '#ef4444',
    },
    
    // Border colors
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      strong: 'rgba(255, 255, 255, 0.3)',
    },
  },
  
  // Gradients for neumorphic effects
  gradients: {
    // Card gradients
    cardLight: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    cardElevated: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)'],
    cardPressed: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)'],
    
    // Background gradients
    backgroundMain: ['#0a0a0a', '#111111', '#1a1a1a'],
    backgroundSecondary: ['#111111', '#1a1a1a', '#1f1f1f'],
    
    // Brand gradients
    brandPrimary: ['#8b5cf6', '#7c3aed'],
    brandSecondary: ['#a78bfa', '#8b5cf6'],
    
    // Status gradients
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
    info: ['#3b82f6', '#2563eb'],
  },
  
  // Shadows for neumorphic depth
  shadows: {
    // Neumorphic shadows (inset and outset)
    neumorphic: {
      // Fix: Add missing small shadow property
      small: {
        shadowColor: 'rgba(255, 255, 255, 0.05)',
        shadowOffset: { width: -1, height: -1 },
        shadowOpacity: 1,
        shadowRadius: 2,
      },
      light: {
        shadowColor: 'rgba(255, 255, 255, 0.1)',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      dark: {
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    },
    
    // Standard elevation shadows
    elevation: {
      small: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    
    // Glow effects
    glow: {
      brand: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
      },
      success: {
        shadowColor: '#10b981',
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
  
  // Typography system
  typography: {
    fontFamily: {
      primary: 'System',
      mono: 'Menlo',
    },
    
    sizes: {
      xs: { fontSize: 12, lineHeight: 16 },
      sm: { fontSize: 14, lineHeight: 20 },
      base: { fontSize: 16, lineHeight: 24 },
      lg: { fontSize: 18, lineHeight: 28 },
      xl: { fontSize: 20, lineHeight: 28 },
      '2xl': { fontSize: 24, lineHeight: 32 },
      '3xl': { fontSize: 30, lineHeight: 36 },
      '4xl': { fontSize: 36, lineHeight: 40 },
    },
    
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
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
  
  // Animation timings
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    
    easing: {
      default: [0.25, 0.46, 0.45, 0.94],
      easeOut: [0.0, 0.0, 0.2, 1],
      easeIn: [0.4, 0.0, 1, 1],
      spring: [0.68, -0.55, 0.265, 1.55],
    },
    
    scale: {
      press: 0.96,
      hover: 1.02,
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

export type NeumorphicThemeType = typeof NeumorphicTheme;
export default NeumorphicTheme;
