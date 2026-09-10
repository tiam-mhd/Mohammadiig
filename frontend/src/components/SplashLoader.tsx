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

type Phase = 'assemble' | 'hold' | 'prefly' | 'fly' | 'expand' | 'reveal' | 'done';

const ASSEMBLE_MS = 1400;
const HOLD_MS = 2800;
const PREFLY_MS = 450;
const FLY_MS = 1100;
const EXPAND_MS = 900;
const REVEAL_MS = 1100;

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

function measureFlyTarget(source: HTMLElement) {
  const pill = document.querySelector<HTMLElement>('.site-header__pill');
  const logoImg = document.querySelector<HTMLElement>('.brand-logo__img');
  const s = source.getBoundingClientRect();
  const sourceCx = s.left + s.width / 2;
  const sourceCy = s.top + s.height / 2;

  if (pill) {
    const p = pill.getBoundingClientRect();
    const targetCx = p.left + p.width / 2;
    const targetCy = p.top + p.height / 2;
    const targetH = logoImg
      ? parseFloat(getComputedStyle(logoImg).height) || p.height * 0.62
      : p.height * 0.62;
    return {
      x: targetCx - sourceCx,
      y: targetCy - sourceCy,
      scale: Math.min(1, targetH / s.height),
    };
  }

  if (logoImg) {
    const t = logoImg.getBoundingClientRect();
    return {
      x: t.left + t.width / 2 - sourceCx,
      y: t.top + t.height / 2 - sourceCy,
      scale: Math.min(t.width / s.width, t.height / s.height),
    };
  }

  return { x: 0, y: 0, scale: 1 };
}

export function SplashLoader() {
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>('assemble');
  const [fly, setFly] = useState({ x: 0, y: 0, scale: 1 });
  const logoRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    document.body.style.overflow = '';
    clearSplashAttr();
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
    const expandEnd = flyEnd + EXPAND_MS;
    const revealEnd = expandEnd + REVEAL_MS;

    const t1 = window.setTimeout(() => setPhase('hold'), assembleEnd);
    const t2 = window.setTimeout(() => setPhase('prefly'), holdEnd);
    const t3 = window.setTimeout(() => {
      if (logoRef.current) setFly(measureFlyTarget(logoRef.current));
      setSplashAttr('dock');
      setPhase('fly');
    }, preflyEnd);
    const t4 = window.setTimeout(() => {
      setSplashAttr('expand');
      setPhase('expand');
    }, flyEnd);
    const t5 = window.setTimeout(() => {
      setSplashAttr('reveal');
      setPhase('reveal');
    }, expandEnd);
    const t6 = window.setTimeout(finish, revealEnd);

    timers.current = [t1, t2, t3, t4, t5, t6];

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      document.body.style.overflow = '';
    };
  }, [finish]);

  const showLabel = phase === 'hold';
  const chromeOpen = phase === 'fly' || phase === 'expand' || phase === 'reveal';
  const logoHandedOff = phase === 'expand' || phase === 'reveal';

  return (
    <AnimatePresence>
      {enabled && phase !== 'done' ? (
        <motion.div
          className={`splash-loader${chromeOpen ? ' splash-loader--chrome' : ''}`}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'reveal' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: REVEAL_MS / 1000, ease: [0.22, 0.61, 0.36, 1] }}
          aria-busy="true"
          aria-live="polite"
          aria-label="در حال بارگذاری"
        >
          <div className="splash-loader__stage">
            <motion.div
              ref={logoRef}
              className="splash-loader__logo"
              animate={
                phase === 'fly' || logoHandedOff
                  ? {
                      x: fly.x,
                      y: fly.y,
                      scale: fly.scale,
                      opacity: logoHandedOff ? 0 : 1,
                    }
                  : { x: 0, y: 0, scale: 1, opacity: 1 }
              }
              transition={{
                duration: FLY_MS / 1000,
                ease: [0.22, 0.61, 0.36, 1],
                opacity: { duration: 0.35, ease: 'easeOut' },
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

            <div className="splash-loader__captions">
              <motion.p
                className="splash-loader__brand"
                initial={{ opacity: 0, y: 12 }}
                animate={
                  showLabel
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: phase === 'assemble' ? 12 : -6 }
                }
                transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
              >
                Mohammadi Industrial Group
              </motion.p>
              <motion.p
                className="splash-loader__label"
                initial={{ opacity: 0, y: 10 }}
                animate={
                  showLabel
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: phase === 'assemble' ? 10 : -6 }
                }
                transition={{
                  duration: 0.5,
                  delay: showLabel ? 0.14 : 0,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              >
                Loading
              </motion.p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
