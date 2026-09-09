/**
 * Header — ناوبری مینیمال + موبایل امن
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const menuItems = [
  { href: '/products', label: 'محصولات' },
  { href: '/portfolio', label: 'نمونه‌کارها' },
  { href: '/projects', label: 'بهره‌برداری' },
  { href: '/services', label: 'خدمات' },
  { href: '/quote-request', label: 'استعلام' },
];

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-14 bg-transparent pt-[env(safe-area-inset-top)] md:h-16">
        <button
          type="button"
          className="nav-link absolute top-1/2 z-10 min-h-11 -translate-y-1/2 px-1 start-[max(1.25rem,env(safe-area-inset-right))] sm:start-10 md:start-16 lg:start-24 xl:start-28"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'بستن منو' : 'باز کردن منو'}
        >
          {open ? 'بستن' : 'منو'}
        </button>

        <Link
          href="/"
          className="brand-logo absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          onClick={() => setOpen(false)}
          aria-label="گروه صنعتی محمدی"
        >
          <img
            src="/Logo-DarkMode.png"
            alt="گروه صنعتی محمدی"
            className="brand-logo__img"
            width={120}
            height={120}
          />
        </Link>

        <Link
          href="/quote-request"
          className="nav-link absolute top-1/2 z-10 min-h-11 -translate-y-1/2 px-1 end-[max(1.25rem,env(safe-area-inset-left))] sm:end-10 md:end-16 lg:end-24 xl:end-28"
        >
          فروشگاه
        </Link>
      </header>

      <div
        className={`menu-overlay fixed inset-0 z-40 transition-[opacity,visibility] duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          open ? 'menu-overlay--open visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="menu-overlay__aurora" aria-hidden />
        <div className="menu-overlay__veil" aria-hidden />
        <nav className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-8 pt-16 sm:gap-7 md:gap-8">
          {menuItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="group min-h-11 text-center"
              style={{
                transitionDelay: open ? `${140 + i * 70}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(10px)',
                transitionProperty: 'opacity, transform',
                transitionDuration: '900ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              <span className="display-section block transition-opacity duration-500 group-hover:opacity-55">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};
