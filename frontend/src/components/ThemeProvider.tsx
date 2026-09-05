'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return children;
}
