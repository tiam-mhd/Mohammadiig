/**
 * Header — سه حباب شیشه‌ای (دایره · کپسول · دایره)
 * نور لبه موس را در کل صفحه دنبال می‌کند؛ بدون تغییر سایز
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, {
  ElementType,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

const menuItems = [
  { href: '/products', label: 'محصولات' },
  { href: '/portfolio', label: 'نمونه‌کارها' },
  { href: '/projects', label: 'بهره‌برداری' },
  { href: '/services', label: 'خدمات' },
  { href: '/quote-request', label: 'استعلام' },
];

function IconMenu({ open }: { open: boolean }) {
  return (
    <svg className="site-header__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path
          d="M7 7l10 10M17 7L7 17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M6 8h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6 16h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function IconShop() {
  return (
    <svg className="site-header__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 9V8a4 4 0 0 1 8 0v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.2 9h9.6a1.5 1.5 0 0 1 1.49 1.66l-.55 5.2A2.2 2.2 0 0 1 15.56 18H8.44a2.2 2.2 0 0 1-2.18-2.14l-.55-5.2A1.5 1.5 0 0 1 7.2 9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type GlassBubbleProps = {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  as?: ElementType;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
};

function GlassBubble({
  className = '',
  onClick,
  children,
  as: Tag = 'div',
  ...aria
}: GlassBubbleProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const track = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      el.style.setProperty('--glow-angle', `${angle}deg`);
      // فاصله نرمال‌شده برای شدت نور (حتی خارج از المان)
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const reach = Math.max(r.width, r.height) * 2.8;
      const intensity = Math.max(0.35, 1 - dist / reach);
      el.style.setProperty('--glow-intensity', intensity.toFixed(3));
    };

    window.addEventListener('pointermove', track, { passive: true });
    return () => window.removeEventListener('pointermove', track);
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`mig-glass ${className}`.trim()}
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
      {...aria}
    >
      <span className="mig-glass__fill" aria-hidden />
      <span className="mig-glass__rim" aria-hidden />
      <span className="mig-glass__body">{children}</span>
    </Tag>
  );
}

export const Header: React.FC = () => {
  const router = useRouter();
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
      <header className="site-header">
        <div className="site-header__row">
          <GlassBubble
            as="button"
            className="site-header__orb"
            aria-label={open ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <IconMenu open={open} />
          </GlassBubble>

          <GlassBubble className="site-header__pill">
            <Link
              href="/"
              className="brand-logo site-header__logo"
              onClick={() => setOpen(false)}
              aria-label="گروه صنعتی محمدی"
            >
              <img
                src="/Logo-Gold.webp"
                alt="گروه صنعتی محمدی"
                className="brand-logo__img"
                width={120}
                height={120}
              />
            </Link>
          </GlassBubble>

          <GlassBubble
            as="button"
            className="site-header__orb"
            aria-label="فروشگاه"
            onClick={() => router.push('/quote-request')}
          >
            <IconShop />
          </GlassBubble>
        </div>
      </header>

      <div
        className={`menu-overlay fixed inset-0 z-40 transition-[opacity,visibility] duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          open ? 'menu-overlay--open visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="menu-overlay__aurora" aria-hidden />
        <div className="menu-overlay__veil" aria-hidden />
        <nav className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-6 pt-[max(5rem,12vh)] sm:gap-7 md:gap-8">
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
