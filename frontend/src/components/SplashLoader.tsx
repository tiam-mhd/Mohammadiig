'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

const PIECES = [
  {
    id: 'left',
    src: '/logo-pieces/piece-left.webp',
    from: { x: '-58vw', y: '0vh' },
  },
  {
    id: 'right',
    src: '/logo-pieces/piece-right.webp',
    from: { x: '58vw', y: '0vh' },
  },
  {
    id: 'top-left',
    src: '/logo-pieces/piece-top-left.webp',
    from: { x: '-48vw', y: '-42vh' },
  },
  {
    id: 'top-right',
    src: '/logo-pieces/piece-top-right.webp',
    from: { x: '48vw', y: '-42vh' },
  },
  {
    id: 'bottom-left',
    src: '/logo-pieces/piece-bottom-left.webp',
    from: { x: '-48vw', y: '42vh' },
  },
  {
    id: 'bottom-right',
    src: '/logo-pieces/piece-bottom-right.webp',
    from: { x: '48vw', y: '42vh' },
  },
] as const;

type Phase = 'assemble' | 'hold' | 'prefly' | 'fly' | 'exit' | 'done';

const ASSEMBLE_MS = 1400;
const HOLD_MS = 3000;
const PREFLY_MS = 500;
const FLY_MS = 1100;
const EXIT_MS = 420;

function shouldSkipSplash() {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return false;
}

function clearSplashAttr() {
  document.documentElement.removeAttribute('data-splash');
}

function setSplashAttr(value: string) {
  document.documentElement.setAttribute('data-splash', value);
}

export function SplashLoader() {
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>('assemble');
  const [fly, setFly] = useState({ x: 0, y: 0, scale: 1 });
  const logoRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    document.body.style.overflow = '';
    setPhase('done');
    setEnabled(false);
  }, []);

  useEffect(() => {
    if (shouldSkipSplash()) {
      clearSplashAttr();
      return;
    }

    setSplashAttr('active');
    document.body.style.overflow = 'hidden';
    setEnabled(true);

    const assembleEnd = ASSEMBLE_MS;
    const holdEnd = assembleEnd + HOLD_MS;
    const preflyEnd = holdEnd + PREFLY_MS;
    const flyEnd = preflyEnd + FLY_MS;

    const t1 = window.setTimeout(() => setPhase('hold'), assembleEnd);
    const t2 = window.setTimeout(() => setPhase('prefly'), holdEnd);
    const t3 = window.setTimeout(() => {
      const source = logoRef.current;
      const target = document.querySelector<HTMLElement>('.brand-logo__img');
      if (source && target) {
        const s = source.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        const sourceCx = s.left + s.width / 2;
        const sourceCy = s.top + s.height / 2;
        const targetCx = t.left + t.width / 2;
        const targetCy = t.top + t.height / 2;
        const scale = Math.min(t.width / s.width, t.height / s.height);
        setFly({
          x: targetCx - sourceCx,
          y: targetCy - sourceCy,
          scale,
        });
      }
      setPhase('fly');
    }, preflyEnd);
    const t4 = window.setTimeout(() => {
      /* Reveal site only after logo has docked in the header */
      clearSplashAttr();
      setPhase('exit');
    }, flyEnd);
    const t5 = window.setTimeout(finish, flyEnd + EXIT_MS);

    timers.current = [t1, t2, t3, t4, t5];

    return () => {
      timers.current.forEach((id: number) => window.clearTimeout(id));
      document.body.style.overflow = '';
    };
  }, [finish]);

  const showLabel = phase === 'hold';

  return (
    <AnimatePresence>
      {enabled && phase !== 'done' ? (
        <motion.div
          className="splash-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_MS / 1000, ease: [0.22, 0.61, 0.36, 1] }}
          aria-busy="true"
          aria-live="polite"
          aria-label="در حال بارگذاری"
        >
          <div className="splash-loader__stage">
            <motion.div
              ref={logoRef}
              className="splash-loader__logo"
              animate={
                phase === 'fly' || phase === 'exit'
                  ? { x: fly.x, y: fly.y, scale: fly.scale }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={{
                duration: FLY_MS / 1000,
                ease: [0.22, 0.61, 0.36, 1],
              }}
            >
              {PIECES.map((piece, index) => (
                <motion.img
                  key={piece.id}
                  src={piece.src}
                  alt=""
                  draggable={false}
                  className="splash-loader__piece"
                  fetchPriority="high"
                  decoding="async"
                  initial={{
                    x: piece.from.x,
                    y: piece.from.y,
                    opacity: 0,
                    filter: 'blur(8px)',
                  }}
                  animate={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                  }}
                  transition={{
                    duration: ASSEMBLE_MS / 1000,
                    delay: index * 0.035,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              ))}
            </motion.div>

            <motion.p
              className="splash-loader__label"
              initial={{ opacity: 0, y: 14 }}
              animate={
                showLabel
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: phase === 'assemble' ? 14 : -8 }
              }
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              Loading
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
