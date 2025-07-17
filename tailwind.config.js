/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
  ],

  // Use NativeWind preset for React Native compatibility
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      // Sia Moon AI-inspired color palette
      colors: {
        // Background system
        'dark-bg': '#0a0a0a',
        'dark-surface': '#111111',
        'dark-elevated': '#1a1a1a',
        'dark-border': '#333333',

        // Text hierarchy
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',

        // Brand colors
        'brand-primary': '#8b5cf6',
        'brand-hover': '#7c3aed',
        'brand-light': '#a78bfa',
        'brand-dark': '#6d28d9',

        // Semantic colors
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',

        // Status colors
        'status-pending': '#f59e0b',
        'status-progress': '#3b82f6',
        'status-completed': '#22c55e',
        'status-cancelled': '#ef4444',

        // Priority colors
        'priority-low': '#22c55e',
        'priority-medium': '#f59e0b',
        'priority-high': '#fb923c',
        'priority-urgent': '#ef4444',
      },

      // Inter font family
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },

      // Custom spacing (8px grid system)
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
      },

      // Custom border radius
      borderRadius: {
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
        '4xl': '2rem',    // 32px
      },

      // Custom shadows with glow effects
      boxShadow: {
        'glow-primary': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.4)',
      },

      // Animation durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },

  theme: {
    extend: {
      // Custom color palette for your property management app
      colors: {
        // Primary brand colors
        primary: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#9f75ff',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },

        // Neon accent colors for dark theme
        neon: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          blue: '#3b82f6',
          green: '#22c55e',
          orange: '#f59e0b',
          red: '#ef4444',
        },

        // Dark theme colors
        dark: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#1a1a1a',
          border: '#262626',
        },

        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },

      // Custom font family
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'system': ['system-ui', 'sans-serif'],
      },

      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },

      // Custom border radius
      borderRadius: {
        '4xl': '2rem',
      },

      // Custom shadows (for web)
      boxShadow: {
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.5)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glassmorphism': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },

      // Custom animations
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      // Custom keyframes
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // Custom backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },

  // Plugins (can be extended as needed)
  plugins: [],
}
