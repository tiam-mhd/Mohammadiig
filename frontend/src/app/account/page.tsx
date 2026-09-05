'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import { acceptQuotation, convertQuotation, fetchMyInvoices, fetchMyOrders, fetchMyQuotations, InvoiceSummary, OrderSummary, QuotationSummary, submitPayment } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AccountPage() {
  const { accessToken, user } = useAuthStore();
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (accessToken) {
      Promise.all([fetchMyQuotations(accessToken), fetchMyOrders(accessToken), fetchMyInvoices(accessToken)])
        .then(([quotationItems, orderItems, invoiceItems]) => { setQuotations(quotationItems); setOrders(orderItems); setInvoices(invoiceItems); })
        .catch(() => setMessage('دریافت اطلاعات حساب انجام نشد.'));
    }
  }, [accessToken]);

  async function accept(id: string) {
    if (!accessToken) return;
    try { const quotation = await acceptQuotation(accessToken, id); setQuotations(quotations.map((item) => item.id === id ? quotation : item)); setMessage('پیش‌فاکتور پذیرفته شد. اکنون می‌توانید سفارش را ثبت کنید.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.'); }
  }

  async function convert(id: string) {
    if (!accessToken) return;
    try { const order = await convertQuotation(accessToken, id); setMessage(`سفارش ${order.orderNumber} با موفقیت ساخته شد.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.'); }
  }

  async function pay(invoice: InvoiceSummary) {
    if (!accessToken) return;
    try { await submitPayment(accessToken, invoice.id, invoice.totalAfterTax); setInvoices(invoices.map((item) => item.id === invoice.id ? { ...item, paymentStatus: 'pending' } : item)); setMessage('درخواست پرداخت ثبت شد و پس از بررسی تایید می‌شود.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.'); }
  }

  if (!accessToken) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><h1 className="text-4xl font-black dark:text-white">ورود به پنل مشتریان</h1><Link href="/auth" className="mt-8 inline-block bg-primary-500 px-7 py-4 font-bold text-neutral-900">ورود</Link></main>;

  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1100px]"><span className="eyebrow">B2B CUSTOMER PORTAL</span><div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-black text-neutral-900 dark:text-white sm:text-6xl">سلام، {user?.companyName ?? user?.email}</h1><p className="mt-3 text-neutral-500">پیش‌فاکتورها، سفارش‌ها و پرداخت‌های شما</p></div><Link href="/quote-request"><Button className="w-fit rounded-none bg-primary-500 text-neutral-900">درخواست جدید</Button></Link></div>{message && <p className="mt-8 border-r-2 border-primary-500 bg-primary-50 px-4 py-3 text-sm text-neutral-700">{message}</p>}<section className="mt-12"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black dark:text-white">پیش‌فاکتورها</h2><span className="text-xs text-neutral-500">{quotations.length} مورد</span></div><div className="space-y-3">{quotations.map((quotation) => <div key={quotation.id} className="flex flex-col justify-between gap-5 border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-[#1b1d1b] sm:flex-row sm:items-center"><div><span className="eyebrow">{quotation.status}</span><h3 className="mt-2 font-bold dark:text-white">{quotation.quotationNumber}</h3><p className="mt-1 text-sm text-neutral-500">{quotation.totalAmount.toLocaleString('fa-IR')} ریال</p></div><div className="flex gap-3">{quotation.status === 'draft' || quotation.status === 'sent' ? <Button size="sm" onClick={() => accept(quotation.id)} className="rounded-none bg-primary-500 text-neutral-900">پذیرش</Button> : null}{quotation.status === 'accepted' ? <Button size="sm" onClick={() => convert(quotation.id)} className="rounded-none bg-neutral-900 text-white">ثبت سفارش</Button> : null}</div></div>)}{quotations.length === 0 && <p className="border border-dashed border-neutral-300 py-16 text-center text-neutral-500">هنوز پیش‌فاکتوری ثبت نشده است.</p>}</div></section><section className="mt-14"><h2 className="mb-5 text-2xl font-black dark:text-white">سفارش‌ها</h2><div className="space-y-3">{orders.map((order) => <div key={order.id} className="flex items-center justify-between border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-[#1b1d1b]"><div><span className="eyebrow">{order.status}</span><h3 className="mt-2 font-bold dark:text-white">{order.orderNumber}</h3></div><span className="text-sm text-primary-500">{order.totalAmount.toLocaleString('fa-IR')} ریال</span></div>)}{orders.length === 0 && <p className="border border-dashed border-neutral-300 py-10 text-center text-neutral-500">هنوز سفارشی ثبت نشده است.</p>}</div></section><section className="mt-14"><h2 className="mb-5 text-2xl font-black dark:text-white">فاکتورها</h2><div className="space-y-3">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-col justify-between gap-4 border border-neutral-200 bg-white p-5 dark:border-white/10 dark:bg-[#1b1d1b] sm:flex-row sm:items-center"><div><span className="eyebrow">{invoice.paymentStatus}</span><h3 className="mt-2 font-bold dark:text-white">{invoice.invoiceNumber}</h3><p className="mt-1 text-sm text-neutral-500">{invoice.totalAfterTax.toLocaleString('fa-IR')} ریال</p></div>{invoice.paymentStatus === 'pending' ? <Button size="sm" onClick={() => pay(invoice)} className="rounded-none bg-primary-500 text-neutral-900">ثبت پرداخت</Button> : null}</div>)}{invoices.length === 0 && <p className="border border-dashed border-neutral-300 py-10 text-center text-neutral-500">هنوز فاکتوری صادر نشده است.</p>}</div></section></div></main>;
}
