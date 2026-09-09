'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

const navigation = [
  { href: '/admin', label: 'نمای کلی' },
  { href: '/admin/products', label: 'محصولات' },
  { href: '/admin/customers', label: 'مشتریان' },
  { href: '/admin/quotations', label: 'پیش‌فاکتورها' },
  { href: '/admin/orders', label: 'سفارش‌ها' },
  { href: '/admin/projects', label: 'پروژه‌ها' },
  { href: '/admin/invoices', label: 'فاکتورها' },
  { href: '/admin/payments', label: 'پرداخت‌ها' },
  { href: '/admin/services', label: 'خدمات' },
  { href: '/admin/attachments', label: 'فایل‌ها' },
  { href: '/admin/users', label: 'کاربران' },
];

export function AdminShell({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, user, clearSession } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!mounted) {
    return (
      <div className="admin-shell flex min-h-svh items-center justify-center px-5">
        <div className="text-center">
          <p className="caption-up">پنل مدیریت</p>
          <h1 className="display-sm mt-4 text-ink">در حال آماده‌سازی…</h1>
        </div>
      </div>
    );
  }

  if (!accessToken || user?.role !== 'admin') {
    return (
      <div className="admin-shell flex min-h-svh items-center justify-center px-5 text-center">
        <div className="max-w-md">
          <p className="caption-up">پنل مدیریت</p>
          <h1 className="display-feature mt-4 text-ink">دسترسی محدود است</h1>
          <p className="body-lead mt-4">
            فقط حساب‌های Admin به این پنل دسترسی دارند.
          </p>
          <Link href="/auth" className="btn-pill mt-10 inline-flex">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  function logout() {
    clearSession();
    router.push('/auth');
  }

  return (
    <div className="admin-shell min-h-svh lg:flex" dir="rtl">
      <aside className="admin-sidebar hidden w-64 shrink-0 lg:flex lg:flex-col xl:w-72">
        <div className="border-b border-hairline px-6 py-6">
          <Link href="/admin" className="block">
            <span className="en text-lg tracking-[0.2em] text-ink">MIG</span>
            <span className="mt-1 block font-ui text-[10px] tracking-[0.14em] text-muted">
              پنل مدیریت
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="منوی پنل">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${isActive(item.href) ? 'is-active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-hairline p-5">
          <p className="font-ui text-sm text-ink">{user?.companyName ?? user?.email}</p>
          <p className="caption-up mt-2 text-white/40">{user?.role}</p>
          <button type="button" onClick={logout} className="btn-pill mt-5 w-full text-xs">
            خروج از پنل
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-end justify-between gap-4 border-b border-hairline px-5 py-5 sm:px-8 lg:px-10">
          <div className="text-start">
            <p className="caption-up">{eyebrow}</p>
            <h1 className="display-sm mt-2 text-ink sm:mt-3">{title}</h1>
          </div>
          <Link
            href="/"
            className="caption-up shrink-0 text-white/70 transition-opacity hover:opacity-100"
          >
            مشاهده سایت ←
          </Link>
        </header>

        <div className="border-b border-hairline px-5 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="منوی موبایل پنل">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-chip ${isActive(item.href) ? 'is-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">{children}</div>
      </div>
    </div>
  );
}
