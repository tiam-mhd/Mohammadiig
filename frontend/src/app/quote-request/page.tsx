'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components';
import { requestQuotation } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const products = [
  { id: '1', name: 'Bumper Car / سری Signature' },
  { id: '2', name: 'Junior / سری Play' },
  { id: '3', name: 'MIG Care / قطعات یدکی' },
];

export default function QuoteRequestPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [quantities, setQuantities] = useState<Record<string, number>>({ '1': 1, '2': 0, '3': 0 });
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRequest() {
    if (!accessToken) return;
    setIsSubmitting(true); setError(''); setResult('');
    try {
      const response = await requestQuotation(accessToken, { items: Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId, quantity })), notes });
      setResult(`درخواست ${response.quotationNumber} با موفقیت ثبت شد.`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally { setIsSubmitting(false); }
  }

  if (!accessToken) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><span className="eyebrow">B2B REQUEST</span><h1 className="mt-5 text-4xl font-black dark:text-white">برای دریافت پیش‌فاکتور وارد شوید</h1><p className="mx-auto mt-4 max-w-md text-neutral-500">درخواست‌های اختصاصی MIG برای حساب‌های سازمانی ثبت می‌شوند.</p><Link href="/auth" className="mt-8 inline-block bg-primary-500 px-7 py-4 text-sm font-bold text-neutral-900">ورود به پنل مشتریان</Link></main>;

  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[900px]"><Link href="/products" className="text-xs font-bold text-primary-500">← بازگشت به محصولات</Link><div className="mt-12"><span className="eyebrow">B2B REQUEST / 01</span><h1 className="mt-4 text-4xl font-black text-neutral-900 dark:text-white sm:text-6xl">درخواست پیش‌فاکتور</h1><p className="mt-5 max-w-xl leading-8 text-neutral-500">محصولات و تعداد مورد نیاز را مشخص کنید؛ تیم فروش MIG پیشنهاد اختصاصی شما را آماده می‌کند.</p></div><div className="mt-12 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-white/10 dark:border-white/10">{products.map((product) => <div key={product.id} className="flex items-center justify-between gap-5 py-6"><div><span className="eyebrow">MIG / PRODUCT</span><h2 className="mt-2 font-bold text-neutral-900 dark:text-white">{product.name}</h2></div><input type="number" min="0" max="999" aria-label={`تعداد ${product.name}`} value={quantities[product.id]} onChange={(event) => setQuantities({ ...quantities, [product.id]: Number(event.target.value) })} className="w-24 border border-neutral-300 bg-transparent px-3 py-3 text-center dark:border-white/20 dark:text-white" /></div>)}</div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="توضیحات پروژه، ابعاد یا نیازهای سفارشی (اختیاری)" className="mt-8 min-h-32 w-full resize-y border border-neutral-300 bg-transparent p-4 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" />{error && <p className="mt-5 border-r-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{result && <p className="mt-5 border-r-2 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-700">{result}</p>}<Button onClick={submitRequest} isLoading={isSubmitting} size="lg" className="mt-8 rounded-none bg-primary-500 text-neutral-900">ثبت درخواست پیش‌فاکتور</Button></div></main>;
}
