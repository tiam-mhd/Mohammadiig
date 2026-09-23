'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchServices, ServiceSummary } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';

const fallbackServices: ServiceSummary[] = [
  {
    id: 'installation',
    nameFa: 'نصب و راه‌اندازی',
    description: 'نصب تخصصی دستگاه و آماده‌سازی سالن برای بهره‌برداری.',
    serviceCategory: 'نصب',
    basePrice: null,
    priceNegotiable: false,
    unitType: 'ثابت',
  },
  {
    id: 'training',
    nameFa: 'آموزش اپراتور',
    description: 'آموزش تیم شما برای استفاده ایمن و درست از دستگاه‌ها.',
    serviceCategory: 'آموزش',
    basePrice: null,
    priceNegotiable: false,
    unitType: 'روزانه',
  },
  {
    id: 'support',
    nameFa: 'پشتیبانی و نگهداری',
    description: 'پشتیبانی فنی و تأمین قطعه تا دستگاه‌ها خواب نمانند.',
    serviceCategory: 'پشتیبانی',
    basePrice: null,
    priceNegotiable: false,
    unitType: 'بازدید',
  },
];

function priceLabel(service: ServiceSummary) {
  if (service.priceNegotiable) return 'قیمت توافقی';
  if (service.basePrice != null && service.basePrice > 0) {
    return `از ${service.basePrice.toLocaleString('fa-IR')} ریال`;
  }
  return '';
}

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
        <Link href="/" className="caption-up text-ink/70 transition-opacity hover:opacity-100">
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
          {services.map((service, index) => {
            const coverSrc = resolveMediaUrl(service.coverImageUrl);
            const gallery = (service.gallery ?? []).map((url) => resolveMediaUrl(url)).filter(Boolean);
            const price = priceLabel(service);
            return (
              <article key={service.id} className="text-start">
                <p className="caption-up text-ink/50">
                  {(index + 1).toLocaleString('fa-IR').padStart(2, '۰')}
                </p>
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverSrc}
                    alt=""
                    className="mt-5 aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <h2 className="display-sm mt-5 text-ink">{service.nameFa}</h2>
                <p className="body-lead mt-4 text-sm">{service.description}</p>
                {gallery.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {gallery.slice(0, 3).map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    ))}
                  </div>
                ) : null}
                <p className="caption-up mt-8 border-t border-hairline pt-4">
                  {service.serviceCategory} · {service.unitType}
                  {price ? ` · ${price}` : ''}
                </p>
              </article>
            );
          })}
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
