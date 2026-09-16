'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaField } from '@/components/admin/MediaField';
import { PersianDatePicker } from '@/components/admin/PersianDatePicker';
import { PriceField } from '@/components/admin/PriceField';
import { PORTFOLIO_CATEGORY } from '@/lib/admin-labels';
import {
  createAdminPortfolio,
  fetchAdminPortfolioWork,
  PortfolioWork,
  updateAdminPortfolio,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

const categoryOptions = Object.entries(PORTFOLIO_CATEGORY).map(([value, label]) => ({ value, label }));

type EditorForm = {
  slug: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  descriptionFa: string;
  clientName: string;
  workCategory: string;
  country: string;
  province: string;
  city: string;
  locationDetail: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  gallery: string[];
  highlightsText: string;
  areaOrCapacity: string;
  priceBase: string;
  priceNegotiable: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
};

const emptyForm: EditorForm = {
  slug: '',
  titleFa: '',
  titleEn: '',
  summaryFa: '',
  descriptionFa: '',
  clientName: '',
  workCategory: 'entertainment',
  country: 'ایران',
  province: '',
  city: '',
  locationDetail: '',
  startDate: '',
  endDate: '',
  coverImageUrl: '',
  gallery: [],
  highlightsText: '',
  areaOrCapacity: '',
  priceBase: '',
  priceNegotiable: false,
  isPublished: false,
  isFeatured: false,
  displayOrder: 0,
};

function suggestSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function linesToList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function workToForm(item: PortfolioWork): EditorForm {
  return {
    slug: item.slug,
    titleFa: item.titleFa,
    titleEn: item.titleEn,
    summaryFa: item.summaryFa,
    descriptionFa: item.descriptionFa,
    clientName: item.clientName ?? '',
    workCategory: item.workCategory,
    country: item.country ?? 'ایران',
    province: item.province ?? '',
    city: item.city ?? '',
    locationDetail: item.locationDetail ?? '',
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
    coverImageUrl: item.coverImageUrl ?? '',
    gallery: item.gallery ?? [],
    highlightsText: (item.highlights ?? []).join('\n'),
    areaOrCapacity: item.areaOrCapacity ?? '',
    priceBase: item.priceBase == null ? '' : String(item.priceBase),
    priceNegotiable: Boolean(item.priceNegotiable),
    isPublished: item.isPublished,
    isFeatured: item.isFeatured,
    displayOrder: item.displayOrder,
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

export function PortfolioEditorPage({ workId }: { workId?: string }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const isNew = !workId;

  const [form, setForm] = useState(emptyForm);
  const [slugLocked, setSlugLocked] = useState(!isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const statusLabel = form.isPublished ? 'منتشرشده' : 'پیش‌نویس';

  useEffect(() => {
    if (!accessToken || !workId) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminPortfolioWork(accessToken, workId)
      .then((item) => {
        if (!cancelled) {
          setForm(workToForm(item));
          setSlugLocked(true);
        }
      })
      .catch(() => {
        if (!cancelled) adminToast.error('بارگذاری نمونه‌کار انجام نشد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, workId]);

  function onTitleChange(value: string) {
    setForm((current) => {
      const next = { ...current, titleFa: value };
      if (!slugLocked) next.slug = suggestSlug(value);
      return next;
    });
  }

  function payloadFromForm(isPublished: boolean) {
    return {
      slug: form.slug.trim(),
      titleFa: form.titleFa.trim(),
      titleEn: form.titleEn.trim() || form.titleFa.trim(),
      summaryFa: form.summaryFa.trim(),
      descriptionFa: form.descriptionFa.trim(),
      clientName: form.clientName || undefined,
      workCategory: form.workCategory,
      country: form.country || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      locationDetail: form.locationDetail || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      gallery: form.gallery,
      highlights: linesToList(form.highlightsText),
      areaOrCapacity: form.areaOrCapacity || undefined,
      priceBase: form.priceNegotiable || form.priceBase === '' ? null : Number(form.priceBase),
      priceNegotiable: form.priceNegotiable,
      isPublished,
      isFeatured: form.isFeatured,
      displayOrder: form.displayOrder,
    };
  }

  async function persist(publishIntent?: boolean) {
    if (!accessToken) return;
    const titleFa = form.titleFa.trim();
    const slug = form.slug.trim();
    if (titleFa.length < 2) {
      adminToast.error('عنوان نمونه‌کار الزامی است.');
      return;
    }
    if (slug.length < 2) {
      adminToast.error('آدرس نمونه‌کار (slug) الزامی است.');
      return;
    }
    if (form.summaryFa.trim().length < 2) {
      adminToast.error('خلاصه الزامی است.');
      return;
    }
    if (form.descriptionFa.trim().length < 10) {
      adminToast.error('توضیح کامل باید حداقل ۱۰ کاراکتر باشد.');
      return;
    }

    const isPublished = publishIntent === undefined ? form.isPublished : publishIntent;
    setSaving(true);
    try {
      const payload = payloadFromForm(isPublished);
      if (isNew) {
        const created = await createAdminPortfolio(accessToken, payload);
        adminToast.success(isPublished ? 'نمونه‌کار منتشر شد.' : 'پیش‌نویس ذخیره شد.');
        router.replace(`/admin/portfolio/${created.id}`);
      } else {
        const updated = await updateAdminPortfolio(accessToken, workId!, payload);
        setForm(workToForm(updated));
        adminToast.success(isPublished ? 'نمونه‌کار منتشر و ذخیره شد.' : 'پیش‌نویس به‌روز شد.');
      }
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ذخیره نمونه‌کار انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  if (!accessToken) {
    return (
      <AdminShell eyebrow="نمایش عمومی" title="نمونه‌کار">
        <p className="text-sm text-[var(--ops-muted)]">برای مدیریت نمونه‌کار وارد شوید.</p>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell eyebrow="نمایش عمومی" title="نمونه‌کار">
        <p className="text-sm text-[var(--ops-muted)]">در حال بارگذاری…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell eyebrow="نمایش عمومی" title={isNew ? 'افزودن نمونه‌کار' : 'ویرایش نمونه‌کار'}>
      <div className="admin-editor__topbar">
        <Link href="/admin/portfolio" className="ops-btn ops-btn--ghost">
          ← بازگشت به فهرست
        </Link>
        <div className="admin-editor__topbar-meta">
          <span className={`admin-badge ${form.isPublished ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
            {statusLabel}
          </span>
          {!isNew && form.isPublished ? (
            <Link href={`/portfolio/${form.slug}`} className="ops-btn ops-btn--ghost" target="_blank">
              مشاهده در سایت
            </Link>
          ) : null}
        </div>
      </div>

      <div className="admin-editor">
        <div className="admin-editor__main">
          <div className="admin-editor__title-block">
            <label className="block text-start">
              <span className="sr-only">عنوان نمونه‌کار</span>
              <input
                className="admin-editor__title-input"
                required
                minLength={2}
                maxLength={200}
                placeholder="عنوان نمونه‌کار"
                value={form.titleFa}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </label>
            <div className="admin-editor__permalink">
              <span className="admin-editor__permalink-label">آدرس:</span>
              <span className="admin-editor__permalink-prefix" dir="ltr">
                /portfolio/
              </span>
              <input
                className="admin-editor__permalink-input"
                required
                minLength={2}
                maxLength={120}
                dir="ltr"
                value={form.slug}
                onChange={(event) => {
                  setSlugLocked(true);
                  setForm({ ...form, slug: event.target.value });
                }}
              />
              {slugLocked && isNew ? (
                <button
                  type="button"
                  className="admin-editor__permalink-unlock"
                  onClick={() => setSlugLocked(false)}
                >
                  هم‌تراز با عنوان
                </button>
              ) : null}
            </div>
          </div>

          <Metabox title="توضیحات">
            <label className="block text-start">
              <span className="ops-login__label">عنوان لاتین</span>
              <input
                className="ops-field"
                dir="ltr"
                value={form.titleEn}
                onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
                placeholder="اختیاری — در صورت خالی بودن از عنوان فارسی استفاده می‌شود"
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">خلاصه</span>
              <input
                className="ops-field"
                value={form.summaryFa}
                onChange={(event) => setForm({ ...form, summaryFa: event.target.value })}
                placeholder="یک جمله برای فهرست نمونه‌کارها"
              />
            </label>
            <label className="mt-4 block text-start">
              <span className="ops-login__label">توضیح کامل</span>
              <textarea
                className="ops-field admin-editor__body"
                value={form.descriptionFa}
                onChange={(event) => setForm({ ...form, descriptionFa: event.target.value })}
                placeholder="جزئیات اجرا، نتیجه و نکات برجسته…"
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

          <Metabox title="جزئیات اجرا">
            <div className="admin-form-grid two">
              <label className="block text-start">
                <span className="ops-login__label">نام مشتری (نمایشی)</span>
                <input
                  className="ops-field"
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">ظرفیت / مقیاس</span>
                <input
                  className="ops-field"
                  value={form.areaOrCapacity}
                  onChange={(event) => setForm({ ...form, areaOrCapacity: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">کشور</span>
                <input
                  className="ops-field"
                  value={form.country}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">استان</span>
                <input
                  className="ops-field"
                  value={form.province}
                  onChange={(event) => setForm({ ...form, province: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">شهر</span>
                <input
                  className="ops-field"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </label>
              <label className="block text-start">
                <span className="ops-login__label">لوکیشن دقیق</span>
                <input
                  className="ops-field"
                  value={form.locationDetail}
                  onChange={(event) => setForm({ ...form, locationDetail: event.target.value })}
                />
              </label>
              <div className="block text-start">
                <PersianDatePicker
                  label="تاریخ شروع"
                  value={form.startDate}
                  onChange={(startDate) => setForm({ ...form, startDate })}
                />
              </div>
              <div className="block text-start">
                <PersianDatePicker
                  label="تاریخ پایان"
                  value={form.endDate}
                  onChange={(endDate) => setForm({ ...form, endDate })}
                />
              </div>
              <label className="block text-start sm:col-span-2">
                <span className="ops-login__label">نکات برجسته (هر خط یک مورد)</span>
                <textarea
                  className="ops-field min-h-20"
                  value={form.highlightsText}
                  onChange={(event) => setForm({ ...form, highlightsText: event.target.value })}
                />
              </label>
            </div>
          </Metabox>
        </div>

        <aside className="admin-editor__side">
          <Metabox title="انتشار" className="admin-metabox--sticky">
            <div className="admin-editor__publish-meta">
              <p>
                وضعیت:{' '}
                <strong className={form.isPublished ? 'text-[var(--ops-ok)]' : 'text-[var(--ops-warn)]'}>
                  {statusLabel}
                </strong>
              </p>
              <label className="mt-3 block text-start">
                <span className="ops-login__label">تغییر وضعیت</span>
                <select
                  className="admin-select admin-select--wide"
                  value={form.isPublished ? 'published' : 'draft'}
                  onChange={(event) => setForm({ ...form, isPublished: event.target.value === 'published' })}
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشرشده</option>
                </select>
              </label>
            </div>
            <div className="admin-editor__publish-actions">
              <button type="button" className="ops-btn ops-btn--ghost" disabled={saving} onClick={() => void persist(false)}>
                {saving ? '…' : 'ذخیره پیش‌نویس'}
              </button>
              <button type="button" className="ops-btn" disabled={saving} onClick={() => void persist(true)}>
                {saving ? 'در حال ذخیره…' : form.isPublished || !isNew ? 'انتشار / به‌روزرسانی' : 'انتشار'}
              </button>
            </div>
          </Metabox>

          <Metabox title="دسته‌بندی">
            <label className="block text-start">
              <span className="ops-login__label">دسته</span>
              <select
                className="admin-select admin-select--wide"
                value={form.workCategory}
                onChange={(event) => setForm({ ...form, workCategory: event.target.value })}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-start">
              <span className="ops-login__label">ترتیب نمایش</span>
              <input
                type="number"
                min={0}
                className="ops-field"
                dir="ltr"
                value={form.displayOrder}
                onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) || 0 })}
              />
            </label>
          </Metabox>

          <Metabox title="قیمت">
            <PriceField
              label="قیمت پایه (ریال)"
              value={form.priceBase}
              negotiable={form.priceNegotiable}
              onValueChange={(priceBase) => setForm({ ...form, priceBase })}
              onNegotiableChange={(priceNegotiable) => setForm({ ...form, priceNegotiable })}
              optional
            />
          </Metabox>

          <Metabox title="نمایش">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              />
              ویژه در صفحه اول
            </label>
          </Metabox>
        </aside>
      </div>
    </AdminShell>
  );
}
