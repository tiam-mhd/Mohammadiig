'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** باکس مشاوره شناور — ثابت روی کل صفحه هنگام اسکرول */
export function FloatingConsultCard() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <aside
      className={`float-card float-card--fixed ${visible ? 'float-card--shown' : ''}`}
      aria-label="مشاوره پروژه"
    >
      <button
        type="button"
        className="float-card__close"
        onClick={() => setDismissed(true)}
        aria-label="بستن"
      >
        ×
      </button>
      <p className="font-ui text-[13px] leading-7 text-white/90">
        برای پروژه جدیدتان نیاز به مشاوره دارید؟
      </p>
      <Link
        href="/quote-request"
        className="caption-up mt-3 inline-block text-white/90 transition-opacity duration-500 hover:opacity-55"
      >
        همین حالا پیام بدهید ←
      </Link>
    </aside>
  );
}
