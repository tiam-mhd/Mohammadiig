'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';

type PhotoBandProps = {
  image: string;
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  align?: 'start' | 'center' | 'end';
  minHeight?: string;
  objectPosition?: string;
  overlay?: 'left' | 'right' | 'bottom' | 'full';
  className?: string;
};

export function PhotoBand({
  image,
  eyebrow,
  title,
  body,
  ctaLabel = 'بیشتر بدانید',
  ctaHref,
  align = 'start',
  minHeight = 'min-h-[68svh] md:min-h-[78svh]',
  objectPosition = 'center',
  overlay = 'bottom',
  className = '',
}: PhotoBandProps) {
  const alignClass =
    align === 'center'
      ? 'items-center text-center'
      : align === 'end'
        ? 'items-end text-end md:items-end'
        : 'items-start text-start';

  const overlayClass =
    overlay === 'left'
      ? 'band-overlay--side bg-gradient-to-l from-transparent via-black/25 to-black/55'
      : overlay === 'right'
        ? 'band-overlay--side bg-gradient-to-r from-transparent via-black/25 to-black/55'
        : overlay === 'full'
          ? 'bg-black/40'
          : 'bg-gradient-to-t from-black/70 via-black/30 to-transparent';

  const bodyAlign =
    align === 'center' ? 'mx-auto' : align === 'end' ? 'ms-auto' : '';

  return (
    <section className={`photo-band relative flex overflow-hidden ${minHeight} ${className}`}>
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover slow-pan"
          style={{ objectPosition }}
          loading="lazy"
        />
        <div className={`absolute inset-0 ${overlayClass}`} />
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <div className={`content-shell section-copy relative z-10 flex w-full flex-col justify-end ${alignClass}`}>
        <Reveal className={`w-full max-w-md ${bodyAlign}`}>
          {eyebrow ? <p className="caption-up mb-3 text-white/75">{eyebrow}</p> : null}
          <h2 className="display-feature">{title}</h2>
          {body ? <p className={`body-lead mt-4 max-w-sm ${bodyAlign}`}>{body}</p> : null}
          {ctaHref ? (
            <div className={`mt-8 ${align === 'center' ? 'flex justify-center' : ''}`}>
              <Link href={ctaHref} className="btn-pill">
                {ctaLabel}
              </Link>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
