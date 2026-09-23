'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  INVOICE_STATUS,
  labelOf,
  PAYMENT_METHOD,
} from '@/lib/admin-labels';
import { fetchAdminInvoice, InvoiceSummary } from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { resolveMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth.store';

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

function SnapshotBlock({ title, data }: { title: string; data?: Record<string, string> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Metabox title={title}>
        <p className="text-sm text-[var(--ops-muted)]">ثبت نشده.</p>
      </Metabox>
    );
  }
  return (
    <Metabox title={title}>
      <dl className="grid gap-2 text-sm text-start">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <dt className="text-[var(--ops-muted)]">{key}</dt>
            <dd className="mt-0.5 text-[var(--ops-ink)]">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Metabox>
  );
}

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !params.id) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminInvoice(token, params.id)
      .then((result) => {
        if (!cancelled) setInvoice(result);
      })
      .catch(() => {
        if (!cancelled) adminToast.error('بارگذاری فاکتور انجام نشد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, params.id]);

  if (!token) {
    return (
      <AdminShell eyebrow="مالی" title="جزئیات فاکتور">
        <p className="text-sm text-[var(--ops-muted)]">برای مشاهده وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="مالی" title="جزئیات فاکتور">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  if (!invoice) {
    return (
      <AdminShell eyebrow="مالی" title="جزئیات فاکتور">
        <div className="admin-editor__topbar">
          <Link href="/admin/invoices" className="ops-btn ops-btn--ghost">
            ← بازگشت به فهرست
          </Link>
        </div>
        <p className="text-sm text-[var(--ops-muted)]">فاکتور یافت نشد.</p>
      </AdminShell>
    );
  }

  const customer = invoice.customerSnapshotJson;

  return (
    <AdminShell eyebrow="مالی" title={invoice.invoiceNumber}>
      <div className="admin-editor__topbar">
        <Link href="/admin/invoices" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className="admin-badge">{labelOf(INVOICE_STATUS, invoice.paymentStatus)}</span>
        </div>
      </div>

      <div className="admin-stat-grid mb-6">
        <div className="admin-stat text-start">
          <p className="caption-up">مبلغ نهایی</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(invoice.totalAfterTax)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">قبل از مالیات</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(invoice.totalBeforeTax)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">مالیات</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(invoice.taxAmount)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">سررسید</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      <div className="admin-card-grid mb-6">
        <Metabox title="خلاصه فاکتور">
          <dl className="grid gap-3 text-sm text-start">
            <div>
              <dt className="text-[var(--ops-muted)]">شماره فاکتور</dt>
              <dd className="mt-1 font-medium">{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">سفارش مرتبط</dt>
              <dd className="mt-1">
                {invoice.orderId ? (
                  <Link
                    href={`/admin/orders/${invoice.orderId}`}
                    className="text-[var(--ops-accent)] hover:underline"
                    dir="ltr"
                  >
                    {invoice.orderId}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">روش پرداخت</dt>
              <dd className="mt-1">{labelOf(PAYMENT_METHOD, invoice.paymentMethod)}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">زمان پرداخت</dt>
              <dd className="mt-1">{formatDateTime(invoice.paidAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">تاریخ ایجاد</dt>
              <dd className="mt-1">{formatDate(invoice.createdAt)}</dd>
            </div>
            {invoice.notes ? (
              <div>
                <dt className="text-[var(--ops-muted)]">یادداشت</dt>
                <dd className="mt-1">{invoice.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Metabox>

        <Metabox title="مشتری (اسنپ‌شات)">
          {customer ? (
            <dl className="grid gap-3 text-sm text-start">
              <div>
                <dt className="text-[var(--ops-muted)]">شرکت</dt>
                <dd className="mt-1 font-medium">
                  {customer.customerId ? (
                    <Link
                      href={`/admin/customers/${customer.customerId}`}
                      className="text-[var(--ops-accent)] hover:underline"
                    >
                      {customer.companyName ?? customer.customerId}
                    </Link>
                  ) : (
                    (customer.companyName ?? '—')
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">مخاطب</dt>
                <dd className="mt-1">{customer.contactPerson ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">تلفن</dt>
                <dd className="mt-1" dir="ltr">
                  {customer.phone ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">ایمیل</dt>
                <dd className="mt-1" dir="ltr">
                  {customer.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ops-muted)]">آدرس</dt>
                <dd className="mt-1">
                  {[customer.address, customer.city, customer.country].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--ops-muted)]">اسنپ‌شات مشتری موجود نیست.</p>
          )}
        </Metabox>

        <SnapshotBlock title="ارسال (اسنپ‌شات)" data={invoice.shippingSnapshotJson} />
        <SnapshotBlock title="صورتحساب (اسنپ‌شات)" data={invoice.billingSnapshotJson} />
      </div>

      <Metabox title="اقلام فاکتور">
        <DataTable
          headers={['تصویر', 'عنوان', 'SKU', 'تعداد', 'قیمت واحد', 'جمع']}
          isEmpty={!invoice.lineItemsJson?.length}
          emptyText="اقلامی ثبت نشده."
        >
          {(invoice.lineItemsJson ?? []).map((item, index) => (
            <DataRow key={`${item.sku}-${index}`}>
              <td>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(item.imageUrl)} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  '—'
                )}
              </td>
              <td className="text-start font-medium text-[var(--ops-ink)]">{item.title}</td>
              <td dir="ltr">{item.sku || '—'}</td>
              <td>{item.quantity.toLocaleString('fa-IR')}</td>
              <td>{formatMoney(item.unitPrice)}</td>
              <td>{formatMoney(item.lineTotal)}</td>
            </DataRow>
          ))}
        </DataTable>
      </Metabox>
    </AdminShell>
  );
}
