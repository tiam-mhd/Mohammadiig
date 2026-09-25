'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { IconAction, IconClear, IconFilter } from '@/components/admin/AdminIcons';
import { getApiUrl } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type AuditRow = { id: string; action: string; entityType: string; entityId: string; actorUserId: string | null; oldValue?: Record<string, unknown> | null; newValue?: Record<string, unknown> | null; createdAt: string };
type AuditResponse = { data: AuditRow[]; meta: { page: number; limit: number; total: number; totalPages: number } };

const actionLabels: Record<string, string> = {
  'payment.created': 'ثبت پرداخت', 'payment.status_changed': 'تغییر وضعیت پرداخت', 'quotation.accepted': 'پذیرش پیش‌فاکتور', 'quotation.status_changed': 'تغییر وضعیت پیش‌فاکتور', 'quotation.created': 'ایجاد پیش‌فاکتور', 'invoice.payment_changed': 'تغییر پرداخت فاکتور', 'order.payment_changed': 'تغییر پرداخت سفارش', 'media.deleted': 'حذف رسانه', 'media.purged': 'حذف دائمی رسانه', 'backup.restored': 'بازیابی پشتیبان', 'product.created': 'ایجاد محصول', 'product.price_changed': 'تغییر قیمت محصول', 'user.role_changed': 'تغییر نقش کاربر', 'user.active_changed': 'تغییر وضعیت کاربر', 'auth.login_success': 'ورود موفق', 'auth.login_failed': 'ورود ناموفق',
};
const entityLabels: Record<string, string> = { payment: 'پرداخت', quotation: 'پیش‌فاکتور', invoice: 'فاکتور', order: 'سفارش', media: 'رسانه', backup: 'پشتیبان', product: 'محصول', user: 'کاربر', auth: 'احراز هویت' };
const actionOptions = Object.entries(actionLabels).map(([value, label]) => ({ value, label }));
const entityOptions = Object.entries(entityLabels).map(([value, label]) => ({ value, label }));

function safeJson(value: Record<string, unknown> | null | undefined) { return value && Object.keys(value).length ? JSON.stringify(value, null, 2) : '—'; }

export default function AuditPage() {
  const { accessToken, user, hasHydrated } = useAuthStore();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [meta, setMeta] = useState<AuditResponse['meta']>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [entityType, setEntityType] = useState('all');
  const [actorUserId, setActorUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const load = useCallback(async () => {
    if (!accessToken || user?.role !== 'admin') return;
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(meta.limit) });
    if (action !== 'all') params.set('action', action);
    if (entityType !== 'all') params.set('entityType', entityType);
    if (actorUserId.trim()) params.set('actorUserId', actorUserId.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', `${to}T23:59:59.999Z`);
    try {
      const response = await fetch(`${getApiUrl()}/audit/admin?${params.toString()}`, { credentials: 'include', headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(response.status === 403 ? 'دسترسی به گزارش ممیزی مجاز نیست.' : 'دریافت گزارش ممیزی انجام نشد.');
      const body = (await response.json()) as AuditResponse;
      setRows(body.data ?? []); setMeta(body.meta ?? { page, limit: 20, total: 0, totalPages: 1 });
    } catch (requestError) {
      setRows([]); setError(requestError instanceof Error ? requestError.message : 'دریافت گزارش ممیزی انجام نشد.');
    } finally { setLoading(false); }
  }, [accessToken, action, actorUserId, entityType, from, meta.limit, page, to, user?.role]);

  useEffect(() => { if (hasHydrated) void load(); }, [hasHydrated, load]);
  const visibleRows = useMemo(() => { const normalized = query.trim().toLowerCase(); return normalized ? rows.filter((row) => `${row.action} ${row.entityType} ${row.entityId} ${row.actorUserId ?? ''}`.toLowerCase().includes(normalized)) : rows; }, [query, rows]);
  const activeFilterCount = [action !== 'all' ? action : '', entityType !== 'all' ? entityType : '', actorUserId, from, to].filter(Boolean).length;
  const resetFilters = () => { setQuery(''); setAction('all'); setEntityType('all'); setActorUserId(''); setFrom(''); setTo(''); setPage(1); };
  const copyId = async (id: string) => { try { await navigator.clipboard.writeText(id); setCopiedId(id); window.setTimeout(() => setCopiedId(''), 1600); } catch { setCopiedId(''); } };

  return (
    <AdminShell eyebrow="امنیت و ردیابی" title="گزارش ممیزی">
      <div className="space-y-5" dir="rtl">
        <section className="admin-stat-grid" aria-label="خلاصه گزارش ممیزی">
          <div className="admin-stat text-start"><p className="caption-up">کل رویدادها</p><p className="admin-stat__value">{loading ? '…' : meta.total.toLocaleString('fa-IR')}</p><p className="admin-stat__hint">رویداد ثبت‌شده در سامانه</p></div>
          <div className="admin-stat text-start"><p className="caption-up">نمایش فعلی</p><p className="admin-stat__value">{loading ? '…' : visibleRows.length.toLocaleString('fa-IR')}</p><p className="admin-stat__hint">نتیجه در این صفحه</p></div>
          <div className="admin-stat text-start"><p className="caption-up">فیلترهای فعال</p><p className="admin-stat__value">{activeFilterCount.toLocaleString('fa-IR')}</p><p className="admin-stat__hint">قابل پاک‌سازی از نوار فیلتر</p></div>
        </section>
        <AdminToolbar countLabel={`${visibleRows.length.toLocaleString('fa-IR')} از ${meta.total.toLocaleString('fa-IR')} رویداد`} query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((open) => !open)} activeFilterCount={activeFilterCount} extraActions={<IconAction label="پاک‌سازی فیلترها" tone="ghost" onClick={resetFilters}><IconClear /></IconAction>}>
          {filtersOpen ? <AdminFilterBar fields={[{ key: 'action', label: 'عملیات', options: actionOptions }, { key: 'entityType', label: 'نوع موجودیت', options: entityOptions }]} values={{ action, entityType }} onChange={(key, value) => { if (key === 'action') setAction(value); if (key === 'entityType') setEntityType(value); setPage(1); }} onClear={resetFilters} /> : null}
        </AdminToolbar>
        <section className="admin-card p-4" aria-label="فیلترهای تکمیلی"><div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="admin-filters__field"><span className="ops-login__label">شناسه کاربر</span><input className="admin-input" value={actorUserId} onChange={(event) => { setActorUserId(event.target.value); setPage(1); }} placeholder="شناسه کاربر ثبت‌کننده" /></label>
          <label className="admin-filters__field"><span className="ops-login__label">از تاریخ</span><input className="admin-input" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
          <label className="admin-filters__field"><span className="ops-login__label">تا تاریخ</span><input className="admin-input" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
          <button type="button" className="ops-btn ops-btn--ghost self-end" onClick={resetFilters}><IconFilter /> پاک‌سازی</button>
        </div></section>
        {error ? <div className="field-message field-message--error flex items-center justify-between gap-3" role="alert"><span>{error}</span><button type="button" className="ops-btn ops-btn--ghost" onClick={() => void load()}>تلاش دوباره</button></div> : null}
        {loading ? <div className="admin-card p-8 text-center text-[var(--ops-muted)]" role="status">در حال بارگذاری گزارش ممیزی…</div> : null}
        {!loading && !error ? <DataTable headers={['رویداد', 'موجودیت', 'ثبت‌کننده', 'زمان', 'جزئیات']} emptyText="در این بازه رویدادی ثبت نشده است." isEmpty={visibleRows.length === 0}>{visibleRows.map((row) => <DataRow key={row.id}><td><strong className="block text-[var(--ops-ink)]">{actionLabels[row.action] ?? row.action}</strong><span className="en mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">{row.action}</span></td><td><span className="admin-badge">{entityLabels[row.entityType] ?? row.entityType}</span><span className="en mt-1 block text-xs text-[var(--ops-muted)]" dir="ltr">{row.entityId.slice(0, 12)}…</span></td><td><span dir="ltr" className="en text-xs">{row.actorUserId ?? 'system'}</span></td><td><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('fa-IR')}</time></td><td><details><summary className="cursor-pointer text-[var(--ops-accent)]">مشاهده</summary><div className="mt-2 max-w-md space-y-2 text-xs"><pre className="overflow-auto rounded bg-[var(--ops-paper)] p-2" dir="ltr">{safeJson(row.newValue ?? row.oldValue)}</pre><button type="button" className="ops-btn ops-btn--ghost" onClick={() => void copyId(row.id)}>{copiedId === row.id ? 'کپی شد' : 'کپی شناسه رویداد'}</button></div></details></td></DataRow>)}</DataTable> : null}
        <div className="flex items-center justify-between gap-3" aria-label="صفحه‌بندی گزارش ممیزی"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} className="ops-btn ops-btn--ghost disabled:opacity-40">قبلی</button><span className="text-sm text-[var(--ops-muted)]">صفحه {page.toLocaleString('fa-IR')} از {Math.max(1, meta.totalPages).toLocaleString('fa-IR')}</span><button type="button" disabled={loading || page >= meta.totalPages} onClick={() => setPage((current) => current + 1)} className="ops-btn ops-btn--ghost disabled:opacity-40">بعدی</button></div>
      </div>
    </AdminShell>
  );
}
