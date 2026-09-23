'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useThemeStore, type ThemeMode } from '@/store/theme.store';

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyPublicTheme(mode: ThemeMode) {
  const dark = resolveIsDark(mode);
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  html.style.colorScheme = dark ? 'dark' : 'light';
  html.style.background = '';
  document.body.style.background = '';
  document.body.style.color = '';
}

/** Marketing = user light/dark. Ops console (/admin) = forced light. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOps = Boolean(pathname?.startsWith('/admin'));
  const mode = useThemeStore((s) => s.mode);

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
    applyPublicTheme(mode);
    useThemeStore.setState({ isDark: resolveIsDark(mode) });

    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyPublicTheme('system');
      useThemeStore.setState({ isDark: resolveIsDark('system') });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isOps, mode]);

  return children;
}
