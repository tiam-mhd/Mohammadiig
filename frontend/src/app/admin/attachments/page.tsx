'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEye, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate, labelOf, OWNER_TYPE } from '@/lib/admin-labels';
import {
  AttachmentAdminSummary,
  createAdminAttachment,
  deleteAdminAttachment,
  fetchAdminAttachments,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const emptyForm = {
  ownerType: 'Order',
  ownerId: '',
  fileName: '',
  fileUrl: '',
  fileType: '',
};

const ownerOptions = Object.entries(OWNER_TYPE).map(([value, label]) => ({ value, label }));

export default function AdminAttachmentsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [attachments, setAttachments] = useState<AttachmentAdminSummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AttachmentAdminSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: AttachmentAdminSummary) =>
      `${item.fileName} ${item.ownerType} ${item.ownerId} ${item.fileType ?? ''} ${OWNER_TYPE[item.ownerType] ?? ''}`,
    [],
  );
  const matchFilter = useCallback(
    (item: AttachmentAdminSummary, key: string, value: string) =>
      key === 'ownerType' ? item.ownerType === value : true,
    [],
  );
  const list = useAdminList(attachments, searchText, matchFilter);

  useEffect(() => {
    if (token)
      fetchAdminAttachments(token).then(setAttachments).catch(() => adminToast.error('دریافت فایل‌ها انجام نشد.'));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const created = await createAdminAttachment(token, {
        ...form,
        fileType: form.fileType || undefined,
      });
      setAttachments((current) => [created, ...current]);
      setModalOpen(false);
      setForm(emptyForm);
      adminToast.success('فایل ثبت شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ثبت فایل انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminAttachment(token, pendingDelete.id);
      setAttachments((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('فایل حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="اسناد" title="فایل‌ها">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setModalOpen(true)}
        addLabel="افزودن فایل"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[{ key: 'ownerType', label: 'نوع سند مرتبط', options: ownerOptions }]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      <DataTable
        headers={['نام فایل', 'مرتبط با', 'نوع', 'حجم', 'تاریخ', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="فایلی با این جستجو پیدا نشد."
      >
        {list.filtered.map((attachment) => (
          <DataRow key={attachment.id}>
            <td className="text-start">
              <a
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--ops-accent-strong)] underline-offset-4 hover:underline"
              >
                {attachment.fileName}
              </a>
            </td>
            <td>
              {labelOf(OWNER_TYPE, attachment.ownerType)}
              <span className="mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">
                {attachment.ownerId.slice(0, 10)}…
              </span>
            </td>
            <td>{attachment.fileType ?? '—'}</td>
            <td>
              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024).toLocaleString('fa-IR')} کیلوبایت` : '—'}
            </td>
            <td>{formatDate(attachment.uploadedAt)}</td>
            <td>
              <RowActions>
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-icon-btn"
                  title="مشاهده"
                  aria-label="مشاهده"
                >
                  <IconEye />
                </a>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(attachment)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={modalOpen}
        title="افزودن فایل"
        description="آدرس فایل آپلودشده را ثبت کنید."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel="ثبت فایل"
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">مرتبط با</span>
            <select
              className="admin-select admin-select--wide"
              value={form.ownerType}
              onChange={(event) => setForm({ ...form, ownerType: event.target.value })}
            >
              {ownerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start">
            <span className="ops-login__label">شناسه سند مرتبط</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.ownerId}
              onChange={(event) => setForm({ ...form, ownerId: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نام فایل</span>
            <input
              required
              className="ops-field"
              value={form.fileName}
              onChange={(event) => setForm({ ...form, fileName: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نوع فایل</span>
            <input
              className="ops-field"
              placeholder="مثلاً PDF یا تصویر"
              value={form.fileType}
              onChange={(event) => setForm({ ...form, fileType: event.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">آدرس فایل</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.fileUrl}
              onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
            />
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`فایل «${pendingDelete?.fileName ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
