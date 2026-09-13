'use client';

import Link from 'next/link';
import {
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';

type GlassButtonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  'aria-label'?: string;
};

/**
 * Glass CTA pill — same rim-light language as the header,
 * with a deliberate hover scale (header bubbles stay size-locked).
 */
export function GlassButton({
  children,
  href,
  className = '',
  onClick,
  type = 'button',
  ...aria
}: GlassButtonProps) {
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
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const reach = Math.max(r.width, r.height) * 2.8;
      const intensity = Math.max(0.35, 1 - dist / reach);
      el.style.setProperty('--glow-intensity', intensity.toFixed(3));
    };

    window.addEventListener('pointermove', track, { passive: true });
    return () => window.removeEventListener('pointermove', track);
  }, []);

  const classes = `mig-glass mig-glass--cta ${className}`.trim();

  if (href) {
    return (
      <Link
        ref={ref as never}
        href={href}
        className={classes}
        onClick={onClick}
        {...aria}
      >
        <span className="mig-glass__fill" aria-hidden />
        <span className="mig-glass__rim" aria-hidden />
        <span className="mig-glass__body mig-glass__body--label">{children}</span>
      </Link>
    );
  }

  const Tag: ElementType = 'button';
  return (
    <Tag
      ref={ref as never}
      type={type}
      className={classes}
      onClick={onClick}
      {...aria}
    >
      <span className="mig-glass__fill" aria-hidden />
      <span className="mig-glass__rim" aria-hidden />
      <span className="mig-glass__body mig-glass__body--label">{children}</span>
    </Tag>
  );
}
