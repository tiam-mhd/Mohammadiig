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
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  ProductCategory,
  updateAdminCategory,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const emptyForm = {
  nameFa: '',
  nameEn: '',
  slug: '',
  descriptionFa: '',
  displayOrder: 0,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchText = useCallback(
    (item: ProductCategory) =>
      `${item.nameFa} ${item.nameEn} ${item.slug} ${item.descriptionFa}`,
    [],
  );
  const matchFilter = useCallback((item: ProductCategory, key: string, value: string) => {
    if (key === 'active') return value === 'yes' ? item.isActive : !item.isActive;
    return true;
  }, []);
  const list = useAdminList(categories, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    fetchAdminCategories(token)
      .then(setCategories)
      .catch(() => adminToast.error('دریافت دسته‌بندی‌ها انجام نشد.'));
  }, [token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(category: ProductCategory) {
    setEditingId(category.id);
    setForm({
      nameFa: category.nameFa,
      nameEn: category.nameEn,
      slug: category.slug,
      descriptionFa: category.descriptionFa,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      if (editingId) {
        const updated = await updateAdminCategory(token, editingId, form);
        setCategories((current) => current.map((item) => (item.id === editingId ? updated : item)));
        adminToast.success('دسته با موفقیت ویرایش شد.');
      } else {
        const created = await createAdminCategory(token, form);
        setCategories((current) => [...current, created].sort((a, b) => a.displayOrder - b.displayOrder));
        adminToast.success('دسته با موفقیت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره دسته انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminCategory(token, pendingDelete.id);
      setCategories((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('دسته حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف دسته انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="کاتالوگ" title="دسته‌بندی‌ها">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={openCreate}
        addLabel="افزودن دسته"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
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
        headers={['نام', 'شناسه', 'ترتیب', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="دسته‌ای با این جستجو پیدا نشد."
      >
        {list.filtered.map((category) => (
          <DataRow key={category.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{category.nameFa}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]">{category.descriptionFa}</span>
            </td>
            <td>
              <span className="text-xs text-[var(--ops-muted)]" dir="ltr">
                {category.slug}
              </span>
            </td>
            <td>{category.displayOrder.toLocaleString('fa-IR')}</td>
            <td>
              <span className={`admin-badge ${category.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {category.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => openEdit(category)}>
                  <IconEdit />
                </IconAction>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(category)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={modalOpen}
        title={editingId ? 'ویرایش دسته' : 'افزودن دسته'}
        description="نام فارسی و شناسه دسته را وارد کنید."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت دسته'}
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">نام فارسی</span>
            <input
              required
              className="ops-field"
              value={form.nameFa}
              onChange={(event) => setForm({ ...form, nameFa: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نام لاتین</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.nameEn}
              onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">شناسه (slug)</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="equipment"
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">ترتیب نمایش</span>
            <input
              required
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              value={form.displayOrder}
              onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">توضیح</span>
            <textarea
              required
              className="ops-field min-h-24"
              value={form.descriptionFa}
              onChange={(event) => setForm({ ...form, descriptionFa: event.target.value })}
            />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 accent-[var(--ops-accent)]"
            />
            دسته فعال باشد
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`دسته «${pendingDelete?.nameFa ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
