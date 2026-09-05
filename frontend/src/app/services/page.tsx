'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import { fetchServices, ServiceSummary } from '@/lib/api-client';

const fallbackServices: ServiceSummary[] = [
  { id: 'installation', nameFa: 'نصب و راه‌اندازی', description: 'نصب تخصصی تجهیزات و آماده‌سازی مجموعه برای بهره‌برداری.', serviceCategory: 'installation', basePrice: 0, unitType: 'fixed' },
  { id: 'training', nameFa: 'آموزش اپراتور', description: 'آموزش تیم بهره‌برداری برای استفاده ایمن و حرفه‌ای.', serviceCategory: 'training', basePrice: 0, unitType: 'per_day' },
  { id: 'support', nameFa: 'پشتیبانی MIG Care', description: 'پشتیبانی فنی و تامین قطعات برای عملکرد پایدار پروژه.', serviceCategory: 'support', basePrice: 0, unitType: 'per_visit' },
];

export default function ServicesPage() {
  const [services, setServices] = useState(fallbackServices);
  useEffect(() => { fetchServices().then(setServices).catch(() => undefined); }, []);
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1200px]"><Link href="/" className="text-xs font-bold text-primary-500">← بازگشت به سایت</Link><div className="mt-14 max-w-2xl"><span className="eyebrow">MIG / FULL-SERVICE DELIVERY</span><h1 className="mt-4 text-5xl font-black text-neutral-900 dark:text-white sm:text-7xl">از ساخت تا<br /><span className="text-primary-500">بهره‌برداری.</span></h1><p className="mt-6 leading-8 text-neutral-500">یک تیم، یک مسئولیت یکپارچه؛ خدمات MIG برای اینکه پروژه شما با اطمینان از ایده به اجرا برسد.</p></div><div className="mt-16 grid gap-5 md:grid-cols-3">{services.map((service, index) => <article key={service.id} className="border border-neutral-200 bg-white p-7 dark:border-white/10 dark:bg-[#1b1d1b]"><span className="text-4xl font-black text-primary-500">0{index + 1}</span><h2 className="mt-12 text-2xl font-black dark:text-white">{service.nameFa}</h2><p className="mt-4 min-h-20 text-sm leading-7 text-neutral-500">{service.description}</p><div className="mt-8 border-t border-neutral-200 pt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:border-white/10">{service.serviceCategory} / {service.unitType}</div></article>)}</div><Link href="/quote-request"><Button size="lg" className="mt-12 rounded-none bg-primary-500 text-neutral-900">درخواست خدمات پروژه</Button></Link></div></main>;
}
