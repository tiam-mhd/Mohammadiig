/**
 * Footer Component
 * App footer with links and copyright
 */

'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">درباره MIG</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              گروه صنعتی محمدی - تولید کننده تجهیزات تفریحی و تخصصی با تجربه بیش از سال.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">محصولات</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products/bumper-cars" className="text-neutral-400 hover:text-white transition-colors">
                  ماشین های تعطیل
                </Link>
              </li>
              <li>
                <Link href="/spare-parts" className="text-neutral-400 hover:text-white transition-colors">
                  قطعات یدکی
                </Link>
              </li>
              <li>
                <Link href="/products/services" className="text-neutral-400 hover:text-white transition-colors">
                  خدمات
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">شرکت</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-neutral-400 hover:text-white transition-colors">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-neutral-400 hover:text-white transition-colors">
                  پروژه ها
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-white transition-colors">
                  تماس
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">تماس</h3>
            <div className="space-y-2 text-sm text-neutral-400">
              <p>📧 info@mohammadiig.ir</p>
              <p>📱 +98 (0) 123 456 7890</p>
              <p>📍 تهران، ایران</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-400 text-sm">
              © {currentYear} گروه صنعتی محمدی. تمام حقوق محفوظ است.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors">
                حریم خصوصی
              </Link>
              <Link href="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors">
                شرایط استفاده
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
