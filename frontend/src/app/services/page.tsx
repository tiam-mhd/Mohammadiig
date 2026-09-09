'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchServices, ServiceSummary } from '@/lib/api-client';

const fallbackServices: ServiceSummary[] = [
  {
    id: 'installation',
    nameFa: 'نصب و راه‌اندازی',
    description: 'نصب تخصصی دستگاه و آماده‌سازی سالن برای بهره‌برداری.',
    serviceCategory: 'نصب',
    basePrice: null,
    unitType: 'ثابت',
  },
  {
    id: 'training',
    nameFa: 'آموزش اپراتور',
    description: 'آموزش تیم شما برای استفاده ایمن و درست از دستگاه‌ها.',
    serviceCategory: 'آموزش',
    basePrice: null,
    unitType: 'روزانه',
  },
  {
    id: 'support',
    nameFa: 'پشتیبانی و نگهداری',
    description: 'پشتیبانی فنی و تأمین قطعه تا دستگاه‌ها خواب نمانند.',
    serviceCategory: 'پشتیبانی',
    basePrice: null,
    unitType: 'بازدید',
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(fallbackServices);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(() => undefined);
  }, []);

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به صفحه اول
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">خدمات</p>
          <h1 className="display-feature mt-4 text-ink">از ساخت تا بهره‌برداری</h1>
          <p className="body-lead mt-5 max-w-md">
            نصب، آموزش و پشتیبانی — تا پروژه شما بدون وقفه راه بیفتد و کار کند.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-hairline pt-12 md:mt-16 md:grid-cols-3 md:gap-12 md:pt-16">
          {services.map((service, index) => (
            <article key={service.id} className="text-start">
              <p className="caption-up text-white/50">
                {(index + 1).toLocaleString('fa-IR').padStart(2, '۰')}
              </p>
              <h2 className="display-sm mt-5 text-ink">{service.nameFa}</h2>
              <p className="body-lead mt-4 text-sm">{service.description}</p>
              <p className="caption-up mt-8 border-t border-hairline pt-4">
                {service.serviceCategory} · {service.unitType}
                {service.basePrice != null && service.basePrice > 0
                  ? ` · از ${service.basePrice.toLocaleString('fa-IR')} ریال`
                  : ''}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-14 md:mt-16">
          <Link href="/quote-request" className="btn-pill inline-flex">
            درخواست خدمات پروژه
          </Link>
        </div>
      </div>
    </div>
  );
}
