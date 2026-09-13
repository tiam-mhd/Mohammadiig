'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { fetchCategories, fetchProducts } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([products, categories]) => {
        setProductCount(products.meta.total);
        setCategoryCount(categories.length);
      })
      .catch(() => {
        setProductCount(0);
        setCategoryCount(0);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminShell eyebrow="داشبورد" title="نمای کلی">
      <div className="admin-stat-grid">
        <div className="admin-stat text-start">
          <p className="caption-up">محصولات</p>
          <p className="admin-stat__value">
            {isLoading ? '—' : productCount.toLocaleString('fa-IR')}
          </p>
          <p className="admin-stat__hint">محصول فعال در کاتالوگ</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">دسته‌بندی</p>
          <p className="admin-stat__value">
            {isLoading ? '—' : categoryCount.toLocaleString('fa-IR')}
          </p>
          <p className="admin-stat__hint">دستهٔ محصول</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">مشتریان</p>
          <p className="admin-stat__value">—</p>
          <p className="admin-stat__hint">از بخش مشتریان</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">وضعیت سامانه</p>
          <p className="admin-stat__value" style={{ color: 'var(--ops-ok)' }}>
            آماده
          </p>
          <p className="admin-stat__hint">ارتباط با سرور برقرار است</p>
        </div>
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
