import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components';
import { ProductShowcase } from '@/components/ProductShowcase';

export const metadata: Metadata = {
  title: 'MIG | مهندسی تجربه، ساخت آینده',
  description: 'MIG؛ طراح و سازنده تجهیزات تفریحی و راهکارهای سرگرمی برای پروژه های متمایز.',
};

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[680px] bg-neutral-900 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,17,16,.98)_15%,rgba(16,17,16,.72)_52%,rgba(16,17,16,.28)),url('https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=2200&q=90')] bg-cover bg-center" />
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="relative mx-auto flex min-h-[680px] max-w-[1400px] items-end px-5 pb-20 sm:px-8 lg:pb-28">
          <div className="max-w-3xl text-right">
            <div className="mb-8 flex items-center gap-4"><span className="h-px w-12 bg-primary-500" /><span className="eyebrow">MIG / MANUFACTURING · OPERATIONS · INVESTMENT</span></div>
            <h1 className="max-w-full text-[clamp(2.8rem,9vw,5.8rem)] font-black leading-[1.12] tracking-tight">تجربه را<br /><span className="text-primary-500">مهندسی می کنیم.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-neutral-300 sm:text-lg">از نخستین ایده تا لحظه بهره برداری؛ MIG فضاهای سرگرمی را با مهندسی دقیق، طراحی متمایز و اجرای یکپارچه خلق می کند.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4"><Link href="#products"><Button size="lg" className="rounded-none bg-primary-500 px-7 text-neutral-900 hover:bg-primary-400">کشف محصولات <span>←</span></Button></Link><Link href="/quote-request" className="border-b border-white/50 pb-2 text-sm font-bold text-white transition-colors hover:border-primary-500 hover:text-primary-500">درخواست پیش‌فاکتور <span className="mr-2">↙</span></Link></div>
          </div>
          <div className="absolute bottom-8 left-5 hidden border-r border-primary-500/60 pr-4 text-left text-[10px] uppercase tracking-[0.2em] text-neutral-400 lg:block">EST. 1998<br /><span className="text-primary-500">TEHRAN / IRAN</span></div>
        </div>
      </section>

      <section id="story" className="border-b border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-neutral-900"><div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-neutral-200 dark:divide-white/10 sm:grid-cols-4 sm:divide-x">{[['۱۵+', 'سال تجربه'], ['۳', 'محور تخصصی'], ['۲', 'پروژه شاخص'], ['۱۰۰٪', 'تعهد MIG']].map(([value, label]) => <div key={label} className="px-5 py-8 sm:px-8 sm:py-10"><strong className="block text-3xl font-black text-primary-500 sm:text-4xl">{value}</strong><span className="mt-2 block text-xs font-bold text-neutral-500">{label}</span></div>)}</div></section>
  <section id="products" className="bg-neutral-50 py-24 dark:bg-neutral-900 sm:py-32"><div className="mx-auto max-w-[1400px] px-5 sm:px-8"><div className="mb-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="eyebrow">01 / SELECTED SYSTEMS</span><h2 className="mt-4 text-4xl font-black text-neutral-900 dark:text-white sm:text-5xl">محصولات منتخب</h2></div><p className="max-w-sm text-sm leading-7 text-neutral-500">راهکارهایی برای ساخت تجربه ای که مخاطب، برند شما و کسب وکار شما به یاد می سپارند.</p></div><ProductShowcase /></div></section>
  <section className="relative border-t border-white/10 bg-neutral-900 py-24 text-white sm:py-32"><div className="absolute left-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_20%_30%,rgba(185,137,82,.18),transparent_55%)]" /><div className="relative mx-auto flex max-w-[1400px] flex-col justify-between gap-12 px-5 sm:px-8 lg:flex-row lg:items-end"><div><span className="eyebrow">02 / THE MIG METHOD</span><h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">هر پروژه،<br /><span className="text-primary-500">یک امضای تازه.</span></h2></div><div className="max-w-md"><p className="text-base leading-8 text-neutral-300">ما فقط محصول نمی سازیم. از تولید تجهیزات تا بهره برداری مجموعه های تفریحی و سرمایه گذاری در ایده های آینده، کنار شما می ایستیم.</p><Link href="/about" className="mt-8 inline-block border-b border-primary-500 pb-2 text-sm font-bold text-primary-500">بیشتر درباره MIG <span className="mr-2">←</span></Link></div></div></section>
      <section className="bg-primary-500 px-5 py-16 text-neutral-900 sm:px-8 sm:py-20"><div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 sm:flex-row sm:items-center"><div><span className="text-xs font-black uppercase tracking-[0.18em]">LET&apos;S BUILD WHAT&apos;S NEXT</span><h2 className="mt-3 text-3xl font-black sm:text-5xl">پروژه بعدی شما از اینجا شروع می شود.</h2></div><Link href="/quote-request"><Button size="lg" className="w-fit rounded-none bg-neutral-900 px-8 text-white hover:bg-neutral-800">شروع درخواست <span>←</span></Button></Link></div></section>
    </main>
  );
}
