'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import { fetchSpareParts, SparePart } from '@/lib/api-client';

export default function SparePartsPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  useEffect(() => { fetchSpareParts().then(setParts).catch(() => undefined); }, []);
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1200px]"><Link href="/products" className="text-xs font-bold text-primary-500">← بازگشت به محصولات</Link><div className="mt-14"><span className="eyebrow">MIG CARE / AFTER-SALES</span><h1 className="mt-4 text-5xl font-black text-neutral-900 dark:text-white sm:text-7xl">قطعات یدکی</h1><p className="mt-5 max-w-xl leading-8 text-neutral-500">قطعات اصلی برای حفظ عملکرد دقیق و پایدار تجهیزات MIG.</p></div><div className="mt-14 grid gap-5 md:grid-cols-2">{parts.map((part) => <article key={part.id} className="border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-[#1b1d1b]"><div className="flex justify-between gap-5"><div><span className="eyebrow">{part.partNumber}</span><h2 className="mt-3 text-2xl font-black dark:text-white">{part.nameFa}</h2></div><span className="text-sm font-bold text-primary-500">{part.price.toLocaleString('fa-IR')} ریال</span></div><p className="mt-5 text-sm leading-7 text-neutral-500">{part.description}</p><div className="mt-6 flex justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-white/10"><span>موجودی: {part.stockQuantity}</span><span>گارانتی: {part.warrantyMonths} ماه</span></div></article>)}{parts.length === 0 && <p className="col-span-full border border-dashed border-neutral-300 py-16 text-center text-neutral-500">در حال دریافت قطعات...</p>}</div><Link href="/quote-request"><Button size="lg" className="mt-12 rounded-none bg-primary-500 text-neutral-900">درخواست قطعه</Button></Link></div></main>;
}
