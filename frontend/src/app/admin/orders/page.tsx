'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { AdminStatusResourcePage } from '@/components/admin/AdminStatusResourcePage';
import { formatMoney, ORDER_STATUS, ORDER_TYPE, PAYMENT_STATUS, labelOf } from '@/lib/admin-labels';
import { fetchAdminOrders, fetchAdminOrdersPage, OrderAdminSummary, updateOrderStatus } from '@/lib/api-client';

const statusOptions = Object.entries(ORDER_STATUS).map(([value, label]) => ({ value, label }));

export default function AdminOrdersPage() {
  const searchText = useCallback(
    (item: OrderAdminSummary) =>
      `${item.orderNumber} ${item.customerId} ${item.status} ${item.paymentStatus} ${item.orderType ?? ''} ${ORDER_STATUS[item.status] ?? ''}`,
    [],
  );

  return (
    <AdminStatusResourcePage
      eyebrow="عملیات"
      title="سفارش‌ها"
      resourceLabel="سفارش"
      headers={['شماره سفارش', 'نوع', 'شناسه مشتری', 'مبلغ', 'وضعیت پرداخت']}
      columns={[
        {
          header: 'شماره',
          cell: (item) => (
            <Link
              href={`/admin/orders/${item.id}`}
              className="font-medium text-[var(--ops-accent)] hover:underline"
            >
              {item.orderNumber}
            </Link>
          ),
        },
        {
          header: 'نوع',
          cell: (item) => labelOf(ORDER_TYPE, item.orderType),
        },
        {
          header: 'مشتری',
          cell: (item) => (
            <span className="text-xs text-[var(--ops-muted)]" dir="ltr">
              {item.customerId.slice(0, 10)}…
            </span>
          ),
        },
        { header: 'مبلغ', cell: (item) => formatMoney(item.totalAmount) },
        {
          header: 'پرداخت',
          cell: (item) => labelOf(PAYMENT_STATUS, item.paymentStatus),
        },
      ]}
      statusMap={ORDER_STATUS}
      statusOptions={statusOptions}
      getStatus={(item) => item.status}
      searchText={searchText}
      fetchItems={fetchAdminOrders}
      fetchPage={fetchAdminOrdersPage}
      updateStatus={updateOrderStatus}
      cancelStatus="cancelled"
      addHint="سفارش جدید معمولاً با تأیید پیش‌فاکتور توسط مشتری ساخته می‌شود. وضعیت تولید و ارسال را از همین صفحه به‌روز کنید."
    />
  );
}
