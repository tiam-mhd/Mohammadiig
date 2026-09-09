'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { labelOf } from '@/lib/admin-labels';
import { useAuthStore } from '@/store/auth.store';

type StatusOption = { value: string; label: string };

type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
};

export function AdminStatusResourcePage<T extends { id: string }>({
  eyebrow,
  title,
  resourceLabel,
  headers,
  columns,
  statusMap,
  statusOptions,
  getStatus,
  searchText,
  fetchItems,
  updateStatus,
  cancelStatus,
  addHint,
}: {
  eyebrow: string;
  title: string;
  resourceLabel: string;
  headers: string[];
  columns: Column<T>[];
  statusMap: Record<string, string>;
  statusOptions: StatusOption[];
  getStatus: (item: T) => string;
  searchText: (item: T) => string;
  fetchItems: (token: string) => Promise<T[]>;
  updateStatus: (token: string, id: string, status: string) => Promise<T>;
  cancelStatus: string;
  addHint: string;
}) {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const search = searchText;
  const matchFilter = useCallback(
    (item: T, key: string, value: string) => (key === 'status' ? getStatus(item) === value : true),
    [getStatus],
  );
  const list = useAdminList(items, search, matchFilter);

  useEffect(() => {
    if (!token) return;
    fetchItems(token).then(setItems).catch(() => setMessage(`دریافت ${resourceLabel} انجام نشد.`));
  }, [token, fetchItems, resourceLabel]);

  function openEdit(item: T) {
    setEditing(item);
    setStatusValue(getStatus(item));
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    try {
      const updated = await updateStatus(token, editing.id, statusValue);
      setItems((current) => current.map((item) => (item.id === editing.id ? updated : item)));
      setEditing(null);
      setMessage(`${resourceLabel} به‌روزرسانی شد.`);
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
      const updated = await updateStatus(token, pendingDelete.id, cancelStatus);
      setItems((current) => current.map((row) => (row.id === pendingDelete.id ? updated : row)));
      setPendingDelete(null);
      setMessage(`${resourceLabel} لغو شد.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow={eyebrow} title={title}>
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel={`افزودن ${resourceLabel}`}
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

      {message ? (
        <p
          className={`field-message mb-4 ${
            message.includes('نشد') ? 'field-message--error' : 'field-message--ok'
          }`}
        >
          {message}
        </p>
      ) : null}

      <DataTable
        headers={[...headers, 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText={`${resourceLabel}ی با این جستجو پیدا نشد.`}
      >
        {list.filtered.map((item) => (
          <DataRow key={item.id}>
            {columns.map((column) => (
              <td key={column.header} className="text-start">
                {column.cell(item)}
              </td>
            ))}
            <td>
              <span className="admin-badge">{labelOf(statusMap, getStatus(item))}</span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => openEdit(item)}>
                  <IconEdit />
                </IconAction>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(item)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={Boolean(editing)}
        title={`ویرایش ${resourceLabel}`}
        description="وضعیت را تغییر دهید و ذخیره کنید."
        onClose={() => setEditing(null)}
        onSubmit={saveEdit}
        busy={busy}
        submitLabel="ذخیره وضعیت"
      >
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
      </AdminModal>

      <AdminModal
        open={addOpen}
        title={`افزودن ${resourceLabel}`}
        description={addHint}
        onClose={() => setAddOpen(false)}
      >
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">{addHint}</p>
        <p className="mt-3 text-sm text-[var(--ops-ink-soft)]">
          پس از ایجاد از مسیر مشتری، می‌توانید از همین صفحه وضعیت را ویرایش یا لغو کنید.
        </p>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title={`لغو ${resourceLabel}`}
        description={`این ${resourceLabel} لغو / حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
