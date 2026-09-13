/**
 * ProductCard — clear product photo first, copy below
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  href?: string;
  slug?: string;
  index?: string;
  showPrice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  price,
  category,
  image,
  href,
  slug,
}) => {
  const target = href || (slug ? `/products/${slug}` : undefined);
  const imageSrc = resolveMediaUrl(image);

  const inner = (
    <article className="pcard">
      <div className="pcard__media">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={name} loading="lazy" decoding="async" />
        ) : (
          <div className="pcard__placeholder">
            <span>بدون تصویر</span>
          </div>
        )}
      </div>

      <div className="pcard__body">
        <p className="pcard__cat">{category}</p>
        <h3 className="pcard__title">{name}</h3>
        <p className="pcard__desc">{description}</p>
        <div className="pcard__foot">
          <div className="pcard__price">
            <span className="pcard__price-label">شروع از</span>
            <span className="pcard__price-value">
              {price.toLocaleString('fa-IR')}
              <span className="pcard__price-unit">ریال</span>
            </span>
          </div>
          {target ? <span className="pcard__link">جزئیات</span> : null}
        </div>
      </div>
    </article>
  );

  if (target) {
    return (
      <Link href={target} className="pcard-link" aria-label={`مشاهده ${name}`}>
        {inner}
      </Link>
    );
  }

  return inner;
};
