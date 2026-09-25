'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('خطای صفحه', error); }, [error]);
  return <main dir="rtl" className="content-shell flex min-h-[60vh] flex-col items-center justify-center text-center"><h1 className="display-md">خطایی رخ داد</h1><p className="mt-3 text-[var(--ops-muted)]">بارگذاری این صفحه با مشکل مواجه شد.</p><button className="admin-button mt-6" onClick={() => reset()}>تلاش دوباره</button></main>;
}
