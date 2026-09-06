'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { fetchAdminOrders, OrderAdminSummary, updateOrderStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'processing', 'manufactured', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [orders, setOrders] = useState<OrderAdminSummary[]>([]);
  useEffect(() => { if (token) fetchAdminOrders(token).then(setOrders).catch(() => undefined); }, [token]);
  async function changeStatus(id: string, status: string) { if (!token) return; const updated = await updateOrderStatus(token, id, status); setOrders((current) => current.map((item) => item.id === id ? updated : item)); }
  return <AdminShell eyebrow="MIG / FULFILLMENT" title="سفارش‌ها"><DataTable headers={['شماره سفارش', 'مشتری', 'مبلغ', 'پرداخت', 'وضعیت']}><div>{orders.map((order) => <div key={order.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><strong>{order.orderNumber}</strong><span className="text-xs text-neutral-500">{order.customerId.slice(0, 8)}...</span><span className="text-sm font-bold text-primary-600 dark:text-primary-500">{order.totalAmount.toLocaleString('fa-IR')} ریال</span><span className="text-xs text-neutral-500">{order.paymentStatus}</span><select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)} className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{orders.length === 0 && <p className="py-16 text-center text-neutral-500">سفارشی ثبت نشده است.</p>}</div></DataTable></AdminShell>;
}
