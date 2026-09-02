/**
 * Theme Store - Zustand
 * Manages application theme state (light/dark mode, colors)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'light',
      isDark: false,

      setMode: (mode: ThemeMode) => {
        set({ mode });

        // Apply theme to document
        const html = document.documentElement;
        if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          html.classList.add('dark');
          set({ isDark: true });
        } else {
          html.classList.remove('dark');
          set({ isDark: false });
        }
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        get().setMode(newMode);
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
