/**
 * ProductCard — model-photo pattern
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  href?: string;
  slug?: string;
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

  const inner = (
    <article className="group block bg-canvas text-start">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-soft">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="caption-up">بدون تصویر</p>
          </div>
        )}
      </div>

      <div className="pt-6">
        <p className="caption-up">{category}</p>
        <h3 className="display-sm mt-3 text-ink">{name}</h3>
        <p className="body-md mt-3 line-clamp-2 text-sm">{description}</p>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-hairline pt-5">
          <div>
            <p className="caption-up">شروع از</p>
            <p className="mt-1 font-display text-lg text-ink">
              {price.toLocaleString('fa-IR')}
              <span className="caption-up mr-2">ریال</span>
            </p>
          </div>
          {target ? (
            <span className="caption-up text-ink transition-opacity group-hover:opacity-60">
              جزئیات ←
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (target) {
    return (
      <Link href={target} className="block" aria-label={`مشاهده ${name}`}>
        {inner}
      </Link>
    );
  }

  return inner;
};
