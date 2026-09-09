'use client';

import { useCallback } from 'react';
import { AdminStatusResourcePage } from '@/components/admin/AdminStatusResourcePage';
import {
  formatDate,
  formatMoney,
  QUOTATION_STATUS,
} from '@/lib/admin-labels';
import { fetchAdminQuotations, QuotationAdminSummary, updateQuotationStatus } from '@/lib/api-client';

const statusOptions = Object.entries(QUOTATION_STATUS).map(([value, label]) => ({ value, label }));

export default function AdminQuotationsPage() {
  const searchText = useCallback(
    (item: QuotationAdminSummary) =>
      `${item.quotationNumber} ${item.customerId} ${item.status} ${QUOTATION_STATUS[item.status] ?? ''}`,
    [],
  );

  return (
    <AdminStatusResourcePage
      eyebrow="فروش"
      title="پیش‌فاکتورها"
      resourceLabel="پیش‌فاکتور"
      headers={['شماره', 'شناسه مشتری', 'مبلغ', 'اعتبار تا']}
      columns={[
        {
          header: 'شماره',
          cell: (item) => <strong className="font-medium text-[var(--ops-ink)]">{item.quotationNumber}</strong>,
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
        { header: 'اعتبار', cell: (item) => formatDate(item.validUntil) },
      ]}
      statusMap={QUOTATION_STATUS}
      statusOptions={statusOptions}
      getStatus={(item) => item.status}
      searchText={searchText}
      fetchItems={fetchAdminQuotations}
      updateStatus={updateQuotationStatus}
      cancelStatus="rejected"
      addHint="پیش‌فاکتور جدید از درخواست قیمت مشتری در سایت ساخته می‌شود. پس از ثبت، وضعیت آن را از همین فهرست مدیریت کنید."
    />
  );
}
