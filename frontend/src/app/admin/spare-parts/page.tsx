'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDisplayPrice } from '@/lib/admin-labels';
import {
  deleteAdminSparePart,
  fetchAdminSparePartCategories,
  fetchAdminSparePartsPage,
  ManageSparePartPayload,
  SparePart,
  SparePartCategory,
  updateAdminSparePart,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

type QuickDraft = {
  stockQuantity: string;
  price: string;
  priceNegotiable: boolean;
};

export default function AdminSparePartsPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuickDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SparePart | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

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

  function draftFor(part: SparePart): QuickDraft {
    return (
      drafts[part.id] ?? {
        stockQuantity: String(part.stockQuantity),
        price: String(part.price),
        priceNegotiable: Boolean(part.priceNegotiable),
      }
    );
  }

  function setDraft(partId: string, patch: Partial<QuickDraft>, fallback: SparePart) {
    setDrafts((current) => {
      const base =
        current[partId] ??
        ({
          stockQuantity: String(fallback.stockQuantity),
          price: String(fallback.price),
          priceNegotiable: Boolean(fallback.priceNegotiable),
        } satisfies QuickDraft);
      return { ...current, [partId]: { ...base, ...patch } };
    });
  }

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchAdminSparePartsPage(token, { page, limit: 20, q: list.query }), fetchAdminSparePartCategories(token)])
      .then(([partResponse, nextCategories]) => {
        setParts(partResponse.data); setMeta(partResponse.meta);
        setCategories(nextCategories);
      })
      .catch(() => adminToast.error('دریافت قطعات یدکی انجام نشد.'))
      .finally(() => setLoading(false));
  }, [token, page, list.query]);

  function categoryLabel(value: string) {
    const found = categories.find((category) => category.id === value || category.slug === value);
    if (found) return found.nameFa;
    return value || '—';
  }

  async function saveQuick(part: SparePart, payload: ManageSparePartPayload, successMessage: string) {
    if (!token) return;
    setSavingId(part.id);
    try {
      const updated = await updateAdminSparePart(token, part.id, payload);
      setParts((current) => current.map((item) => (item.id === part.id ? updated : item)));
      setDrafts((current) => {
        const next = { ...current };
        delete next[part.id];
        return next;
      });
      adminToast.success(successMessage);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره سریع انجام نشد.');
    } finally {
      setSavingId(null);
    }
  }

  async function commitStock(part: SparePart) {
    const draft = draftFor(part);
    const stockQuantity = Number(draft.stockQuantity);
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      adminToast.error('موجودی نامعتبر است.');
      setDrafts((current) => {
        const next = { ...current };
        delete next[part.id];
        return next;
      });
      return;
    }
    if (stockQuantity === part.stockQuantity) return;
    await saveQuick(part, { stockQuantity }, 'موجودی به‌روز شد.');
  }

  async function commitPrice(part: SparePart) {
    const draft = draftFor(part);
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      adminToast.error('قیمت نامعتبر است.');
      setDrafts((current) => {
        const next = { ...current };
        delete next[part.id];
        return next;
      });
      return;
    }
    if (price === part.price && draft.priceNegotiable === Boolean(part.priceNegotiable)) return;
    await saveQuick(part, { price, priceNegotiable: draft.priceNegotiable }, 'قیمت به‌روز شد.');
  }

  async function commitNegotiable(part: SparePart, priceNegotiable: boolean) {
    setDraft(part.id, { priceNegotiable }, part);
    if (priceNegotiable === Boolean(part.priceNegotiable)) return;
    await saveQuick(part, { priceNegotiable }, priceNegotiable ? 'قیمت توافقی فعال شد.' : 'قیمت توافقی برداشته شد.');
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminSparePart(token, pendingDelete.id);
      setParts((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('قطعه حذف شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف قطعه انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="پس از فروش" title="قطعات یدکی">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={(value) => { list.setQuery(value); setPage(1); }}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => router.push('/admin/spare-parts/new')}
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

      <DataTable
        headers={['قطعه', 'دسته', 'شماره', 'موجودی', 'قیمت', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0 && !loading}
        loading={loading}
        emptyText="قطعه‌ای با این جستجو پیدا نشد."
      >
        {list.filtered.map((part) => {
          const draft = draftFor(part);
          const stockValue = Number(draft.stockQuantity);
          const lowStock =
            (Number.isFinite(stockValue) ? stockValue : part.stockQuantity) <= (part.reorderLevel ?? 5);
          const busy = savingId === part.id;
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
                <div className="admin-quick-row">
                  <input
                    type="number"
                    min={0}
                    className={`admin-quick-field ${lowStock ? 'admin-quick-field--warn' : ''}`}
                    dir="ltr"
                    disabled={busy}
                    value={draft.stockQuantity}
                    onChange={(event) => setDraft(part.id, { stockQuantity: event.target.value }, part)}
                    onBlur={() => void commitStock(part)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                    aria-label={`موجودی ${part.nameFa}`}
                    title={lowStock ? 'موجودی کم — Enter برای ذخیره' : 'ویرایش سریع موجودی'}
                  />
                </div>
              </td>
              <td>
                <div className="admin-quick-row">
                  <label className="admin-quick-check">
                    <input
                      type="checkbox"
                      checked={draft.priceNegotiable}
                      disabled={busy}
                      onChange={(event) => void commitNegotiable(part, event.target.checked)}
                    />
                    توافقی
                  </label>
                  {draft.priceNegotiable ? (
                    <span className="text-xs text-[var(--ops-ink)]">توافقی</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      className="admin-quick-field admin-quick-field--price"
                      dir="ltr"
                      disabled={busy}
                      value={draft.price}
                      onChange={(event) => setDraft(part.id, { price: event.target.value }, part)}
                      onBlur={() => void commitPrice(part)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur();
                        }
                      }}
                      aria-label={`قیمت ${part.nameFa}`}
                      title="ویرایش سریع قیمت"
                    />
                  )}
                  <span className="sr-only">{formatDisplayPrice(part.price, part.priceNegotiable)}</span>
                </div>
              </td>
              <td>
                <span className={`admin-badge ${part.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                  {part.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </td>
              <td>
                <RowActions>
                  <IconAction label="ویرایش" onClick={() => router.push(`/admin/spare-parts/${part.id}`)}>
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

      <div className="mt-4 flex items-center justify-between text-sm"><button className="admin-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>قبلی</button><span>{meta.total.toLocaleString('fa-IR')} مورد · صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, meta.totalPages).toLocaleString('fa-IR')}</span><button className="admin-button" disabled={page >= meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>بعدی</button></div>

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
