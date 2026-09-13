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
import { PORTFOLIO_CATEGORY } from '@/lib/admin-labels';
import {
  createAdminPortfolio,
  deleteAdminPortfolio,
  fetchAdminPortfolio,
  PortfolioWork,
  updateAdminPortfolio,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const categoryOptions = Object.entries(PORTFOLIO_CATEGORY).map(([value, label]) => ({ value, label }));

const emptyForm = {
  slug: '',
  titleFa: '',
  titleEn: '',
  summaryFa: '',
  descriptionFa: '',
  clientName: '',
  workCategory: 'entertainment',
  country: 'ایران',
  province: '',
  city: '',
  locationDetail: '',
  startDate: '',
  endDate: '',
  coverImageUrl: '',
  gallery: [] as string[],
  highlightsText: '',
  areaOrCapacity: '',
  isPublished: true,
  isFeatured: false,
  displayOrder: 0,
};

function linesToList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function locationLabel(item: PortfolioWork) {
  return [item.province, item.city, item.locationDetail].filter(Boolean).join(' · ') || '—';
}

export default function AdminPortfolioPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PortfolioWork[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PortfolioWork | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: PortfolioWork) =>
      `${item.titleFa} ${item.titleEn} ${item.slug} ${item.clientName ?? ''} ${item.province ?? ''} ${item.city ?? ''} ${item.summaryFa}`,
    [],
  );
  const matchFilter = useCallback((item: PortfolioWork, key: string, value: string) => {
    if (key === 'published') return value === 'yes' ? item.isPublished : !item.isPublished;
    if (key === 'category') return item.workCategory === value;
    return true;
  }, []);
  const list = useAdminList(items, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    fetchAdminPortfolio(token)
      .then(setItems)
      .catch(() => adminToast.error('دریافت نمونه‌کارها انجام نشد.'));
  }, [token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: PortfolioWork) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      titleFa: item.titleFa,
      titleEn: item.titleEn,
      summaryFa: item.summaryFa,
      descriptionFa: item.descriptionFa,
      clientName: item.clientName ?? '',
      workCategory: item.workCategory,
      country: item.country ?? 'ایران',
      province: item.province ?? '',
      city: item.city ?? '',
      locationDetail: item.locationDetail ?? '',
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
      coverImageUrl: item.coverImageUrl ?? '',
      gallery: item.gallery ?? [],
      highlightsText: (item.highlights ?? []).join('\n'),
      areaOrCapacity: item.areaOrCapacity ?? '',
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      displayOrder: item.displayOrder,
    });
    setModalOpen(true);
  }

  function payloadFromForm() {
    return {
      slug: form.slug,
      titleFa: form.titleFa,
      titleEn: form.titleEn,
      summaryFa: form.summaryFa,
      descriptionFa: form.descriptionFa,
      clientName: form.clientName || undefined,
      workCategory: form.workCategory,
      country: form.country || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      locationDetail: form.locationDetail || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      gallery: form.gallery,
      highlights: linesToList(form.highlightsText),
      areaOrCapacity: form.areaOrCapacity || undefined,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      displayOrder: form.displayOrder,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const payload = payloadFromForm();
      if (editingId) {
        const updated = await updateAdminPortfolio(token, editingId, payload);
        setItems((current) => current.map((item) => (item.id === editingId ? updated : item)));
        adminToast.success('نمونه‌کار با موفقیت ویرایش شد.');
      } else {
        const created = await createAdminPortfolio(token, payload);
        setItems((current) => [created, ...current]);
        adminToast.success('نمونه‌کار با موفقیت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره نمونه‌کار انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminPortfolio(token, pendingDelete.id);
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('نمونه‌کار حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف نمونه‌کار انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="نمایش عمومی" title="نمونه‌کارها">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={openCreate}
        addLabel="افزودن نمونه‌کار"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'category', label: 'دسته', options: categoryOptions },
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
        headers={['عنوان', 'مشتری', 'لوکیشن', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="نمونه‌کاری با این جستجو پیدا نشد."
      >
        {list.filtered.map((item) => (
          <DataRow key={item.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{item.titleFa}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]">{item.summaryFa}</span>
            </td>
            <td>{item.clientName || '—'}</td>
            <td className="text-start text-sm">{locationLabel(item)}</td>
            <td>
              <span className={`admin-badge ${item.isPublished ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {item.isPublished ? 'منتشرشده' : 'پیش‌نویس'}
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
        title={editingId ? 'ویرایش نمونه‌کار' : 'افزودن نمونه‌کار'}
        description="اطلاعات کامل نمونه‌کار مشتری را ثبت کنید؛ شامل لوکیشن و جزئیات اجرا."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت نمونه‌کار'}
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">عنوان فارسی</span>
            <input required className="ops-field" value={form.titleFa} onChange={(e) => setForm({ ...form, titleFa: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">عنوان لاتین</span>
            <input required className="ops-field" dir="ltr" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">شناسه (slug)</span>
            <input required className="ops-field" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">دسته</span>
            <select className="admin-select admin-select--wide" value={form.workCategory} onChange={(e) => setForm({ ...form, workCategory: e.target.value })}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">خلاصه</span>
            <input required className="ops-field" value={form.summaryFa} onChange={(e) => setForm({ ...form, summaryFa: e.target.value })} />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">توضیح کامل</span>
            <textarea required className="ops-field min-h-28" value={form.descriptionFa} onChange={(e) => setForm({ ...form, descriptionFa: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نام مشتری (نمایشی)</span>
            <input className="ops-field" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">ظرفیت / مقیاس</span>
            <input className="ops-field" value={form.areaOrCapacity} onChange={(e) => setForm({ ...form, areaOrCapacity: e.target.value })} />
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
              label="تاریخ شروع"
              value={form.startDate}
              onChange={(startDate) => setForm({ ...form, startDate })}
            />
          </div>
          <div className="block text-start">
            <PersianDatePicker
              label="تاریخ پایان"
              value={form.endDate}
              onChange={(endDate) => setForm({ ...form, endDate })}
            />
          </div>
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
          <label className="block text-start">
            <span className="ops-login__label">ترتیب نمایش</span>
            <input type="number" min={0} className="ops-field" dir="ltr" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)]">
            <input type="checkbox" className="h-4 w-4 accent-[var(--ops-accent)]" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            در سایت منتشر شود
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)]">
            <input type="checkbox" className="h-4 w-4 accent-[var(--ops-accent)]" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            ویژه در صفحه اول
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`نمونه‌کار «${pendingDelete?.titleFa ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
