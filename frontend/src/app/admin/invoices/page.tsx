'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { fetchAdminInvoices, InvoiceAdminSummary, updateInvoiceStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'partial', 'paid', 'overdue', 'cancelled'];

export default function AdminInvoicesPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [invoices, setInvoices] = useState<InvoiceAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminInvoices(token).then(setInvoices).catch(() => undefined);
  }, [token]);

  async function change(id: string, status: string) {
    if (!token) return;
    const updated = await updateInvoiceStatus(token, id, status);
    setInvoices((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="مالی" title="فاکتورها">
      <DataTable headers={['شماره فاکتور', 'مشتری', 'مبلغ', 'سررسید', 'وضعیت']}>
        {invoices.map((invoice) => (
          <DataRow key={invoice.id} className="text-start">
            <strong className="font-normal text-ink">{invoice.invoiceNumber}</strong>
            <span className="text-xs text-muted">{invoice.customerId.slice(0, 8)}…</span>
            <span className="text-ink">{invoice.totalAfterTax.toLocaleString('fa-IR')} ریال</span>
            <span className="text-xs text-muted">
              {new Date(invoice.dueDate).toLocaleDateString('fa-IR')}
            </span>
            <select
              value={invoice.paymentStatus}
              onChange={(event) => change(invoice.id, event.target.value)}
              className="admin-select"
              aria-label={`وضعیت ${invoice.invoiceNumber}`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </DataRow>
        ))}
        {invoices.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">فاکتوری صادر نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
