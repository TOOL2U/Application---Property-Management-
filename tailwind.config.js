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
      // Neon Green Dark Theme Color Palette
      colors: {
        // Background system - Updated with new surface color
        'dark-bg': '#0B0F1A',        // Primary background (deep navy-black)
        'dark-surface': '#1C1F2A',   // Surface/card background (elevated surfaces)
        'dark-elevated': '#1F2937',  // Secondary surfaces
        'dark-border': '#374151',    // Border color

        // Text hierarchy - Updated typography colors
        'text-primary': '#F1F1F1',   // Soft white for headings and important content
        'text-secondary': '#A1A1AA', // Muted gray for descriptions and secondary content
        'text-muted': '#71717A',     // Darker gray for subtle text

        // Brand colors - Neon green accent system
        'brand-primary': '#C6FF00',  // Neon green primary accent
        'brand-hover': '#A3E635',    // Lime green for hover/active states
        'brand-light': '#D4FF3A',    // Lighter neon green
        'brand-dark': '#84CC16',     // Darker lime for pressed states

        // Semantic colors - Keep existing success/warning/error
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',

        // Status colors - Updated pending to use neon green
        'status-pending': '#C6FF00',  // Neon green for pending status
        'status-progress': '#3b82f6',
        'status-completed': '#22c55e',
        'status-cancelled': '#ef4444',

        // Priority colors - Keep existing
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
        // Primary brand colors - Neon green scale
        primary: {
          50: '#f7ffe0',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#C6FF00',  // Main neon green
          600: '#84cc16',
          700: '#65a30d',
          800: '#4d7c0f',
          900: '#365314',
        },

        // Neon accent colors for dark theme - Updated with neon green
        neon: {
          green: '#C6FF00',  // Primary neon green
          lime: '#A3E635',   // Secondary lime green
          blue: '#3b82f6',
          cyan: '#06b6d4',
          orange: '#f59e0b',
          red: '#ef4444',
        },

        // Dark theme colors - Updated backgrounds
        dark: {
          bg: '#0B0F1A',     // Primary background
          surface: '#1C1F2A', // Surface/card background
          card: '#1F2937',   // Secondary surfaces
          border: '#374151', // Border color
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

      // Custom shadows (for web) - Updated with neon green glow effects
      boxShadow: {
        'neon-green': '0 0 20px rgba(198, 255, 0, 0.5)',      // Primary neon green glow
        'neon-lime': '0 0 20px rgba(163, 230, 53, 0.5)',      // Secondary lime glow
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.5)',      // Blue glow
        'neon-success': '0 0 20px rgba(34, 197, 94, 0.5)',    // Success green glow
        'glassmorphism': '0 8px 32px 0 rgba(28, 31, 42, 0.37)', // Updated glass effect
        'glow-primary': '0 0 20px rgba(198, 255, 0, 0.4)',    // Primary brand glow
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
