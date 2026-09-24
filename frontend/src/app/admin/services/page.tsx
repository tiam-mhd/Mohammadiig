'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import {
  formatDisplayPrice,
  labelOf,
  SERVICE_CATEGORY,
  SERVICE_UNIT,
} from '@/lib/admin-labels';
import {
  fetchAdminServicesPage,
  ServiceAdminSummary,
  updateAdminService,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const categoryOptions = Object.entries(SERVICE_CATEGORY).map(([value, label]) => ({ value, label }));

export default function AdminServicesPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [services, setServices] = useState<ServiceAdminSummary[]>([]);
  const [pendingDelete, setPendingDelete] = useState<ServiceAdminSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const searchText = useCallback(
    (item: ServiceAdminSummary) =>
      `${item.nameFa} ${item.nameEn} ${item.description} ${SERVICE_CATEGORY[item.serviceCategory] ?? ''} ${SERVICE_UNIT[item.unitType] ?? ''}`,
    [],
  );
  const matchFilter = useCallback((item: ServiceAdminSummary, key: string, value: string) => {
    if (key === 'category') return item.serviceCategory === value;
    if (key === 'active') return value === 'yes' ? item.isActive : !item.isActive;
    return true;
  }, []);
  const list = useAdminList(services, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminServicesPage(token, { page, limit: 20, search: list.query })
      .then((result) => { setServices(result.data); setMeta(result.meta); })
      .catch(() => adminToast.error('دریافت خدمات انجام نشد.'))
      .finally(() => setLoading(false));
  }, [token, page, list.query]);
  useEffect(() => setPage(1), [list.query, JSON.stringify(list.filters)]);

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      const updated = await updateAdminService(token, pendingDelete.id, { isActive: false });
      setServices((current) => current.map((item) => (item.id === pendingDelete.id ? updated : item)));
      setPendingDelete(null);
      adminToast.success('خدمت غیرفعال شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow="خدمات" title="خدمات">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => router.push('/admin/services/new')}
        addLabel="افزودن خدمت"
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'category', label: 'نوع خدمت', options: categoryOptions },
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
        headers={['خدمت', 'نوع', 'قیمت پایه', 'واحد', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0 && !loading}
        emptyText="خدمتی با این جستجو پیدا نشد."
      >
        {list.filtered.map((service) => (
          <DataRow key={service.id}>
            <td className="text-start">
              <strong className="font-medium text-[var(--ops-ink)]">{service.nameFa}</strong>
            </td>
            <td>{labelOf(SERVICE_CATEGORY, service.serviceCategory)}</td>
            <td>{formatDisplayPrice(service.basePrice, service.priceNegotiable, 'بدون قیمت')}</td>
            <td>{labelOf(SERVICE_UNIT, service.unitType)}</td>
            <td>
              <span className={`admin-badge ${service.isActive ? 'admin-badge--ok' : ''}`}>
                {service.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => router.push(`/admin/services/${service.id}`)}>
                  <IconEdit />
                </IconAction>
                <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(service)}>
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>
      <div className="mt-4 flex items-center justify-between text-sm"><button className="admin-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>قبلی</button><span>{meta.total.toLocaleString('fa-IR')} مورد · صفحه {page.toLocaleString('fa-IR')} از {meta.totalPages.toLocaleString('fa-IR')}</span><button className="admin-button" disabled={page >= meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>بعدی</button></div>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title="غیرفعال‌سازی خدمت"
        description={`خدمت «${pendingDelete?.nameFa ?? ''}» غیرفعال شود؟`}
        confirmLabel="بله، غیرفعال شود"
        busyLabel="در حال غیرفعال‌سازی…"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
