'use client';

import { type ReactNode } from 'react';

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: 'div' | 'aside' | 'article';
  /**
   * `backdrop` — blurs whatever is truly behind the panel (corner-accurate).
   * `frost` — blurred image copy (only for transformed parents like the product rail).
   */
  mode?: 'backdrop' | 'frost';
  /** Required when mode is `frost`. */
  frostSrc?: string;
};

export function GlassPanel({
  children,
  className = '',
  bodyClassName = '',
  as: Tag = 'div',
  mode = 'backdrop',
  frostSrc,
}: GlassPanelProps) {
  const useFrost = mode === 'frost' && Boolean(frostSrc);

  return (
    <Tag
      className={`mig-glass-panel mig-glass-panel--${useFrost ? 'frost' : 'backdrop'} ${className}`.trim()}
    >
      {useFrost ? (
        <div className="mig-glass-panel__frost" aria-hidden>
          <img src={frostSrc} alt="" loading="lazy" decoding="async" />
        </div>
      ) : null}
      <div className={`mig-glass-panel__body ${bodyClassName}`.trim()}>{children}</div>
    </Tag>
  );
}
