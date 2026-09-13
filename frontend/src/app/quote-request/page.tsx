'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components';
import { fetchProducts, Product, requestQuotation } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth.store';

type Quantities = Record<string, number>;

function clampQuantity(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(999, Math.floor(value));
}

function readProductParam() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('product')?.trim() ?? '';
}

export default function QuoteRequestPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [ready, setReady] = useState(false);
  const [productParam, setProductParam] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [projectCity, setProjectCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [venueDetails, setVenueDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ quotationNumber: string; totalAmount: number } | null>(
    null,
  );

  // Never stay stuck on the loading screen: wait for auth hydrate, with a short fallback.
  useEffect(() => {
    setProductParam(readProductParam());

    if (hasHydrated || useAuthStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    const fallback = window.setTimeout(() => setReady(true), 100);
    return () => {
      unsub();
      window.clearTimeout(fallback);
    };
  }, [hasHydrated]);

  const authReturnPath = useMemo(() => {
    const query = productParam ? `?product=${encodeURIComponent(productParam)}` : '';
    return `/quote-request${query}`;
  }, [productParam]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setIsLoadingProducts(true);
    fetchProducts({ limit: 100 })
      .then((response) => {
        if (cancelled) return;
        const list = response.data ?? [];
        setProducts(list);
        setQuantities((current) => {
          const next: Quantities = {};
          for (const product of list) {
            next[product.id] = current[product.id] ?? 0;
          }
          if (productParam) {
            const matched = list.find(
              (product) => product.slug === productParam || product.id === productParam,
            );
            if (matched) next[matched.id] = Math.max(next[matched.id] ?? 0, 1);
          }
          return next;
        });
        setLoadError('');
      })
      .catch(() => {
        if (!cancelled) setLoadError('بارگذاری محصولات انجام نشد. لطفاً صفحه را تازه کنید.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, productParam]);

  const selectedItems = useMemo(
    () =>
      products
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product.id] ?? 0,
          lineTotal: product.price * (quantities[product.id] ?? 0),
        })),
    [products, quantities],
  );

  const estimatedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [selectedItems],
  );

  function setQuantity(productId: string, value: number) {
    setQuantities((current) => ({ ...current, [productId]: clampQuantity(value) }));
    setError('');
    setSuccess(null);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    if (selectedItems.length === 0) {
      setError('حداقل یک محصول را با تعداد بیشتر از صفر انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const response = await requestQuotation(accessToken, {
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        projectCity: projectCity.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        venueDetails: venueDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess({
        quotationNumber: response.quotationNumber,
        totalAmount: response.totalAmount,
      });
      setQuantities((current) => {
        const reset: Quantities = {};
        for (const id of Object.keys(current)) reset[id] = 0;
        return reset;
      });
      setNotes('');
      setVenueDetails('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28">
          <p className="caption-up">درخواست قیمت</p>
          <p className="body-lead mt-6">در حال آماده‌سازی فرم…</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="bg-canvas quote-page">
        <div className="content-shell section-copy quote-page__gate">
          <p className="caption-up">درخواست قیمت</p>
          <h1 className="display-feature mt-4 text-ink">خوش آمدید؛ اول وارد حساب شوید</h1>
          <p className="body-lead mt-5 max-w-lg">
            با ورود یا ثبت‌نام کوتاه، درخواست‌تان ثبت می‌شود و تیم فروش می‌تواند مستقیم با شما هماهنگ
            کند.
          </p>
          <div className="quote-page__gate-actions">
            <Link
              href={`/auth?next=${encodeURIComponent(authReturnPath)}`}
              className="btn-pill inline-flex"
            >
              ورود یا ثبت‌نام
            </Link>
            <Link href="/products" className="caption-up text-white/70 transition-opacity hover:opacity-100">
              فعلاً محصولات را ببینم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas quote-page">
      <div className="content-shell section-copy quote-page__shell">
        <Link href="/products" className="quote-page__back">
          ← بازگشت به محصولات
        </Link>

        <header className="quote-page__head">
          <div className="quote-page__intro">
            <p className="caption-up">درخواست قیمت</p>
            <h1 className="display-feature mt-4 text-ink">بگویید چه نیاز دارید</h1>
            <p className="body-lead mt-5 max-w-xl">
              محصول‌ها را انتخاب کنید و چند خط درباره پروژه‌تان بنویسید. ما با دقت بررسی می‌کنیم و
              پیشنهاد قیمت را برایتان آماده می‌کنیم.
            </p>
            {user?.companyName ? (
              <p className="quote-page__account mt-4">
                خوش آمدید، <strong>{user.companyName}</strong>
              </p>
            ) : null}
          </div>
          <ol className="quote-page__steps" aria-label="مراحل درخواست">
            <li>
              <span>۱</span>
              انتخاب محصول
            </li>
            <li>
              <span>۲</span>
              کمی درباره پروژه
            </li>
            <li>
              <span>۳</span>
              ارسال درخواست
            </li>
          </ol>
        </header>

        {success ? (
          <div className="quote-page__success" role="status">
            <p className="caption-up">با موفقیت ثبت شد</p>
            <h2 className="display-sm mt-3 text-ink">درخواست‌تان را دریافت کردیم</h2>
            <p className="body-lead mt-3 max-w-lg">
              شماره پیگیری <strong dir="ltr">{success.quotationNumber}</strong> — برآورد اولیه{' '}
              {success.totalAmount.toLocaleString('fa-IR')} ریال است. به‌زودی تیم فروش با شما هماهنگ
              می‌کند.
            </p>
            <div className="quote-page__success-actions">
              <Button type="button" size="lg" onClick={() => router.push('/account')}>
                برو به حساب من
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => setSuccess(null)}>
                یک درخواست دیگر
              </Button>
            </div>
          </div>
        ) : null}

        <form onSubmit={submitRequest} className="quote-page__layout" noValidate>
          <div className="quote-page__main">
            <section className="quote-page__section" aria-labelledby="quote-products-title">
              <div className="quote-page__section-head">
                <h2 id="quote-products-title" className="display-sm text-ink">
                  چه محصولی می‌خواهید؟
                </h2>
                <p className="body-lead mt-2 text-sm">
                  با دکمه‌های + و − تعداد را تنظیم کنید. هرچه واضح‌تر بگویید، پیشنهاد دقیق‌تری
                  می‌گیرید.
                </p>
              </div>

              {isLoadingProducts ? (
                <p className="quote-page__empty">چند لحظه… در حال آوردن محصولات</p>
              ) : null}

              {loadError ? <p className="field-message field-message--error">{loadError}</p> : null}

              {!isLoadingProducts && !loadError && products.length === 0 ? (
                <p className="quote-page__empty">الان محصول فعالی برای انتخاب نیست.</p>
              ) : null}

              <div className="quote-page__products">
                {products.map((product) => {
                  const quantity = quantities[product.id] ?? 0;
                  const isSelected = quantity > 0;
                  return (
                    <article
                      key={product.id}
                      className={`quote-product${isSelected ? ' is-selected' : ''}`}
                    >
                      <div className="quote-product__media">
                        {resolveMediaUrl(product.image) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(product.image)!} alt={product.name} loading="lazy" />
                        ) : (
                          <span className="quote-product__placeholder">بدون تصویر</span>
                        )}
                      </div>
                      <div className="quote-product__body">
                        <p className="caption-up text-white/45">{product.category || 'محصول'}</p>
                        <h3 className="quote-product__title">{product.name}</h3>
                        <p className="quote-product__price">
                          شروع از {product.price.toLocaleString('fa-IR')} ریال
                        </p>
                      </div>
                      <div className="quote-product__qty" aria-label={`تعداد ${product.name}`}>
                        <button
                          type="button"
                          className="quote-qty-btn"
                          aria-label="کاهش تعداد"
                          disabled={quantity <= 0}
                          onClick={() => setQuantity(product.id, quantity - 1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          inputMode="numeric"
                          className="field-input field-input--box quote-qty-input"
                          value={quantity}
                          onChange={(event) =>
                            setQuantity(product.id, Number(event.target.value || 0))
                          }
                        />
                        <button
                          type="button"
                          className="quote-qty-btn"
                          aria-label="افزایش تعداد"
                          disabled={quantity >= 999}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="quote-page__section" aria-labelledby="quote-details-title">
              <div className="quote-page__section-head">
                <h2 id="quote-details-title" className="display-sm text-ink">
                  کمی درباره پروژه‌تان
                </h2>
                <p className="body-lead mt-2 text-sm">
                  پر کردن این بخش اختیاری است؛ ولی همین چند نکته کمک می‌کند پیشنهاد بهتری برایتان
                  بنویسیم.
                </p>
              </div>

              <div className="quote-page__fields">
                <label className="quote-field">
                  <span className="quote-field__label">شهر یا محل پروژه</span>
                  <input
                    type="text"
                    value={projectCity}
                    onChange={(event) => setProjectCity(event.target.value)}
                    placeholder="مثلاً تهران، اصفهان، کیش"
                    maxLength={100}
                    className="quote-field__input"
                  />
                </label>

                <label className="quote-field">
                  <span className="quote-field__label">شماره تماس برای هماهنگی</span>
                  <input
                    type="tel"
                    dir="ltr"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="09xxxxxxxxx"
                    maxLength={30}
                    autoComplete="tel"
                    className="quote-field__input quote-field__input--ltr"
                  />
                </label>

                <label className="quote-field quote-field--wide">
                  <span className="quote-field__label">ابعاد سالن یا ظرفیت فضا</span>
                  <input
                    type="text"
                    value={venueDetails}
                    onChange={(event) => setVenueDetails(event.target.value)}
                    placeholder="مثلاً سالن ۲۰۰ متری، ظرفیت حدود ۱۵۰ نفر"
                    maxLength={500}
                    className="quote-field__input"
                  />
                </label>

                <label className="quote-field quote-field--wide">
                  <span className="quote-field__label">اگر نکته‌ای مانده…</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="زمان تحویل، نیاز سفارشی، یا هر چیزی که دوست دارید بدانیم"
                    maxLength={2000}
                    className="quote-field__input quote-field__textarea"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="quote-page__aside" aria-labelledby="quote-summary-title">
            <div className="quote-summary">
              <h2 id="quote-summary-title" className="display-sm text-ink">
                خلاصه شما
              </h2>
              <p className="quote-summary__lede">
                این فقط یک برآورد اولیه است؛ قیمت نهایی را بعد از بررسی اعلام می‌کنیم.
              </p>

              {selectedItems.length === 0 ? (
                <p className="quote-summary__empty">هنوز چیزی انتخاب نکرده‌اید — از فهرست محصولات شروع کنید.</p>
              ) : (
                <ul className="quote-summary__list">
                  {selectedItems.map((item) => (
                    <li key={item.product.id}>
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.quantity.toLocaleString('fa-IR')} عدد</span>
                      </div>
                      <em>{item.lineTotal.toLocaleString('fa-IR')} ریال</em>
                    </li>
                  ))}
                </ul>
              )}

              <div className="quote-summary__total">
                <span>برآورد اولیه</span>
                <strong>{estimatedTotal.toLocaleString('fa-IR')} ریال</strong>
              </div>

              {error ? <p className="field-message field-message--error">{error}</p> : null}

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                disabled={isLoadingProducts || Boolean(loadError)}
                className="mt-6 w-full"
              >
                ارسال درخواست
              </Button>

              <p className="quote-summary__note">
                بعد از ارسال، هم در حساب شما و هم در پنل فروش قابل پیگیری است.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
