'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDisplayPrice, PORTFOLIO_CATEGORY } from '@/lib/admin-labels';
import {
  deleteAdminPortfolio,
  fetchAdminPortfolio,
  PortfolioWork,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const categoryOptions = Object.entries(PORTFOLIO_CATEGORY).map(([value, label]) => ({ value, label }));

function locationLabel(item: PortfolioWork) {
  return [item.province, item.city, item.locationDetail].filter(Boolean).join(' · ') || '—';
}

export default function AdminPortfolioPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PortfolioWork[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PortfolioWork | null>(null);
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
        onAdd={() => router.push('/admin/portfolio/new')}
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
        headers={['عنوان', 'مشتری', 'قیمت', 'لوکیشن', 'وضعیت', 'عملیات']}
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
            <td>{formatDisplayPrice(item.priceBase, item.priceNegotiable, 'بدون قیمت')}</td>
            <td className="text-start text-sm">{locationLabel(item)}</td>
            <td>
              <span className={`admin-badge ${item.isPublished ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {item.isPublished ? 'منتشرشده' : 'پیش‌نویس'}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => router.push(`/admin/portfolio/${item.id}`)}>
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
