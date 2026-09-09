'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';

type ModelBandProps = {
  image: string;
  name: string;
  tagline: string;
  href: string;
  index: string;
};

export function ModelBand({ image, name, tagline, href, index }: ModelBandProps) {
  return (
    <section className="model-band relative flex min-h-[68svh] overflow-hidden md:min-h-[72svh]">
      <div className="absolute inset-0">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          style={{ objectPosition: 'center' }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
      </div>

      <div className="content-shell section-copy relative z-10 flex w-full flex-col items-start justify-end text-start">
        <Reveal className="w-full max-w-md">
          <p className="caption-up text-white/65">{index}</p>
          <h3 className="display-feature mt-3">{name}</h3>
          <p className="body-lead mt-3 text-white/85">{tagline}</p>
          <Link href={href} className="btn-pill mt-8">
            جزئیات محصول
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
