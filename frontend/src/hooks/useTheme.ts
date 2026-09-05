/**
 * useTheme Hook
 * Provides theme configuration and store access throughout the app
 */

'use client';

import { useThemeStore } from '@/store/theme.store';
import { themeConfig } from '@/config/theme.config';

export const useTheme = () => {
  const { mode, setMode, isDark, toggleTheme } = useThemeStore();

  return {
    // Theme configuration
    config: themeConfig,
    
    // Theme state
    mode,
    isDark,
    
    // Theme actions
    setMode,
    toggleTheme,
    
    // Utility functions
    getColor: (colorKey: string) => {
      // Example: getColor('primary.500') returns the primary color at 500 weight
      return colorKey.split('.').reduce<unknown>((value, key) => {
        if (typeof value !== 'object' || value === null) return undefined;
        return (value as Record<string, unknown>)[key];
      }, themeConfig.colors);
    },

    getSpacing: (key: string | number) => {
      return themeConfig.spacing[key as keyof typeof themeConfig.spacing];
    },
  };
};
