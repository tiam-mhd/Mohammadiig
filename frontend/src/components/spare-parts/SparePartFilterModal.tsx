'use client';

import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import type { SparePartCategory } from '@/lib/api-client';
import { PriceRangeSlider } from './PriceRangeSlider';

export type SparePartFilters = {
  category: string;
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
};

type SparePartFilterModalProps = {
  open: boolean;
  categories: SparePartCategory[];
  initial: SparePartFilters;
  priceBounds: { min: number; max: number };
  onClose: () => void;
  onApply: (filters: SparePartFilters) => void;
};

export function SparePartFilterModal({
  open,
  categories,
  initial,
  priceBounds,
  onClose,
  onApply,
}: SparePartFilterModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState(initial);

  const bounds = useMemo(() => {
    const min = Math.max(0, priceBounds.min);
    const max = Math.max(min + 10_000, priceBounds.max);
    return { min, max };
  }, [priceBounds]);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const rangeMin = draft.minPrice.trim()
    ? Number(draft.minPrice)
    : bounds.min;
  const rangeMax = draft.maxPrice.trim()
    ? Number(draft.maxPrice)
    : bounds.max;

  function submit(e: FormEvent) {
    e.preventDefault();
    onApply(draft);
    onClose();
  }

  function reset() {
    const cleared: SparePartFilters = {
      category: '',
      inStock: false,
      minPrice: '',
      maxPrice: '',
    };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  }

  return (
    <div className="sp-modal" role="presentation">
      <button type="button" className="sp-modal__backdrop" aria-label="بستن" onClick={onClose} />
      <div
        className="sp-modal__panel sp-modal__panel--soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="caption-up">فیلتر</p>
            <h2 id={titleId} className="display-sm mt-2 text-ink">
              محدود کردن نتایج
            </h2>
          </div>
          <button type="button" className="caption-up text-muted hover:text-ink" onClick={onClose}>
            بستن
          </button>
        </div>

        <form className="mt-8 space-y-7" onSubmit={submit}>
          <label className="block text-start">
            <span className="caption-up">دسته‌بندی</span>
            <select
              className="sp-field sp-field--soft mt-2 w-full"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug || cat.nameEn || cat.nameFa}>
                  {cat.nameFa}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-start">
            <input
              type="checkbox"
              className="sp-check"
              checked={draft.inStock}
              onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))}
            />
            <span className="font-ui text-sm text-ink">فقط موجود در انبار</span>
          </label>

          <div className="text-start">
            <span className="caption-up">بازه قیمت</span>
            <div className="mt-4">
              <PriceRangeSlider
                min={bounds.min}
                max={bounds.max}
                valueMin={Number.isFinite(rangeMin) ? rangeMin : bounds.min}
                valueMax={Number.isFinite(rangeMax) ? rangeMax : bounds.max}
                onChange={({ min, max }) =>
                  setDraft((d) => ({
                    ...d,
                    minPrice: String(min),
                    maxPrice: String(max),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button type="submit" className="btn-pill">
              اعمال فیلتر
            </button>
            <button type="button" className="btn-pill btn-pill--ghost" onClick={reset}>
              پاک کردن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
