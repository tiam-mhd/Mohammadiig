'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { CartBagIcon } from '@/components/icons/CartBagIcon';
import { formatCartMoney } from '@/components/spare-parts/formatSparePartPrice';
import { checkoutSpareParts } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

export default function CheckoutPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);

  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [payWithTestGateway, setPayWithTestGateway] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      setReady(true);
      return;
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (!ready) return;
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.companyName ||
      '';
    if (name && !fullName) setFullName(name);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [ready, user, fullName, phone]);

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const currency = lines[0]?.currency || 'IRR';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) {
      router.push(`/auth?next=${encodeURIComponent('/checkout')}`);
      return;
    }
    if (lines.length === 0) {
      setError('سبد خرید خالی است.');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setError('نام، تلفن، شهر و آدرس الزامی است.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await checkoutSpareParts(accessToken, {
        items: lines.map((line) => ({
          sparePartId: line.sparePartId,
          quantity: line.quantity,
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim().replace(/\s+/g, ''),
          city: city.trim(),
          address: address.trim(),
          postalCode: postalCode.trim() || undefined,
          province: province.trim() || undefined,
        },
        notes: notes.trim() || undefined,
        payWithTestGateway,
      });
      clearCart();
      const invoiceRef = result.invoice?.id || result.invoice?.invoiceNumber || '';
      router.push(
        `/checkout/success?invoice=${encodeURIComponent(invoiceRef)}&order=${encodeURIComponent(result.order?.id || result.order?.orderNumber || '')}&paid=${payWithTestGateway ? '1' : '0'}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ثبت سفارش انجام نشد.';
      if (/نشست|منقضی|نامعتبر|وارد شوید|Authentication|token/i.test(message)) {
        clearSession();
        setError('نشست منقضی شده است. دوباره وارد شوید و پرداخت را تکرار کنید.');
        window.setTimeout(() => {
          router.push(`/auth?next=${encodeURIComponent('/checkout')}`);
        }, 900);
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="sp-checkout sp-checkout--soft bg-canvas">
        <div className="content-shell section-copy pt-28">
          <p className="font-ui text-sm text-muted">در حال آماده‌سازی…</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="sp-checkout sp-checkout--soft bg-canvas">
        <div className="sp-shop__glow" aria-hidden />
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">پرداخت</p>
          <h1 className="display-feature mt-4 text-ink">ورود لازم است</h1>
          <p className="body-lead mx-auto mt-4 max-w-md">
            برای ثبت سفارش قطعات ابتدا وارد حساب کاربری شوید.
          </p>
          <Link
            href={`/auth?next=${encodeURIComponent('/checkout')}`}
            className="btn-pill mt-10 inline-flex"
          >
            ورود
          </Link>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="sp-checkout sp-checkout--soft bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">پرداخت</p>
          <h1 className="display-feature mt-4 text-ink">سبد خالی است</h1>
          <Link href="/spare-parts" className="btn-pill mt-10 inline-flex">
            فروشگاه قطعات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-checkout sp-checkout--soft bg-canvas">
      <div className="sp-shop__glow" aria-hidden />
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/cart" className="caption-up text-ink/70 transition-opacity hover:opacity-100">
          ← بازگشت به سبد
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">پرداخت</p>
          <h1 className="display-feature mt-4 text-ink">تکمیل سفارش</h1>
          <p className="body-lead mt-5 max-w-md">
            آدرس ارسال را وارد کنید؛ سفارش و فاکتور ثبت می‌شود و پرداخت از پنل حساب پیگیری خواهد شد.
          </p>
        </div>

        <div className="sp-checkout__layout mt-10 md:mt-12">
          <form className="sp-checkout__form text-start" onSubmit={onSubmit}>
            <div className="sp-checkout__panel">
              <h2 className="display-sm text-base text-ink">اطلاعات گیرنده</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="caption-up">نام گیرنده</span>
                  <input
                    className="sp-field sp-field--soft mt-2 w-full"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="caption-up">تلفن</span>
                  <input
                    className="sp-field sp-field--soft mt-2 w-full"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="0912…"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="caption-up">استان</span>
                    <input
                      className="sp-field sp-field--soft mt-2 w-full"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="caption-up">شهر</span>
                    <input
                      className="sp-field sp-field--soft mt-2 w-full"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="caption-up">آدرس</span>
                  <textarea
                    className="sp-field sp-field--soft mt-2 w-full"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className="caption-up">کد پستی</span>
                  <input
                    className="sp-field sp-field--soft mt-2 w-full"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label className="block">
                  <span className="caption-up">یادداشت</span>
                  <textarea
                    className="sp-field sp-field--soft mt-2 w-full"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اختیاری"
                  />
                </label>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' ? (
              <div className="sp-checkout__panel mt-4">
                <label className="sp-checkout__pay-opt">
                  <input
                    type="checkbox"
                    className="sp-check"
                    checked={payWithTestGateway}
                    onChange={(e) => setPayWithTestGateway(e.target.checked)}
                  />
                  <span>
                    <strong className="font-ui text-sm text-ink">پرداخت با درگاه آزمایشی</strong>
                    <span className="mt-1 block font-ui text-xs text-muted">
                      فقط در محیط توسعه؛ فاکتور بلافاصله پرداخت‌شده ثبت می‌شود.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            {error ? <p className="field-message mt-4">{error}</p> : null}

            <button
              type="submit"
              className="sp-detail__cart-btn mt-6"
              disabled={submitting}
            >
              <CartBagIcon className="sp-action-icon" />
              <span>{submitting ? 'در حال ثبت…' : 'ثبت سفارش و صدور فاکتور'}</span>
            </button>
          </form>

          <aside className="sp-checkout__aside">
            <div className="sp-cart__summary-card">
              <h2 className="display-sm text-base text-ink">خلاصه سفارش</h2>
              <ul className="mt-5 space-y-3">
                {lines.map((line) => (
                  <li key={line.sparePartId} className="sp-checkout__line">
                    <span className="min-w-0 text-ink">
                      {line.nameFa}
                      <span className="text-muted">
                        {' '}
                        × {line.quantity.toLocaleString('fa-IR')}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatCartMoney(line.unitPrice * line.quantity, line.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-baseline justify-between border-t border-hairline/80 pt-4">
                <span className="caption-up">جمع</span>
                <strong className="font-ui text-base font-medium text-ink">
                  {formatCartMoney(subtotal, currency)}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
