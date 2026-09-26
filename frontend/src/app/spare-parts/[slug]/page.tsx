"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CartBagIcon } from "@/components/icons/CartBagIcon";
import { SparePartGallery } from "@/components/spare-parts/SparePartGallery";
import { formatPartPrice } from "@/components/spare-parts/formatSparePartPrice";
import {
  fetchSparePart,
  fetchSpareParts,
  type SparePart,
} from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media";
import { useCartStore } from "@/store/cart.store";

export default function SparePartDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "");

  const [part, setPart] = useState<SparePart | null>(null);
  const [related, setRelated] = useState<SparePart[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoaded(false);
    fetchSparePart(slug)
      .then((item) => {
        if (cancelled) return;
        setPart(item);
        setQty(1);
        setError("");
        if (item.category) {
          fetchSpareParts({ category: item.category })
            .then((list) => {
              if (!cancelled) {
                setRelated(list.filter((p) => p.id !== item.id).slice(0, 6));
              }
            })
            .catch(() => undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPart(null);
          setError("قطعه یافت نشد.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const canAdd = useMemo(
    () =>
      Boolean(
        part &&
          !part.priceNegotiable &&
          part.stockQuantity > 0 &&
          part.price > 0,
      ),
    [part],
  );

  const maxQty = part?.stockQuantity ?? 0;

  function addToCart() {
    if (!part || !canAdd) return;
    useCartStore.getState().addItem({
      sparePartId: part.id,
      slug: part.slug || part.id,
      partNumber: part.partNumber,
      nameFa: part.nameFa,
      imageUrl: part.imageUrl,
      unitPrice: part.price,
      currency: part.currency || "IRR",
      maxStock: part.stockQuantity,
      quantity: qty,
    });
    setToast("به سبد اضافه شد");
  }

  if (!loaded) {
    return (
      <div className="sp-detail sp-detail--soft bg-canvas">
        <div className="content-shell section-copy pt-28">
          <p className="font-ui text-sm text-muted">در حال بارگذاری…</p>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="sp-detail sp-detail--soft bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">قطعات یدکی</p>
          <h1 className="display-feature mt-4 text-ink">
            {error || "یافت نشد"}
          </h1>
          <Link href="/spare-parts" className="btn-pill mt-10 inline-flex">
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    );
  }

  const specs = part.specs ?? [];

  return (
    <div className="sp-detail sp-detail--soft bg-canvas">
      <div className="sp-shop__glow" aria-hidden />
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link
          href="/spare-parts"
          className="caption-up text-ink/70 transition-opacity hover:opacity-100"
        >
          ← بازگشت به قطعات
        </Link>

        <div className="sp-detail__layout mt-10 md:mt-12">
          <SparePartGallery
            nameFa={part.nameFa}
            imageUrl={part.imageUrl}
            gallery={part.gallery}
          />

          <div className="sp-detail__info text-start">
            <p className="caption-up">{part.partNumber}</p>
            <h1 className="display-feature mt-3 text-ink md:mt-4">
              {part.nameFa}
            </h1>
            {part.nameEn ? (
              <p className="mt-2 font-ui text-sm text-muted">{part.nameEn}</p>
            ) : null}
            <p className="sp-detail__price mt-5">{formatPartPrice(part)}</p>
            <p className="caption-up mt-3 text-ink/45">
              موجودی: {part.stockQuantity.toLocaleString("fa-IR")}
              {part.warrantyMonths
                ? ` · گارانتی ${part.warrantyMonths.toLocaleString("fa-IR")} ماه`
                : ""}
            </p>

            {(part.shortDescription || part.description) && (
              <p className="body-lead mt-6 max-w-lg text-sm">
                {part.shortDescription || part.description}
              </p>
            )}

            {part.compatibleProducts?.length ? (
              <p className="mt-5 font-ui text-sm text-muted">
                سازگار با: {part.compatibleProducts.join(" · ")}
              </p>
            ) : null}

            <div className="sp-detail__buy mt-8">
              <div className="sp-qty sp-qty--soft" aria-label="تعداد">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="کاهش"
                >
                  −
                </button>
                <span>{qty.toLocaleString("fa-IR")}</span>
                <button
                  type="button"
                  disabled={qty >= maxQty}
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  aria-label="افزایش"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="sp-detail__cart-btn"
                disabled={!canAdd}
                onClick={addToCart}
              >
                <CartBagIcon className="sp-action-icon" />
                <span>
                  {part.priceNegotiable
                    ? "قیمت توافقی"
                    : part.stockQuantity <= 0
                      ? "ناموجود"
                      : "افزودن به سبد"}
                </span>
              </button>
            </div>
            {toast ? (
              <p className="sp-toast mt-4" role="status">
                {toast}
              </p>
            ) : null}
          </div>
        </div>

        <section className="sp-detail__specs mt-14 md:mt-16">
          <h2 className="display-sm text-ink">مشخصات</h2>
          <dl className="sp-specs mt-6">
            {part.brand ? (
              <div>
                <dt>برند</dt>
                <dd>{part.brand}</dd>
              </div>
            ) : null}
            {part.oemCode ? (
              <div>
                <dt>کد OEM</dt>
                <dd>{part.oemCode}</dd>
              </div>
            ) : null}
            {part.weightGrams != null ? (
              <div>
                <dt>وزن</dt>
                <dd>{part.weightGrams.toLocaleString("fa-IR")} گرم</dd>
              </div>
            ) : null}
            {part.dimensions ? (
              <div>
                <dt>ابعاد</dt>
                <dd>{part.dimensions}</dd>
              </div>
            ) : null}
            {part.warrantyMonths ? (
              <div>
                <dt>گارانتی</dt>
                <dd>{part.warrantyMonths.toLocaleString("fa-IR")} ماه</dd>
              </div>
            ) : null}
            {specs.map((row) => (
              <div key={`${row.key}-${row.value}`}>
                <dt>{row.key}</dt>
                <dd>
                  {row.value}
                  {row.unit ? ` ${row.unit}` : ""}
                </dd>
              </div>
            ))}
          </dl>
          {!part.brand &&
          !part.oemCode &&
          part.weightGrams == null &&
          !part.dimensions &&
          !part.warrantyMonths &&
          specs.length === 0 ? (
            <p className="mt-4 font-ui text-sm text-muted">
              مشخصات تکمیلی ثبت نشده است.
            </p>
          ) : null}

          {part.description && part.shortDescription ? (
            <p className="body-lead mt-8 max-w-2xl text-sm">
              {part.description}
            </p>
          ) : null}
        </section>

        {related.length > 0 ? (
          <section className="mt-14 md:mt-16">
            <h2 className="display-sm text-ink">قطعات مرتبط</h2>
            <div className="sp-grid sp-grid--related mt-8">
              {related.map((item) => {
                const src = resolveMediaUrl(item.imageUrl);
                const href = `/spare-parts/${encodeURIComponent(item.slug || item.id)}`;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="sp-card sp-card--link"
                  >
                    <div className="sp-card__media-wrap">
                      <div className="sp-card__media">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" loading="lazy" />
                        ) : null}
                      </div>
                    </div>
                    <div className="sp-card__body text-start">
                      <p className="caption-up">{item.partNumber}</p>
                      <span className="sp-card__title">{item.nameFa}</span>
                      <p className="sp-card__price">{formatPartPrice(item)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
