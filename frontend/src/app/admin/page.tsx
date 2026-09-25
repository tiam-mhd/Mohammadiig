'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { fetchAdminDashboard, AdminDashboardMetrics } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminDashboardPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  function load() { if (!token) return; setIsLoading(true); setError(''); fetchAdminDashboard(token).then((result) => setMetrics(result.data)).catch(() => { setMetrics(null); setError('دریافت آمار داشبورد انجام نشد.'); }).finally(() => setIsLoading(false)); }
  useEffect(() => { load(); }, [token]);

  const value = (key: keyof AdminDashboardMetrics) => isLoading ? 'در حال بارگذاری…' : metrics ? Number(metrics[key]).toLocaleString('fa-IR') : 'داده در دسترس نیست';

  return (
    <AdminShell eyebrow="داشبورد" title="نمای کلی">
      {error ? <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">{error}<button className="mr-3 underline" onClick={load}>تلاش دوباره</button></div> : null}
      <div className="admin-stat-grid">
        <div className="admin-stat text-start">
          <p className="caption-up">محصولات</p>
          <p className="admin-stat__value">
            {value('products')}
          </p>
          <p className="admin-stat__hint">محصول فعال در کاتالوگ</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">دسته‌بندی</p>
          <p className="admin-stat__value">
            {value('categories')}
          </p>
          <p className="admin-stat__hint">دستهٔ محصول</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">مشتریان</p>
          <p className="admin-stat__value">{value('customers')}</p>
          <p className="admin-stat__hint">مشتری ثبت‌شده</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">وضعیت سامانه</p>
          <p className="admin-stat__value" style={{ color: metrics?.health.backend === 'ok' && metrics?.health.database === 'ok' ? 'var(--ops-ok)' : 'var(--ops-danger)' }}>
            {isLoading ? 'در حال بررسی…' : metrics?.health.backend === 'ok' && metrics.health.database === 'ok' ? 'سالم' : 'نیازمند بررسی'}
          </p>
          <p className="admin-stat__hint">Backend: {metrics?.health.backend === 'ok' ? 'سالم' : 'خطا'} · Database: {metrics?.health.database === 'ok' ? 'سالم' : 'خطا'}</p>
        </div>
        {(['users','newRequests','pendingQuotations','activeOrders','pendingPayments','unpaidInvoices'] as const).map((key) => <div className="admin-stat text-start" key={key}><p className="caption-up">{{users:'کاربران',newRequests:'درخواست‌های جدید',pendingQuotations:'پیش‌فاکتورهای در انتظار',activeOrders:'سفارش‌های فعال',pendingPayments:'پرداخت‌های در انتظار',unpaidInvoices:'فاکتورهای پرداخت‌نشده'}[key]}</p><p className="admin-stat__value">{value(key)}</p><p className="admin-stat__hint">دریافت‌شده از API داشبورد</p></div>)}
      </div>

      <section className="admin-card-grid mt-5">
        <Link href="/admin/products" className="admin-panel-card text-start">
          <p className="caption-up">۰۱ · کاتالوگ</p>
          <h2 className="display-sm mt-3">مدیریت محصولات</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ops-muted)]">
            افزودن، ویرایش و حذف محصولات کاتالوگ.
          </p>
          <span className="admin-panel-card__cta">
            ورود به مدیریت
            <span aria-hidden>←</span>
          </span>
        </Link>
        <Link href="/admin/categories" className="admin-panel-card text-start">
          <p className="caption-up">۰۲ · دسته‌بندی</p>
          <h2 className="display-sm mt-3">مدیریت دسته‌ها</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ops-muted)]">
            ساخت و ویرایش دسته‌بندی محصولات.
          </p>
          <span className="admin-panel-card__cta">
            ورود به دسته‌ها
            <span aria-hidden>←</span>
          </span>
        </Link>
        <Link href="/admin/spare-parts" className="admin-panel-card text-start">
          <p className="caption-up">۰۳ · پس از فروش</p>
          <h2 className="display-sm mt-3">مدیریت قطعات یدکی</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ops-muted)]">
            ثبت، موجودی و ویرایش قطعات یدکی.
          </p>
          <span className="admin-panel-card__cta">
            ورود به قطعات
            <span aria-hidden>←</span>
          </span>
        </Link>
        <Link href="/admin/spare-part-categories" className="admin-panel-card text-start">
          <p className="caption-up">۰۴ · دسته قطعات</p>
          <h2 className="display-sm mt-3">دسته‌بندی قطعات</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ops-muted)]">
            تعریف دسته‌های جدا برای قطعات یدکی.
          </p>
          <span className="admin-panel-card__cta">
            ورود به دسته‌ها
            <span aria-hidden>←</span>
          </span>
        </Link>
      </section>
    </AdminShell>
  );
}
