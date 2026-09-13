'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="admin-nav-link__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const navigation: NavSection[] = [
  {
    id: 'overview',
    label: 'اصلی',
    items: [
      {
        href: '/admin',
        label: 'نمای کلی',
        icon: (
          <Icon>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'catalog',
    label: 'کاتالوگ',
    items: [
      {
        href: '/admin/products',
        label: 'محصولات',
        icon: (
          <Icon>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.3 7 12 12l8.7-5" />
            <path d="M12 22V12" />
          </Icon>
        ),
      },
      {
        href: '/admin/categories',
        label: 'دسته‌بندی محصولات',
        icon: (
          <Icon>
            <path d="M4 6h6v6H4z" />
            <path d="M14 6h6v6h-6z" />
            <path d="M4 14h6v6H4z" />
            <path d="M14 17h6" />
            <path d="M17 14v6" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'after-sales',
    label: 'پس از فروش',
    items: [
      {
        href: '/admin/spare-parts',
        label: 'قطعات یدکی',
        icon: (
          <Icon>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.3 7 12 12l8.7-5" />
            <path d="M12 22V12" />
            <path d="M7.5 9.5 12 12l4.5-2.5" />
          </Icon>
        ),
      },
      {
        href: '/admin/spare-part-categories',
        label: 'دسته‌بندی قطعات',
        icon: (
          <Icon>
            <path d="M4 6h6v6H4z" />
            <path d="M14 6h6v6h-6z" />
            <path d="M4 14h6v6H4z" />
            <path d="M14 14h6v6h-6z" />
          </Icon>
        ),
      },
      {
        href: '/admin/services',
        label: 'خدمات',
        icon: (
          <Icon>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'sales',
    label: 'فروش',
    items: [
      {
        href: '/admin/customers',
        label: 'مشتریان',
        icon: (
          <Icon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        ),
      },
      {
        href: '/admin/quotations',
        label: 'پیش‌فاکتورها',
        icon: (
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </Icon>
        ),
      },
      {
        href: '/admin/orders',
        label: 'سفارش‌ها',
        icon: (
          <Icon>
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
            <path d="M2 3h3l2.4 12.3a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L21 8H6" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'showcase',
    label: 'نمایش عمومی',
    items: [
      {
        href: '/admin/portfolio',
        label: 'نمونه‌کارها',
        icon: (
          <Icon>
            <rect x="3" y="3" width="18" height="14" rx="1" />
            <path d="M3 17h18" />
            <path d="M8 21h8" />
          </Icon>
        ),
      },
      {
        href: '/admin/projects',
        label: 'بهره‌برداری‌ها',
        icon: (
          <Icon>
            <path d="M3 7h7l2 3h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'finance',
    label: 'مالی',
    items: [
      {
        href: '/admin/invoices',
        label: 'فاکتورها',
        icon: (
          <Icon>
            <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
          </Icon>
        ),
      },
      {
        href: '/admin/payments',
        label: 'پرداخت‌ها',
        icon: (
          <Icon>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'system',
    label: 'سامانه',
    items: [
      {
        href: '/admin/media',
        label: 'کتابخانه رسانه',
        icon: (
          <Icon>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-5-5L5 21" />
          </Icon>
        ),
      },
      {
        href: '/admin/attachments',
        label: 'فایل‌ها',
        icon: (
          <Icon>
            <path d="M21.4 14.4 14 21.9a4 4 0 0 1-5.7 0L2.1 15.6a4 4 0 0 1 0-5.7l7.5-7.5a4 4 0 0 1 5.7 0l6.1 6.1a3 3 0 0 1 0 4.2z" />
            <path d="m14.5 7.5 2 2" />
          </Icon>
        ),
      },
      {
        href: '/admin/users',
        label: 'کاربران',
        icon: (
          <Icon>
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </Icon>
        ),
      },
    ],
  },
  {
    id: 'backup',
    label: 'پشتیبان‌گیری',
    items: [
      {
        href: '/admin/backup',
        label: 'پشتیبان و بازیابی',
        icon: (
          <Icon>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </Icon>
        ),
      },
    ],
  },
];

const COLLAPSE_KEY = 'mig-admin-sidebar-collapsed';

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
  const [collapsed, setCollapsed] = useState(false);

  const flatItems = useMemo(() => navigation.flatMap((section) => section.items), []);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!accessToken || user?.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [mounted, accessToken, user, router]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!mounted || !accessToken || user?.role !== 'admin') {
    return (
      <div className="ops-gate">
        <div className="ops-gate__card">
          <p className="caption-up">پنل مدیریت</p>
          <h1 className="display-sm mt-3">در حال انتقال…</h1>
        </div>
      </div>
    );
  }

  function logout() {
    clearSession();
    router.push('/admin/login');
  }

  return (
    <div className={`admin-shell min-h-svh lg:flex ${collapsed ? 'is-sidebar-collapsed' : ''}`} dir="rtl">
      <aside className="admin-sidebar hidden shrink-0 lg:flex lg:flex-col" aria-label="منوی کناری">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-row">
            <Link href="/admin" className="admin-sidebar__brand-link" title="پنل مدیریت">
              <span className="admin-sidebar__mark">MIG</span>
              <span className="admin-sidebar__brand-text">
                <span className="admin-sidebar__title">پنل مدیریت</span>
                <span className="admin-sidebar__sub">گروه صنعتی محمدی</span>
              </span>
            </Link>
            <button
              type="button"
              className="admin-sidebar__toggle"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
              title={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {collapsed ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
              </svg>
            </button>
          </div>
        </div>

        <nav className="admin-sidebar__nav" aria-label="منوی پنل مدیریت">
          {navigation.map((section) => (
            <div key={section.id} className="admin-nav-section">
              <p className="admin-nav-section__title">{section.label}</p>
              <div className="admin-nav-section__items">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link ${isActive(item.href) ? 'is-active' : ''}`}
                    title={item.label}
                  >
                    {item.icon}
                    <span className="admin-nav-link__label">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <div className="admin-sidebar__user-block">
            <p className="admin-sidebar__user">{user?.companyName ?? user?.email}</p>
            <p className="admin-sidebar__role">مدیر سیستم</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="ops-btn ops-btn--rail admin-sidebar__logout"
            title="خروج از پنل"
          >
            <svg className="admin-nav-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="admin-nav-link__label">خروج از پنل</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="admin-topbar">
          <div className="admin-topbar__start text-start">
            <button
              type="button"
              className="admin-sidebar__toggle admin-sidebar__toggle--mobile lg:inline-flex"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div>
              <p className="caption-up">{eyebrow}</p>
              <h1 className="display-sm mt-1.5">{title}</h1>
            </div>
          </div>
          <Link href="/" className="admin-topbar__link shrink-0">
            مشاهده سایت
            <span aria-hidden>←</span>
          </Link>
        </header>

        <div className="border-b border-[var(--ops-line)] bg-[rgba(247,249,252,0.7)] px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-0.5" aria-label="منوی موبایل پنل">
            {flatItems.map((item) => (
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

        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
