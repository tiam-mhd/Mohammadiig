'use client';

import { useEffect, useState } from 'react';
import { fetchCategories, fetchProducts, Product, ProductCategory } from '@/lib/api-client';
import { ProductCard } from './ProductCard';

const fallbackProducts: Product[] = [
  { id: '1', slug: 'bumper-car-signature', name: 'Bumper Car / سری Signature', description: 'بدنه مهندسی شده، ایمنی بالا و آماده برای بهره برداری حرفه ای.', price: 45000000, currency: 'IRR', category: 'EQUIPMENT', image: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=85', isFeatured: true },
  { id: '2', slug: 'junior-play', name: 'Junior / سری Play', description: 'نسخه ایمن و پرانرژی برای تجربه ای ماندگار در فضاهای خانوادگی.', price: 15000000, currency: 'IRR', category: 'FAMILY', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85', isFeatured: true },
  { id: '3', slug: 'mig-care-spare-parts', name: 'MIG Care / قطعات یدکی', description: 'قطعات اصلی و پشتیبانی فنی برای حفظ عملکرد بلندمدت مجموعه.', price: 8500000, currency: 'IRR', category: 'AFTER-SALES', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85', isFeatured: true },
];

export function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([productResponse, categoryResponse]) => {
        setProducts(productResponse.data);
        setCategories(categoryResponse);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const visibleProducts = selectedCategory
    ? products.filter((product) => product.category.toLowerCase() === selectedCategory)
    : products;

  return (
    <>
      <div className="mb-12 flex flex-col justify-between gap-6 border-b border-neutral-200 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">CATALOG / {products.length.toString().padStart(2, '0')} SYSTEMS</span>
          <h1 className="mt-4 text-4xl font-black text-neutral-900 dark:text-white sm:text-6xl">محصولات MIG</h1>
        </div>
        <label className="flex items-center gap-3 text-xs font-bold text-neutral-500">
          <span>فیلتر دسته‌بندی</span>
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="border border-neutral-300 bg-transparent px-4 py-3 text-neutral-900 outline-none dark:border-white/20 dark:text-white">
            <option value="">همه محصولات</option>
            {categories.map((category) => <option key={category.id} value={category.nameEn.toLowerCase()}>{category.nameFa}</option>)}
          </select>
        </label>
      </div>
      <div className="mb-6 text-[10px] font-bold tracking-wider text-neutral-500">{isLoading ? 'SYNCING CATALOG...' : `${visibleProducts.length} PRODUCTS AVAILABLE`}</div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => <ProductCard key={product.id} {...product} href={`/products/${product.slug}`} />)}
      </div>
      {visibleProducts.length === 0 && <p className="border border-dashed border-neutral-300 py-16 text-center text-neutral-500">محصولی در این دسته پیدا نشد.</p>}
    </>
  );
}
