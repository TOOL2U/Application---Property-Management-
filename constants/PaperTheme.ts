import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/**
 * Custom React Native Paper theme configuration
 * Matches the existing dark theme with custom colors from tailwind.config.js
 */

// Font configuration to match Inter font
const fontConfig = {
  displayLarge: {
    fontFamily: 'Inter',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'Inter',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

/**
 * Sia Moon Property Management Paper Theme
 * Extends MD3DarkTheme with custom colors matching tailwind.config.js
 */
export const SiaMoonPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    
    // Primary colors (matching neon green theme)
    primary: '#C6FF00',
    onPrimary: '#0B0F1A',  // Dark text for better contrast
    primaryContainer: '#A3E635',
    onPrimaryContainer: '#0B0F1A',
    
    // Secondary colors (using neon-pink)
    secondary: '#ec4899',
    onSecondary: '#ffffff',
    secondaryContainer: '#be185d',
    onSecondaryContainer: '#fce7f3',
    
    // Tertiary colors (using neon-green)
    tertiary: '#22c55e',
    onTertiary: '#ffffff',
    tertiaryContainer: '#16a34a',
    onTertiaryContainer: '#dcfce7',
    
    // Error colors
    error: '#ef4444',
    onError: '#ffffff',
    errorContainer: '#dc2626',
    onErrorContainer: '#fef2f2',
    
    // Background colors (matching new dark theme)
    background: '#0B0F1A',        // Primary background
    onBackground: '#F1F1F1',      // Primary text
    surface: '#1C1F2A',           // Surface/card background
    onSurface: '#F1F1F1',         // Primary text
    surfaceVariant: '#1F2937',    // Secondary surfaces
    onSurfaceVariant: '#A1A1AA',  // Secondary text
    
    // Outline colors
    outline: '#262626',           // dark-border
    outlineVariant: '#374151',    // gray-700
    
    // Surface tints
    surfaceTint: '#C6FF00',
    inverseSurface: '#f9fafb',
    inverseOnSurface: '#111827',
    inversePrimary: '#6366f1',
    
    // Elevation surfaces
    elevation: {
      level0: 'transparent',
      level1: '#111111',          // dark-surface
      level2: '#1a1a1a',          // dark-card
      level3: '#262626',          // dark-border
      level4: '#374151',          // gray-700
      level5: '#4b5563',          // gray-600
    },
    
    // Additional custom colors for neon effects
    surfaceDisabled: '#374151',
    onSurfaceDisabled: '#9ca3af',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Custom roundness to match tailwind rounded-lg
  roundness: 8,
};

/**
 * Color constants for easy access throughout the app
 */
export const PaperColors = {
  primary: '#C6FF00',
  neonGreen: '#C6FF00',
  neonLime: '#A3E635',
  neonBlue: '#3b82f6',
  neonSuccess: '#22c55e',
  neonOrange: '#f59e0b',
  neonRed: '#ef4444',

  darkBg: '#0B0F1A',
  darkSurface: '#1C1F2A',
  darkCard: '#1F2937',
  darkBorder: '#374151',
  
  white: '#ffffff',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
} as const;

export default SiaMoonPaperTheme;
