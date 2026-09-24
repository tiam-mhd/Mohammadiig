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
  fetchAdminAttachmentsPage,
} from '@/lib/api-client';
import { resolveMediaUrl, toRelativeMediaPath } from '@/lib/media';
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
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

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
    if (!token) return;
    setLoading(true);
    fetchAdminAttachmentsPage(token, { page, limit: 20, search: list.query })
      .then((result) => { setAttachments(result.data); setMeta(result.meta); })
      .catch(() => adminToast.error('دریافت فایل‌ها انجام نشد.'))
      .finally(() => setLoading(false));
  }, [token, page, list.query]);
  useEffect(() => setPage(1), [list.query, JSON.stringify(list.filters)]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const created = await createAdminAttachment(token, {
        ...form,
        fileUrl: toRelativeMediaPath(form.fileUrl) || form.fileUrl.trim(),
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
        isEmpty={list.filtered.length === 0 && !loading}
        emptyText="فایلی با این جستجو پیدا نشد."
      >
        {list.filtered.map((attachment) => {
          const fileHref = resolveMediaUrl(attachment.fileUrl) || attachment.fileUrl;
          return (
          <DataRow key={attachment.id}>
            <td className="text-start">
              <a
                href={fileHref}
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
                  href={fileHref}
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
          );
        })}
      </DataTable>
      <div className="mt-4 flex items-center justify-between text-sm"><button className="admin-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>قبلی</button><span>{meta.total.toLocaleString('fa-IR')} مورد · صفحه {page.toLocaleString('fa-IR')} از {meta.totalPages.toLocaleString('fa-IR')}</span><button className="admin-button" disabled={page >= meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>بعدی</button></div>

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
