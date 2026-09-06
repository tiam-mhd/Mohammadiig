'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
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
    <AdminShell eyebrow="MIG / ACCESS CONTROL" title="کاربران و نقش‌ها">
      <DataTable headers={['نام', 'ایمیل', 'شرکت', 'نقش', 'وضعیت', 'آخرین ورود']}>
        <div>
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-6 sm:items-center dark:border-white/10">
              <div>
                <strong className="block">{user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '—'}</strong>
                <span className="mt-1 block text-xs text-neutral-500">{user.id.slice(0, 8)}...</span>
              </div>
              <span className="text-sm text-neutral-500">{user.email}</span>
              <span className="text-sm text-neutral-500">{user.companyName ?? '—'}</span>
              <select
                value={user.role}
                onChange={(event) => changeRole(user.id, event.target.value)}
                className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={user.isActive}
                  onChange={(event) => toggleActive(user.id, event.target.checked)}
                  className="h-4 w-4"
                />
                {user.isActive ? 'فعال' : 'غیرفعال'}
              </label>
              <span className="text-xs text-neutral-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fa-IR') : '—'}</span>
            </div>
          ))}
          {users.length === 0 && <p className="py-16 text-center text-neutral-500">کاربری ثبت نشده است.</p>}
        </div>
      </DataTable>
    </AdminShell>
  );
}
