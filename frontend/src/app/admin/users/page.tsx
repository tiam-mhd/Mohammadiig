'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDateTime, labelOf, USER_ROLE } from '@/lib/admin-labels';
import {
  fetchAdminUsers,
  register,
  updateUserActive,
  updateUserRole,
  UserAdminSummary,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const roleOptions = Object.entries(USER_ROLE).map(([value, label]) => ({ value, label }));

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  companyName: '',
  phone: '',
  role: 'customer',
};

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [users, setUsers] = useState<UserAdminSummary[]>([]);
  const [editing, setEditing] = useState<UserAdminSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserAdminSummary | null>(null);
  const [role, setRole] = useState('customer');
  const [isActive, setIsActive] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: UserAdminSummary) =>
      `${item.email} ${item.firstName ?? ''} ${item.lastName ?? ''} ${item.companyName ?? ''} ${USER_ROLE[item.role] ?? item.role}`,
    [],
  );
  const matchFilter = useCallback((item: UserAdminSummary, key: string, value: string) => {
    if (key === 'role') return item.role === value;
    if (key === 'active') return value === 'yes' ? item.isActive : !item.isActive;
    return true;
  }, []);
  const list = useAdminList(users, searchText, matchFilter);

  async function reload() {
    if (!token) return;
    const next = await fetchAdminUsers(token);
    setUsers(next);
  }

  useEffect(() => {
    if (!token) return;
    fetchAdminUsers(token).then(setUsers).catch(() => adminToast.error('دریافت کاربران انجام نشد.'));
  }, [token]);

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    try {
      let updated = await updateUserRole(token, editing.id, role);
      updated = await updateUserActive(token, editing.id, isActive);
      setUsers((current) => current.map((item) => (item.id === editing.id ? updated : item)));
      setEditing(null);
      adminToast.success('کاربر به‌روزرسانی شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ویرایش انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      const updated = await updateUserActive(token, pendingDelete.id, false);
      setUsers((current) => current.map((item) => (item.id === pendingDelete.id ? updated : item)));
      setPendingDelete(null);
      adminToast.success('کاربر غیرفعال شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const created = await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        companyName: form.companyName,
        phone: form.phone || undefined,
      });
      if (form.role !== 'customer') {
        await updateUserRole(token, created.user.id, form.role);
      }
      await reload();
      setAddOpen(false);
      setForm(emptyForm);
      adminToast.success('کاربر جدید ثبت شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ثبت کاربر انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell eyebrow="دسترسی" title="کاربران">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel="افزودن کاربر"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'role', label: 'نقش', options: roleOptions },
              {
                key: 'active',
                label: 'وضعیت',
                options: [
                  { value: 'yes', label: 'فعال' },
                  { value: 'no', label: 'غیرفعال' },
                ],
              },
            ]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      <DataTable
        headers={['نام', 'ایمیل', 'شرکت', 'نقش', 'وضعیت', 'آخرین ورود', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="کاربری با این جستجو پیدا نشد."
      >
        {list.filtered.map((user) => {
          const fullName =
            user.firstName || user.lastName
              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
              : '—';

          return (
            <DataRow key={user.id}>
              <td className="text-start">
                <strong className="font-medium text-[var(--ops-ink)]">{fullName}</strong>
              </td>
              <td dir="ltr">{user.email}</td>
              <td>{user.companyName ?? '—'}</td>
              <td>{labelOf(USER_ROLE, user.role)}</td>
              <td>
                <span className={`admin-badge ${user.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                  {user.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </td>
              <td>{formatDateTime(user.lastLoginAt)}</td>
              <td>
                <RowActions>
                  <IconAction
                    label="ویرایش"
                    onClick={() => {
                      setEditing(user);
                      setRole(user.role);
                      setIsActive(user.isActive);
                    }}
                  >
                    <IconEdit />
                  </IconAction>
                  <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(user)}>
                    <IconTrash />
                  </IconAction>
                </RowActions>
              </td>
            </DataRow>
          );
        })}
      </DataTable>

      <AdminModal
        open={Boolean(editing)}
        title="ویرایش کاربر"
        onClose={() => setEditing(null)}
        onSubmit={saveEdit}
        busy={busy}
      >
        <div className="admin-form-grid">
          <label className="block text-start">
            <span className="ops-login__label">نقش</span>
            <select
              className="admin-select admin-select--wide"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm text-[var(--ops-ink-soft)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-[var(--ops-accent)]"
            />
            حساب فعال باشد
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={addOpen}
        title="افزودن کاربر"
        description="کاربر جدید را ثبت کنید و نقش او را مشخص کنید."
        onClose={() => setAddOpen(false)}
        onSubmit={createUser}
        busy={busy}
        submitLabel="ثبت کاربر"
      >
        <div className="admin-form-grid two">
          {(
            [
              ['firstName', 'نام'],
              ['lastName', 'نام خانوادگی'],
              ['companyName', 'نام شرکت'],
              ['phone', 'تلفن'],
              ['email', 'ایمیل'],
              ['password', 'رمز عبور'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-start">
              <span className="ops-login__label">{label}</span>
              <input
                required={key !== 'phone'}
                type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                className="ops-field"
                dir={key === 'email' || key === 'password' || key === 'phone' ? 'ltr' : 'rtl'}
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </label>
          ))}
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">نقش</span>
            <select
              className="admin-select admin-select--wide"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title="غیرفعال‌سازی کاربر"
        description={`کاربر «${pendingDelete?.email ?? ''}» غیرفعال شود؟`}
        confirmLabel="بله، غیرفعال شود"
        busyLabel="در حال غیرفعال‌سازی…"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
