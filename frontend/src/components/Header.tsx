/**
 * Header Component
 * Navigation header with logo and theme toggle
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-[#f3f0ea]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#101110]/90">
      <div className="mx-auto max-w-[1400px] px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-primary-500 bg-neutral-900 text-primary-500 transition-transform group-hover:rotate-45 dark:bg-white">
              <span className="text-lg font-black -rotate-45">M</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-[0.22em] text-neutral-900 dark:text-white">MIG</h1>
              <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">Industrial Group</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/products" className="text-xs font-bold text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300">
              محصولات
            </Link>
            <Link href="/projects" className="text-xs font-bold text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300">
              پروژه ها
            </Link>
            <Link href="/about" className="text-xs font-bold text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300">
              درباره
            </Link>
            <Link href="/contact" className="text-xs font-bold text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300">
              تماس
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-9 w-9 border border-neutral-300 p-0 dark:border-white/20"
            >
              {isDark ? '☼' : '◐'}
            </Button>

            <Button variant="primary" size="sm" className="hidden rounded-none bg-neutral-900 px-5 text-[11px] font-bold tracking-wide hover:bg-primary-600 sm:inline-flex dark:bg-primary-500 dark:text-neutral-900">
              دریافت مشاوره
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
