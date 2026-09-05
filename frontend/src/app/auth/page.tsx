'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components';
import { login, register } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', companyName: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = mode === 'login' ? await login(form.email, form.password) : await register(form);
      setSession(response.accessToken, response.user);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'خطایی رخ داد.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="grid min-h-screen bg-neutral-50 dark:bg-neutral-900 lg:grid-cols-2"><section className="relative hidden overflow-hidden bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,17,16,.98),rgba(16,17,16,.55)),url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" /><div className="relative text-primary-500 text-2xl font-black tracking-[0.25em]">MIG</div><div className="relative"><span className="eyebrow">MIG / B2B PORTAL</span><h1 className="mt-5 text-5xl font-black leading-tight">ساختن آینده<br /><span className="text-primary-500">با هم.</span></h1><p className="mt-5 max-w-sm leading-8 text-neutral-300">برای دریافت پیشنهاد اختصاصی، پیگیری پروژه و دسترسی به خدمات MIG وارد شوید.</p></div><span className="relative text-xs text-neutral-500">MANUFACTURING · OPERATIONS · INVESTMENT</span></section><section className="flex items-center justify-center px-5 py-16 sm:px-10"><div className="w-full max-w-md"><Link href="/" className="text-xs font-bold text-primary-500">← بازگشت به سایت</Link><div className="mt-12"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN MIG NETWORK'}</span><h2 className="mt-4 text-4xl font-black text-neutral-900 dark:text-white">{mode === 'login' ? 'ورود به حساب' : 'ایجاد حساب سازمانی'}</h2><p className="mt-3 text-sm leading-7 text-neutral-500">{mode === 'login' ? 'برای ادامه اطلاعات حساب خود را وارد کنید.' : 'حساب خود را برای همکاری حرفه‌ای با MIG بسازید.'}</p></div><form onSubmit={handleSubmit} className="mt-10 space-y-4">{mode === 'register' && <div className="grid grid-cols-2 gap-3"><input required minLength={2} placeholder="نام" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" /><input required minLength={2} placeholder="نام خانوادگی" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" /></div>}{mode === 'register' && <input required minLength={2} placeholder="نام شرکت" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" />}<input required type="email" placeholder="ایمیل سازمانی" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" /><input required minLength={8} type="password" placeholder="رمز عبور" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary-500 dark:border-white/20 dark:text-white" />{error && <p className="border-r-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Button type="submit" isLoading={isSubmitting} size="lg" className="w-full rounded-none bg-primary-500 text-neutral-900">{mode === 'login' ? 'ورود به حساب' : 'ثبت حساب'}</Button></form><button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="mt-6 w-full text-center text-sm font-bold text-neutral-500 hover:text-primary-500">{mode === 'login' ? 'حساب ندارید؟ ثبت‌نام کنید' : 'قبلاً حساب ساخته‌اید؟ وارد شوید'}</button></div></section></main>;
}
