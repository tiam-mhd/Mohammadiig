'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  fetchProduct,
  fetchProductSpecifications,
  fetchProductVariants,
  Product,
  ProductSpecification,
  ProductVariant,
} from '@/lib/api-client';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProduct(params.slug)
      .then((productResponse) => {
        setProduct(productResponse);
        return Promise.all([
          fetchProductVariants(productResponse.id),
          fetchProductSpecifications(productResponse.id),
        ]);
      })
      .then(([variantResponse, specificationResponse]) => {
        setVariants(variantResponse);
        setSpecifications(specificationResponse);
      })
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">در حال دریافت اطلاعات محصول...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <h1 className="display-feature text-ink">محصول پیدا نشد</h1>
          <Link href="/products" className="btn-pill mt-10 inline-flex">
            بازگشت به محصولات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/products" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به کاتالوگ
        </Link>

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
          <div className="aspect-[16/11] overflow-hidden bg-surface-soft">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="caption-up">بدون تصویر</p>
              </div>
            )}
          </div>

          <div className="text-start">
            <p className="caption-up">{product.category}</p>
            <h1 className="display-feature mt-4 text-ink">{product.name}</h1>
            <p className="body-lead mt-5 max-w-md">{product.description}</p>

            <div className="mt-8 border-y border-hairline py-6">
              <p className="caption-up">قیمت پایه</p>
              <p className="mt-2 font-display text-2xl text-ink">
                {product.price.toLocaleString('fa-IR')}
                <span className="caption-up mr-2">ریال</span>
              </p>
            </div>

            <Link href="/quote-request" className="btn-pill mt-8 inline-flex">
              درخواست مشاوره برای این محصول
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-12 border-t border-hairline pt-12 md:mt-20 md:grid-cols-2 md:gap-16 md:pt-16">
          <section className="text-start">
            <h2 className="display-sm text-ink">مشخصات فنی</h2>
            {specifications.length === 0 ? (
              <p className="body-lead mt-5 text-muted">مشخصات فنی ثبت نشده است.</p>
            ) : (
              <div className="mt-6 divide-y divide-white/10">
                {specifications.map((specification) => (
                  <div key={specification.id} className="flex justify-between gap-5 py-4">
                    <span className="font-ui text-sm text-muted">
                      {specification.specCategory} / {specification.specificationKey}
                    </span>
                    <span className="font-ui text-sm text-ink">
                      {specification.specificationValue}
                      {specification.unit ? ` ${specification.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="text-start">
            <h2 className="display-sm text-ink">مدل‌های قابل سفارش</h2>
            {variants.length === 0 ? (
              <p className="body-lead mt-5 text-muted">مدل اضافه‌ای ثبت نشده است.</p>
            ) : (
              <div className="mt-6 space-y-0 divide-y divide-white/10 border-t border-white/10">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between gap-4 py-5">
                    <div>
                      <p className="font-ui text-base text-ink">{variant.variantNameFa}</p>
                      <p className="caption-up mt-2">
                        {variant.skuVariant} · موجودی {variant.stockQuantity.toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <p className="font-ui text-sm text-ink">
                      +{variant.priceAdjustment.toLocaleString('fa-IR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
