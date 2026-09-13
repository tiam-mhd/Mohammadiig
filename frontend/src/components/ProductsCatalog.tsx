'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlassButton } from '@/components/GlassButton';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProducts, Product, ProductCategory } from '@/lib/api-client';

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
    name: 'ماشین کودک',
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
    name: 'قطعات و پشتیبانی',
    description: 'قطعات اصلی و پشتیبانی فنی برای عملکرد بلندمدت مجموعه.',
    price: 8500000,
    currency: 'IRR',
    category: 'پس از فروش',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fm=webp&fit=crop&w=800&q=75',
    isFeatured: true,
  },
];

export function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([productResponse, categoryResponse]) => {
        if (productResponse.data?.length) setProducts(productResponse.data);
        setCategories(categoryResponse);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((product) => {
      const selected = categories.find((category) => category.id === selectedCategory);
      if (!selected) return product.category.toLowerCase() === selectedCategory;
      const needles = [selected.id, selected.slug, selected.nameEn, selected.nameEn.toUpperCase()];
      return needles.some((needle) => needle.toLowerCase() === product.category.toLowerCase());
    });
  }, [categories, products, selectedCategory]);

  return (
    <div className="products-page">
      <div className="content-shell products-shell">
        <header className="products-head">
          <div className="products-head__copy">
            <p className="products-kicker">کاتالوگ</p>
            <h1 className="products-title">محصولات</h1>
            <p className="products-lede">
              دستگاه‌ها و قطعات موردنیاز سالن شهربازی — تصویر را ببینید، مشخصات را مقایسه کنید.
            </p>
          </div>
          <GlassButton href="/quote-request">درخواست قیمت</GlassButton>
        </header>

        <div className="products-toolbar" role="toolbar" aria-label="فیلتر محصولات">
          <div className="products-chips">
            <button
              type="button"
              className={`products-chip${selectedCategory === '' ? ' is-active' : ''}`}
              onClick={() => setSelectedCategory('')}
              aria-pressed={selectedCategory === ''}
            >
              همه
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`products-chip${selectedCategory === category.id ? ' is-active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={selectedCategory === category.id}
              >
                {category.nameFa}
              </button>
            ))}
          </div>
          <p className="products-count" aria-live="polite">
            {isLoading
              ? 'در حال بارگذاری...'
              : `${visibleProducts.length.toLocaleString('fa-IR')} محصول`}
          </p>
        </div>

        <div className="products-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} {...product} href={`/products/${product.slug}`} />
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="products-empty">
            <p>محصولی در این دسته پیدا نشد.</p>
            <button type="button" className="products-empty__reset" onClick={() => setSelectedCategory('')}>
              نمایش همه
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
