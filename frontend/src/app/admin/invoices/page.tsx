'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { fetchAdminInvoices, InvoiceAdminSummary, updateInvoiceStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'partial', 'paid', 'overdue', 'cancelled'];
export default function AdminInvoicesPage() { const token = useAuthStore((state) => state.accessToken); const [invoices, setInvoices] = useState<InvoiceAdminSummary[]>([]); useEffect(() => { if (token) fetchAdminInvoices(token).then(setInvoices).catch(() => undefined); }, [token]); async function change(id: string, status: string) { if (!token) return; const updated = await updateInvoiceStatus(token, id, status); setInvoices((items) => items.map((item) => item.id === id ? updated : item)); } return <AdminShell eyebrow="MIG / FINANCE" title="فاکتورها"><DataTable headers={['شماره فاکتور', 'مشتری', 'مبلغ', 'سررسید', 'وضعیت']}><div>{invoices.map((invoice) => <div key={invoice.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><strong>{invoice.invoiceNumber}</strong><span className="text-xs text-neutral-500">{invoice.customerId.slice(0, 8)}...</span><span className="text-sm font-bold text-primary-600 dark:text-primary-500">{invoice.totalAfterTax.toLocaleString('fa-IR')} ریال</span><span className="text-xs text-neutral-500">{new Date(invoice.dueDate).toLocaleDateString('fa-IR')}</span><select value={invoice.paymentStatus} onChange={(event) => change(invoice.id, event.target.value)} className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{invoices.length === 0 && <p className="py-16 text-center text-neutral-500">فاکتوری صادر نشده است.</p>}</div></DataTable></AdminShell>; }
