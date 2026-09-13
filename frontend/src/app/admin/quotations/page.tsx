'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  labelOf,
  QUOTATION_STATUS,
} from '@/lib/admin-labels';
import {
  fetchAdminQuotations,
  QuotationAdminSummary,
  updateQuotationStatus,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const statusOptions = Object.entries(QUOTATION_STATUS).map(([value, label]) => ({ value, label }));

function itemsLabel(item: QuotationAdminSummary) {
  if (!item.items?.length) return 'بدون قلم';
  return item.items
    .map((row) => `${row.productName} × ${row.quantity.toLocaleString('fa-IR')}`)
    .join('، ');
}

export default function AdminQuotationsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<QuotationAdminSummary[]>([]);
  const [editing, setEditing] = useState<QuotationAdminSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuotationAdminSummary | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: QuotationAdminSummary) =>
      [
        item.quotationNumber,
        item.customerCompanyName,
        item.customerContactPerson,
        item.customerPhone,
        item.notes,
        item.status,
        QUOTATION_STATUS[item.status] ?? '',
        itemsLabel(item),
      ]
        .filter(Boolean)
        .join(' '),
    [],
  );

  const matchFilter = useCallback(
    (item: QuotationAdminSummary, key: string, value: string) =>
      key === 'status' ? item.status === value : true,
    [],
  );

  const list = useAdminList(items, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    fetchAdminQuotations(token)
      .then(setItems)
      .catch(() => adminToast.error('دریافت پیش‌فاکتورها انجام نشد.'));
  }, [token]);

  function openEdit(item: QuotationAdminSummary) {
    setEditing(item);
    setStatusValue(item.status);
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    try {
      const updated = await updateQuotationStatus(token, editing.id, statusValue);
      setItems((current) => current.map((row) => (row.id === editing.id ? updated : row)));
      setEditing(null);
      adminToast.success('وضعیت پیش‌فاکتور به‌روزرسانی شد.');
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
      const updated = await updateQuotationStatus(token, pendingDelete.id, 'rejected');
      setItems((current) => current.map((row) => (row.id === pendingDelete.id ? updated : row)));
      setPendingDelete(null);
      adminToast.success('پیش‌فاکتور رد شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'عملیات انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="فروش" title="پیش‌فاکتورها">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel="افزودن پیش‌فاکتور"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[{ key: 'status', label: 'وضعیت', options: statusOptions }]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      <DataTable
        headers={['شماره', 'مشتری', 'اقلام', 'مبلغ', 'ثبت', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="پیش‌فاکتوری با این جستجو پیدا نشد."
      >
        {list.filtered.map((item) => (
          <DataRow key={item.id}>
            <td className="text-start">
              <strong className="font-medium text-[var(--ops-ink)]">{item.quotationNumber}</strong>
            </td>
            <td className="text-start">
              <div className="font-medium text-[var(--ops-ink)]">
                {item.customerCompanyName || 'مشتری ناشناس'}
              </div>
              <div className="mt-1 text-xs text-[var(--ops-muted)]">
                {[item.customerContactPerson, item.customerPhone].filter(Boolean).join(' · ') || '—'}
              </div>
            </td>
            <td className="text-start">
              <span className="line-clamp-2 text-sm text-[var(--ops-ink-soft)]">{itemsLabel(item)}</span>
            </td>
            <td className="text-start">{formatMoney(item.totalAmount)}</td>
            <td className="text-start">{formatDate(item.createdAt)}</td>
            <td>
              <span className="admin-badge">{labelOf(QUOTATION_STATUS, item.status)}</span>
            </td>
            <td>
              <RowActions>
                <IconAction label="مشاهده و ویرایش" onClick={() => openEdit(item)}>
                  <IconEdit />
                </IconAction>
                <IconAction label="رد کردن" tone="danger" onClick={() => setPendingDelete(item)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={Boolean(editing)}
        title={editing ? `پیش‌فاکتور ${editing.quotationNumber}` : 'پیش‌فاکتور'}
        description="جزئیات درخواست مشتری را ببینید و وضعیت را به‌روز کنید."
        onClose={() => setEditing(null)}
        onSubmit={saveEdit}
        busy={busy}
        submitLabel="ذخیره وضعیت"
      >
        {editing ? (
          <div className="space-y-5 text-start">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-paper)] p-3">
                <p className="text-xs text-[var(--ops-muted)]">مشتری</p>
                <p className="mt-1 font-medium text-[var(--ops-ink)]">
                  {editing.customerCompanyName || '—'}
                </p>
                <p className="mt-1 text-sm text-[var(--ops-ink-soft)]">
                  {[editing.customerContactPerson, editing.customerPhone].filter(Boolean).join(' · ') ||
                    'اطلاعات تماس ثبت نشده'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--ops-line)] bg-[var(--ops-paper)] p-3">
                <p className="text-xs text-[var(--ops-muted)]">زمان‌بندی</p>
                <p className="mt-1 text-sm text-[var(--ops-ink)]">
                  ثبت: {formatDateTime(editing.createdAt)}
                </p>
                <p className="mt-1 text-sm text-[var(--ops-ink)]">
                  اعتبار تا: {formatDate(editing.validUntil)}
                </p>
                <p className="mt-1 text-sm text-[var(--ops-ink)]">
                  مبلغ پایه: {formatMoney(editing.totalAmount)}
                </p>
              </div>
            </div>

            <div>
              <p className="ops-login__label">اقلام درخواست</p>
              <ul className="mt-2 space-y-2 rounded-xl border border-[var(--ops-line)] bg-[var(--ops-surface)] p-3">
                {(editing.items ?? []).length === 0 ? (
                  <li className="text-sm text-[var(--ops-muted)]">قلمی ثبت نشده است.</li>
                ) : (
                  editing.items.map((row) => (
                    <li
                      key={`${row.productId}-${row.productName}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-[var(--ops-ink)]">
                        {row.productName}
                        <span className="mt-0.5 block text-xs text-[var(--ops-muted)]">
                          {row.quantity.toLocaleString('fa-IR')} عدد ×{' '}
                          {formatMoney(row.unitPrice)}
                        </span>
                      </span>
                      <strong className="shrink-0 text-[var(--ops-ink)]">
                        {formatMoney(row.lineTotal)}
                      </strong>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <p className="ops-login__label">یادداشت مشتری</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-[var(--ops-line)] bg-[var(--ops-paper)] p-3 text-sm leading-7 text-[var(--ops-ink-soft)]">
                {editing.notes?.trim() || 'یادداشتی ثبت نشده است.'}
              </p>
            </div>

            <label className="block text-start">
              <span className="ops-login__label">وضعیت</span>
              <select
                className="admin-select admin-select--wide"
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={addOpen}
        title="افزودن پیش‌فاکتور"
        description="پیش‌فاکتور جدید از مسیر مشتری ساخته می‌شود."
        onClose={() => setAddOpen(false)}
      >
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">
          پیش‌فاکتور جدید از صفحه «درخواست قیمت» سایت توسط مشتری ثبت می‌شود. پس از ثبت، جزئیات کامل
          (مشتری، اقلام، یادداشت و مبلغ) در همین فهرست قابل مشاهده و مدیریت است.
        </p>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title="رد پیش‌فاکتور"
        description="این پیش‌فاکتور رد شود؟"
        confirmLabel="بله، رد شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
