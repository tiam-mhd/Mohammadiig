'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, Product } from '@/lib/api-client';
import { ProductCard } from './ProductCard';

const fallbackProducts: Product[] = [
  {
    id: '1',
    slug: 'bumper-car-signature',
    name: 'ماشین برخوردی / سری امضا',
    description: 'بدنه مهندسی‌شده، ایمنی بالا و آماده برای بهره‌برداری حرفه‌ای.',
    price: 45000000,
    currency: 'IRR',
    category: 'تجهیزات',
    image:
      'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fm=webp&fit=crop&w=1000&q=75',
    isFeatured: true,
  },
  {
    id: '2',
    slug: 'junior-play',
    name: 'جونیور / پلی',
    description: 'نسخه ایمن و پرانرژی برای فضاهای خانوادگی.',
    price: 15000000,
    currency: 'IRR',
    category: 'خانواده',
    image:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fm=webp&fit=crop&w=800&q=75',
    isFeatured: true,
  },
  {
    id: '3',
    slug: 'mig-care-spare-parts',
    name: 'مراقبت MIG / قطعات',
    description: 'قطعات اصلی و پشتیبانی فنی برای عملکرد بلندمدت.',
    price: 8500000,
    currency: 'IRR',
    category: 'پس از فروش',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fm=webp&fit=crop&w=800&q=75',
    isFeatured: true,
  },
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
      <p className="caption-up mb-10">
        <span
          className={`ml-2 inline-block h-1.5 w-1.5 rounded-full ${
            isConnected ? 'bg-success' : 'bg-muted'
          }`}
        />
        {isConnected ? 'کاتالوگ زنده' : 'کاتالوگ منتخب'}
      </p>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-x-10 md:gap-y-16">
        {products.map((product, index) => (
          <div key={product.id} className={index === 0 ? 'md:col-span-2' : ''}>
            <ProductCard {...product} slug={product.slug} />
          </div>
        ))}
      </div>
    </>
  );
}
