'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import {
  acceptQuotation,
  convertQuotation,
  fetchMyInvoices,
  fetchMyOrders,
  fetchMyQuotations,
  InvoiceSummary,
  OrderSummary,
  QuotationSummary,
  submitPayment,
} from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AccountPage() {
  const { accessToken, user } = useAuthStore();
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      fetchMyQuotations(accessToken),
      fetchMyOrders(accessToken),
      fetchMyInvoices(accessToken),
    ])
      .then(([quotationItems, orderItems, invoiceItems]) => {
        setQuotations(quotationItems);
        setOrders(orderItems);
        setInvoices(invoiceItems);
      })
      .catch(() => setMessage('دریافت اطلاعات حساب انجام نشد.'));
  }, [accessToken]);

  async function accept(id: string) {
    if (!accessToken) return;
    try {
      const quotation = await acceptQuotation(accessToken, id);
      setQuotations(quotations.map((item) => (item.id === id ? quotation : item)));
      setMessage('پیش‌فاکتور پذیرفته شد. اکنون می‌توانید سفارش را ثبت کنید.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.');
    }
  }

  async function convert(id: string) {
    if (!accessToken) return;
    try {
      const order = await convertQuotation(accessToken, id);
      setMessage(`سفارش ${order.orderNumber} با موفقیت ساخته شد.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.');
    }
  }

  async function pay(invoice: InvoiceSummary) {
    if (!accessToken) return;
    try {
      await submitPayment(accessToken, invoice.id, invoice.totalAfterTax);
      setInvoices(
        invoices.map((item) =>
          item.id === invoice.id ? { ...item, paymentStatus: 'pending' } : item,
        ),
      );
      setMessage('درخواست پرداخت ثبت شد و پس از بررسی تایید می‌شود.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خطایی رخ داد.');
    }
  }

  if (!accessToken) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">حساب کاربری</p>
          <h1 className="display-feature mt-4 text-ink">ورود به پنل مشتریان</h1>
          <p className="body-lead mx-auto mt-4 max-w-md">
            برای دیدن پیش‌فاکتور، سفارش و فاکتور وارد حساب شوید.
          </p>
          <Link href="/auth" className="btn-pill mt-10 inline-flex">
            ورود
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user?.companyName ?? user?.email ?? 'مشتری';

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <div className="flex flex-col justify-between gap-8 border-b border-hairline pb-10 sm:flex-row sm:items-end sm:pb-12">
          <div className="max-w-2xl text-start">
            <p className="caption-up">پنل مشتری</p>
            <h1 className="display-feature mt-4 text-ink">{displayName}</h1>
            <p className="body-lead mt-4 max-w-md">
              پیش‌فاکتورها، سفارش‌ها و پرداخت‌های شما.
            </p>
          </div>
          <Link href="/quote-request" className="btn-pill shrink-0">
            درخواست جدید
          </Link>
        </div>

        {message ? <p className="field-message mt-8">{message}</p> : null}

        <section className="mt-12 md:mt-14">
          <div className="mb-2 flex items-end justify-between gap-4">
            <h2 className="display-sm text-ink">پیش‌فاکتورها</h2>
            <span className="caption-up text-white/45">
              {quotations.length.toLocaleString('fa-IR')} مورد
            </span>
          </div>
          <div className="border-t border-hairline">
            {quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="flex flex-col justify-between gap-5 border-b border-hairline py-6 sm:flex-row sm:items-center"
              >
                <div className="text-start">
                  <p className="caption-up">{quotation.status}</p>
                  <h3 className="mt-2 font-ui text-base text-ink">{quotation.quotationNumber}</h3>
                  <p className="mt-1 font-ui text-sm text-muted">
                    {quotation.totalAmount.toLocaleString('fa-IR')} ریال
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {quotation.status === 'draft' || quotation.status === 'sent' ? (
                    <Button size="sm" onClick={() => accept(quotation.id)}>
                      پذیرش
                    </Button>
                  ) : null}
                  {quotation.status === 'accepted' ? (
                    <Button size="sm" variant="secondary" onClick={() => convert(quotation.id)}>
                      ثبت سفارش
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {quotations.length === 0 ? (
              <p className="border border-dashed border-white/20 py-14 text-center font-ui text-sm text-muted">
                هنوز پیش‌فاکتوری ثبت نشده است.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-14 md:mt-16">
          <h2 className="display-sm mb-2 text-ink">سفارش‌ها</h2>
          <div className="border-t border-hairline">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-5 border-b border-hairline py-6"
              >
                <div className="text-start">
                  <p className="caption-up">{order.status}</p>
                  <h3 className="mt-2 font-ui text-base text-ink">{order.orderNumber}</h3>
                </div>
                <span className="font-ui text-sm text-ink">
                  {order.totalAmount.toLocaleString('fa-IR')} ریال
                </span>
              </div>
            ))}
            {orders.length === 0 ? (
              <p className="border border-dashed border-white/20 py-10 text-center font-ui text-sm text-muted">
                هنوز سفارشی ثبت نشده است.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-14 md:mt-16">
          <h2 className="display-sm mb-2 text-ink">فاکتورها</h2>
          <div className="border-t border-hairline">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col justify-between gap-5 border-b border-hairline py-6 sm:flex-row sm:items-center"
              >
                <div className="text-start">
                  <p className="caption-up">{invoice.paymentStatus}</p>
                  <h3 className="mt-2 font-ui text-base text-ink">{invoice.invoiceNumber}</h3>
                  <p className="mt-1 font-ui text-sm text-muted">
                    {invoice.totalAfterTax.toLocaleString('fa-IR')} ریال
                  </p>
                </div>
                {invoice.paymentStatus === 'pending' ? (
                  <Button size="sm" onClick={() => pay(invoice)}>
                    ثبت پرداخت
                  </Button>
                ) : null}
              </div>
            ))}
            {invoices.length === 0 ? (
              <p className="border border-dashed border-white/20 py-10 text-center font-ui text-sm text-muted">
                هنوز فاکتوری صادر نشده است.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
