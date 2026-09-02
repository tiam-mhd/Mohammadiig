import type { Config } from 'tailwindcss';
import { themeConfig } from './src/config/theme.config';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: themeConfig.colors.primary,
        secondary: themeConfig.colors.secondary,
        success: themeConfig.colors.success,
        error: themeConfig.colors.error,
        warning: themeConfig.colors.warning,
        neutral: themeConfig.colors.neutral,
      },
      fontFamily: {
        sans: themeConfig.typography.fontFamily.sans,
        mono: themeConfig.typography.fontFamily.mono,
        farsi: themeConfig.typography.fontFamily.farsi,
      },
      fontSize: themeConfig.typography.fontSize,
      fontWeight: themeConfig.typography.fontWeight,
      spacing: themeConfig.spacing,
      borderRadius: themeConfig.borderRadius,
      borderWidth: themeConfig.borderWidth,
      boxShadow: themeConfig.boxShadow,
      transitionDuration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      screens: {
        xs: themeConfig.breakpoints.xs,
        sm: themeConfig.breakpoints.sm,
        md: themeConfig.breakpoints.md,
        lg: themeConfig.breakpoints.lg,
        xl: themeConfig.breakpoints.xl,
        '2xl': themeConfig.breakpoints['2xl'],
      },
    },
  },
  plugins: [],
};

export default config;
