'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { fetchAdminPayments, PaymentAdminSummary, updatePaymentStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

export default function AdminPaymentsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [payments, setPayments] = useState<PaymentAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminPayments(token).then(setPayments).catch(() => undefined);
  }, [token]);

  async function change(id: string, status: string) {
    if (!token) return;
    const updated = await updatePaymentStatus(token, id, status);
    setPayments((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="مالی" title="پرداخت‌ها">
      <DataTable headers={['فاکتور', 'مبلغ', 'روش پرداخت', 'تراکنش', 'وضعیت']}>
        {payments.map((payment) => (
          <DataRow key={payment.id} className="text-start">
            <strong className="font-normal text-ink">{payment.invoiceId.slice(0, 8)}…</strong>
            <span className="text-ink">{payment.amount.toLocaleString('fa-IR')} ریال</span>
            <span className="text-xs text-muted">{payment.paymentMethod}</span>
            <span className="text-xs text-muted">{payment.transactionId ?? 'بدون شناسه'}</span>
            <select
              value={payment.paymentStatus}
              onChange={(event) => change(payment.id, event.target.value)}
              className="admin-select"
              aria-label={`وضعیت پرداخت ${payment.id.slice(0, 8)}`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </DataRow>
        ))}
        {payments.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">پرداختی ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
