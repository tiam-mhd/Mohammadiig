'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import { fetchProduct, fetchProductSpecifications, fetchProductVariants, Product, ProductSpecification, ProductVariant } from '@/lib/api-client';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProduct(params.slug).then((productResponse) => { setProduct(productResponse); return Promise.all([fetchProductVariants(productResponse.id), fetchProductSpecifications(productResponse.id)]); }).then(([variantResponse, specificationResponse]) => { setVariants(variantResponse); setSpecifications(specificationResponse); }).catch(() => setProduct(null)).finally(() => setIsLoading(false));
  }, [params.slug]);

  if (isLoading) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center text-neutral-500 dark:bg-neutral-900">در حال دریافت اطلاعات محصول...</main>;
  if (!product) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><h1 className="text-3xl font-black dark:text-white">محصول پیدا نشد</h1><Link href="/products" className="mt-6 inline-block text-primary-500">بازگشت به محصولات</Link></main>;

  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1200px]"><Link href="/products" className="text-xs font-bold text-primary-500">← بازگشت به کاتالوگ</Link><div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start"><div className="aspect-[1.2] overflow-hidden bg-neutral-100 dark:bg-neutral-800">{product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}</div><div><span className="eyebrow">{product.category}</span><h1 className="mt-5 text-4xl font-black leading-tight text-neutral-900 dark:text-white sm:text-6xl">{product.name}</h1><p className="mt-6 text-base leading-8 text-neutral-500 dark:text-neutral-400">{product.description}</p><div className="mt-8 border-y border-neutral-200 py-5 dark:border-white/10"><span className="text-xs text-neutral-500">قیمت پایه</span><strong className="mt-2 block text-2xl text-primary-500">{product.price.toLocaleString('fa-IR')} ریال</strong></div><Button size="lg" className="mt-8 rounded-none bg-primary-500 text-neutral-900">درخواست مشاوره برای این محصول</Button></div></div><div className="mt-16 grid gap-10 border-t border-neutral-200 pt-10 dark:border-white/10 md:grid-cols-2"><section><h2 className="text-2xl font-black dark:text-white">مشخصات فنی</h2><div className="mt-5 divide-y divide-neutral-200 dark:divide-white/10">{specifications.map((specification) => <div key={specification.id} className="flex justify-between gap-5 py-4 text-sm"><span className="text-neutral-500">{specification.specCategory} / {specification.specificationKey}</span><strong className="dark:text-white">{specification.specificationValue}{specification.unit ? ` ${specification.unit}` : ''}</strong></div>)}</div></section><section><h2 className="text-2xl font-black dark:text-white">مدل‌های قابل سفارش</h2><div className="mt-5 space-y-3">{variants.map((variant) => <div key={variant.id} className="flex items-center justify-between border border-neutral-200 p-4 dark:border-white/10"><div><strong className="block dark:text-white">{variant.variantNameFa}</strong><span className="mt-1 block text-xs text-neutral-500">{variant.skuVariant} / موجودی {variant.stockQuantity}</span></div><span className="text-sm font-bold text-primary-500">+{variant.priceAdjustment.toLocaleString('fa-IR')}</span></div>)}</div></section></div></div></main>;
}
