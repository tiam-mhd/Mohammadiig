'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { fetchAdminUsers, updateUserActive, updateUserRole, UserAdminSummary } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const roles = ['admin', 'salesman', 'support', 'accountant', 'customer'];

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [users, setUsers] = useState<UserAdminSummary[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchAdminUsers(token).then(setUsers).catch(() => undefined);
  }, [token]);

  async function changeRole(id: string, role: string) {
    if (!token) return;
    const updated = await updateUserRole(token, id, role);
    setUsers((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  async function toggleActive(id: string, isActive: boolean) {
    if (!token) return;
    const updated = await updateUserActive(token, id, isActive);
    setUsers((current) => current.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="دسترسی" title="کاربران و نقش‌ها">
      <DataTable
        headers={['نام', 'ایمیل', 'شرکت', 'نقش', 'وضعیت', 'آخرین ورود']}
        columns="sm:grid-cols-6"
      >
        {users.map((user) => {
          const fullName =
            user.firstName || user.lastName
              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
              : '—';

          return (
            <DataRow key={user.id} columns="sm:grid-cols-6" className="text-start">
              <div>
                <strong className="block font-normal text-ink">{fullName}</strong>
                <span className="mt-1 block text-xs text-muted">{user.id.slice(0, 8)}…</span>
              </div>
              <span className="text-sm text-muted" dir="ltr">
                {user.email}
              </span>
              <span className="text-sm text-muted">{user.companyName ?? '—'}</span>
              <select
                value={user.role}
                onChange={(event) => changeRole(user.id, event.target.value)}
                className="admin-select"
                aria-label={`نقش ${user.email}`}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 font-ui text-xs text-muted">
                <input
                  type="checkbox"
                  checked={user.isActive}
                  onChange={(event) => toggleActive(user.id, event.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                {user.isActive ? 'فعال' : 'غیرفعال'}
              </label>
              <span className="text-xs text-muted">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fa-IR') : '—'}
              </span>
            </DataRow>
          );
        })}
        {users.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">کاربری ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
