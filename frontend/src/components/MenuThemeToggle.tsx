'use client';

import { useTheme } from '@/hooks/useTheme';

/** Toggle at bottom of full-screen menu — light ↔ dark */
export function MenuThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تاریک'}
      className="menu-theme-toggle"
      onClick={toggleTheme}
    >
      <span className="menu-theme-toggle__track" aria-hidden>
        <span className="menu-theme-toggle__thumb" />
      </span>
      <span>{isDark ? 'حالت روشن' : 'حالت تاریک'}</span>
    </button>
  );
}
