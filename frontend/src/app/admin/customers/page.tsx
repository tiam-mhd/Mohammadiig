'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { CustomerAdminSummary, fetchAdminCustomers } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminCustomersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [customers, setCustomers] = useState<CustomerAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminCustomers(token).then(setCustomers).catch(() => undefined);
  }, [token]);

  return (
    <AdminShell eyebrow="مشتریان" title="فهرست مشتریان">
      <DataTable headers={['شرکت', 'تماس', 'کشور', 'شرایط پرداخت', 'وضعیت']}>
        {customers.map((customer) => (
          <DataRow key={customer.id} className="text-start">
            <div>
              <strong className="block font-normal text-ink">{customer.companyName}</strong>
              <span className="mt-1 block text-xs text-muted">
                {customer.contactPerson ?? 'بدون مخاطب'}
              </span>
            </div>
            <span className="text-muted">{customer.phone ?? '—'}</span>
            <span className="text-muted">{customer.country ?? '—'}</span>
            <span className="text-muted">{customer.paymentTerms}</span>
            <span
              className={`admin-badge w-fit ${customer.isVerified ? 'admin-badge--ok' : 'admin-badge--warn'}`}
            >
              {customer.isVerified ? 'تأیید شده' : 'در انتظار تأیید'}
            </span>
          </DataRow>
        ))}
        {customers.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">مشتری‌ای ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
