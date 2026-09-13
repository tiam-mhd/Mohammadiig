'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/admin/AdminIcons';
import { login } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminLoginPage() {
  const router = useRouter();
  const { accessToken, user, setSession, clearSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (accessToken && user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [mounted, accessToken, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await login(email, password);
      if (response.user.role !== 'admin') {
        clearSession();
        setError('این حساب دسترسی مدیریت ندارد. برای ورود مشتریان از پنل مشتریان استفاده کنید.');
        return;
      }
      setSession(response.accessToken, response.user);
      router.replace('/admin');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'ورود انجام نشد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ops-login" dir="rtl">
      <aside className="ops-login__brand">
        <div className="ops-login__brand-inner">
          <span className="ops-login__kicker">
            <span className="ops-login__kicker-dot" aria-hidden />
            پنل مدیریت MIG
          </span>
          <h1 className="ops-login__headline">ورود مدیران سیستم</h1>
          <p className="ops-login__copy">
            از اینجا کاتالوگ، مشتریان، سفارش‌ها و امور مالی را مدیریت کنید. این صفحه مخصوص مدیران است.
          </p>
        </div>
        <p className="ops-login__meta">گروه صنعتی محمدی</p>
      </aside>

      <section className="ops-login__panel">
        <div className="ops-login__card text-start">
          <div className="mb-8 lg:hidden">
            <span className="ops-login__kicker">
              <span className="ops-login__kicker-dot" aria-hidden />
              پنل مدیریت
            </span>
          </div>

          <div className="ops-login__intro">
            <p className="caption-up">ورود مدیریت</p>
            <h2 className="display-sm">احراز هویت مدیر</h2>
          </div>

          <form onSubmit={handleSubmit} className="ops-login__form">
            <div className="ops-login__field-wrap">
              <label htmlFor="admin-email" className="ops-login__label">
                ایمیل مدیر
              </label>
              <input
                id="admin-email"
                required
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ops-field text-start"
                placeholder="نام کاربری مدیریت"
              />
            </div>

            <div className="ops-login__field-wrap">
              <label htmlFor="admin-password" className="ops-login__label">
                رمز عبور
              </label>
              <div className="ops-password-field">
                <input
                  id="admin-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ops-field text-start"
                />
                <button
                  type="button"
                  className="ops-password-field__toggle"
                  aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="field-message field-message--error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="ops-btn ops-login__submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  در حال ورود…
                </>
              ) : (
                'ورود به پنل مدیریت'
              )}
            </button>
          </form>

          <div className="ops-login__footer">
            <Link href="/auth">پنل مشتریان ←</Link>
            <Link href="/">بازگشت به سایت</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
