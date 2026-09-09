'use client';

import { useCallback } from 'react';
import { AdminStatusResourcePage } from '@/components/admin/AdminStatusResourcePage';
import { formatDate, formatMoney, INVOICE_STATUS } from '@/lib/admin-labels';
import { fetchAdminInvoices, InvoiceAdminSummary, updateInvoiceStatus } from '@/lib/api-client';

const statusOptions = Object.entries(INVOICE_STATUS).map(([value, label]) => ({ value, label }));

export default function AdminInvoicesPage() {
  const searchText = useCallback(
    (item: InvoiceAdminSummary) =>
      `${item.invoiceNumber} ${item.customerId} ${item.paymentStatus} ${INVOICE_STATUS[item.paymentStatus] ?? ''}`,
    [],
  );

  return (
    <AdminStatusResourcePage
      eyebrow="مالی"
      title="فاکتورها"
      resourceLabel="فاکتور"
      headers={['شماره فاکتور', 'شناسه مشتری', 'مبلغ', 'سررسید']}
      columns={[
        {
          header: 'شماره',
          cell: (item) => <strong className="font-medium text-[var(--ops-ink)]">{item.invoiceNumber}</strong>,
        },
        {
          header: 'مشتری',
          cell: (item) => (
            <span className="text-xs text-[var(--ops-muted)]" dir="ltr">
              {item.customerId.slice(0, 10)}…
            </span>
          ),
        },
        { header: 'مبلغ', cell: (item) => formatMoney(item.totalAfterTax) },
        { header: 'سررسید', cell: (item) => formatDate(item.dueDate) },
      ]}
      statusMap={INVOICE_STATUS}
      statusOptions={statusOptions}
      getStatus={(item) => item.paymentStatus}
      searchText={searchText}
      fetchItems={fetchAdminInvoices}
      updateStatus={updateInvoiceStatus}
      cancelStatus="cancelled"
      addHint="فاکتور هنگام تبدیل سفارش ساخته می‌شود. وضعیت تسویه را از همین صفحه به‌روز کنید."
    />
  );
}
