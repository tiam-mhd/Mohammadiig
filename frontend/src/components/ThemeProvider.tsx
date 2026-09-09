'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Marketing = dark Bugatti. Ops console (/admin) = light industrial workspace. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOps = Boolean(pathname?.startsWith('/admin'));

  useEffect(() => {
    if (isOps) {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.background = '#e8edf3';
      document.body.style.background = '#e8edf3';
      document.body.style.color = '#142033';
      return () => {
        document.documentElement.style.background = '';
        document.body.style.background = '';
        document.body.style.color = '';
      };
    }
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.background = '';
    document.body.style.background = '';
    document.body.style.color = '';
  }, [isOps]);

  return children;
}
