'use client';

import { useEffect, useState } from 'react';
import { fetchCategories, fetchProducts, Product, ProductCategory } from '@/lib/api-client';
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
        setProducts(productResponse.data);
        setCategories(categoryResponse);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const visibleProducts = selectedCategory
    ? products.filter((product) => {
        const selected = categories.find((category) => category.id === selectedCategory);
        if (!selected) return product.category.toLowerCase() === selectedCategory;
        const needles = [selected.id, selected.slug, selected.nameEn, selected.nameEn.toUpperCase()];
        return needles.some((needle) => needle.toLowerCase() === product.category.toLowerCase());
      })
    : products;

  return (
    <>
      <div className="mb-12 flex flex-col justify-between gap-8 border-b border-hairline pb-10 sm:mb-16 sm:flex-row sm:items-end sm:pb-12">
        <div className="max-w-xl text-start">
          <p className="caption-up">کاتالوگ · {products.length.toLocaleString('fa-IR')} محصول</p>
          <h1 className="display-feature mt-4 text-ink">محصولات</h1>
          <p className="body-lead mt-4 max-w-md">
            دستگاه‌ها و قطعات موردنیاز سالن شهربازی و مجموعه‌های تفریحی.
          </p>
        </div>

        <label className="flex w-full max-w-xs flex-col gap-2 text-start sm:w-auto">
          <span className="caption-up">دسته‌بندی</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-h-11 border border-white/25 bg-transparent px-4 py-3 font-ui text-sm text-ink outline-none transition-[border-color] duration-300 focus:border-white"
          >
            <option value="" className="bg-canvas text-ink">
              همه محصولات
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="bg-canvas text-ink">
                {category.nameFa}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="caption-up mb-8">
        {isLoading
          ? 'در حال بارگذاری کاتالوگ...'
          : `${visibleProducts.length.toLocaleString('fa-IR')} مورد نمایش داده می‌شود`}
      </p>

      <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} {...product} href={`/products/${product.slug}`} />
        ))}
      </div>

      {visibleProducts.length === 0 ? (
        <p className="mt-10 border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
          محصولی در این دسته پیدا نشد.
        </p>
      ) : null}
    </>
  );
}
