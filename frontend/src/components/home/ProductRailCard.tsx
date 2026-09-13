'use client';

import { GlassButton } from '@/components/GlassButton';
import { GlassPanel } from '@/components/home/GlassPanel';

type ProductRailCardProps = {
  index: string;
  name: string;
  tagline: string;
  href: string;
  image?: string;
};

/** Product card — GPU-friendly hover (transform + opacity only). */
export function ProductRailCard({
  index,
  name,
  tagline,
  href,
  image,
}: ProductRailCardProps) {
  return (
    <article className="home-rail__card">
      <div className="home-rail__media">
        {image ? (
          <img src={image} alt={name} loading="lazy" decoding="async" />
        ) : (
          <div className="home-rail__placeholder" aria-hidden>
            <span>بدون تصویر</span>
          </div>
        )}
      </div>

      <div className="home-rail__glow" aria-hidden />
      <div className="home-rail__shine" aria-hidden />
      <div className="home-rail__rim" aria-hidden />

      <GlassPanel
        mode={image ? 'frost' : 'backdrop'}
        frostSrc={image}
        className="home-rail__copy"
        bodyClassName="home-rail__copy-inner"
      >
        <span className="home-rail__badge" lang="en">
          {index}
        </span>
        <h3 className="home-rail__title">{name}</h3>
        <p className="home-rail__body">{tagline}</p>
        <div className="home-rail__cta">
          <GlassButton href={href}>جزئیات محصول</GlassButton>
        </div>
      </GlassPanel>
    </article>
  );
}
