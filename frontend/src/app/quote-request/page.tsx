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
    setIsSubmitting(true);
    setError('');
    setResult('');
    try {
      const response = await requestQuotation(accessToken, {
        items: Object.entries(quantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([productId, quantity]) => ({ productId, quantity })),
        notes,
      });
      setResult(`درخواست ${response.quotationNumber} با موفقیت ثبت شد.`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">درخواست قیمت</p>
          <h1 className="display-feature mt-4 text-ink">برای دریافت پیش‌فاکتور وارد شوید</h1>
          <p className="body-lead mx-auto mt-4 max-w-md">
            درخواست قیمت برای حساب‌های سازمانی ثبت می‌شود.
          </p>
          <Link href="/auth" className="btn-pill mt-10 inline-flex">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy max-w-3xl pt-24 md:pt-28">
        <Link href="/products" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به محصولات
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">درخواست قیمت</p>
          <h1 className="display-feature mt-4 text-ink">درخواست پیش‌فاکتور</h1>
          <p className="body-lead mt-5 max-w-md">
            محصول و تعداد را مشخص کنید؛ تیم فروش پیشنهاد قیمت را آماده می‌کند.
          </p>
        </div>

        <div className="mt-12 border-t border-hairline md:mt-16">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-6 border-b border-hairline py-7"
            >
              <div className="min-w-0 text-start">
                <p className="caption-up text-white/50">محصول</p>
                <h2 className="display-sm mt-2 text-ink">{product.name}</h2>
              </div>
              <input
                type="number"
                min={0}
                max={999}
                aria-label={`تعداد ${product.name}`}
                value={quantities[product.id]}
                onChange={(event) =>
                  setQuantities({ ...quantities, [product.id]: Number(event.target.value) })
                }
                className="field-input field-input--box w-24 shrink-0 text-center"
              />
            </div>
          ))}
        </div>

        <label className="mt-10 block text-start">
          <span className="caption-up">توضیحات (اختیاری)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="ابعاد سالن، تعداد دستگاه، یا نیاز سفارشی"
            className="field-input field-input--box field-textarea mt-4"
          />
        </label>

        {error ? <p className="field-message field-message--error">{error}</p> : null}
        {result ? <p className="field-message field-message--ok">{result}</p> : null}

        <div className="mt-10">
          <Button onClick={submitRequest} isLoading={isSubmitting} size="lg">
            ثبت درخواست پیش‌فاکتور
          </Button>
        </div>
      </div>
    </div>
  );
}
