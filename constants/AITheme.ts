/**
 * Neon Green Dark Theme System
 * Modern, professional dark theme with neon green accents for Property Management
 */

export const AITheme = {
  // Base Colors - Deep navy/black foundation
  colors: {
    // Primary Background System
    background: {
      primary: '#0B0F1A',      // Deep navy-black - main background
      secondary: '#111827',     // Slightly lighter - secondary surfaces
      tertiary: '#1F2937',      // Cards and elevated surfaces
      elevated: '#1C1F2A',      // Highly elevated surfaces (new surface color)
      glass: 'rgba(28, 31, 42, 0.8)', // Glass morphism overlay
    },

    // Surface Colors
    surface: {
      primary: '#1C1F2A',       // Main surface color (new elevated surface)
      secondary: '#1F2937',     // Secondary surface
      elevated: '#374151',      // Elevated surfaces
      glass: 'rgba(55, 65, 81, 0.6)', // Glass effect
      overlay: 'rgba(0, 0, 0, 0.4)', // Modal overlays
    },

    // Text Colors - High contrast for readability with new hierarchy
    text: {
      primary: '#F1F1F1',       // Soft white - primary text (headings, important content)
      secondary: '#A1A1AA',     // Muted gray - secondary text (descriptions)
      tertiary: '#71717A',      // Darker gray - tertiary text (subtle text)
      muted: '#6B7280',         // Muted gray - subtle text
      disabled: '#4B5563',      // Disabled text
      inverse: '#111827',       // Dark text for light backgrounds
    },

    // Brand Colors - Neon green accent system
    brand: {
      primary: '#C6FF00',       // Neon green - main brand accent
      secondary: '#A3E635',     // Lime green - hover/active states
      tertiary: '#84CC16',      // Darker lime - pressed states
      gradient: ['#C6FF00', '#A3E635'], // Neon to lime gradient
      glow: 'rgba(198, 255, 0, 0.3)', // Neon green glow effect
    },

    // Accent Colors
    accent: {
      blue: '#3B82F6',          // Blue 500
      cyan: '#06B6D4',          // Cyan 500
      teal: '#10B981',          // Emerald 500
      green: '#22C55E',         // Green 500
      orange: '#F97316',        // Orange 500
      pink: '#EC4899',          // Pink 500
    },

    // Status Colors - Keep existing success/warning/error, update pending
    status: {
      success: '#22C55E',       // Green 500 (keep existing)
      warning: '#F59E0B',       // Amber 500 (keep existing)
      error: '#EF4444',         // Red 500 (keep existing)
      info: '#3B82F6',          // Blue 500 (keep existing)
      pending: '#C6FF00',       // Neon green - updated from purple
    },

    // Border Colors - Updated to use neon green accents
    border: {
      subtle: 'rgba(75, 85, 99, 0.3)',    // Very subtle borders
      default: 'rgba(107, 114, 128, 0.4)', // Default borders
      strong: 'rgba(156, 163, 175, 0.6)',  // Strong borders
      focus: '#C6FF00',                     // Neon green focus state
      glow: 'rgba(198, 255, 0, 0.4)',     // Neon green glow borders
    },
  },

  // Typography System - Modern font hierarchy
  typography: {
    fonts: {
      primary: 'Inter',         // Primary font family
      secondary: 'Urbanist',    // Secondary font family
      mono: 'SF Mono',          // Monospace font
    },
    
    sizes: {
      // Display sizes
      display: {
        xl: { fontSize: 48, lineHeight: 56, fontWeight: '800' },
        lg: { fontSize: 40, lineHeight: 48, fontWeight: '800' },
        md: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
        sm: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
      },
      
      // Heading sizes
      heading: {
        h1: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
        h2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
        h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
        h4: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
      },
      
      // Body text sizes
      body: {
        lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
        md: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
        sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
        xs: { fontSize: 10, lineHeight: 14, fontWeight: '400' },
      },
      
      // Label sizes
      label: {
        lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
        md: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
        sm: { fontSize: 10, lineHeight: 14, fontWeight: '500' },
      },
    },
  },

  // Spacing System - Consistent spacing scale
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

  // Border Radius System
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  // Shadow System - Modern elevation
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 12,
    },
    glow: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  // Component Specific Styles
  components: {
    // Button variants
    button: {
      height: {
        sm: 32,
        md: 40,
        lg: 48,
        xl: 56,
      },
      padding: {
        sm: { paddingHorizontal: 12, paddingVertical: 6 },
        md: { paddingHorizontal: 16, paddingVertical: 8 },
        lg: { paddingHorizontal: 20, paddingVertical: 12 },
        xl: { paddingHorizontal: 24, paddingVertical: 14 },
      },
    },

    // Input variants
    input: {
      height: 48,
      borderRadius: 12,
      padding: { paddingHorizontal: 16, paddingVertical: 12 },
    },

    // Card variants
    card: {
      borderRadius: 16,
      padding: 20,
      margin: 4,
    },

    // Tab bar
    tabBar: {
      height: 84,
      paddingBottom: 24,
      paddingTop: 8,
      borderRadius: 24,
    },
  },

  // Gradient Definitions
  gradients: {
    primary: ['#8B5CF6', '#3B82F6'],
    secondary: ['#6366F1', '#8B5CF6'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    error: ['#EF4444', '#DC2626'],
    surface: ['#1F2937', '#111827'],
    glass: ['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)'],
    overlay: ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.8)'],
  },

  // Animation Timings
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
    
    // Specific animation configs
    spring: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    
    easing: {
      default: 'ease-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Blur Effects
  blur: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;



export default AITheme;
