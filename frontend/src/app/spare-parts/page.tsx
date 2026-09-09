'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchSpareParts, SparePart } from '@/lib/api-client';

export default function SparePartsPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSpareParts()
      .then(setParts)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/products" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به محصولات
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">پس از فروش</p>
          <h1 className="display-feature mt-4 text-ink">قطعات یدکی</h1>
          <p className="body-lead mt-5 max-w-md">
            قطعات اصلی برای نگهداری و تعمیر دستگاه‌های MIG — تا مجموعه بدون وقفه کار کند.
          </p>
        </div>

        <div className="mt-12 border-t border-hairline md:mt-16">
          {parts.map((part) => (
            <article
              key={part.id}
              className="flex flex-col justify-between gap-6 border-b border-hairline py-8 sm:flex-row sm:items-end"
            >
              <div className="max-w-xl text-start">
                <p className="caption-up">{part.partNumber}</p>
                <h2 className="display-sm mt-3 text-ink">{part.nameFa}</h2>
                <p className="body-lead mt-3 text-sm">{part.description}</p>
                <p className="caption-up mt-5 text-white/45">
                  موجودی: {part.stockQuantity.toLocaleString('fa-IR')} · گارانتی:{' '}
                  {part.warrantyMonths.toLocaleString('fa-IR')} ماه
                </p>
              </div>
              <p className="shrink-0 font-ui text-sm text-ink">
                {part.price.toLocaleString('fa-IR')} ریال
              </p>
            </article>
          ))}

          {loaded && parts.length === 0 ? (
            <p className="border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
              قطعه‌ای در کاتالوگ نیست.
            </p>
          ) : null}

          {!loaded ? (
            <p className="border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
              در حال دریافت قطعات…
            </p>
          ) : null}
        </div>

        <div className="mt-14 md:mt-16">
          <Link href="/quote-request" className="btn-pill inline-flex">
            درخواست قطعه
          </Link>
        </div>
      </div>
    </div>
  );
}
