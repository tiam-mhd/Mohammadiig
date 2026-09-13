'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GlassButton } from '@/components/GlassButton';
import {
  fetchProduct,
  fetchProductSpecifications,
  fetchProductVariants,
  Product,
  ProductSpecification,
  ProductVariant,
} from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';

function SpecRows({ items, empty }: { items: ProductSpecification[]; empty: string }) {
  if (items.length === 0) {
    return <p className="pd-spec__empty">{empty}</p>;
  }

  return (
    <dl className="pd-spec__list">
      {items.map((specification) => (
        <div key={specification.id} className="pd-spec__row">
          <dt>{specification.specificationKey}</dt>
          <dd>
            {specification.specificationValue || '—'}
            {specification.unit ? ` ${specification.unit}` : ''}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchProduct(params.slug)
      .then((productResponse) => {
        setProduct(productResponse);
        setActiveImage(productResponse.image);
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

  const technicalSpecs = useMemo(
    () =>
      specifications.filter(
        (item) =>
          item.specCategory === 'technical' ||
          !['appearance', 'technical'].includes(item.specCategory),
      ),
    [specifications],
  );
  const appearanceSpecs = useMemo(
    () => specifications.filter((item) => item.specCategory === 'appearance'),
    [specifications],
  );

  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const urls = product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [];
    return urls.filter(Boolean);
  }, [product]);

  const heroSrc = resolveMediaUrl(activeImage || product?.image);

  if (isLoading) {
    return (
      <div className="products-page">
        <div className="content-shell products-shell products-state">
          <p className="products-kicker">محصول</p>
          <p className="products-lede">در حال دریافت اطلاعات محصول...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="products-page">
        <div className="content-shell products-shell products-state">
          <h1 className="products-title">محصول پیدا نشد</h1>
          <p className="products-lede">این محصول در کاتالوگ موجود نیست.</p>
          <GlassButton href="/products">بازگشت به محصولات</GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="content-shell products-shell">
        <Link href="/products" className="pd-back">
          ← بازگشت به کاتالوگ
        </Link>

        <div className="pd-hero">
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              {heroSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={heroSrc} src={heroSrc} alt={product.name} decoding="async" />
              ) : (
                <div className="pcard__placeholder">
                  <span>بدون تصویر</span>
                </div>
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="pd-gallery__thumbs" role="list">
                {gallery.map((url, index) => {
                  const resolved = resolveMediaUrl(url);
                  const isActive = (activeImage || product.image) === url;
                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      role="listitem"
                      className={`pd-gallery__thumb${isActive ? ' is-active' : ''}`}
                      aria-label={`تصویر ${index + 1}`}
                      aria-pressed={isActive}
                      onClick={() => setActiveImage(url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resolved} alt="" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="pd-info">
            <p className="products-kicker">{product.category}</p>
            <h1 className="pd-info__title">{product.name}</h1>
            <p className="pd-info__desc">{product.description}</p>

            <div className="pd-info__price">
              <span className="pcard__price-label">قیمت پایه</span>
              <p className="pd-info__price-value">
                {product.price.toLocaleString('fa-IR')}
                <span className="pcard__price-unit">ریال</span>
              </p>
            </div>

            <div className="pd-info__actions">
              <GlassButton href={`/quote-request?product=${encodeURIComponent(product.slug)}`}>
                درخواست مشاوره برای این محصول
              </GlassButton>
            </div>
          </div>
        </div>

        {product.descriptionLong ? (
          <section className="pd-section">
            <h2 className="pd-section__title">توضیحات کامل</h2>
            <div className="pd-section__body">{product.descriptionLong}</div>
          </section>
        ) : null}

        <div className="pd-specs">
          <section className="pd-section">
            <h2 className="pd-section__title">مشخصات فنی</h2>
            <SpecRows items={technicalSpecs} empty="مشخصات فنی ثبت نشده است." />
          </section>
          <section className="pd-section">
            <h2 className="pd-section__title">مشخصات ظاهری</h2>
            <SpecRows items={appearanceSpecs} empty="مشخصات ظاهری ثبت نشده است." />
          </section>
        </div>

        <section className="pd-section">
          <h2 className="pd-section__title">مدل‌های قابل سفارش</h2>
          {variants.length === 0 ? (
            <p className="pd-spec__empty">مدل اضافه‌ای ثبت نشده است.</p>
          ) : (
            <div className="pd-variants">
              {variants.map((variant) => (
                <div key={variant.id} className="pd-variant">
                  <div>
                    <p className="pd-variant__name">{variant.variantNameFa}</p>
                    <p className="pd-variant__meta">
                      {variant.skuVariant} · موجودی {variant.stockQuantity.toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <p className="pd-variant__price">
                    +{variant.priceAdjustment.toLocaleString('fa-IR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
