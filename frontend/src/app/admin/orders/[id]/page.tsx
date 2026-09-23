'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import {
  formatDate,
  formatMoney,
  labelOf,
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_STATUS,
} from '@/lib/admin-labels';
import { fetchAdminOrder, OrderDetail } from '@/lib/api-client';
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

function AddressBlock({ title, address }: { title: string; address?: Record<string, string> }) {
  if (!address || Object.keys(address).length === 0) {
    return (
      <Metabox title={title}>
        <p className="text-sm text-[var(--ops-muted)]">ثبت نشده.</p>
      </Metabox>
    );
  }
  return (
    <Metabox title={title}>
      <dl className="grid gap-2 text-sm text-start">
        {Object.entries(address).map(([key, value]) => (
          <div key={key}>
            <dt className="text-[var(--ops-muted)]">{key}</dt>
            <dd className="mt-0.5 text-[var(--ops-ink)]">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Metabox>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !params.id) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminOrder(token, params.id)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch(() => {
        if (!cancelled) adminToast.error('بارگذاری سفارش انجام نشد.');
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
      <AdminShell eyebrow="عملیات" title="جزئیات سفارش">
        <p className="text-sm text-[var(--ops-muted)]">برای مشاهده وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="عملیات" title="جزئیات سفارش">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell eyebrow="عملیات" title="جزئیات سفارش">
        <div className="admin-editor__topbar">
          <Link href="/admin/orders" className="ops-btn ops-btn--ghost">
            ← بازگشت به فهرست
          </Link>
        </div>
        <p className="text-sm text-[var(--ops-muted)]">سفارش یافت نشد.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="عملیات" title={order.orderNumber}>
      <div className="admin-editor__topbar">
        <Link href="/admin/orders" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className="admin-badge">{labelOf(ORDER_STATUS, order.status)}</span>
          <span className="admin-badge">{labelOf(PAYMENT_STATUS, order.paymentStatus)}</span>
          {order.orderType ? <span className="admin-badge">{labelOf(ORDER_TYPE, order.orderType)}</span> : null}
        </div>
      </div>

      <div className="admin-stat-grid mb-6">
        <div className="admin-stat text-start">
          <p className="caption-up">مبلغ کل</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(order.totalAmount)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">جمع جزء</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(order.subtotal)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">مالیات</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(order.taxAmount)}
          </p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">هزینه ارسال</p>
          <p className="admin-stat__value" style={{ fontSize: '1.15rem' }}>
            {formatMoney(order.shippingCost)}
          </p>
        </div>
      </div>

      <div className="admin-card-grid mb-6">
        <Metabox title="خلاصه">
          <dl className="grid gap-3 text-sm text-start">
            <div>
              <dt className="text-[var(--ops-muted)]">شماره سفارش</dt>
              <dd className="mt-1 font-medium">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">شناسه مشتری</dt>
              <dd className="mt-1">
                {order.customerId ? (
                  <Link
                    href={`/admin/customers/${order.customerId}`}
                    className="text-[var(--ops-accent)] hover:underline"
                    dir="ltr"
                  >
                    {order.customerId}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">تاریخ</dt>
              <dd className="mt-1">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[var(--ops-muted)]">فاکتور</dt>
              <dd className="mt-1">
                {order.invoice ? (
                  <Link
                    href={`/admin/invoices/${order.invoice.id}`}
                    className="font-medium text-[var(--ops-accent)] hover:underline"
                  >
                    {order.invoice.invoiceNumber}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            {order.notes ? (
              <div>
                <dt className="text-[var(--ops-muted)]">یادداشت</dt>
                <dd className="mt-1">{order.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Metabox>
        <AddressBlock title="آدرس ارسال" address={order.shippingAddress} />
        <AddressBlock title="آدرس صورتحساب" address={order.billingAddress} />
      </div>

      <Metabox title="اقلام سفارش">
        <DataTable
          headers={['تصویر', 'عنوان', 'SKU', 'تعداد', 'قیمت واحد', 'جمع']}
          isEmpty={!order.items?.length}
          emptyText="اقلامی ثبت نشده."
        >
          {(order.items ?? []).map((item) => (
            <DataRow key={item.id}>
              <td>
                {item.imageSnapshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(item.imageSnapshot)}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  '—'
                )}
              </td>
              <td className="text-start font-medium text-[var(--ops-ink)]">
                {item.titleSnapshot ?? item.itemType}
              </td>
              <td dir="ltr">{item.skuSnapshot ?? '—'}</td>
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
