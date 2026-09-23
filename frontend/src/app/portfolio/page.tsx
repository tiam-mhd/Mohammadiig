'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchPortfolioWorks, PortfolioWork } from '@/lib/api-client';
import { labelOf, PORTFOLIO_CATEGORY } from '@/lib/admin-labels';
import { resolveMediaUrl } from '@/lib/media';

function locationLine(item: PortfolioWork) {
  return [item.province, item.city, item.locationDetail].filter(Boolean).join(' · ');
}

export default function PortfolioPage() {
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPortfolioWorks()
      .then(setWorks)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/" className="caption-up text-ink/70 transition-opacity hover:opacity-100">
          ← بازگشت به صفحه اول
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">برای مشتریان</p>
          <h1 className="display-feature mt-4 text-ink">نمونه‌کارها</h1>
          <p className="body-lead mt-5 max-w-md">
            کارهای اجراشده برای مجموعه‌ها — از تجهیز سالن تا راه‌اندازی کامل، با جزئیات مکان و نتیجه.
          </p>
        </div>

        <div className="mt-12 border-t border-hairline md:mt-16">
          {works.map((work) => {
            const coverSrc = resolveMediaUrl(work.coverImageUrl);
            return (
            <article
              key={work.id}
              className="flex flex-col justify-between gap-6 border-b border-hairline py-8 sm:flex-row sm:items-end"
            >
              <div className="flex max-w-xl gap-5 text-start">
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt=""
                    className="h-24 w-32 shrink-0 object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div>
                <p className="caption-up">
                  {labelOf(PORTFOLIO_CATEGORY, work.workCategory)}
                  {locationLine(work) ? ` · ${locationLine(work)}` : ''}
                </p>
                <h2 className="display-sm mt-3 text-ink">{work.titleFa}</h2>
                <p className="body-lead mt-3 text-sm">{work.summaryFa}</p>
                {work.priceNegotiable || (work.priceBase != null && work.priceBase > 0) ? (
                  <p className="caption-up mt-3 text-ink/55">
                    {work.priceNegotiable
                      ? 'قیمت توافقی'
                      : `از ${work.priceBase!.toLocaleString('fa-IR')} ریال`}
                  </p>
                ) : null}
                {work.clientName ? (
                  <p className="caption-up mt-4 text-ink/45">مشتری: {work.clientName}</p>
                ) : null}
                </div>
              </div>
              <Link href={`/portfolio/${work.slug}`} className="btn-pill shrink-0">
                جزئیات کار
              </Link>
            </article>
            );
          })}

          {loaded && works.length === 0 ? (
            <p className="border border-dashed border-ink/20 py-16 text-center font-ui text-sm text-muted">
              هنوز نمونه‌کاری منتشر نشده است.
            </p>
          ) : null}

          {!loaded ? (
            <p className="border border-dashed border-ink/20 py-16 text-center font-ui text-sm text-muted">
              در حال دریافت نمونه‌کارها…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
