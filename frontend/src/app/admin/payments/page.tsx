'use client';

import { useCallback } from 'react';
import { AdminStatusResourcePage } from '@/components/admin/AdminStatusResourcePage';
import { formatMoney, labelOf, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/admin-labels';
import { fetchAdminPayments, PaymentAdminSummary, updatePaymentStatus } from '@/lib/api-client';

const statusOptions = Object.entries(PAYMENT_STATUS)
  .filter(([value]) => ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(value))
  .map(([value, label]) => ({ value, label }));

export default function AdminPaymentsPage() {
  const searchText = useCallback(
    (item: PaymentAdminSummary) =>
      `${item.invoiceId} ${item.paymentMethod} ${item.paymentStatus} ${item.transactionId ?? ''} ${PAYMENT_STATUS[item.paymentStatus] ?? ''}`,
    [],
  );

  return (
    <AdminStatusResourcePage
      eyebrow="مالی"
      title="پرداخت‌ها"
      resourceLabel="پرداخت"
      headers={['فاکتور', 'مبلغ', 'روش پرداخت', 'پیگیری']}
      columns={[
        {
          header: 'فاکتور',
          cell: (item) => (
            <span className="text-xs" dir="ltr">
              {item.invoiceId.slice(0, 10)}…
            </span>
          ),
        },
        { header: 'مبلغ', cell: (item) => formatMoney(item.amount) },
        {
          header: 'روش',
          cell: (item) => labelOf(PAYMENT_METHOD, item.paymentMethod, item.paymentMethod),
        },
        {
          header: 'پیگیری',
          cell: (item) => (
            <span className="text-xs text-[var(--ops-muted)]" dir="ltr">
              {item.transactionId ?? '—'}
            </span>
          ),
        },
      ]}
      statusMap={PAYMENT_STATUS}
      statusOptions={statusOptions}
      getStatus={(item) => item.paymentStatus}
      searchText={searchText}
      fetchItems={fetchAdminPayments}
      updateStatus={updatePaymentStatus}
      cancelStatus="cancelled"
      addHint="پرداخت از پنل مشتری روی فاکتور ثبت می‌شود. تأیید یا رد پرداخت را از این فهرست انجام دهید."
    />
  );
}
