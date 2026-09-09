'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { createAdminService, fetchAdminServices, ServiceAdminSummary } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const initialForm = {
  nameFa: '',
  nameEn: '',
  description: '',
  serviceCategory: 'support',
  basePrice: 0,
  unitType: 'fixed',
};

export default function AdminServicesPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [services, setServices] = useState<ServiceAdminSummary[]>([]);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (token) fetchAdminServices(token).then(setServices).catch(() => undefined);
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    const service = await createAdminService(token, form);
    setServices((items) => [...items, service]);
    setForm(initialForm);
    setOpen(false);
  }

  return (
    <AdminShell eyebrow="خدمات" title="خدمات">
      <div className="flex justify-end">
        <Button onClick={() => setOpen((value) => !value)} className="w-fit">
          {open ? 'بستن فرم' : 'خدمت جدید'}
        </Button>
      </div>

      {open ? (
        <form
          onSubmit={submit}
          className="mt-8 grid gap-5 border-y border-hairline py-8 sm:grid-cols-2"
        >
          <h2 className="display-sm sm:col-span-2 text-ink">خدمت جدید</h2>
          {(
            [
              ['nameFa', 'نام فارسی'],
              ['nameEn', 'نام انگلیسی'],
              ['description', 'توضیحات'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-start">
              <span className="caption-up">{label}</span>
              <input
                required
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="field-input mt-2"
                dir={key === 'nameEn' ? 'ltr' : 'rtl'}
              />
            </label>
          ))}
          <label className="block text-start">
            <span className="caption-up">قیمت پایه</span>
            <input
              required
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(event) => setForm({ ...form, basePrice: Number(event.target.value) })}
              className="field-input mt-2"
              dir="ltr"
            />
          </label>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit">ذخیره خدمت</Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        <DataTable headers={['خدمت', 'دسته‌بندی', 'قیمت پایه', 'واحد', 'وضعیت']}>
          {services.map((service) => (
            <DataRow key={service.id} className="text-start">
              <strong className="font-normal text-ink">{service.nameFa}</strong>
              <span className="text-xs text-muted">{service.serviceCategory}</span>
              <span className="text-ink">{service.basePrice.toLocaleString('fa-IR')} ریال</span>
              <span className="text-xs text-muted">{service.unitType}</span>
              <span className={`admin-badge w-fit ${service.isActive ? 'admin-badge--ok' : ''}`}>
                {service.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </DataRow>
          ))}
          {services.length === 0 ? (
            <p className="py-14 text-center font-ui text-sm text-muted">خدمتی ثبت نشده است.</p>
          ) : null}
        </DataTable>
      </div>
    </AdminShell>
  );
}
