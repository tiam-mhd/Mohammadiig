'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { fetchAdminQuotations, QuotationAdminSummary, updateQuotationStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

export default function AdminQuotationsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [quotations, setQuotations] = useState<QuotationAdminSummary[]>([]);
  useEffect(() => { if (token) fetchAdminQuotations(token).then(setQuotations).catch(() => undefined); }, [token]);
  async function changeStatus(id: string, status: string) { if (!token) return; const updated = await updateQuotationStatus(token, id, status); setQuotations((current) => current.map((item) => item.id === id ? updated : item)); }
  return <AdminShell eyebrow="MIG / SALES PIPELINE" title="پیش‌فاکتورها"><DataTable headers={['شماره', 'مشتری', 'مبلغ', 'اعتبار', 'وضعیت']}><div>{quotations.map((quotation) => <div key={quotation.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><strong>{quotation.quotationNumber}</strong><span className="text-xs text-neutral-500">{quotation.customerId.slice(0, 8)}...</span><span className="text-sm font-bold text-primary-600 dark:text-primary-500">{quotation.totalAmount.toLocaleString('fa-IR')} ریال</span><span className="text-xs text-neutral-500">{new Date(quotation.validUntil).toLocaleDateString('fa-IR')}</span><select value={quotation.status} onChange={(event) => changeStatus(quotation.id, event.target.value)} className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{quotations.length === 0 && <p className="py-16 text-center text-neutral-500">پیش‌فاکتوری ثبت نشده است.</p>}</div></DataTable></AdminShell>;
}
