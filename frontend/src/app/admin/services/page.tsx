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
  formatMoney,
  labelOf,
  SERVICE_CATEGORY,
  SERVICE_UNIT,
} from '@/lib/admin-labels';
import {
  createAdminService,
  fetchAdminServices,
  ServiceAdminSummary,
  updateAdminService,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const emptyForm = {
  nameFa: '',
  nameEn: '',
  description: '',
  serviceCategory: 'support',
  basePrice: '' as number | '',
  unitType: 'fixed',
  isActive: true,
};

const categoryOptions = Object.entries(SERVICE_CATEGORY).map(([value, label]) => ({ value, label }));
const unitOptions = Object.entries(SERVICE_UNIT).map(([value, label]) => ({ value, label }));

export default function AdminServicesPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [services, setServices] = useState<ServiceAdminSummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceAdminSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

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
    if (token) fetchAdminServices(token).then(setServices).catch(() => setMessage('دریافت خدمات انجام نشد.'));
  }, [token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(service: ServiceAdminSummary) {
    setEditingId(service.id);
    setForm({
      nameFa: service.nameFa,
      nameEn: service.nameEn,
      description: service.description,
      serviceCategory: service.serviceCategory,
      basePrice: service.basePrice ?? '',
      unitType: service.unitType,
      isActive: service.isActive,
    });
    setModalOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const payload = {
        nameFa: form.nameFa,
        nameEn: form.nameEn,
        description: form.description,
        serviceCategory: form.serviceCategory,
        unitType: form.unitType,
        isActive: form.isActive,
        basePrice: form.basePrice === '' ? null : Number(form.basePrice),
      };
      if (editingId) {
        const updated = await updateAdminService(token, editingId, payload);
        setServices((current) => current.map((item) => (item.id === editingId ? updated : item)));
        setMessage('خدمت ویرایش شد.');
      } else {
        const created = await createAdminService(token, payload);
        setServices((current) => [...current, created]);
        setMessage('خدمت افزوده شد.');
      }
      setModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره خدمت انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      const updated = await updateAdminService(token, pendingDelete.id, { isActive: false });
      setServices((current) => current.map((item) => (item.id === pendingDelete.id ? updated : item)));
      setPendingDelete(null);
      setMessage('خدمت غیرفعال شد.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حذف انجام نشد.');
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
        onAdd={openCreate}
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

      {message ? <p className="field-message field-message--ok mb-4">{message}</p> : null}

      <DataTable
        headers={['خدمت', 'نوع', 'قیمت پایه', 'واحد', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0}
        emptyText="خدمتی با این جستجو پیدا نشد."
      >
        {list.filtered.map((service) => (
          <DataRow key={service.id}>
            <td className="text-start">
              <strong className="font-medium text-[var(--ops-ink)]">{service.nameFa}</strong>
            </td>
            <td>{labelOf(SERVICE_CATEGORY, service.serviceCategory)}</td>
            <td>{service.basePrice == null ? 'بدون قیمت' : formatMoney(service.basePrice)}</td>
            <td>{labelOf(SERVICE_UNIT, service.unitType)}</td>
            <td>
              <span className={`admin-badge ${service.isActive ? 'admin-badge--ok' : ''}`}>
                {service.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => openEdit(service)}>
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

      <AdminModal
        open={modalOpen}
        title={editingId ? 'ویرایش خدمت' : 'افزودن خدمت'}
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editingId ? 'ذخیره تغییرات' : 'ثبت خدمت'}
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
            <span className="ops-login__label">نام لاتین (فنی)</span>
            <input
              required
              className="ops-field"
              dir="ltr"
              value={form.nameEn}
              onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">توضیحات</span>
            <textarea
              required
              className="ops-field min-h-24"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">نوع خدمت</span>
            <select
              className="admin-select admin-select--wide"
              value={form.serviceCategory}
              onChange={(event) => setForm({ ...form, serviceCategory: event.target.value })}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start">
            <span className="ops-login__label">واحد قیمت</span>
            <select
              className="admin-select admin-select--wide"
              value={form.unitType}
              onChange={(event) => setForm({ ...form, unitType: event.target.value })}
            >
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-start">
            <span className="ops-login__label">قیمت پایه (ریال) — اختیاری</span>
            <input
              type="number"
              min={0}
              className="ops-field"
              dir="ltr"
              placeholder="خالی = بدون نمایش قیمت"
              value={form.basePrice}
              onChange={(event) =>
                setForm({
                  ...form,
                  basePrice: event.target.value === '' ? '' : Number(event.target.value),
                })
              }
            />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm text-[var(--ops-ink-soft)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 accent-[var(--ops-accent)]"
            />
            خدمت فعال باشد
          </label>
        </div>
      </AdminModal>

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
