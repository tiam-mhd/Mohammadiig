'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { fetchAdminOrders, OrderAdminSummary, updateOrderStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['pending', 'processing', 'manufactured', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [orders, setOrders] = useState<OrderAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminOrders(token).then(setOrders).catch(() => undefined);
  }, [token]);

  async function changeStatus(id: string, status: string) {
    if (!token) return;
    const updated = await updateOrderStatus(token, id, status);
    setOrders((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="عملیات" title="سفارش‌ها">
      <DataTable headers={['شماره سفارش', 'مشتری', 'مبلغ', 'پرداخت', 'وضعیت']}>
        {orders.map((order) => (
          <DataRow key={order.id} className="text-start">
            <strong className="font-normal text-ink">{order.orderNumber}</strong>
            <span className="text-xs text-muted">{order.customerId.slice(0, 8)}…</span>
            <span className="text-ink">{order.totalAmount.toLocaleString('fa-IR')} ریال</span>
            <span className="text-xs text-muted">{order.paymentStatus}</span>
            <select
              value={order.status}
              onChange={(event) => changeStatus(order.id, event.target.value)}
              className="admin-select"
              aria-label={`وضعیت ${order.orderNumber}`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </DataRow>
        ))}
        {orders.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">سفارشی ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
