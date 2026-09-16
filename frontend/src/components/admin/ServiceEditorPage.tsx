'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaField } from '@/components/admin/MediaField';
import { PriceField } from '@/components/admin/PriceField';
import { SERVICE_CATEGORY, SERVICE_UNIT } from '@/lib/admin-labels';
import {
  createAdminService,
  fetchAdminService,
  ServiceAdminSummary,
  updateAdminService,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const categoryOptions = Object.entries(SERVICE_CATEGORY).map(([value, label]) => ({ value, label }));
const unitOptions = Object.entries(SERVICE_UNIT).map(([value, label]) => ({ value, label }));

type EditorForm = {
  nameFa: string;
  nameEn: string;
  description: string;
  serviceCategory: string;
  basePrice: string;
  priceNegotiable: boolean;
  unitType: string;
  coverImageUrl: string;
  gallery: string[];
  isActive: boolean;
};

const emptyForm: EditorForm = {
  nameFa: '',
  nameEn: '',
  description: '',
  serviceCategory: 'support',
  basePrice: '',
  priceNegotiable: false,
  unitType: 'fixed',
  coverImageUrl: '',
  gallery: [],
  isActive: false,
};

function serviceToForm(item: ServiceAdminSummary): EditorForm {
  return {
    nameFa: item.nameFa,
    nameEn: item.nameEn,
    description: item.description,
    serviceCategory: item.serviceCategory,
    basePrice: item.basePrice == null ? '' : String(item.basePrice),
    priceNegotiable: Boolean(item.priceNegotiable),
    unitType: item.unitType,
    coverImageUrl: item.coverImageUrl ?? '',
    gallery: item.gallery ?? [],
    isActive: item.isActive,
  };
}

function Metabox({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-metabox ${className}`.trim()}>
      <header className="admin-metabox__head">
        <h2 className="admin-metabox__title">{title}</h2>
      </header>
      <div className="admin-metabox__body">{children}</div>
    </section>
  );
}

export function ServiceEditorPage({ serviceId }: { serviceId?: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const isNew = !serviceId;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const statusLabel = form.isActive ? 'فعال' : 'پیش‌نویس';

  useEffect(() => {
    if (!accessToken || !serviceId) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminService(accessToken, serviceId)
      .then((item) => {
        if (!cancelled) setForm(serviceToForm(item));
      })
      .catch(() => {
        if (!cancelled) adminToast.error('بارگذاری خدمت انجام نشد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, serviceId]);

  async function persist(publishIntent?: boolean) {
    if (!accessToken) return;
    const nameFa = form.nameFa.trim();
    const nameEn = form.nameEn.trim();
    const description = form.description.trim();
    if (nameFa.length < 2) {
      adminToast.error('نام فارسی خدمت الزامی است.');
      return;
    }
    if (nameEn.length < 2) {
      adminToast.error('نام لاتین خدمت الزامی است.');
      return;
    }
    if (description.length < 10) {
      adminToast.error('توضیحات باید حداقل ۱۰ کاراکتر باشد.');
      return;
    }

    const isActive = publishIntent === undefined ? form.isActive : publishIntent;
    setSaving(true);
    try {
      const payload = {
        nameFa,
        nameEn,
        description,
        serviceCategory: form.serviceCategory,
        unitType: form.unitType,
        isActive,
        basePrice: form.priceNegotiable || form.basePrice === '' ? null : Number(form.basePrice),
        priceNegotiable: form.priceNegotiable,
        coverImageUrl: form.coverImageUrl || undefined,
        gallery: form.gallery,
      };
      if (isNew) {
        const created = await createAdminService(accessToken, payload);
        adminToast.success(isActive ? 'خدمت منتشر شد.' : 'پیش‌نویس ذخیره شد.');
        router.replace(`/admin/services/${created.id}`);
      } else {
        const updated = await updateAdminService(accessToken, serviceId!, payload);
        setForm(serviceToForm(updated));
        adminToast.success(isActive ? 'خدمت منتشر و ذخیره شد.' : 'پیش‌نویس به‌روز شد.');
      }
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره خدمت انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  if (!accessToken) {
    return (
      <AdminShell eyebrow="خدمات" title="خدمت">
        <p className="text-sm text-[var(--ops-muted)]">برای مدیریت خدمت وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="خدمات" title="خدمت">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="خدمات" title={isNew ? 'افزودن خدمت' : 'ویرایش خدمت'}>
      <div className="admin-editor__topbar">
        <Link href="/admin/services" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className={`admin-badge ${form.isActive ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="admin-editor">
        <div className="admin-editor__main">
          <div className="admin-editor__title-block">
            <label className="block text-start">
              <span className="sr-only">نام خدمت</span>
              <input
                className="admin-editor__title-input"
                required
                minLength={2}
                maxLength={150}
                placeholder="نام خدمت"
                value={form.nameFa}
                onChange={(event) => setForm({ ...form, nameFa: event.target.value })}
              />
            </label>
            <p className="admin-editor__hint">نام فارسی در عنوان بالا؛ جزئیات را در جعبه‌های زیر تکمیل کنید.</p>
          </div>

          <Metabox title="توضیحات">
            <label className="block text-start">
              <span className="ops-login__label">نام لاتین (فنی)</span>
              <input
                className="ops-field"
                dir="ltr"
                value={form.nameEn}
                onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">توضیحات</span>
              <textarea
                className="ops-field admin-editor__body"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="شرح خدمت، محدوده کار و شرایط…"
              />
            </label>
          </Metabox>

          <Metabox title="گالری رسانه">
            <MediaField
              label="تصویر کاور"
              value={form.coverImageUrl}
              onChange={(coverImageUrl) => setForm({ ...form, coverImageUrl })}
            />
            <div className="mt-4">
              <MediaField
                label="گالری (چندتصویری)"
                multiple
                value={form.gallery}
                onChange={(gallery) => setForm({ ...form, gallery })}
              />
            </div>
          </Metabox>
        </div>

        <aside className="admin-editor__side">
          <Metabox title="انتشار" className="admin-metabox--sticky">
            <div className="admin-editor__publish-meta">
              <p>
                وضعیت:{' '}
                <strong className={form.isActive ? 'text-[var(--ops-ok)]' : 'text-[var(--ops-warn)]'}>
                  {statusLabel}
                </strong>
              </p>
              <label className="mt-3 block text-start">
                <span className="ops-login__label">تغییر وضعیت</span>
                <select
                  className="admin-select admin-select--wide"
                  value={form.isActive ? 'published' : 'draft'}
                  onChange={(event) => setForm({ ...form, isActive: event.target.value === 'published' })}
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">فعال / منتشرشده</option>
                </select>
              </label>
            </div>
            <div className="admin-editor__publish-actions">
              <button type="button" className="ops-btn ops-btn--ghost" disabled={saving} onClick={() => void persist(false)}>
                {saving ? '…' : 'ذخیره پیش‌نویس'}
              </button>
              <button type="button" className="ops-btn" disabled={saving} onClick={() => void persist(true)}>
                {saving ? 'در حال ذخیره…' : form.isActive || !isNew ? 'انتشار / به‌روزرسانی' : 'انتشار'}
              </button>
            </div>
          </Metabox>

          <Metabox title="دسته‌بندی و واحد">
            <label className="block text-start">
              <span className="ops-login__label">نوع خدمت</span>
              <select
                className="admin-select admin-select--wide"
                value={form.serviceCategory}
                onChange={(event) => setForm({ ...form, serviceCategory: event.target.value })}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-start">
              <span className="ops-login__label">واحد قیمت</span>
              <select
                className="admin-select admin-select--wide"
                value={form.unitType}
                onChange={(event) => setForm({ ...form, unitType: event.target.value })}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </Metabox>

          <Metabox title="قیمت">
            <PriceField
              label="قیمت پایه (ریال)"
              value={form.basePrice}
              negotiable={form.priceNegotiable}
              onValueChange={(basePrice) => setForm({ ...form, basePrice })}
              onNegotiableChange={(priceNegotiable) => setForm({ ...form, priceNegotiable })}
              optional
            />
          </Metabox>
        </aside>
      </div>
    </AdminShell>
  );
}
