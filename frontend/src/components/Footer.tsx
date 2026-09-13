/**
 * Footer — luxury close for MIG promotional site
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { GlassButton } from '@/components/GlassButton';

const explore = [
  { href: '/products', label: 'محصولات' },
  { href: '/portfolio', label: 'نمونه‌کارها' },
  { href: '/projects', label: 'بهره‌برداری' },
  { href: '/services', label: 'خدمات' },
  { href: '/spare-parts', label: 'قطعات یدکی' },
];

const company = [
  { href: '/quote-request', label: 'درخواست قیمت' },
  { href: '/auth', label: 'پنل مشتریان' },
  { href: '/quote-request', label: 'مشاوره همکاری' },
];

const legal = [
  { href: '/privacy', label: 'حریم خصوصی' },
  { href: '/terms', label: 'شرایط استفاده' },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__glow" aria-hidden />

      <div className="site-footer__intro">
        <div className="site-footer__shell site-footer__intro-inner">
          <div className="site-footer__intro-copy">
            <p className="site-footer__eyebrow" lang="en">
              Mohammadi Industrial Group
            </p>
            <p className="site-footer__tagline">
              تجهیزات شهربازی، نصب و پشتیبانی — کنار مجموعه شما.
            </p>
          </div>
          <GlassButton href="/quote-request" className="site-footer__cta">
            درخواست مشاوره
          </GlassButton>
        </div>
      </div>

      <div className="site-footer__shell site-footer__body">
        <div className="site-footer__grid">
          <div className="site-footer__brand-col">
            <div className="site-footer__brand-row">
              <img
                src="/Logo-Gold.webp"
                alt=""
                className="site-footer__logo"
                width={56}
                height={56}
              />
              <p className="site-footer__mark" lang="en">
                MIG
              </p>
            </div>
            <p className="site-footer__brand-text">
              تولید و تأمین دستگاه‌های تفریحی برای صاحبان شهربازی و مجموعه‌های سرگرمی.
            </p>
          </div>

          <nav className="site-footer__nav-col" aria-label="کاوش">
            <p className="site-footer__heading">کاوش</p>
            <ul className="site-footer__list">
              {explore.map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className="site-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__nav-col" aria-label="همکاری">
            <p className="site-footer__heading">همکاری</p>
            <ul className="site-footer__list">
              {company.map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className="site-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer__nav-col">
            <p className="site-footer__heading">تماس</p>
            <ul className="site-footer__list site-footer__contact">
              <li>
                <a
                  href="mailto:info@mohammadiig.ir"
                  className="site-footer__link site-footer__link--en"
                  lang="en"
                >
                  info@mohammadiig.ir
                </a>
              </li>
              <li>
                <span className="site-footer__meta">تهران، ایران</span>
              </li>
              <li>
                <Link href="/quote-request" className="site-footer__link">
                  فرم ارتباط
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__shell site-footer__bottom-inner">
          <p className="site-footer__copy">
            © {year} گروه صنعتی محمدی. تمام حقوق محفوظ است.
          </p>
          <ul className="site-footer__legal">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-footer__legal-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};
