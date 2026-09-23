/**
 * Theme Store - Zustand
 * Public site light/dark preference (persisted).
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

function applyDomTheme(mode: ThemeMode): boolean {
  if (typeof document === 'undefined') return mode !== 'light';
  const dark =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  html.style.colorScheme = dark ? 'dark' : 'light';
  return dark;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      isDark: true,

      setMode: (mode: ThemeMode) => {
        const isDark = applyDomTheme(mode);
        set({ mode, isDark });
      },

      toggleTheme: () => {
        const next = get().isDark || get().mode === 'dark' ? 'light' : 'dark';
        get().setMode(next);
      },
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Skip ops routes — ThemeProvider owns those
        if (typeof window !== 'undefined') {
          const p = window.location.pathname;
          if (p === '/admin' || p.startsWith('/admin/')) return;
        }
        state.setMode(state.mode);
      },
    }
  )
);
