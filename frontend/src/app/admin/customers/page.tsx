'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { CustomerAdminSummary, fetchAdminCustomers } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminCustomersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [customers, setCustomers] = useState<CustomerAdminSummary[]>([]);
  useEffect(() => { if (token) fetchAdminCustomers(token).then(setCustomers).catch(() => undefined); }, [token]);
  return <AdminShell eyebrow="MIG / CRM" title="مشتریان B2B"><DataTable headers={['شرکت', 'تماس', 'کشور', 'شرایط پرداخت', 'وضعیت']}><div>{customers.map((customer) => <div key={customer.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><div><strong className="block">{customer.companyName}</strong><span className="mt-1 block text-xs text-neutral-500">{customer.contactPerson ?? 'بدون مخاطب'}</span></div><span className="text-sm text-neutral-500">{customer.phone ?? '—'}</span><span className="text-sm text-neutral-500">{customer.country ?? '—'}</span><span className="text-sm text-neutral-500">{customer.paymentTerms}</span><span className={`w-fit px-2 py-1 text-xs font-bold ${customer.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{customer.isVerified ? 'تأیید شده' : 'در انتظار تأیید'}</span></div>)}{customers.length === 0 && <p className="py-16 text-center text-neutral-500">مشتری‌ای ثبت نشده است.</p>}</div></DataTable></AdminShell>;
}
