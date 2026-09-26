"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataRow, DataTable } from "@/components/admin/DataTable";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  INVOICE_STATUS,
  labelOf,
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  QUOTATION_STATUS,
} from "@/lib/admin-labels";
import { Customer360, fetchAdminCustomer360 } from "@/lib/api-client";
import { adminToast } from "@/lib/admin-toast";
import { CUSTOMER_STATUS_LABELS } from "@/lib/customer-status";
import { useAuthStore } from "@/store/auth.store";

function Metabox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-metabox">
      <header className="admin-metabox__head">
        <h2 className="admin-metabox__title">{title}</h2>
      </header>
      <div className="admin-metabox__body">{children}</div>
    </section>
  );
}

export default function AdminCustomer360Page() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const [data, setData] = useState<Customer360 | null>(null);
  const [settledFor, setSettledFor] = useState("");
  const requestKey = `${token}:${params.id}`;
  const loading = settledFor !== requestKey;

  useEffect(() => {
    if (!token || !params.id) return;
    let cancelled = false;
    fetchAdminCustomer360(token, params.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          adminToast.error("بارگذاری نمای ۳۶۰ مشتری انجام نشد.");
        }
      })
      .finally(() => {
        if (!cancelled) setSettledFor(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [token, params.id, requestKey]);

  if (!token) {
    return (
      <AdminShell eyebrow="مشتریان" title="نمای ۳۶۰ مشتری">
        <p className="text-sm text-[var(--ops-muted)]">
          برای مشاهده وارد شوید.
        </p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="مشتریان" title="نمای ۳۶۰ مشتری">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell eyebrow="مشتریان" title="نمای ۳۶۰ مشتری">
        <div className="admin-editor__topbar">
          <Link href="/admin/customers" className="ops-btn ops-btn--ghost">
            ← بازگشت به فهرست
          </Link>
        </div>
        <p className="text-sm text-[var(--ops-muted)]">مشتری یافت نشد.</p>
      </AdminShell>
    );
  }

  const { customer, user, stats, orders, invoices, payments, quotations } =
    data;

  return (
    <AdminShell
      eyebrow="مشتریان"
      title={customer.companyName || customer.contactPerson || "پروفایل مشتری"}
    >
      <div className="admin-editor__topbar">
        <Link href="/admin/customers" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          {!customer.deletedAt ? (
            <span
              className={`admin-badge ${customer.status === "active" ? "admin-badge--ok" : "admin-badge--warn"}`}
            >
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </span>
          ) : null}
          {customer.deletedAt ? (
            <span className="admin-badge admin-badge--warn">
              حذف‌شده · {formatDate(customer.deletedAt)}
            </span>
          ) : null}
          <span
            className={`admin-badge ${customer.isVerified ? "admin-badge--ok" : "admin-badge--warn"}`}
          >
            {customer.isVerified ? "تأیید شده" : "در انتظار تأیید"}
          </span>
        </div>
      </div>

      {customer.statusReason ? (
        <section className="admin-metabox mb-6">
          <div className="admin-metabox__body text-start">
            <p className="ops-login__label">دلیل / یادداشت وضعیت</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {customer.statusReason}
            </p>
            {customer.statusChangedAt ? (
              <p className="mt-2 text-xs text-[var(--ops-muted)]">
                آخرین تغییر: {formatDateTime(customer.statusChangedAt)}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="admin-stat-grid mb-6">
        <div className="admin-stat text-start">
          <p className="caption-up">سفارش‌ها</p>
          <p className="admin-stat__value">
            {stats.ordersCount.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">فاکتورها</p>
          <p className="admin-stat__value">
            {stats.invoicesCount.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">پرداخت‌شده</p>
          <p className="admin-stat__value" style={{ fontSize: "1.15rem" }}>
            {formatMoney(stats.paidTotal)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">پرداخت‌نشده</p>
          <p className="admin-stat__value" style={{ fontSize: "1.15rem" }}>
            {formatMoney(stats.unpaidTotal)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">سفارش قطعات</p>
          <p className="admin-stat__value">
            {stats.sparePartsOrdersCount.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <div className="admin-card-grid mb-6">
        <Metabox title="پروفایل مشتری">
          <dl className="grid gap-3 text-sm text-start">
            <div>
              <dt className="text-[var(--ops-muted)]">شرکت</dt>
              <dd className="mt-1 font-medium text-[var(--ops-ink)]">
                {customer.companyName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">مخاطب</dt>
              <dd className="mt-1">{customer.contactPerson ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">تلفن</dt>
              <dd className="mt-1" dir="ltr">
                {customer.phone ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">کشور / شهر</dt>
              <dd className="mt-1">
                {[customer.country, customer.city]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">آدرس</dt>
              <dd className="mt-1">{customer.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">صنعت</dt>
              <dd className="mt-1">{customer.industry ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">شرایط پرداخت</dt>
              <dd className="mt-1">{customer.paymentTerms}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">تاریخ ثبت</dt>
              <dd className="mt-1">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </Metabox>

        <Metabox title="حساب کاربری">
          {user ? (
            <dl className="grid gap-3 text-sm text-start">
              <div>
                <dt className="text-[var(--ops-muted)]">نام</dt>
                <dd className="mt-1">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">ایمیل</dt>
                <dd className="mt-1" dir="ltr">
                  {user.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">موبایل</dt>
                <dd className="mt-1" dir="ltr">
                  {user.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">آخرین ورود</dt>
                <dd className="mt-1">{formatDateTime(user.lastLoginAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--ops-muted)]">
              حساب کاربری متصل نیست.
            </p>
          )}
        </Metabox>
      </div>

      <Metabox title="سفارش‌ها">
        <DataTable
          headers={["شماره", "نوع", "مبلغ", "وضعیت", "پرداخت", "تاریخ"]}
          isEmpty={orders.length === 0}
          emptyText="سفارشی ثبت نشده."
        >
          {orders.map((order) => (
            <DataRow key={order.id}>
              <td className="text-start">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium text-[var(--ops-accent)] hover:underline"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td>{labelOf(ORDER_TYPE, order.orderType)}</td>
              <td>{formatMoney(order.totalAmount)}</td>
              <td>{labelOf(ORDER_STATUS, order.status)}</td>
              <td>{labelOf(PAYMENT_STATUS, order.paymentStatus)}</td>
              <td>{formatDate(order.createdAt)}</td>
            </DataRow>
          ))}
        </DataTable>
      </Metabox>

      <div className="mt-6">
        <Metabox title="فاکتورها">
          <DataTable
            headers={["شماره", "اقلام", "مبلغ", "وضعیت", "سررسید"]}
            isEmpty={invoices.length === 0}
            emptyText="فاکتوری ثبت نشده."
          >
            {invoices.map((invoice) => (
              <DataRow key={invoice.id}>
                <td className="text-start">
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="font-medium text-[var(--ops-accent)] hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td>
                  {(invoice.lineItemsJson?.length ?? 0).toLocaleString("fa-IR")}
                </td>
                <td>{formatMoney(invoice.totalAfterTax)}</td>
                <td>{labelOf(INVOICE_STATUS, invoice.paymentStatus)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
              </DataRow>
            ))}
          </DataTable>
        </Metabox>
      </div>

      <div className="mt-6">
        <Metabox title="پرداخت‌ها">
          <DataTable
            headers={["فاکتور", "مبلغ", "روش", "وضعیت", "تراکنش"]}
            isEmpty={payments.length === 0}
            emptyText="پرداختی ثبت نشده."
          >
            {payments.map((payment) => (
              <DataRow key={payment.id}>
                <td className="text-start">
                  {payment.invoiceId ? (
                    <Link
                      href={`/admin/invoices/${payment.invoiceId}`}
                      className="text-[var(--ops-accent)] hover:underline"
                      dir="ltr"
                    >
                      {payment.invoiceId.slice(0, 8)}…
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{formatMoney(payment.amount)}</td>
                <td>{labelOf(PAYMENT_METHOD, payment.paymentMethod)}</td>
                <td>{labelOf(PAYMENT_STATUS, payment.paymentStatus)}</td>
                <td dir="ltr">{payment.transactionId ?? "—"}</td>
              </DataRow>
            ))}
          </DataTable>
        </Metabox>
      </div>

      <div className="mt-6">
        <Metabox title="پیش‌فاکتورها">
          <DataTable
            headers={["شماره", "مبلغ", "وضعیت", "اعتبار تا", "تاریخ"]}
            isEmpty={quotations.length === 0}
            emptyText="پیش‌فاکتوری ثبت نشده."
          >
            {quotations.map((quotation) => (
              <DataRow key={quotation.id}>
                <td className="text-start font-medium text-[var(--ops-ink)]">
                  {quotation.quotationNumber}
                </td>
                <td>{formatMoney(quotation.totalAmount)}</td>
                <td>{labelOf(QUOTATION_STATUS, quotation.status)}</td>
                <td>{formatDate(quotation.validUntil)}</td>
                <td>{formatDate(quotation.createdAt)}</td>
              </DataRow>
            ))}
          </DataTable>
        </Metabox>
      </div>
    </AdminShell>
  );
}
