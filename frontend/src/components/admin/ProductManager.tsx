'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconRestore, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { CATEGORY_LABELS, formatMoney, labelOf } from '@/lib/admin-labels';
import {
  deleteProduct,
  fetchAdminProducts,
  fetchCategories,
  Product,
  ProductCategory,
  purgeProduct,
  restoreProduct,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

type ProductStatusFilter = 'active' | 'trash' | 'all';
type PendingAction = { product: Product; mode: 'soft' | 'purge' };

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
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('active');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.nameFa })),
    [categories],
  );

  const searchText = useCallback(
    (item: Product) =>
      `${item.name} ${item.slug} ${item.sku ?? ''} ${item.category} ${item.description} ${resolveCategoryLabel(item.category, categories)}`,
    [categories],
  );
  const matchFilter = useCallback(
    (item: Product, key: string, value: string) => {
      if (key === 'status') {
        if (value === 'trash') return Boolean(item.deletedAt);
        if (value === 'active') return !item.deletedAt;
        return true;
      }
      if (key !== 'category') return true;
      const selected = categories.find((category) => category.id === value);
      if (!selected) return item.category === value;
      const needles = [selected.id, selected.slug, selected.nameEn, selected.nameEn.toUpperCase()];
      return needles.some((needle) => needle.toLowerCase() === item.category.toLowerCase());
    },
    [categories],
  );
  const list = useAdminList(products, searchText, matchFilter);
  const inTrash = (list.filters.status ?? statusFilter) === 'trash';

  const reloadProducts = useCallback(
    async (status: ProductStatusFilter = statusFilter) => {
      if (!accessToken) return;
      const next = await fetchAdminProducts(accessToken, status);
      setProducts(next);
    },
    [accessToken, statusFilter],
  );

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchAdminProducts(accessToken, statusFilter), fetchCategories()])
      .then(([productResponse, categoryResponse]) => {
        setProducts(productResponse);
        setCategories(categoryResponse);
      })
      .catch(() => adminToast.error('دریافت محصولات یا دسته‌ها انجام نشد.'));
  }, [accessToken, statusFilter]);

  async function confirmRemove() {
    if (!accessToken || !pendingAction) return;
    setDeleting(true);
    try {
      if (pendingAction.mode === 'purge') {
        await purgeProduct(accessToken, pendingAction.product.id);
        setProducts((current) => current.filter((item) => item.id !== pendingAction.product.id));
        adminToast.success('محصول برای همیشه حذف شد.');
      } else {
        await deleteProduct(accessToken, pendingAction.product.id);
        if (statusFilter === 'active') {
          setProducts((current) => current.filter((item) => item.id !== pendingAction.product.id));
        } else {
          await reloadProducts(statusFilter);
        }
        adminToast.success('محصول به سطل زباله منتقل شد.');
      }
      setPendingAction(null);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف محصول انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  async function onRestore(product: Product) {
    if (!accessToken) return;
    try {
      const restored = await restoreProduct(accessToken, product.id);
      if (statusFilter === 'trash') {
        setProducts((current) => current.filter((item) => item.id !== product.id));
      } else {
        setProducts((current) => current.map((item) => (item.id === product.id ? restored : item)));
      }
      adminToast.success('محصول بازیابی شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'بازیابی محصول انجام نشد.');
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
        activeFilterCount={list.activeFilterCount + (statusFilter !== 'active' ? 1 : 0)}
        onAdd={statusFilter === 'trash' ? undefined : () => router.push('/admin/products/new')}
        addLabel="افزودن محصول"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'category', label: 'دسته‌بندی', options: categoryOptions },
              {
                key: 'status',
                label: 'وضعیت',
                options: [
                  { value: 'active', label: 'فعال' },
                  { value: 'trash', label: 'سطل زباله' },
                ],
              },
            ]}
            values={{ ...list.filters, status: list.filters.status || statusFilter }}
            onChange={(key, value) => {
              list.setFilter(key, value);
              if (key === 'status') {
                const next = (value || 'active') as ProductStatusFilter;
                setStatusFilter(next === 'trash' || next === 'all' ? next : 'active');
              }
            }}
            onClear={() => {
              list.clearFilters();
              setStatusFilter('active');
            }}
          />
        ) : null}
      </AdminToolbar>

      <DataTable
        headers={['محصول', 'وضعیت', 'دسته‌بندی', 'قیمت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText={inTrash ? 'سطل زباله خالی است.' : 'محصولی با این جستجو پیدا نشد.'}
      >
        {list.filtered.map((product) => {
          const deleted = Boolean(product.deletedAt);
          return (
            <DataRow key={product.id}>
              <td>
                <strong className="block font-medium text-[var(--ops-ink)]">{product.name}</strong>
                <span className="mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">
                  {product.slug}
                </span>
              </td>
              <td>
                {deleted ? (
                  <span className="admin-badge admin-badge--danger">حذف‌شده</span>
                ) : (
                  <span className="admin-badge">فعال</span>
                )}
              </td>
              <td>
                <span className="admin-badge">{resolveCategoryLabel(product.category, categories)}</span>
              </td>
              <td>
                <span className="font-medium text-[var(--ops-ink)]" dir="ltr">
                  {formatMoney(product.price)}
                </span>
              </td>
              <td>
                <RowActions>
                  {deleted ? (
                    <>
                      <IconAction label="بازیابی" onClick={() => void onRestore(product)}>
                        <IconRestore />
                      </IconAction>
                      <IconAction
                        label="حذف دائم"
                        tone="danger"
                        onClick={() => setPendingAction({ product, mode: 'purge' })}
                      >
                        <IconTrash />
                      </IconAction>
                    </>
                  ) : (
                    <>
                      <IconAction label="ویرایش" onClick={() => router.push(`/admin/products/${product.id}`)}>
                        <IconEdit />
                      </IconAction>
                      <IconAction
                        label="حذف"
                        tone="danger"
                        onClick={() => setPendingAction({ product, mode: 'soft' })}
                      >
                        <IconTrash />
                      </IconAction>
                    </>
                  )}
                </RowActions>
              </td>
            </DataRow>
          );
        })}
      </DataTable>

      <AdminConfirmModal
        open={Boolean(pendingAction)}
        description={
          pendingAction?.mode === 'purge'
            ? `محصول «${pendingAction.product.name}» برای همیشه حذف شود؟ این کار برگشت‌پذیر نیست.`
            : `محصول «${pendingAction?.product.name ?? ''}» به سطل زباله منتقل شود؟`
        }
        confirmLabel={pendingAction?.mode === 'purge' ? 'بله، حذف دائم' : 'بله، حذف شود'}
        busy={deleting}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
