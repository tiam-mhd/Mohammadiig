"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const invoice = searchParams.get("invoice")?.trim() || "";
  const order = searchParams.get("order")?.trim() || "";
  const paid = searchParams.get("paid") === "1";

  return (
    <div className="sp-checkout sp-checkout--soft bg-canvas">
      <div className="sp-shop__glow" aria-hidden />
      <div className="content-shell section-copy pt-28 text-center md:pt-32">
        <p className="caption-up">پرداخت</p>
        <h1 className="display-feature mt-4 text-ink">
          {paid ? "پرداخت موفق بود" : "سفارش ثبت شد"}
        </h1>
        <p className="body-lead mx-auto mt-5 max-w-md">
          {paid
            ? "پرداخت تأیید شد. فاکتور و جزئیات سفارش در حساب شما آماده است."
            : "سفارش شما ثبت شد. می‌توانید فاکتور را از پنل حساب ببینید و پرداخت کنید."}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {invoice ? (
            <Link
              href={`/account/invoices/${encodeURIComponent(invoice)}`}
              className="btn-pill"
            >
              مشاهده فاکتور
            </Link>
          ) : (
            <Link href="/account" className="btn-pill">
              پنل حساب
            </Link>
          )}
          {order ? (
            <Link
              href={`/account/orders/${encodeURIComponent(order)}`}
              className="btn-pill btn-pill--ghost"
            >
              جزئیات سفارش
            </Link>
          ) : null}
          <Link
            href="/spare-parts"
            className="caption-up text-muted hover:text-ink"
          >
            ادامه خرید
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="sp-checkout sp-checkout--soft bg-canvas">
          <div className="content-shell section-copy pt-28">
            <p className="font-ui text-sm text-muted">در حال بارگذاری…</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
