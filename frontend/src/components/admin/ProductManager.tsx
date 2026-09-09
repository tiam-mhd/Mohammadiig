'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { CATEGORY_LABELS, formatMoney, labelOf } from '@/lib/admin-labels';
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchCategories,
  Product,
  ProductCategory,
  updateProduct,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const emptyForm = {
  nameFa: '',
  nameEn: '',
  slug: '',
  descriptionShortFa: '',
  sku: '',
  category: '',
  priceBase: 0,
  thumbnailImageUrl: '',
};

function resolveCategoryLabel(value: string, categories: ProductCategory[]) {
  const found = categories.find(
    (category) =>
      category.id === value ||
      category.slug === value ||
      category.nameEn.toLowerCase() === value.toLowerCase() ||
      category.nameEn.toUpperCase() === value.toUpperCase(),
  );
  if (found) return found.nameFa;
  return labelOf(CATEGORY_LABELS, value);
}

export function ProductManager() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameFa })),
    [categories],
  );

  const searchText = useCallback(
    (item: Product) =>
      `${item.name} ${item.slug} ${item.category} ${item.description} ${resolveCategoryLabel(item.category, categories)}`,
    [categories],
  );
  const matchFilter = useCallback(
    (item: Product, key: string, value: string) => {
      if (key !== 'category') return true;
      const selected = categories.find((category) => category.id === value);
      if (!selected) return item.category === value;
      const needles = [selected.id, selected.slug, selected.nameEn, selected.nameEn.toUpperCase()];
      return needles.some((needle) => needle.toLowerCase() === item.category.toLowerCase());
    },
    [categories],
  );
  const list = useAdminList(products, searchText, matchFilter);

  useEffect(() => {
    Promise.all([fetchAdminProducts(), fetchCategories()])
      .then(([productResponse, categoryResponse]) => {
        setProducts(productResponse.data);
        setCategories(categoryResponse);
        setForm((current) => ({
          ...current,
          category: current.category || categoryResponse[0]?.id || '',
        }));
      })
      .catch(() => setMessage('دریافت محصولات یا دسته‌ها انجام نشد.'));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categories[0]?.id || '',
    });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    const matched =
      categories.find(
        (category) =>
          category.id === product.category ||
          category.slug === product.category ||
          category.nameEn.toLowerCase() === product.category.toLowerCase() ||
          category.id.toUpperCase() === product.category.toUpperCase() ||
          category.slug.toUpperCase() === product.category.toUpperCase(),
      )?.id ?? product.category;

    setEditingId(product.id);
    setForm({
      nameFa: product.name,
      nameEn: product.name,
      slug: product.slug,
      descriptionShortFa: product.description,
      sku: product.slug.toUpperCase().replace(/-/g, '_').slice(0, 40),
      category: matched,
      priceBase: product.price,
      thumbnailImageUrl: product.image ?? '',
    });
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        thumbnailImageUrl: form.thumbnailImageUrl || undefined,
      };
      if (editingId) {
        const updated = await updateProduct(accessToken, editingId, payload);
        setProducts((current) => current.map((item) => (item.id === editingId ? updated : item)));
        setMessage('محصول با موفقیت ویرایش شد.');
      } else {
        const created = await createProduct(accessToken, payload);
        setProducts((current) => [created, ...current]);
        setMessage('محصول با موفقیت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره محصول انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!accessToken || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(accessToken, pendingDelete.id);
      setProducts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setMessage('محصول حذف شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف محصول انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={openCreate}
        addLabel="افزودن محصول"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[{ key: 'category', label: 'دسته‌بندی', options: categoryOptions }]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      {message ? (
        <p
          className={`field-message mb-4 ${
            message.includes('موفقیت') || message.includes('حذف شد') ? 'field-message--ok' : ''
          }`}
        >
          {message}
        </p>
      ) : null}

      <DataTable
        headers={['محصول', 'دسته‌بندی', 'قیمت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="محصولی با این جستجو پیدا نشد."
      >
        {list.filtered.map((product) => (
          <DataRow key={product.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{product.name}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">
                {product.slug}
              </span>
            </td>
            <td>
              <span className="admin-badge">{resolveCategoryLabel(product.category, categories)}</span>
            </td>
            <td className="font-medium text-[var(--ops-ink)]">{formatMoney(product.price)}</td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => openEdit(product)}>
                  <IconEdit />
                </IconAction>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(product)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>

      <AdminModal
        open={modalOpen}
        title={editingId ? 'ویرایش محصول' : 'افزودن محصول'}
        description="اطلاعات کاتالوگ را به فارسی وارد کنید."
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت محصول'}
      >
        <div className="admin-form-grid two">
          {(
            [
              ['nameFa', 'نام فارسی'],
              ['nameEn', 'نام لاتین (فنی)'],
              ['slug', 'شناسه آدرس'],
              ['sku', 'کد کالا'],
              ['descriptionShortFa', 'توضیح کوتاه'],
              ['thumbnailImageUrl', 'آدرس تصویر (اختیاری)'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-start">
              <span className="ops-login__label">{label}</span>
              <input
                required={key !== 'thumbnailImageUrl'}
                value={String(form[key])}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="ops-field"
                dir={key === 'nameFa' || key === 'descriptionShortFa' ? 'rtl' : 'ltr'}
              />
            </label>
          ))}
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
            <span className="ops-login__label">قیمت پایه (ریال)</span>
            <input
              required
              type="number"
              min={0}
              value={form.priceBase}
              onChange={(event) => setForm({ ...form, priceBase: Number(event.target.value) })}
              className="ops-field"
              dir="ltr"
            />
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`محصول «${pendingDelete?.name ?? ''}» حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
