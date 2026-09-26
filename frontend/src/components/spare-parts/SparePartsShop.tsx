"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartBagIcon,
  IconDetails,
  IconPreview,
} from "@/components/icons/CartBagIcon";
import {
  fetchSparePartCategories,
  fetchSparePartsPage,
  type SparePart,
  type SparePartCategory,
} from "@/lib/api-client";
import { resolveMediaUrl } from "@/lib/media";
import { useCartStore } from "@/store/cart.store";
import { formatPartPrice } from "./formatSparePartPrice";
import {
  SparePartFilterModal,
  type SparePartFilters,
} from "./SparePartFilterModal";
import { SparePartPreviewModal } from "./SparePartPreviewModal";

const emptyFilters: SparePartFilters = {
  category: "",
  inStock: false,
  minPrice: "",
  maxPrice: "",
};

function canAddPart(part: SparePart) {
  return !part.priceNegotiable && part.stockQuantity > 0 && part.price > 0;
}

function addPartToCart(part: SparePart) {
  if (!canAddPart(part)) return;
  useCartStore.getState().addItem({
    sparePartId: part.id,
    slug: part.slug || part.id,
    partNumber: part.partNumber,
    nameFa: part.nameFa,
    imageUrl: part.imageUrl,
    unitPrice: part.price,
    currency: part.currency || "IRR",
    maxStock: part.stockQuantity,
  });
}

function PartCardActions({
  part,
  href,
  addable,
  onPreview,
  onAdded,
}: {
  part: SparePart;
  href: string;
  addable: boolean;
  onPreview: () => void;
  onAdded: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="sp-icon-btn"
        disabled={!addable}
        aria-label={
          part.priceNegotiable
            ? "قیمت توافقی"
            : part.stockQuantity <= 0
              ? "ناموجود"
              : "افزودن به سبد خرید"
        }
        title={
          part.priceNegotiable
            ? "قیمت توافقی"
            : part.stockQuantity <= 0
              ? "ناموجود"
              : "افزودن به سبد"
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addPartToCart(part);
          if (addable) onAdded();
        }}
      >
        <CartBagIcon className="sp-action-icon" />
      </button>
      <button
        type="button"
        className="sp-icon-btn"
        aria-label={`پیش‌نمایش ${part.nameFa}`}
        title="پیش‌نمایش"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPreview();
        }}
      >
        <IconPreview />
      </button>
      <Link
        href={href}
        className="sp-icon-btn"
        aria-label={`جزئیات ${part.nameFa}`}
        title="جزئیات"
        onClick={(e) => e.stopPropagation()}
      >
        <IconDetails />
      </Link>
    </>
  );
}

export function SparePartsShop() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<SparePartFilters>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [preview, setPreview] = useState<SparePart | null>(null);
  const [toast, setToast] = useState("");
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 50_000_000 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters]);

  useEffect(() => {
    fetchSparePartCategories()
      .then((list) => setCategories(list.filter((c) => c.isActive !== false)))
      .catch(() => undefined);

    fetchSparePartsPage({ limit: 100 })
      .then((response) => {
        const list = response.data;
        const priced = list.filter((p) => !p.priceNegotiable && p.price > 0);
        if (!priced.length) return;
        const min = Math.min(...priced.map((p) => p.price));
        const max = Math.max(...priced.map((p) => p.price));
        setPriceBounds({ min, max: max === min ? min + 100_000 : max });
      })
      .catch(() => undefined);
  }, []);

  const loadParts = useCallback(async () => {
    setLoaded(false);
    setError("");
    try {
      const min = filters.minPrice.trim()
        ? Number(filters.minPrice)
        : undefined;
      const max = filters.maxPrice.trim()
        ? Number(filters.maxPrice)
        : undefined;
      const response = await fetchSparePartsPage({
        q: debouncedQuery || undefined,
        category: filters.category || undefined,
        inStock: filters.inStock || undefined,
        minPrice: Number.isFinite(min) ? min : undefined,
        maxPrice: Number.isFinite(max) ? max : undefined,
        page,
        limit: 20,
      });
      setParts(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch {
      setParts([]);
      setError("دریافت قطعات انجام نشد.");
    } finally {
      setLoaded(true);
    }
  }, [debouncedQuery, filters, page]);

  useEffect(() => {
    void loadParts();
  }, [loadParts]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category) n += 1;
    if (filters.inStock) n += 1;
    if (filters.minPrice) n += 1;
    if (filters.maxPrice) n += 1;
    return n;
  }, [filters]);

  function flashAdded() {
    setToast("به سبد اضافه شد");
  }

  return (
    <div className="sp-shop sp-shop--soft bg-canvas">
      <div className="sp-shop__glow" aria-hidden />
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link
          href="/products"
          className="caption-up text-ink/70 transition-opacity hover:opacity-100"
        >
          ← بازگشت به محصولات
        </Link>

        <div className="sp-shop__hero mt-10 md:mt-12">
          <div className="max-w-2xl text-start">
            <p className="caption-up">پس از فروش</p>
            <h1 className="display-feature mt-4 text-ink">قطعات یدکی</h1>
            <p className="body-lead mt-5 max-w-md">
              قطعات اصلی را آرام و دقیق انتخاب کنید — برای نگهداری بی‌وقفه
              دستگاه‌های MIG.
            </p>
          </div>
          <Link
            href="/quote-request"
            className="btn-pill sp-shop__hero-cta shrink-0"
          >
            درخواست قطعه سفارشی
          </Link>
        </div>

        <div className="sp-toolbar mt-10 md:mt-12">
          <label className="sp-search">
            <span className="sr-only">جستجو</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام یا شماره قطعه…"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="sp-filter-btn"
            onClick={() => setFilterOpen(true)}
          >
            فیلتر
            {activeFilterCount > 0 ? (
              <span className="sp-filter-btn__count">
                {activeFilterCount.toLocaleString("fa-IR")}
              </span>
            ) : null}
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="sp-chips mt-6" role="list">
            <button
              type="button"
              role="listitem"
              className={`sp-chip${!filters.category ? " sp-chip--active" : ""}`}
              onClick={() => setFilters((f) => ({ ...f, category: "" }))}
            >
              همه
            </button>
            {categories.map((cat) => {
              const value = cat.slug || cat.nameEn || cat.nameFa;
              const active = filters.category === value;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="listitem"
                  className={`sp-chip${active ? " sp-chip--active" : ""}`}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      category: active ? "" : value,
                    }))
                  }
                >
                  {cat.nameFa}
                </button>
              );
            })}
          </div>
        ) : null}

        {toast ? (
          <p className="sp-toast mt-6" role="status">
            {toast}
          </p>
        ) : null}
        {error ? <p className="field-message mt-6">{error}</p> : null}

        <div className="sp-shop__catalog">
          {!loaded ? <p className="sp-empty">در حال دریافت قطعات…</p> : null}

          {loaded && parts.length === 0 ? (
            <p className="sp-empty">قطعه‌ای با این شرایط یافت نشد.</p>
          ) : null}

          {loaded && parts.length > 0 ? (
            <div className="sp-grid">
              {parts.map((part) => {
                const imageSrc = resolveMediaUrl(part.imageUrl);
                const href = `/spare-parts/${encodeURIComponent(part.slug || part.id)}`;
                const addable = canAddPart(part);
                return (
                  <article key={part.id} className="sp-card">
                    <div className="sp-card__media-wrap">
                      <button
                        type="button"
                        className="sp-card__media"
                        onClick={() => setPreview(part)}
                        aria-label={`پیش‌نمایش ${part.nameFa}`}
                      >
                        {imageSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageSrc} alt="" loading="lazy" />
                        ) : (
                          <span className="font-ui text-xs text-muted">
                            بدون تصویر
                          </span>
                        )}
                      </button>
                      <div className="sp-card__icons sp-card__icons--hover">
                        <PartCardActions
                          part={part}
                          href={href}
                          addable={addable}
                          onPreview={() => setPreview(part)}
                          onAdded={flashAdded}
                        />
                      </div>
                    </div>

                    <div className="sp-card__body text-start">
                      <p className="caption-up">{part.partNumber}</p>
                      <Link href={href} className="sp-card__title">
                        {part.nameFa}
                      </Link>
                      <p className="sp-card__price">{formatPartPrice(part)}</p>

                      <div className="sp-card__icons sp-card__icons--mobile">
                        <PartCardActions
                          part={part}
                          href={href}
                          addable={addable}
                          onPreview={() => setPreview(part)}
                          onAdded={flashAdded}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
          {loaded && totalPages > 1 ? (
            <div
              className="mt-8 flex items-center justify-center gap-3"
              dir="rtl"
            >
              <button
                type="button"
                className="btn-pill btn-pill--ghost"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                قبلی
              </button>
              <span className="text-sm text-muted">
                {total.toLocaleString("fa-IR")} قطعه · صفحه{" "}
                {page.toLocaleString("fa-IR")} از{" "}
                {totalPages.toLocaleString("fa-IR")}
              </span>
              <button
                type="button"
                className="btn-pill btn-pill--ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                بعدی
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <SparePartFilterModal
        open={filterOpen}
        categories={categories}
        initial={filters}
        priceBounds={priceBounds}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />

      <SparePartPreviewModal
        open={Boolean(preview)}
        part={preview}
        onClose={() => setPreview(null)}
        onAdded={flashAdded}
      />
    </div>
  );
}
