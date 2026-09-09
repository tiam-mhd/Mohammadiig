/**
 * Footer — بسته شدن آرام و شکیل صفحه
 */

'use client';

import React from 'react';
import Link from 'next/link';

const explore = [
  { href: '/products', label: 'محصولات' },
  { href: '/projects', label: 'پروژه‌ها' },
  { href: '/services', label: 'خدمات' },
  { href: '/spare-parts', label: 'قطعات یدکی' },
];

const company = [
  { href: '/quote-request', label: 'درخواست قیمت' },
  { href: '/auth', label: 'پنل مشتریان' },
  { href: '/quote-request', label: 'مشاوره پروژه' },
];

const legal = [
  { href: '/privacy', label: 'حریم خصوصی' },
  { href: '/terms', label: 'شرایط استفاده' },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      {/* نوار بالایی — معرفی کوتاه + CTA */}
      <div className="site-footer__intro">
        <div className="site-footer__shell site-footer__intro-inner">
          <div className="site-footer__intro-copy">
            <p className="caption-up text-white/55">گروه صنعتی محمدی</p>
            <p className="site-footer__tagline">
              تجهیزات شهربازی، نصب و پشتیبانی — کنار مجموعه شما.
            </p>
          </div>
          <Link href="/quote-request" className="btn-pill site-footer__cta">
            درخواست مشاوره
          </Link>
        </div>
      </div>

      {/* بدنه لینک‌ها */}
      <div className="site-footer__shell site-footer__body">
        <div className="site-footer__grid">
          <div className="site-footer__brand-col">
            <p className="wordmark site-footer__mark" lang="en">
              MIG
            </p>
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

          <nav className="site-footer__nav-col" aria-label="خدمات">
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

      {/* نوار پایینی */}
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
