'use client';

import { useEffect } from 'react';

/** Marketing surface is canvas-black only (Bugatti: no light mode). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  return children;
}
