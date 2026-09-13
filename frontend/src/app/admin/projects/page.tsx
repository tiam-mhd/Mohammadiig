'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { MediaField } from '@/components/admin/MediaField';
import { PersianDatePicker } from '@/components/admin/PersianDatePicker';
import { useAdminList } from '@/hooks/useAdminList';
import { labelOf, PROJECT_STATUS, PROJECT_TYPE } from '@/lib/admin-labels';
import {
  createAdminProject,
  deleteAdminProject,
  fetchAdminProjects,
  OpsProject,
  updateAdminProject,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const typeOptions = Object.entries(PROJECT_TYPE).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(PROJECT_STATUS).map(([value, label]) => ({ value, label }));

const emptyForm = {
  projectName: '',
  nameEn: '',
  slug: '',
  summaryFa: '',
  description: '',
  projectType: 'operation',
  clientDisplayName: '',
  country: 'ایران',
  province: '',
  city: '',
  locationDetail: '',
  startDate: '',
  expectedCompletionDate: '',
  completionDate: '',
  budgetTotal: 0,
  migInvestmentPercentage: 0,
  profitSharingPercentage: 0,
  status: 'planning',
  coverImageUrl: '',
  gallery: [] as string[],
  highlightsText: '',
  isPublished: true,
};

function linesToList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function locationLabel(item: OpsProject) {
  return [item.province, item.city, item.locationDetail].filter(Boolean).join(' · ') || '—';
}

export default function AdminProjectsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<OpsProject[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OpsProject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: OpsProject) =>
      `${item.projectCode} ${item.projectName} ${item.slug ?? ''} ${item.clientDisplayName ?? ''} ${item.province ?? ''} ${item.city ?? ''} ${item.description}`,
    [],
  );
  const matchFilter = useCallback((item: OpsProject, key: string, value: string) => {
    if (key === 'type') return item.projectType === value;
    if (key === 'status') return item.status === value;
    if (key === 'published') return value === 'yes' ? item.isPublished : !item.isPublished;
    return true;
  }, []);
  const list = useAdminList(items, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    fetchAdminProjects(token)
      .then(setItems)
      .catch(() => adminToast.error('دریافت پروژه‌ها انجام نشد.'));
  }, [token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: OpsProject) {
    setEditingId(item.id);
    setForm({
      projectName: item.projectName,
      nameEn: item.nameEn ?? '',
      slug: item.slug ?? '',
      summaryFa: item.summaryFa ?? '',
      description: item.description,
      projectType: item.projectType,
      clientDisplayName: item.clientDisplayName ?? '',
      country: item.country ?? 'ایران',
      province: item.province ?? '',
      city: item.city ?? '',
      locationDetail: item.locationDetail ?? '',
      startDate: item.startDate ?? '',
      expectedCompletionDate: item.expectedCompletionDate ?? '',
      completionDate: item.completionDate ?? '',
      budgetTotal: item.budgetTotal,
      migInvestmentPercentage: item.migInvestmentPercentage,
      profitSharingPercentage: item.profitSharingPercentage,
      status: item.status,
      coverImageUrl: item.coverImageUrl ?? '',
      gallery: item.gallery ?? [],
      highlightsText: (item.highlights ?? []).join('\n'),
      isPublished: item.isPublished,
    });
    setModalOpen(true);
  }

  function payloadFromForm() {
    return {
      projectName: form.projectName,
      nameEn: form.nameEn || undefined,
      slug: form.slug,
      summaryFa: form.summaryFa || undefined,
      description: form.description,
      projectType: form.projectType,
      clientDisplayName: form.clientDisplayName || undefined,
      country: form.country || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      locationDetail: form.locationDetail || undefined,
      startDate: form.startDate || undefined,
      expectedCompletionDate: form.expectedCompletionDate || undefined,
      completionDate: form.completionDate || undefined,
      budgetTotal: form.budgetTotal,
      migInvestmentPercentage: form.migInvestmentPercentage,
      profitSharingPercentage: form.profitSharingPercentage,
      status: form.status,
      coverImageUrl: form.coverImageUrl || undefined,
      gallery: form.gallery,
      highlights: linesToList(form.highlightsText),
      isPublished: form.isPublished,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const payload = payloadFromForm();
      if (editingId) {
        const updated = await updateAdminProject(token, editingId, payload);
        setItems((current) => current.map((item) => (item.id === editingId ? updated : item)));
        adminToast.success('پروژه با موفقیت ویرایش شد.');
      } else {
        const created = await createAdminProject(token, payload);
        setItems((current) => [created, ...current]);
        adminToast.success('پروژه با موفقیت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره پروژه انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminProject(token, pendingDelete.id);
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('پروژه حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف پروژه انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="نمایش عمومی" title="پروژه‌های بهره‌برداری">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={openCreate}
        addLabel="افزودن پروژه"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'type', label: 'نوع', options: typeOptions },
              { key: 'status', label: 'وضعیت', options: statusOptions },
              {
                key: 'published',
                label: 'انتشار',
                options: [
                  { value: 'yes', label: 'منتشرشده' },
                  { value: 'no', label: 'پیش‌نویس' },
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
        headers={['پروژه', 'نوع', 'لوکیشن', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="پروژه‌ای با این جستجو پیدا نشد."
      >
        {list.filtered.map((item) => (
          <DataRow key={item.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{item.projectName}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">
                {item.projectCode}
              </span>
            </td>
            <td>
              <span className="admin-badge">{labelOf(PROJECT_TYPE, item.projectType)}</span>
            </td>
            <td className="text-start text-sm">{locationLabel(item)}</td>
            <td>
              <span className={`admin-badge ${item.isPublished ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {labelOf(PROJECT_STATUS, item.status)}
                {item.isPublished ? '' : ' · پیش‌نویس'}
              </span>
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
        open={modalOpen}
        title={editingId ? 'ویرایش پروژه' : 'افزودن پروژه بهره‌برداری'}
        description="پروژه‌های بهره‌برداری، مشارکت و سرمایه‌گذاری — فقط توسط پنل ثبت می‌شوند."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت پروژه'}
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">نام پروژه</span>
            <input required className="ops-field" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نام لاتین</span>
            <input className="ops-field" dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">شناسه (slug)</span>
            <input required className="ops-field" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نوع پروژه</span>
            <select required className="admin-select admin-select--wide" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">خلاصه</span>
            <input className="ops-field" value={form.summaryFa} onChange={(e) => setForm({ ...form, summaryFa: e.target.value })} />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">توضیح کامل</span>
            <textarea required className="ops-field min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نام شریک / طرف مقابل</span>
            <input className="ops-field" value={form.clientDisplayName} onChange={(e) => setForm({ ...form, clientDisplayName: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">وضعیت اجرا</span>
            <select className="admin-select admin-select--wide" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start">
            <span className="ops-login__label">کشور</span>
            <input className="ops-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">استان</span>
            <input className="ops-field" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">شهر</span>
            <input className="ops-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">لوکیشن دقیق</span>
            <input className="ops-field" value={form.locationDetail} onChange={(e) => setForm({ ...form, locationDetail: e.target.value })} />
          </label>
          <div className="block text-start">
            <PersianDatePicker
              label="شروع"
              value={form.startDate}
              onChange={(startDate) => setForm({ ...form, startDate })}
            />
          </div>
          <div className="block text-start">
            <PersianDatePicker
              label="پایان پیش‌بینی"
              value={form.expectedCompletionDate}
              onChange={(expectedCompletionDate) => setForm({ ...form, expectedCompletionDate })}
            />
          </div>
          <div className="block text-start">
            <PersianDatePicker
              label="تاریخ اتمام"
              value={form.completionDate}
              onChange={(completionDate) => setForm({ ...form, completionDate })}
            />
          </div>
          <label className="block text-start">
            <span className="ops-login__label">بودجه (ریال)</span>
            <input type="number" min={0} className="ops-field" dir="ltr" value={form.budgetTotal} onChange={(e) => setForm({ ...form, budgetTotal: Number(e.target.value) })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">سهم سرمایه‌گذاری MIG (%)</span>
            <input type="number" min={0} max={100} className="ops-field" dir="ltr" value={form.migInvestmentPercentage} onChange={(e) => setForm({ ...form, migInvestmentPercentage: Number(e.target.value) })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">سهم سود (%)</span>
            <input type="number" min={0} max={100} className="ops-field" dir="ltr" value={form.profitSharingPercentage} onChange={(e) => setForm({ ...form, profitSharingPercentage: Number(e.target.value) })} />
          </label>
          <div className="sm:col-span-2">
            <MediaField
              label="تصویر کاور"
              value={form.coverImageUrl}
              onChange={(coverImageUrl) => setForm({ ...form, coverImageUrl })}
            />
          </div>
          <div className="sm:col-span-2">
            <MediaField
              label="گالری (چندتصویری)"
              multiple
              value={form.gallery}
              onChange={(gallery) => setForm({ ...form, gallery })}
            />
          </div>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">نکات برجسته (هر خط یک مورد)</span>
            <textarea className="ops-field min-h-20" value={form.highlightsText} onChange={(e) => setForm({ ...form, highlightsText: e.target.value })} />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)] sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 accent-[var(--ops-accent)]" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            در سایت منتشر شود
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`پروژه «${pendingDelete?.projectName ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
