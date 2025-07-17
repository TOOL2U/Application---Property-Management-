/**
 * Sia Moon Design System - NativeWind Integration
 * Modern AI-inspired design tokens for consistent styling
 */

// Color tokens for NativeWind classes
export const SiaMoonColors = {
  // Background colors
  'dark-bg': '#0a0a0a',
  'dark-surface': '#111111', 
  'dark-elevated': '#1a1a1a',
  'dark-border': '#333333',
  
  // Text colors
  'text-primary': '#ffffff',
  'text-secondary': '#a1a1aa',
  'text-muted': '#71717a',
  
  // Brand colors
  'brand-primary': '#8b5cf6',
  'brand-hover': '#7c3aed',
  
  // Semantic colors
  'success': '#22c55e',
  'warning': '#f59e0b', 
  'error': '#ef4444',
  'info': '#3b82f6',
} as const;

// Component style presets using NativeWind classes
export const SiaMoonStyles = {
  // Screen containers
  screen: 'flex-1 bg-dark-bg',
  screenPadded: 'flex-1 bg-dark-bg px-4 py-6',
  
  // Card styles
  card: 'bg-dark-elevated rounded-2xl p-4 border border-dark-border shadow-lg',
  cardPressed: 'bg-dark-surface rounded-2xl p-4 border border-dark-border',
  
  // Text styles
  h1: 'text-3xl font-bold tracking-tight text-text-primary',
  h2: 'text-xl font-semibold text-text-primary',
  h3: 'text-lg font-medium text-text-primary',
  body: 'text-base font-normal text-text-primary',
  caption: 'text-sm text-text-muted',
  
  // Button styles
  buttonPrimary: 'bg-brand-primary rounded-xl px-6 py-3 shadow-lg',
  buttonSecondary: 'bg-dark-surface border border-dark-border rounded-xl px-6 py-3',
  buttonText: 'text-base font-semibold text-white text-center',
  
  // Input styles
  input: 'bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-text-primary',
  inputFocused: 'bg-dark-surface border border-brand-primary rounded-xl px-4 py-3 text-text-primary',
  
  // Navigation styles
  tabBar: 'bg-dark-surface border-t border-brand-primary/30 pt-2 pb-8 h-20',
  tabActive: 'text-brand-primary',
  tabInactive: 'text-text-muted',
} as const;

// Animation presets
export const SiaMoonAnimations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideInUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
  },
  pulse: {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.6 },
    '100%': { opacity: 1 },
  },
} as const;

// Spacing system (8px grid)
export const SiaMoonSpacing = {
  xs: 4,   // gap-1
  sm: 8,   // gap-2  
  md: 16,  // gap-4
  lg: 24,  // gap-6
  xl: 32,  // gap-8
  '2xl': 48, // gap-12
} as const;

// Component size presets
export const SiaMoonSizes = {
  touchTarget: 44,
  buttonHeight: 48,
  inputHeight: 48,
  cardMinHeight: 80,
  tabBarHeight: 80,
  headerHeight: 60,
} as const;

// Utility functions for consistent styling
export const createGradientStyle = (colors: string[]) => ({
  background: `linear-gradient(135deg, ${colors.join(', ')})`,
});

export const createShadowStyle = (color: string, opacity: number = 0.4) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: opacity,
  shadowRadius: 12,
  elevation: 8,
});

// Status color mappings
export const StatusColors = {
  pending: '#f59e0b',
  inProgress: '#3b82f6', 
  completed: '#22c55e',
  cancelled: '#ef4444',
  urgent: '#ef4444',
} as const;

// Priority color mappings  
export const PriorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#fb923c', 
  urgent: '#ef4444',
} as const;

export type SiaMoonColorKey = keyof typeof SiaMoonColors;
export type SiaMoonStyleKey = keyof typeof SiaMoonStyles;
export type StatusColorKey = keyof typeof StatusColors;
export type PriorityColorKey = keyof typeof PriorityColors;
