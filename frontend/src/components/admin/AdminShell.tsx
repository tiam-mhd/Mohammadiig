'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

const navigation = [
  { href: '/admin', label: 'نمای کلی', icon: '▦' },
  { href: '/admin/products', label: 'محصولات', icon: '◈' },
  { href: '/admin/customers', label: 'مشتریان', icon: '◎' },
  { href: '/admin/quotations', label: 'پیش‌فاکتورها', icon: '◇' },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: '▤' },
  { href: '/admin/projects', label: 'پروژه‌ها', icon: '◆' },
  { href: '/admin/invoices', label: 'فاکتورها', icon: '▧' },
  { href: '/admin/payments', label: 'پرداخت‌ها', icon: '₽' },
  { href: '/admin/services', label: 'خدمات', icon: '＋' },
  { href: '/admin/attachments', label: 'فایل‌ها', icon: '▧' },
  { href: '/admin/users', label: 'کاربران', icon: '◎' },
];

export function AdminShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, user, clearSession } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main className="flex min-h-screen items-center justify-center bg-[#111210] text-white"><div className="text-center"><span className="eyebrow">MIG / CONTROL ROOM</span><h1 className="mt-4 text-2xl font-black">در حال آماده‌سازی پنل...</h1></div></main>;
  }
  if (!accessToken || !['admin', 'salesman'].includes(user?.role ?? '')) return <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-center"><div><span className="eyebrow">MIG CONTROL ROOM</span><h1 className="mt-5 text-4xl font-black text-white">دسترسی محدود است</h1><p className="mt-4 text-neutral-400">برای ورود به پنل مدیریت با حساب مجاز وارد شوید.</p><Link href="/auth" className="mt-8 inline-block bg-primary-500 px-7 py-4 font-bold text-neutral-950">ورود به حساب</Link></div></main>;

  function logout() { clearSession(); router.push('/auth'); }

  return <div className="min-h-screen bg-[#f0eee8] text-neutral-900 dark:bg-[#111210] dark:text-white lg:flex" dir="rtl"><aside className="hidden w-72 shrink-0 border-l border-neutral-200 bg-[#191a18] text-white lg:flex lg:flex-col dark:border-white/10"><div className="border-b border-white/10 px-7 py-7"><Link href="/" className="text-xl font-black tracking-[0.24em] text-primary-500">MIG<span className="mr-2 text-[9px] font-normal tracking-[0.16em] text-neutral-500">CONTROL ROOM</span></Link></div><nav className="flex-1 space-y-1 p-4">{navigation.map((item) => <Link key={item.href} href={item.href} className={`flex items-center gap-4 px-4 py-3 text-sm transition ${pathname === item.href ? 'bg-primary-500 font-bold text-neutral-950' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}><span className="text-lg">{item.icon}</span>{item.label}</Link>)}</nav><div className="border-t border-white/10 p-5"><div className="mb-4 text-xs text-neutral-400"><strong className="block text-white">{user?.companyName ?? user?.email}</strong><span className="mt-1 block uppercase tracking-wider">{user?.role}</span></div><button type="button" onClick={logout} className="w-full border border-white/15 px-4 py-3 text-xs font-bold text-neutral-300 transition hover:border-primary-500 hover:text-primary-500">خروج از پنل</button></div></aside><main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-neutral-200 bg-[#f0eee8]/90 px-5 py-5 backdrop-blur lg:px-10 dark:border-white/10 dark:bg-[#111210]/90"><div><span className="eyebrow">{eyebrow}</span><h1 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h1></div><Link href="/" className="text-xs font-bold text-primary-600 dark:text-primary-500">مشاهده سایت ↗</Link></header><div className="border-b border-neutral-200 bg-[#191a18] px-5 py-3 lg:hidden dark:border-white/10"><div className="flex gap-2 overflow-x-auto">{navigation.map((item) => <Link key={item.href} href={item.href} className={`shrink-0 px-3 py-2 text-xs ${pathname === item.href ? 'bg-primary-500 text-neutral-950' : 'text-neutral-400'}`}>{item.label}</Link>)}</div></div><div className="p-5 sm:p-8 lg:p-10">{children}</div></main></div>;
}
