'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatMoney } from '@/lib/admin-labels';
import {
  createAdminSparePart,
  deleteAdminSparePart,
  fetchAdminSparePartCategories,
  fetchAdminSpareParts,
  SparePart,
  SparePartCategory,
  updateAdminSparePart,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const emptyForm = {
  partNumber: '',
  nameFa: '',
  nameEn: '',
  description: '',
  category: '',
  compatibleProductsText: '',
  price: 0,
  stockQuantity: 0,
  reorderLevel: 5,
  imageUrl: '',
  warrantyMonths: 12,
  isActive: true,
};

function parseCompatibleIds(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminSparePartsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SparePart | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameFa })),
    [categories],
  );

  const searchText = useCallback(
    (item: SparePart) =>
      `${item.partNumber} ${item.nameFa} ${item.nameEn ?? ''} ${item.description} ${item.category} ${item.compatibleProducts.join(' ')}`,
    [],
  );
  const matchFilter = useCallback((item: SparePart, key: string, value: string) => {
    if (key === 'active') return value === 'yes' ? Boolean(item.isActive) : !item.isActive;
    if (key === 'category') return item.category === value;
    if (key === 'stock') {
      if (value === 'low') return item.stockQuantity <= (item.reorderLevel ?? 5);
      if (value === 'ok') return item.stockQuantity > (item.reorderLevel ?? 5);
    }
    return true;
  }, []);
  const list = useAdminList(parts, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchAdminSpareParts(token), fetchAdminSparePartCategories(token)])
      .then(([nextParts, nextCategories]) => {
        setParts(nextParts);
        setCategories(nextCategories);
      })
      .catch(() => setMessage('دریافت قطعات یدکی انجام نشد.'));
  }, [token]);

  function categoryLabel(value: string) {
    const found = categories.find((category) => category.id === value || category.slug === value);
    if (found) return found.nameFa;
    return value || '—';
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categoryOptions[0]?.value ?? '',
    });
    setModalOpen(true);
  }

  function openEdit(part: SparePart) {
    setEditingId(part.id);
    setForm({
      partNumber: part.partNumber,
      nameFa: part.nameFa,
      nameEn: part.nameEn ?? '',
      description: part.description,
      category: part.category || categoryOptions[0]?.value || '',
      compatibleProductsText: part.compatibleProducts.join(', '),
      price: part.price,
      stockQuantity: part.stockQuantity,
      reorderLevel: part.reorderLevel ?? 5,
      imageUrl: part.imageUrl ?? '',
      warrantyMonths: part.warrantyMonths,
      isActive: part.isActive ?? true,
    });
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        partNumber: form.partNumber,
        nameFa: form.nameFa,
        nameEn: form.nameEn,
        description: form.description,
        category: form.category,
        compatibleProducts: parseCompatibleIds(form.compatibleProductsText),
        price: form.price,
        stockQuantity: form.stockQuantity,
        reorderLevel: form.reorderLevel,
        imageUrl: form.imageUrl || undefined,
        warrantyMonths: form.warrantyMonths,
        isActive: form.isActive,
      };
      if (editingId) {
        const updated = await updateAdminSparePart(token, editingId, payload);
        setParts((current) => current.map((item) => (item.id === editingId ? updated : item)));
        setMessage('قطعه با موفقیت ویرایش شد.');
      } else {
        const created = await createAdminSparePart(token, payload);
        setParts((current) => [created, ...current]);
        setMessage('قطعه با موفقیت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره قطعه انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminSparePart(token, pendingDelete.id);
      setParts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setMessage('قطعه حذف شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف قطعه انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="پس از فروش" title="قطعات یدکی">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={openCreate}
        addLabel="افزودن قطعه"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              {
                key: 'category',
                label: 'دسته‌بندی',
                options: categoryOptions,
              },
              {
                key: 'active',
                label: 'وضعیت',
                options: [
                  { value: 'yes', label: 'فعال' },
                  { value: 'no', label: 'غیرفعال' },
                ],
              },
              {
                key: 'stock',
                label: 'موجودی',
                options: [
                  { value: 'low', label: 'نیاز به سفارش' },
                  { value: 'ok', label: 'کافی' },
                ],
              },
            ]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      {message ? (
        <p
          className={`field-message mb-4 ${
            message.includes('موفقیت') || message.includes('حذف شد')
              ? 'field-message--ok'
              : message.includes('نشد')
                ? 'field-message--error'
                : 'field-message--ok'
          }`}
        >
          {message}
        </p>
      ) : null}

      <DataTable
        headers={['قطعه', 'دسته', 'شماره', 'موجودی', 'قیمت', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="قطعه‌ای با این جستجو پیدا نشد."
      >
        {list.filtered.map((part) => {
          const lowStock = part.stockQuantity <= (part.reorderLevel ?? 5);
          return (
            <DataRow key={part.id}>
              <td className="text-start">
                <strong className="block font-medium text-[var(--ops-ink)]">{part.nameFa}</strong>
                <span className="mt-1 block text-xs text-[var(--ops-muted)]">{part.description}</span>
              </td>
              <td>
                <span className="admin-badge">{categoryLabel(part.category)}</span>
              </td>
              <td>
                <span className="text-xs" dir="ltr">
                  {part.partNumber}
                </span>
              </td>
              <td>
                <span className={lowStock ? 'text-[var(--ops-warn)]' : ''}>
                  {part.stockQuantity.toLocaleString('fa-IR')}
                </span>
              </td>
              <td>{formatMoney(part.price)}</td>
              <td>
                <span className={`admin-badge ${part.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                  {part.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </td>
              <td>
                <RowActions>
                  <IconAction label="ویرایش" onClick={() => openEdit(part)}>
                    <IconEdit />
                  </IconAction>
                  <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(part)}>
                    <IconTrash />
                  </IconAction>
                </RowActions>
              </td>
            </DataRow>
          );
        })}
      </DataTable>

      <AdminModal
        open={modalOpen}
        title={editingId ? 'ویرایش قطعه' : 'افزودن قطعه'}
        description="اطلاعات قطعه یدکی را وارد کنید."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت قطعه'}
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">شماره قطعه</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.partNumber}
              onChange={(event) => setForm({ ...form, partNumber: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">دسته‌بندی</span>
            <select
              required
              className="admin-select admin-select--wide"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {categoryOptions.length === 0 ? <option value="">دسته‌ای ثبت نشده</option> : null}
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
            <span className="ops-login__label">شناسه محصولات سازگار</span>
            <input
              className="ops-field"
              dir="ltr"
              placeholder="1, 2"
              value={form.compatibleProductsText}
              onChange={(event) => setForm({ ...form, compatibleProductsText: event.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">توضیح</span>
            <textarea
              required
              className="ops-field min-h-24"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">قیمت (ریال)</span>
            <input
              required
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">موجودی</span>
            <input
              required
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              value={form.stockQuantity}
              onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">حد سفارش مجدد</span>
            <input
              required
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              value={form.reorderLevel}
              onChange={(event) => setForm({ ...form, reorderLevel: Number(event.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">گارانتی (ماه)</span>
            <input
              required
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              value={form.warrantyMonths}
              onChange={(event) => setForm({ ...form, warrantyMonths: Number(event.target.value) })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">آدرس تصویر (اختیاری)</span>
            <input
              className="ops-field"
              dir="ltr"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
            />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 accent-[var(--ops-accent)]"
            />
            قطعه فعال باشد
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`قطعه «${pendingDelete?.nameFa ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
