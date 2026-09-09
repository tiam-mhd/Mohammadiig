'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPortfolioWork, PortfolioWork } from '@/lib/api-client';
import { labelOf, PORTFOLIO_CATEGORY } from '@/lib/admin-labels';

export default function PortfolioDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [work, setWork] = useState<PortfolioWork | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchPortfolioWork(slug)
      .then(setWork)
      .catch(() => setError('نمونه‌کار پیدا نشد.'));
  }, [slug]);

  if (error) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="body-lead">{error}</p>
          <Link href="/portfolio" className="btn-pill mt-8 inline-flex">
            بازگشت به نمونه‌کارها
          </Link>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="body-lead">در حال دریافت…</p>
        </div>
      </div>
    );
  }

  const location = [work.country, work.province, work.city, work.locationDetail].filter(Boolean).join(' · ');

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/portfolio" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← همه نمونه‌کارها
        </Link>

        <div className="mt-10 max-w-3xl text-start md:mt-12">
          <p className="caption-up">{labelOf(PORTFOLIO_CATEGORY, work.workCategory)}</p>
          <h1 className="display-feature mt-4 text-ink">{work.titleFa}</h1>
          <p className="body-lead mt-5 max-w-xl">{work.summaryFa}</p>
        </div>

        <dl className="mt-12 grid max-w-3xl grid-cols-1 gap-6 border-t border-hairline pt-10 text-start sm:grid-cols-2">
          {work.clientName ? (
            <div>
              <dt className="caption-up text-white/45">مشتری</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{work.clientName}</dd>
            </div>
          ) : null}
          {location ? (
            <div>
              <dt className="caption-up text-white/45">لوکیشن</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{location}</dd>
            </div>
          ) : null}
          {work.areaOrCapacity ? (
            <div>
              <dt className="caption-up text-white/45">ظرفیت / مقیاس</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{work.areaOrCapacity}</dd>
            </div>
          ) : null}
          {work.startDate || work.endDate ? (
            <div>
              <dt className="caption-up text-white/45">بازه اجرا</dt>
              <dd className="mt-2 font-ui text-sm text-ink" dir="ltr">
                {[work.startDate, work.endDate].filter(Boolean).join(' — ')}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-12 max-w-3xl border-t border-hairline pt-10 text-start">
          <p className="body-lead whitespace-pre-line text-sm leading-relaxed">{work.descriptionFa}</p>
        </div>

        {work.highlights?.length ? (
          <ul className="mt-10 max-w-xl space-y-3 text-start">
            {work.highlights.map((item) => (
              <li key={item} className="border-b border-hairline pb-3 font-ui text-sm text-ink">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-14">
          <Link href="/quote-request" className="btn-pill inline-flex">
            درخواست مشابه
          </Link>
        </div>
      </div>
    </div>
  );
}
