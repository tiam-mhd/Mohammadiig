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
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminShell eyebrow="پنل مدیریت" title="نمای کلی عملیات">
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-10">
        <div className="admin-stat text-start">
          <p className="caption-up">محصولات</p>
          <p className="mt-4 font-ui text-3xl text-ink">
            {isLoading ? '—' : productCount.toLocaleString('fa-IR')}
          </p>
          <p className="mt-2 font-ui text-sm text-muted">محصول فعال در کاتالوگ</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">دسته‌بندی</p>
          <p className="mt-4 font-ui text-3xl text-ink">
            {isLoading ? '—' : categoryCount.toLocaleString('fa-IR')}
          </p>
          <p className="mt-2 font-ui text-sm text-muted">دستهٔ محصول</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">مشتریان</p>
          <p className="mt-4 font-ui text-3xl text-ink">—</p>
          <p className="mt-2 font-ui text-sm text-muted">از بخش مشتریان</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">سیستم</p>
          <p className="mt-4 font-ui text-3xl text-ink">OK</p>
          <p className="mt-2 font-ui text-sm text-muted">API و دیتابیس فعال</p>
        </div>
      </div>

      <section className="mt-12 grid gap-0 border-t border-hairline lg:grid-cols-2">
        <Link
          href="/admin/products"
          className="border-b border-hairline py-8 text-start transition-opacity hover:opacity-80 lg:border-e lg:pe-10"
        >
          <p className="caption-up">۰۱ · کاتالوگ</p>
          <h2 className="display-sm mt-6 text-ink">مدیریت محصولات</h2>
          <p className="body-lead mt-3 text-sm">ایجاد، بررسی و حذف محصولات کاتالوگ.</p>
          <span className="caption-up mt-8 inline-block text-white/55">ورود به مدیریت ←</span>
        </Link>
        <Link
          href="/admin/customers"
          className="border-b border-hairline py-8 text-start transition-opacity hover:opacity-80 lg:ps-10"
        >
          <p className="caption-up">۰۲ · مشتریان</p>
          <h2 className="display-sm mt-6 text-ink">فهرست مشتریان</h2>
          <p className="body-lead mt-3 text-sm">حساب‌های سازمانی و وضعیت تأیید.</p>
          <span className="caption-up mt-8 inline-block text-white/55">مشاهده مشتریان ←</span>
        </Link>
      </section>
    </AdminShell>
  );
}
