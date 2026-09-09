'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/admin-labels';
import {
  CustomerAdminSummary,
  deleteAdminCustomer,
  fetchAdminCustomers,
  updateCustomerVerified,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminCustomersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [customers, setCustomers] = useState<CustomerAdminSummary[]>([]);
  const [editing, setEditing] = useState<CustomerAdminSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerAdminSummary | null>(null);
  const [verified, setVerified] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const searchText = useCallback(
    (item: CustomerAdminSummary) =>
      `${item.companyName} ${item.contactPerson ?? ''} ${item.phone ?? ''} ${item.country ?? ''} ${item.paymentTerms}`,
    [],
  );
  const matchFilter = useCallback((item: CustomerAdminSummary, key: string, value: string) => {
    if (key === 'verified') return value === 'yes' ? item.isVerified : !item.isVerified;
    return true;
  }, []);
  const list = useAdminList(customers, searchText, matchFilter);

  useEffect(() => {
    if (token) fetchAdminCustomers(token).then(setCustomers).catch(() => setMessage('دریافت مشتریان انجام نشد.'));
  }, [token]);

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    try {
      const updated = await updateCustomerVerified(token, editing.id, verified);
      setCustomers((current) => current.map((item) => (item.id === editing.id ? updated : item)));
      setEditing(null);
      setMessage('وضعیت مشتری ذخیره شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ویرایش انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminCustomer(token, pendingDelete.id);
      setCustomers((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setMessage('مشتری حذف شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="مشتریان" title="مشتریان">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel="افزودن مشتری"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              {
                key: 'verified',
                label: 'تأیید حساب',
                options: [
                  { value: 'yes', label: 'تأییدشده' },
                  { value: 'no', label: 'در انتظار تأیید' },
                ],
              },
            ]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      {message ? <p className="field-message field-message--ok mb-4">{message}</p> : null}

      <DataTable
        headers={['شرکت', 'تماس', 'کشور', 'شرایط پرداخت', 'تاریخ', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="مشتری‌ای با این جستجو پیدا نشد."
      >
        {list.filtered.map((customer) => (
          <DataRow key={customer.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{customer.companyName}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]">
                {customer.contactPerson ?? 'بدون مخاطب'}
              </span>
            </td>
            <td dir="ltr">{customer.phone ?? '—'}</td>
            <td>{customer.country ?? '—'}</td>
            <td>{customer.paymentTerms}</td>
            <td>{formatDate(customer.createdAt)}</td>
            <td>
              <span className={`admin-badge ${customer.isVerified ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {customer.isVerified ? 'تأیید شده' : 'در انتظار تأیید'}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction
                  label="ویرایش"
                  onClick={() => {
                    setEditing(customer);
                    setVerified(customer.isVerified);
                  }}
                >
                  <IconEdit />
                </IconAction>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(customer)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={Boolean(editing)}
        title="ویرایش مشتری"
        description="وضعیت تأیید حساب سازمانی را تنظیم کنید."
        onClose={() => setEditing(null)}
        onSubmit={saveEdit}
        busy={busy}
      >
        <label className="flex items-center gap-3 text-sm text-[var(--ops-ink-soft)]">
          <input
            type="checkbox"
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
            className="h-4 w-4 accent-[var(--ops-accent)]"
          />
          حساب تأیید شده است
        </label>
      </AdminModal>

      <AdminModal open={addOpen} title="افزودن مشتری" onClose={() => setAddOpen(false)}>
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">
          مشتری سازمانی با ثبت‌نام در «پنل مشتریان» ساخته می‌شود. پس از ثبت، از همین صفحه می‌توانید حساب را تأیید یا حذف کنید.
        </p>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`مشتری «${pendingDelete?.companyName ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
