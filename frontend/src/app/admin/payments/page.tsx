'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { fetchAdminPayments, PaymentAdminSummary, updatePaymentStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
export default function AdminPaymentsPage() { const token = useAuthStore((state) => state.accessToken); const [payments, setPayments] = useState<PaymentAdminSummary[]>([]); useEffect(() => { if (token) fetchAdminPayments(token).then(setPayments).catch(() => undefined); }, [token]); async function change(id: string, status: string) { if (!token) return; const updated = await updatePaymentStatus(token, id, status); setPayments((items) => items.map((item) => item.id === id ? updated : item)); } return <AdminShell eyebrow="MIG / PAYMENTS" title="پرداخت‌ها"><DataTable headers={['فاکتور', 'مبلغ', 'روش پرداخت', 'تراکنش', 'وضعیت']}><div>{payments.map((payment) => <div key={payment.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><strong>{payment.invoiceId.slice(0, 8)}...</strong><span className="text-sm font-bold text-primary-600 dark:text-primary-500">{payment.amount.toLocaleString('fa-IR')} ریال</span><span className="text-xs text-neutral-500">{payment.paymentMethod}</span><span className="text-xs text-neutral-500">{payment.transactionId ?? 'بدون شناسه'}</span><select value={payment.paymentStatus} onChange={(event) => change(payment.id, event.target.value)} className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{payments.length === 0 && <p className="py-16 text-center text-neutral-500">پرداختی ثبت نشده است.</p>}</div></DataTable></AdminShell>; }
