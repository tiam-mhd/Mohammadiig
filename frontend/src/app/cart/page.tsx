"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartBagIcon } from "@/components/icons/CartBagIcon";
import { formatCartMoney } from "@/components/spare-parts/formatSparePartPrice";
import { resolveMediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const currency = lines[0]?.currency || "IRR";
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  if (!hydrated) {
    return (
      <div className="sp-cart sp-cart--soft bg-canvas">
        <div className="content-shell section-copy pt-28">
          <p className="font-ui text-sm text-muted">در حال بارگذاری سبد…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-cart sp-cart--soft bg-canvas">
      <div className="sp-shop__glow" aria-hidden />
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link
          href="/spare-parts"
          className="caption-up text-ink/70 transition-opacity hover:opacity-100"
        >
          ← ادامه خرید
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">فروشگاه</p>
          <h1 className="display-feature mt-4 text-ink">سبد خرید</h1>
          <p className="body-lead mt-5 max-w-md">
            {count > 0
              ? `${count.toLocaleString("fa-IR")} قلم آمادهٔ سفارش است.`
              : "هنوز قطعه‌ای انتخاب نکرده‌اید."}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="sp-empty mt-12">
            <p>سبد خرید خالی است.</p>
            <Link href="/spare-parts" className="btn-pill mt-8 inline-flex">
              مشاهده قطعات
            </Link>
          </div>
        ) : (
          <div className="sp-cart__layout mt-10 md:mt-12">
            <div className="sp-cart__list">
              {lines.map((line) => {
                const src = resolveMediaUrl(line.imageUrl);
                return (
                  <article key={line.sparePartId} className="sp-cart__row">
                    <Link
                      href={`/spare-parts/${encodeURIComponent(line.slug)}`}
                      className="sp-cart__product"
                    >
                      <div className="sp-cart__thumb">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" loading="lazy" />
                        ) : (
                          <span className="font-ui text-[10px] text-muted">
                            —
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 text-start">
                        <p className="caption-up">{line.partNumber}</p>
                        <h2 className="sp-cart__name">{line.nameFa}</h2>
                        <p className="mt-1 font-ui text-sm text-muted">
                          {formatCartMoney(line.unitPrice, line.currency)}
                        </p>
                      </div>
                    </Link>

                    <div className="sp-cart__controls">
                      <div className="sp-qty sp-qty--soft" aria-label="تعداد">
                        <button
                          type="button"
                          aria-label="کاهش"
                          onClick={() =>
                            setQuantity(line.sparePartId, line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{line.quantity.toLocaleString("fa-IR")}</span>
                        <button
                          type="button"
                          aria-label="افزایش"
                          disabled={line.quantity >= line.maxStock}
                          onClick={() =>
                            setQuantity(line.sparePartId, line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <p className="sp-cart__line-total">
                        {formatCartMoney(
                          line.unitPrice * line.quantity,
                          line.currency,
                        )}
                      </p>
                      <button
                        type="button"
                        className="sp-cart__remove"
                        onClick={() => removeItem(line.sparePartId)}
                      >
                        حذف
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="sp-cart__summary">
              <div className="sp-cart__summary-card">
                <p className="caption-up">جمع جزء</p>
                <p className="sp-cart__summary-total mt-2">
                  {formatCartMoney(subtotal, currency)}
                </p>
                <p className="mt-3 font-ui text-xs text-muted">
                  هزینه ارسال هنگام ثبت سفارش محاسبه می‌شود.
                </p>
                {accessToken ? (
                  <Link
                    href="/checkout"
                    className="sp-detail__cart-btn sp-cart__checkout mt-6"
                  >
                    <CartBagIcon className="sp-action-icon" />
                    <span>ادامه به پرداخت</span>
                  </Link>
                ) : (
                  <Link
                    href={`/auth?next=${encodeURIComponent("/checkout")}`}
                    className="sp-detail__cart-btn sp-cart__checkout mt-6"
                  >
                    <span>ورود برای پرداخت</span>
                  </Link>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
