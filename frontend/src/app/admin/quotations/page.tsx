'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import {
  fetchAdminQuotations,
  QuotationAdminSummary,
  updateQuotationStatus,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

export default function AdminQuotationsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [quotations, setQuotations] = useState<QuotationAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminQuotations(token).then(setQuotations).catch(() => undefined);
  }, [token]);

  async function changeStatus(id: string, status: string) {
    if (!token) return;
    const updated = await updateQuotationStatus(token, id, status);
    setQuotations((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="فروش" title="پیش‌فاکتورها">
      <DataTable headers={['شماره', 'مشتری', 'مبلغ', 'اعتبار', 'وضعیت']}>
        {quotations.map((quotation) => (
          <DataRow key={quotation.id} className="text-start">
            <strong className="font-normal text-ink">{quotation.quotationNumber}</strong>
            <span className="text-xs text-muted">{quotation.customerId.slice(0, 8)}…</span>
            <span className="text-ink">{quotation.totalAmount.toLocaleString('fa-IR')} ریال</span>
            <span className="text-xs text-muted">
              {new Date(quotation.validUntil).toLocaleDateString('fa-IR')}
            </span>
            <select
              value={quotation.status}
              onChange={(event) => changeStatus(quotation.id, event.target.value)}
              className="admin-select"
              aria-label={`وضعیت ${quotation.quotationNumber}`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </DataRow>
        ))}
        {quotations.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">پیش‌فاکتوری ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
