/**
 * MIG (Mohammadi Industrial Group) - Centralized Theme Configuration
 * 
 * CRITICAL RULE: All styling must reference this configuration.
 * NO hardcoded colors anywhere in the codebase.
 * Components use Tailwind classes that map to these color values.
 */

export const themeConfig = {
  // Color Palettes - Tailwind safe colors
  colors: {
    // Primary Brand Color (MIG signature blue)
    primary: {
      50: '#f0f7ff',
      100: '#e0effe',
      200: '#c7e0fe',
      300: '#a4c9fd',
      400: '#80b1fc',
      500: '#3b82f6', // Base primary
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
    },
    // Secondary Brand Color (accent)
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7', // Base secondary
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    // Success State
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Base success
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#145231',
    },
    // Error/Danger State
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Base error
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Warning State
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Base warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Neutral (Grayscale)
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373', // Base neutral
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    // Background Colors
    background: {
      light: '#ffffff',
      default: '#f9fafb',
      dark: '#1f2937',
    },
  },

  // Typography System
  typography: {
    // Font Families
    fontFamily: {
      sans: [
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ],
      mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      // Persian/Farsi fonts
      farsi: ['IRANSans', 'system-ui', '-apple-system', 'sans-serif'],
    },

    // Font Sizes - Mobile-first responsive scale
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '3.5rem' }], // 48px
    },

    // Font Weights
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },

    // Line Heights
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing System - 4px base unit
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Border Widths
  borderWidth: {
    DEFAULT: '1px',
    0: '0',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  // Shadows
  boxShadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.5)', // Primary blue with opacity
  },

  // Transitions & Animations
  transition: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    timingFunction: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Responsive Breakpoints (Mobile-first)
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component-Specific Defaults
  components: {
    button: {
      baseStyles: {
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: 500,
        transition: 'all 200ms ease-in-out',
        cursor: 'pointer',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      },
      variants: {
        primary: {
          backgroundColor: '#3b82f6', // primary-500
          color: '#ffffff',
          hover: '#1d4ed8', // primary-600
        },
        secondary: {
          backgroundColor: '#a855f7', // secondary-500
          color: '#ffffff',
          hover: '#9333ea', // secondary-600
        },
        outline: {
          backgroundColor: 'transparent',
          color: '#3b82f6', // primary-500
          border: '1px solid #3b82f6',
          hover: '#f0f7ff', // primary-50
        },
        ghost: {
          backgroundColor: 'transparent',
          color: '#3b82f6',
          hover: '#f0f7ff',
        },
      },
      sizes: {
        xs: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
        sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
        md: { padding: '0.5rem 1rem', fontSize: '1rem' },
        lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
        xl: { padding: '1rem 2rem', fontSize: '1.25rem' },
      },
    },

    input: {
      baseStyles: {
        width: '100%',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid #e5e5e5',
        fontSize: '1rem',
        transition: 'all 150ms ease-in-out',
      },
      focus: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
    },

    card: {
      baseStyles: {
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1rem',
      },
    },
  },

  // RTL (Right-to-Left) Support for Farsi
  direction: 'rtl',
  lang: 'fa',

  // Dark Mode Support
  darkMode: 'class', // or 'media'
} as const;

// Export types for TypeScript support
export type ThemeConfig = typeof themeConfig;
export type ThemeColor = keyof typeof themeConfig.colors;
export type ThemeBreakpoint = keyof typeof themeConfig.breakpoints;
