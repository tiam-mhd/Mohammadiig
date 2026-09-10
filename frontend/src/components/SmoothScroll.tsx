'use client';

import { ReactNode } from 'react';

/**
 * Lenis applies transform on the scroll root, which breaks CSS backdrop-filter.
 * Keep native scrolling so glass panels can truly frost whatever sits behind them.
 * GSAP ScrollTrigger still handles section motion.
 */
export function SmoothScroll({ children }: { children: ReactNode; enabled?: boolean }) {
  return <>{children}</>;
}
