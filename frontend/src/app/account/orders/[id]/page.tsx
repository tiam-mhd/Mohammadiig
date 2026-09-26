"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyOrder, type OrderDetail } from "@/lib/api-client";
import {
  formatMoney,
  labelOf,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "@/lib/admin-labels";
import { resolveMediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth.store";

function addressRows(addr?: Record<string, string>) {
  if (!addr) return [];
  return Object.entries(addr).filter(([, v]) => Boolean(v));
}

export default function AccountOrderPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const accessToken = useAuthStore((s) => s.accessToken);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken || !id) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    fetchMyOrder(accessToken, id)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null);
          setError("سفارش یافت نشد.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  if (!accessToken) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <h1 className="display-feature text-ink">ورود لازم است</h1>
          <Link
            href={`/auth?next=${encodeURIComponent(`/account/orders/${id}`)}`}
            className="btn-pill mt-10 inline-flex"
          >
            ورود
          </Link>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28">
          <p className="font-ui text-sm text-muted">در حال بارگذاری سفارش…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <h1 className="display-feature text-ink">{error || "یافت نشد"}</h1>
          <Link href="/account" className="btn-pill mt-10 inline-flex">
            بازگشت به حساب
          </Link>
        </div>
      </div>
    );
  }

  const shipping = addressRows(order.shippingAddress);
  const items = order.items ?? [];

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link
          href="/account"
          className="caption-up text-ink/70 transition-opacity hover:opacity-100"
        >
          ← بازگشت به حساب
        </Link>

        <div className="mt-10 text-start md:mt-12">
          <p className="caption-up">{labelOf(ORDER_STATUS, order.status)}</p>
          <h1 className="display-feature mt-4 text-ink">{order.orderNumber}</h1>
          <p className="body-lead mt-4">
            {formatMoney(order.totalAmount)}
            {order.paymentStatus
              ? ` · ${labelOf(PAYMENT_STATUS, order.paymentStatus)}`
              : ""}
          </p>
          {order.createdAt ? (
            <p className="mt-2 font-ui text-xs text-muted">
              {new Date(order.createdAt).toLocaleString("fa-IR")}
            </p>
          ) : null}
        </div>

        <section className="mt-12 border-t border-hairline pt-8">
          <h2 className="display-sm text-ink">اقلام سفارش</h2>
          <div className="mt-4">
            {items.length === 0 ? (
              <p className="font-ui text-sm text-muted">آیتمی ثبت نشده است.</p>
            ) : (
              items.map((item) => {
                const src = resolveMediaUrl(item.imageSnapshot);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 border-b border-hairline py-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 gap-4 text-start">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt=""
                          className="h-14 w-14 object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="caption-up">
                          {item.skuSnapshot || item.itemType}
                        </p>
                        <h3 className="mt-1 font-ui text-sm text-ink">
                          {item.titleSnapshot || "قلم سفارش"}
                        </h3>
                        <p className="mt-1 font-ui text-xs text-muted">
                          {item.quantity.toLocaleString("fa-IR")} ×{" "}
                          {item.unitPrice.toLocaleString("fa-IR")}
                        </p>
                      </div>
                    </div>
                    <p className="font-ui text-sm text-ink">
                      {item.lineTotal.toLocaleString("fa-IR")} {item.currency}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {(order.subtotal != null ||
          order.taxAmount != null ||
          order.shippingCost != null ||
          order.discountAmount != null) && (
          <dl className="sp-specs mt-8 max-w-md">
            {order.subtotal != null ? (
              <div>
                <dt>جمع جزء</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
            ) : null}
            {order.taxAmount != null ? (
              <div>
                <dt>مالیات</dt>
                <dd>{formatMoney(order.taxAmount)}</dd>
              </div>
            ) : null}
            {order.shippingCost != null ? (
              <div>
                <dt>ارسال</dt>
                <dd>{formatMoney(order.shippingCost)}</dd>
              </div>
            ) : null}
            {order.discountAmount != null && order.discountAmount > 0 ? (
              <div>
                <dt>تخفیف</dt>
                <dd>{formatMoney(order.discountAmount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>مبلغ کل</dt>
              <dd>{formatMoney(order.totalAmount)}</dd>
            </div>
          </dl>
        )}

        {shipping.length > 0 ? (
          <section className="mt-12 border-t border-hairline pt-8 text-start">
            <h2 className="display-sm text-ink">آدرس ارسال</h2>
            <dl className="sp-specs mt-4">
              {shipping.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {order.notes ? (
          <section className="mt-10 text-start">
            <h2 className="display-sm text-ink">یادداشت</h2>
            <p className="body-lead mt-3 text-sm">{order.notes}</p>
          </section>
        ) : null}

        {order.invoice?.id || order.invoice?.invoiceNumber ? (
          <div className="mt-12">
            <Link
              href={`/account/invoices/${encodeURIComponent(order.invoice.id || order.invoice.invoiceNumber)}`}
              className="btn-pill inline-flex"
            >
              مشاهده فاکتور
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
