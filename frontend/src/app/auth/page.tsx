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
  const { accessToken, user, setSession } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', companyName: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken || !user) return;
    const target = ['admin', 'salesman'].includes(user.role) ? '/admin' : '/account';
    router.replace(target);
  }, [accessToken, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = mode === 'login' ? await login(form.email, form.password) : await register(form);
      setSession(response.accessToken, response.user);
      const nextRoute = ['admin', 'salesman'].includes(response.user.role) ? '/admin' : '/account';
      router.replace(nextRoute);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe9] text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,11,11,0.96),rgba(15,20,18,0.68)),url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" />
          <div className="relative z-10 flex items-center justify-between p-10">
            <div className="text-3xl font-black tracking-[0.28em] text-primary-500">MIG</div>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-neutral-200">B2B PORTAL</span>
          </div>

          <div className="relative z-10 px-10 pb-12">
            <span className="eyebrow">MIG / INDUSTRIAL GROUP</span>
            <h1 className="mt-5 max-w-md text-5xl font-black leading-tight text-white">
              ساختن آینده
              <span className="mt-3 block text-primary-500">با هم.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-neutral-300">
              برای دریافت پیشنهاد اختصاصی پیگیری پروه و دسترسی به امکانات مدیریتی MIG داخل حساب خود وارد شوید.
            </p>
          </div>

          <div className="relative z-10 border-t border-white/10 px-10 py-6 text-xs tracking-[0.2em] text-neutral-400">
            MANUFACTURING · OPERATIONS · INVESTMENT
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 transition hover:text-primary-500 dark:text-primary-400">
                <span aria-hidden="true">←</span>
                بازگشت به سایت
              </Link>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-[#171a18]/80 sm:p-8">
              <div className="mb-7 flex gap-2 rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-white/10 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-neutral-900 text-white shadow-sm dark:bg-primary-500 dark:text-neutral-950' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'}`}
                >
                  ورود
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${mode === 'register' ? 'bg-neutral-900 text-white shadow-sm dark:bg-primary-500 dark:text-neutral-950' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'}`}
                >
                  ثبتنام
                </button>
              </div>

              <div className="mb-6">
                <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN MIG NETWORK'}</span>
                <h2 className="mt-3 text-3xl font-black text-neutral-900 dark:text-white sm:text-4xl">
                  {mode === 'login' ? 'ورود به حساب' : 'ایجاد حساب سازمانی'}
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
                  {mode === 'login' ? 'برای ادامه اطلاعات حساب خود را وارد کنید.' : 'حساب خود را برای همکاری حرفهای با MIG بسازید.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      required
                      minLength={2}
                      placeholder="نام"
                      value={form.firstName}
                      onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                      className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                    />
                    <input
                      required
                      minLength={2}
                      placeholder="نام خانوادگی"
                      value={form.lastName}
                      onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                      className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                    />
                  </div>
                )}

                {mode === 'register' && (
                  <input
                    required
                    placeholder="نام شرکت"
                    value={form.companyName}
                    onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                    className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                  />
                )}

                <input
                  required
                  type="email"
                  placeholder="ایمیل"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                />

                {mode === 'register' && (
                  <input
                    placeholder="تلفن"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                  />
                )}

                <input
                  required
                  type="password"
                  placeholder="رمز عبور"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-white/15 dark:text-white"
                />

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary-500 via-primary-600 to-amber-400 px-4 py-3 text-base font-black text-neutral-950 shadow-lg shadow-primary-500/25 transition hover:scale-[1.01]"
                >
                  {mode === 'login' ? 'ورود به حساب' : 'ثبتنام و ادامه'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
