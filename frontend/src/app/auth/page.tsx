'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components';
import { login, register } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { accessToken, user, setSession, clearSession } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }
    router.replace('/account');
  }, [accessToken, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = mode === 'login' ? await login(form.email, form.password) : await register(form);

      if (response.user.role === 'admin') {
        clearSession();
        setError('حساب مدیریت از این صفحه وارد نمی‌شود. لطفاً از ورود ادمین استفاده کنید.');
        return;
      }

      setSession(response.accessToken, response.user);
      router.replace('/account');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-canvas min-h-svh">
      <div className="content-shell section-copy grid min-h-svh items-center py-16 md:py-20 lg:grid-cols-[1fr_0.95fr] lg:gap-16 xl:gap-24">
        <section className="hidden text-start lg:block">
          <p className="caption-up">حساب کاربری</p>
          <h1 className="display-feature mt-5 max-w-md text-ink">ورود به پنل مشتریان</h1>
          <p className="body-lead mt-6 max-w-md">
            درخواست قیمت و دسترسی به حساب سازمانی از اینجا انجام می‌شود.
          </p>
          <p className="caption-up mt-14 border-t border-hairline pt-6 text-white/45">
            MIG · گروه صنعتی محمدی
          </p>
        </section>

        <section className="mx-auto w-full max-w-md text-start lg:mx-0 lg:max-w-lg">
          <Link
            href="/"
            className="caption-up text-white/70 transition-opacity hover:opacity-100 lg:hidden"
          >
            ← بازگشت به سایت
          </Link>

          <div className="auth-mode mt-8 lg:mt-0" role="tablist" aria-label="ورود یا ثبت‌نام">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => setMode('login')}
              className={`auth-mode__btn ${mode === 'login' ? 'is-active' : ''}`}
            >
              ورود
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => setMode('register')}
              className={`auth-mode__btn ${mode === 'register' ? 'is-active' : ''}`}
            >
              ثبت‌نام
            </button>
          </div>

          <div className="mt-10">
            <p className="caption-up lg:hidden">حساب کاربری</p>
            <h2 className="display-sm mt-3 text-ink sm:mt-4">
              {mode === 'login' ? 'ورود به حساب' : 'ایجاد حساب سازمانی'}
            </h2>
            <p className="body-lead mt-3 text-sm">
              {mode === 'login'
                ? 'ایمیل و رمز عبور خود را وارد کنید.'
                : 'اطلاعات شرکت را برای همکاری با MIG ثبت کنید.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {mode === 'register' ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="caption-up">نام</span>
                  <input
                    required
                    minLength={2}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                    className="field-input mt-2"
                  />
                </label>
                <label className="block">
                  <span className="caption-up">نام خانوادگی</span>
                  <input
                    required
                    minLength={2}
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                    className="field-input mt-2"
                  />
                </label>
              </div>
            ) : null}

            {mode === 'register' ? (
              <label className="block">
                <span className="caption-up">نام شرکت</span>
                <input
                  required
                  autoComplete="organization"
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                  className="field-input mt-2"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="caption-up">ایمیل</span>
              <input
                required
                type="email"
                autoComplete="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="field-input mt-2 text-start"
              />
            </label>

            {mode === 'register' ? (
              <label className="block">
                <span className="caption-up">تلفن</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="field-input mt-2 text-start"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="caption-up">رمز عبور</span>
              <input
                required
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                dir="ltr"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="field-input mt-2 text-start"
              />
            </label>

            {error ? (
              <div className="space-y-3">
                <p className="field-message field-message--error">{error}</p>
                {error.includes('مدیریت') ? (
                  <Link href="/admin/login" className="caption-up inline-block text-[#c3d9f3]">
                    رفتن به ورود ادمین ←
                  </Link>
                ) : null}
              </div>
            ) : null}

            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto">
              {mode === 'login' ? 'ورود به حساب' : 'ثبت‌نام و ادامه'}
            </Button>
          </form>

          <p className="mt-10 hidden lg:block">
            <Link href="/" className="caption-up text-white/70 transition-opacity hover:opacity-100">
              ← بازگشت به سایت
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
