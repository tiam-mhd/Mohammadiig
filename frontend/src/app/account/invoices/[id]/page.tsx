"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components";
import {
  fetchMyInvoice,
  fetchMyPayments,
  submitPayment,
  type InvoiceSummary,
  type PaymentAdminSummary,
} from "@/lib/api-client";
import { formatMoney, labelOf, PAYMENT_STATUS } from "@/lib/admin-labels";
import { resolveMediaUrl } from "@/lib/media";
import { useAuthStore } from "@/store/auth.store";

function snapshotRows(snapshot?: Record<string, string> | null) {
  if (!snapshot) return [];
  return Object.entries(snapshot).filter(([, v]) => Boolean(v));
}

export default function AccountInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const accessToken = useAuthStore((s) => s.accessToken);

  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [payments, setPayments] = useState<PaymentAdminSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) {
      queueMicrotask(() => setLoaded(true));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoaded(false);
    });
    Promise.all([fetchMyInvoice(accessToken, id), fetchMyPayments(accessToken)])
      .then(([data, paymentItems]) => {
        if (!cancelled) {
          setInvoice(data);
          setPayments(
            paymentItems.filter((payment) => payment.invoiceId === data.id),
          );
          setMessage("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvoice(null);
          setMessage("فاکتور یافت نشد.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  async function payInvoice() {
    if (!accessToken || !invoice) return;
    setPaying(true);
    setMessage("");
    try {
      await submitPayment(accessToken, invoice.id, invoice.totalAfterTax);
      const [freshInvoice, freshPayments] = await Promise.all([
        fetchMyInvoice(accessToken, invoice.id),
        fetchMyPayments(accessToken),
      ]);
      setInvoice(freshInvoice);
      setPayments(
        freshPayments.filter(
          (payment) => payment.invoiceId === freshInvoice.id,
        ),
      );
      setMessage("درخواست پرداخت ثبت شد و در انتظار بررسی است.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ثبت پرداخت انجام نشد.",
      );
    } finally {
      setPaying(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <h1 className="display-feature text-ink">ورود لازم است</h1>
          <Link
            href={`/auth?next=${encodeURIComponent(`/account/invoices/${id}`)}`}
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
          <p className="font-ui text-sm text-muted">در حال بارگذاری فاکتور…</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <h1 className="display-feature text-ink">{message || "یافت نشد"}</h1>
          <Link href="/account" className="btn-pill mt-10 inline-flex">
            بازگشت به حساب
          </Link>
        </div>
      </div>
    );
  }

  const lines = invoice.lineItemsJson ?? [];
  const customer = invoice.customerSnapshotJson;
  const shipping = snapshotRows(invoice.shippingSnapshotJson);
  const unpaid =
    invoice.paymentStatus === "pending" ||
    invoice.paymentStatus === "failed" ||
    invoice.paymentStatus === "overdue";
  const hasPendingPayment = payments.some(
    (payment) => payment.paymentStatus === "pending",
  );

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link
          href="/account"
          className="caption-up text-ink/70 transition-opacity hover:opacity-100"
        >
          ← بازگشت به حساب
        </Link>

        <div className="mt-10 flex flex-col justify-between gap-6 md:mt-12 md:flex-row md:items-end">
          <div className="text-start">
            <p className="caption-up">
              {labelOf(PAYMENT_STATUS, invoice.paymentStatus)}
            </p>
            <h1 className="display-feature mt-4 text-ink">
              {invoice.invoiceNumber}
            </h1>
            <p className="body-lead mt-4">
              مبلغ قابل پرداخت: {formatMoney(invoice.totalAfterTax)}
            </p>
          </div>
          {unpaid ? (
            <Button
              size="sm"
              onClick={payInvoice}
              isLoading={paying}
              disabled={paying || hasPendingPayment}
            >
              {hasPendingPayment ? "پرداخت در انتظار بررسی" : "ثبت پرداخت"}
            </Button>
          ) : null}
        </div>

        {message ? <p className="field-message mt-6">{message}</p> : null}

        <section className="mt-12 border-t border-hairline pt-8">
          <h2 className="display-sm text-ink">اقلام</h2>
          <div className="mt-4">
            {lines.length === 0 ? (
              <p className="font-ui text-sm text-muted">
                قلم فاکتور ثبت نشده است.
              </p>
            ) : (
              lines.map((line, index) => {
                const src = resolveMediaUrl(line.imageUrl);
                return (
                  <div
                    key={`${line.sku}-${index}`}
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
                        <p className="caption-up">{line.sku}</p>
                        <h3 className="mt-1 font-ui text-sm text-ink">
                          {line.title}
                        </h3>
                        <p className="mt-1 font-ui text-xs text-muted">
                          {line.quantity.toLocaleString("fa-IR")} ×{" "}
                          {line.unitPrice.toLocaleString("fa-IR")}
                        </p>
                      </div>
                    </div>
                    <p className="font-ui text-sm text-ink">
                      {line.lineTotal.toLocaleString("fa-IR")} {line.currency}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {(invoice.totalBeforeTax != null || invoice.taxAmount != null) && (
          <dl className="sp-specs mt-8 max-w-md">
            {invoice.totalBeforeTax != null ? (
              <div>
                <dt>جمع قبل از مالیات</dt>
                <dd>{formatMoney(invoice.totalBeforeTax)}</dd>
              </div>
            ) : null}
            {invoice.taxAmount != null ? (
              <div>
                <dt>مالیات</dt>
                <dd>{formatMoney(invoice.taxAmount)}</dd>
              </div>
            ) : null}
            <div>
              <dt>مبلغ نهایی</dt>
              <dd>{formatMoney(invoice.totalAfterTax)}</dd>
            </div>
          </dl>
        )}

        {customer ? (
          <section className="mt-12 border-t border-hairline pt-8 text-start">
            <h2 className="display-sm text-ink">خریدار</h2>
            <dl className="sp-specs mt-4">
              {customer.companyName ? (
                <div>
                  <dt>شرکت</dt>
                  <dd>{customer.companyName}</dd>
                </div>
              ) : null}
              {customer.contactPerson ? (
                <div>
                  <dt>مخاطب</dt>
                  <dd>{customer.contactPerson}</dd>
                </div>
              ) : null}
              {customer.phone ? (
                <div>
                  <dt>تلفن</dt>
                  <dd>{customer.phone}</dd>
                </div>
              ) : null}
              {customer.email ? (
                <div>
                  <dt>ایمیل</dt>
                  <dd>{customer.email}</dd>
                </div>
              ) : null}
              {customer.address || customer.city ? (
                <div>
                  <dt>آدرس</dt>
                  <dd>
                    {[customer.address, customer.city, customer.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {shipping.length > 0 ? (
          <section className="mt-12 border-t border-hairline pt-8 text-start">
            <h2 className="display-sm text-ink">ارسال</h2>
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

        <section className="mt-12 border-t border-hairline pt-8 text-start">
          <h2 className="display-sm text-ink">وضعیت پرداخت</h2>
          <p className="mt-4 font-ui text-sm text-ink">
            {labelOf(PAYMENT_STATUS, invoice.paymentStatus)}
            {invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : ""}
          </p>
          {invoice.paidAt ? (
            <p className="mt-2 font-ui text-xs text-muted">
              زمان پرداخت: {new Date(invoice.paidAt).toLocaleString("fa-IR")}
            </p>
          ) : null}
          {payments.length > 0 ? (
            <div className="mt-6 space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border-t border-hairline pt-3 font-ui text-sm text-ink"
                >
                  <span>{labelOf(PAYMENT_STATUS, payment.paymentStatus)}</span>
                  <span className="mx-2 text-muted">·</span>
                  <span>{formatMoney(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {invoice.orderId ? (
            <Link
              href={`/account/orders/${encodeURIComponent(invoice.orderId)}`}
              className="caption-up mt-6 inline-block text-muted hover:text-ink"
            >
              مشاهده سفارش مرتبط
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
