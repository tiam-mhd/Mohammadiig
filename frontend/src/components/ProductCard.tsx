/**
 * ProductCard Component
 * Displays a product with image, name, and price
 */

'use client';

import React from 'react';
import { Button } from './Button';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  category,
  image,
}) => {
  return (
    <div className="group overflow-hidden border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary-500 dark:border-white/10 dark:bg-[#1b1d1b]">
      {/* Image */}
      <div className="relative aspect-[1.2] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
        ) : (
          <div className="p-4 text-center text-neutral-400 dark:text-neutral-600">
            <p className="text-sm">تصویر محصول</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="eyebrow mb-3">
          {category}
        </p>
        <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white line-clamp-2">
          {name}
        </h3>
        <p className="mb-6 text-sm leading-6 text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {description}
        </p>

        {/* Price and CTA */}
        <div className="flex items-end justify-between gap-2 border-t border-neutral-200 pt-4 dark:border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">شروع از</p>
            <p className="text-lg font-black text-primary-600 dark:text-primary-500">
              {price.toLocaleString('fa-IR')} <span className="text-[10px]">ریال</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-none p-0 text-xl">
            ←
          </Button>
        </div>
      </div>
    </div>
  );
};
