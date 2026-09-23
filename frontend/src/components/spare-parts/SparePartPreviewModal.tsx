'use client';

import Link from 'next/link';
import { useEffect, useId } from 'react';
import { CartBagIcon } from '@/components/icons/CartBagIcon';
import type { SparePart } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';
import { useCartStore } from '@/store/cart.store';
import { formatPartPrice } from './formatSparePartPrice';

type SparePartPreviewModalProps = {
  part: SparePart | null;
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export function SparePartPreviewModal({
  part,
  open,
  onClose,
  onAdded,
}: SparePartPreviewModalProps) {
  const titleId = useId();

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

  if (!open || !part) return null;

  const imageSrc = resolveMediaUrl(part.imageUrl);
  const detailHref = `/spare-parts/${encodeURIComponent(part.slug || part.id)}`;
  const canAdd = !part.priceNegotiable && part.stockQuantity > 0 && part.price > 0;

  function addToCart() {
    if (!canAdd) return;
    useCartStore.getState().addItem({
      sparePartId: part!.id,
      slug: part!.slug || part!.id,
      partNumber: part!.partNumber,
      nameFa: part!.nameFa,
      imageUrl: part!.imageUrl,
      unitPrice: part!.price,
      currency: part!.currency || 'IRR',
      maxStock: part!.stockQuantity,
    });
    onAdded?.();
  }

  return (
    <div className="sp-modal" role="presentation">
      <button type="button" className="sp-modal__backdrop" aria-label="بستن" onClick={onClose} />
      <div
        className="sp-modal__panel sp-modal__panel--soft sp-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="caption-up">{part.partNumber}</p>
          <button type="button" className="caption-up text-muted hover:text-ink" onClick={onClose}>
            بستن
          </button>
        </div>

        <div className="sp-preview__body mt-6">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={part.nameFa} className="sp-preview__image" />
          ) : (
            <div className="sp-preview__image sp-preview__image--empty">
              <span className="font-ui text-xs text-muted">بدون تصویر</span>
            </div>
          )}

          <div className="text-start">
            <h2 id={titleId} className="display-sm text-ink">
              {part.nameFa}
            </h2>
            <p className="mt-3 font-ui text-sm text-ink">{formatPartPrice(part)}</p>
            <p className="caption-up mt-3 text-ink/45">
              موجودی: {part.stockQuantity.toLocaleString('fa-IR')}
              {part.warrantyMonths
                ? ` · گارانتی: ${part.warrantyMonths.toLocaleString('fa-IR')} ماه`
                : ''}
            </p>
            {(part.shortDescription || part.description) && (
              <p className="body-lead mt-4 text-sm">
                {part.shortDescription || part.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="sp-detail__cart-btn"
                disabled={!canAdd}
                onClick={addToCart}
              >
                <CartBagIcon className="sp-action-icon" />
                <span>
                  {part.priceNegotiable
                    ? 'قیمت توافقی'
                    : part.stockQuantity <= 0
                      ? 'ناموجود'
                      : 'افزودن به سبد'}
                </span>
              </button>
              <Link href={detailHref} className="btn-pill btn-pill--ghost" onClick={onClose}>
                مشاهده جزئیات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
