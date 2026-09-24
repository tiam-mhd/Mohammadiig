'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { DataRow, DataTable, RowActions } from '@/components/admin/DataTable';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { IconAction, IconEdit, IconTrash } from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import { formatDate } from '@/lib/admin-labels';
import { CUSTOMER_STATUS_DESCRIPTIONS, CUSTOMER_STATUS_LABELS, CustomerStatus } from '@/lib/customer-status';
import {
  CustomerAdminSummary,
  deleteAdminCustomer,
  fetchAdminCustomersPage,
  updateCustomerStatus,
  permanentlyDeleteAdminCustomer,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

export default function AdminCustomersPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [customers, setCustomers] = useState<CustomerAdminSummary[]>([]);
  const [editing, setEditing] = useState<CustomerAdminSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerAdminSummary | null>(null);
  const [verified, setVerified] = useState(false);
  const [accessStatus, setAccessStatus] = useState<CustomerStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [pendingPurge, setPendingPurge] = useState<CustomerAdminSummary | null>(null);
  const [purgeConfirmation, setPurgeConfirmation] = useState('');
  const [purging, setPurging] = useState(false);
  const [status, setStatus] = useState<'current' | 'deleted'>('current');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const searchText = useCallback(
    (item: CustomerAdminSummary) =>
      `${item.companyName ?? ''} ${item.contactPerson ?? ''} ${item.phone ?? ''} ${item.country ?? ''} ${item.paymentTerms} ${item.statusReason ?? ''}`,
    [],
  );
  const matchFilter = useCallback((item: CustomerAdminSummary, key: string, value: string) => {
    if (key === 'verified') return value === 'yes' ? item.isVerified : !item.isVerified;
    if (key === 'accessStatus') return item.status === value;
    return true;
  }, []);
  const list = useAdminList(customers, searchText, matchFilter);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAdminCustomersPage(token, { status, page, limit: 20, search: list.query })
      .then((result) => { if (!cancelled) { setCustomers(result.data); setMeta(result.meta); } })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          adminToast.error('دریافت مشتریان انجام نشد.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, status, page, list.query]);
  useEffect(() => setPage(1), [status, list.query, JSON.stringify(list.filters)]);

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    if (accessStatus === 'blocked' && !statusReason.trim()) {
      adminToast.error('دلیل مسدودسازی را وارد کنید.');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateCustomerStatus(token, editing.id, {
        isVerified: verified, status: accessStatus, reason: statusReason.trim(),
      });
      setCustomers((current) => current.map((item) => (item.id === editing.id ? updated : item)));
      setEditing(null);
      adminToast.success('وضعیت مشتری ذخیره شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ویرایش انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdminCustomer(token, pendingDelete.id);
      setCustomers((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      adminToast.success('مشتری به فهرست حذف‌شده‌ها منتقل شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف انجام نشد.');
    } finally {
      setDeleting(false);
    }
  }

  async function confirmPermanentRemove(event: FormEvent) {
    event.preventDefault();
    if (!token || !pendingPurge || purging) return;
    if (purgeConfirmation !== 'حذف دائمی') {
      adminToast.error('برای تأیید، عبارت «حذف دائمی» را دقیق وارد کنید.');
      return;
    }
    setPurging(true);
    try {
      await permanentlyDeleteAdminCustomer(token, pendingPurge.id, purgeConfirmation);
      setCustomers((current) => current.filter((item) => item.id !== pendingPurge.id));
      setPendingPurge(null);
      setPurgeConfirmation('');
      adminToast.success('هویت مشتری برای همیشه پاک شد؛ سوابق مالی به‌صورت ناشناس حفظ شدند.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'حذف دائمی انجام نشد.');
    } finally {
      setPurging(false);
    }
  }

  return (
    <AdminShell eyebrow="مشتریان" title="مشتریان">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel="افزودن مشتری"
        extraActions={
          <label className="admin-filters__field text-start">
            <span className="ops-login__label">نمایش مشتریان</span>
            <select
              className="admin-select"
              value={status}
              onChange={(event) => {
                setCustomers([]);
                setLoading(true);
                setLoadError(false);
                setStatus(event.target.value as 'current' | 'deleted');
                list.clearFilters();
              }}
            >
              <option value="current">مشتریان فعلی</option>
              <option value="deleted">فقط حذف‌شده‌ها</option>
            </select>
          </label>
        }
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              {
                key: 'accessStatus',
                label: 'دسترسی حساب',
                options: Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
              },
              {
                key: 'verified',
                label: 'تأیید حساب',
                options: [
                  { value: 'yes', label: 'تأییدشده' },
                  { value: 'no', label: 'در انتظار تأیید' },
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
        headers={['شرکت', 'تماس', 'کشور', 'شرایط پرداخت', 'تاریخ', 'وضعیت', 'عملیات']}
        isEmpty={list.filtered.length === 0 && !loading}
        emptyText={loading ? 'در حال دریافت مشتریان…' : loadError ? 'دریافت مشتریان انجام نشد. صفحه را دوباره بارگذاری کنید.' : 'مشتری‌ای با این جستجو پیدا نشد.'}
      >
        {list.filtered.map((customer) => (
          <DataRow key={customer.id}>
            <td className="text-start">
              <strong className="block font-medium text-[var(--ops-ink)]">{customer.companyName || customer.contactPerson || 'مشتری بدون نام'}</strong>
              <span className="mt-1 block text-xs text-[var(--ops-muted)]">
                {customer.contactPerson ?? 'بدون مخاطب'}
              </span>
            </td>
            <td dir="ltr">{customer.phone ?? '—'}</td>
            <td>{customer.country ?? '—'}</td>
            <td>{customer.paymentTerms}</td>
            <td>{formatDate(customer.createdAt)}</td>
            <td>
              <span className={`admin-badge ${customer.deletedAt || !customer.isActive ? 'admin-badge--warn' : 'admin-badge--ok'}`}>
                {customer.deletedAt ? 'حذف‌شده' : CUSTOMER_STATUS_LABELS[customer.status]}
              </span>
              {customer.deletedAt ? <span className="mt-1 block text-xs text-[var(--ops-muted)]">حذف: {formatDate(customer.deletedAt)}</span> : null}
              {customer.statusReason ? <span className="mt-1 block max-w-xs whitespace-pre-wrap break-words text-xs text-[var(--ops-muted)]">دلیل: {customer.statusReason}</span> : null}
              <span className={`admin-badge ${customer.isVerified ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                {customer.isVerified ? 'تأیید شده' : 'در انتظار تأیید'}
              </span>
            </td>
            <td>
              <RowActions>
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="admin-action text-xs text-[var(--ops-accent)] hover:underline"
                >
                  نمای ۳۶۰
                </Link>
                {!customer.deletedAt ? (
                  <>
                    <IconAction
                      label="ویرایش"
                      onClick={() => {
                        setEditing(customer);
                        setVerified(customer.isVerified);
                        setAccessStatus(customer.status);
                        setStatusReason(customer.statusReason ?? '');
                      }}
                    >
                      <IconEdit />
                    </IconAction>
                    <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(customer)}>
                      <IconTrash />
                    </IconAction>
                  </>
                ) : (
                  <IconAction label="حذف دائمی" tone="danger" onClick={() => {
                    setPendingPurge(customer);
                    setPurgeConfirmation('');
                  }}>
                    <IconTrash />
                  </IconAction>
                )}
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>
      <div className="mt-4 flex items-center justify-between text-sm"><button className="admin-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>قبلی</button><span>{meta.total.toLocaleString('fa-IR')} مورد · صفحه {page.toLocaleString('fa-IR')} از {meta.totalPages.toLocaleString('fa-IR')}</span><button className="admin-button" disabled={page >= meta.totalPages || loading} onClick={() => setPage((value) => value + 1)}>بعدی</button></div>

      <AdminModal
        open={Boolean(editing)}
        title="ویرایش مشتری"
        description="وضعیت دسترسی و تأیید حساب را جداگانه تنظیم کنید."
        onClose={() => { if (!busy) setEditing(null); }}
        onSubmit={saveEdit}
        busy={busy}
      >
        <label className="admin-filters__field text-start">
          <span className="ops-login__label">وضعیت دسترسی</span>
          <select className="admin-select admin-select--wide" value={accessStatus} disabled={busy}
            onChange={(event) => { setAccessStatus(event.target.value as CustomerStatus); setStatusReason(''); }}>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <span className="mt-2 block text-sm text-[var(--ops-muted)]">{CUSTOMER_STATUS_DESCRIPTIONS[accessStatus]}</span>
        </label>
        <label className="mt-4 block text-start">
          <span className="ops-login__label">{accessStatus === 'blocked' ? 'دلیل مسدودسازی (الزامی)' : 'دلیل / یادداشت وضعیت (اختیاری)'}</span>
          <textarea className="ops-field mt-2 w-full" rows={3} maxLength={1000} disabled={busy}
            required={accessStatus === 'blocked'} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} />
        </label>
        <label className="flex items-center gap-3 text-sm text-[var(--ops-ink-soft)]">
          <input
            type="checkbox"
            checked={verified}
            disabled={busy}
            onChange={(event) => setVerified(event.target.checked)}
            className="h-4 w-4 accent-[var(--ops-accent)]"
          />
          حساب تأیید شده است
        </label>
      </AdminModal>

      <AdminModal
        open={Boolean(pendingPurge)}
        title="حذف دائمی مشتری"
        description={`اطلاعات هویتی «${pendingPurge?.companyName || pendingPurge?.contactPerson || 'مشتری'}» برای همیشه پاک می‌شود. این عملیات قابل بازگشت نیست.`}
        onClose={() => { if (!purging) setPendingPurge(null); }}
        onSubmit={confirmPermanentRemove}
        submitLabel="حذف دائمی و حفظ سوابق مالی ناشناس"
        busy={purging}
      >
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">
          حساب ورود، مشخصات پروفایل و اطلاعات هویتی ثبت‌شده در سفارش‌ها و فاکتورها پاک می‌شوند.
          مبلغ‌ها و سوابق مالی باقی می‌مانند. مشتری از فهرست حذف‌شده‌ها نیز خارج می‌شود.
          فایل‌های پیوست و نسخه‌های پشتیبان در این عملیات تغییر نمی‌کنند و در صورت داشتن اطلاعات هویتی باید جداگانه بررسی شوند.
        </p>
        <label className="mt-4 block text-start">
          <span className="ops-login__label">برای تأیید، عبارت «حذف دائمی» را وارد کنید</span>
          <input className="ops-field mt-2 w-full" required autoComplete="off" disabled={purging}
            value={purgeConfirmation} onChange={(event) => setPurgeConfirmation(event.target.value)} />
        </label>
      </AdminModal>

      <AdminModal open={addOpen} title="افزودن مشتری" onClose={() => setAddOpen(false)}>
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">
          مشتری سازمانی با ثبت‌نام در «پنل مشتریان» ساخته می‌شود. پس از ثبت، از همین صفحه می‌توانید حساب را تأیید یا حذف کنید.
        </p>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`مشتری «${pendingDelete?.companyName || pendingDelete?.contactPerson || ''}» حذف شود؟ دسترسی حساب قطع می‌شود. پروفایل به فیلتر حذف‌شده‌ها منتقل و سوابق سفارش و پرداخت حفظ می‌شوند.`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
