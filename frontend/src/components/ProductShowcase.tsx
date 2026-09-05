'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, Product } from '@/lib/api-client';
import { ProductCard } from './ProductCard';

const fallbackProducts: Product[] = [
  { id: '1', slug: 'bumper-car-signature', name: 'Bumper Car / سری Signature', description: 'بدنه مهندسی شده، ایمنی بالا و آماده برای بهره برداری حرفه ای.', price: 45000000, currency: 'IRR', category: 'EQUIPMENT', image: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=85', isFeatured: true },
  { id: '2', slug: 'junior-play', name: 'Junior / سری Play', description: 'نسخه ایمن و پرانرژی برای تجربه ای ماندگار در فضاهای خانوادگی.', price: 15000000, currency: 'IRR', category: 'FAMILY', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85', isFeatured: true },
  { id: '3', slug: 'mig-care-spare-parts', name: 'MIG Care / قطعات یدکی', description: 'قطعات اصلی و پشتیبانی فنی برای حفظ عملکرد بلندمدت مجموعه.', price: 8500000, currency: 'IRR', category: 'AFTER-SALES', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85', isFeatured: true },
];

export function ProductShowcase() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((response) => {
        if (isMounted) {
          setProducts(response.data);
          setIsConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsConnected(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-wider text-neutral-500">
        <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-primary-500'}`} />
        {isConnected ? 'LIVE CATALOG' : 'CURATED CATALOG'}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {products.map((product, index) => (
          <div key={product.id} className={index === 0 ? 'md:col-span-2' : ''}>
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </>
  );
}
